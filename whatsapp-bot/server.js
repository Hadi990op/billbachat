/**
 * BillBachat WhatsApp Bot Service
 * 
 * Uses Baileys (unofficial WhatsApp Web API) to:
 * - Connect to WhatsApp via QR code / pairing code
 * - Receive commands: "bill <refno> <company>", "status", "help"
 * - Send bill alerts
 * - Expose REST API for the web app to interact
 * 
 * Port: 9200
 */

const { default: makeWASocket, useMultiFileAuthState, 
        makeCacheableSignalKeyStore, fetchLatestBaileysVersion,
        DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const { NodeCache } = require('@cacheable/node-cache');
const QRCode = require('qrcode');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// === CONFIG ===
const PORT = 9200;
const AUTH_DIR = path.join(__dirname, 'baileys_auth_info');
const BILLBachat_API = 'http://localhost:9100/billbachat/api/check-bill';

// === STATE ===
let sock = null;
let connectionState = 'disconnected'; // disconnected, connecting, connected, logged_out
let qrCodeData = null; // QR string
let qrCodeImage = null; // base64 PNG
let lastConnectionUpdate = null;
let pairingCode = null; // 8-digit pairing code
let pairingPhoneNumber = null; // phone number used for pairing

// Pairing code request: returns 8-digit code that user enters in WhatsApp
async function requestPairingCode(phoneNumber) {
  if (!sock) return null;
  
  // Clean number: remove +, spaces, dashes. Ensure country code prefix.
  let cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  
  // Pakistani numbers: convert 03XXXXXXXXX to 923XXXXXXXXX
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '92' + cleanNumber.slice(1);
  }
  
  // If no country code, assume Pakistan (92)
  if (cleanNumber.length === 10) {
    cleanNumber = '92' + cleanNumber;
  }
  
  pairingPhoneNumber = cleanNumber;
  
  try {
    const code = await sock.requestPairingCode(cleanNumber);
    pairingCode = code;
    console.log(`[WA] Pairing code generated for ${cleanNumber}: ${code}`);
    return code;
  } catch (err) {
    console.error('[WA] Pairing code error:', err.message);
    return null;
  }
}

// === LOGGER ===
// Keep silent — we log manually with console.log
const logger = P({ level: 'silent' });

// === SUBSCRIBERS ===
// Store: phone -> { refNo, company, name, subscribedAt }
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

function loadSubscribers() {
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveSubscribers(subs) {
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2));
}

// === WHATSAPP CONNECTION ===
let reconnectAttempts = 0;
let shouldReconnect = true;

async function startSock() {
  // Only clean auth if we're doing a HARD reset (not on soft reconnect)
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`[WA] Using Baileys v${version.join('.')}, isLatest=${isLatest}`);
  
  const msgRetryCounterCache = new NodeCache();

  sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),  // silence pino noise, we log manually
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    // CRITICAL: must use Browsers.macOS("Chrome") for pairing code to work
    browser: Browsers.macOS("Chrome"),
    markOnlineOnConnect: false,
    shouldSyncHistoryMessage: () => false,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000,
    // Increase QR timeout to give more time for pairing
    qrTimeout: 60000,
  });

  connectionState = 'connecting';
  console.log('[WA] Connecting to WhatsApp...');

  sock.ev.process(async (events) => {
    // Connection updates
    if (events['connection.update']) {
      const update = events['connection.update'];
      const { connection, lastDisconnect, qr } = update;
      lastConnectionUpdate = update;

      if (connection === 'connecting') {
        connectionState = 'connecting';
        console.log('[WA] Connecting...');
      }

      if (connection === 'open') {
        connectionState = 'connected';
        qrCodeData = null;
        qrCodeImage = null;
        pairingCode = null;
        reconnectAttempts = 0;
        console.log('[WA] ✅ Connected! Bot is online.');
        console.log('[WA] Bot number:', sock.user?.id);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error instanceof Boom) 
          ? lastDisconnect.error.output.statusCode 
          : 0;
        
        console.log('[WA] Connection closed. statusCode:', statusCode);
        if (lastDisconnect?.error?.output?.payload) {
          console.log('[WA] Error:', lastDisconnect.error.output.payload.message);
        }
        if (lastDisconnect?.error?.data) {
          console.log('[WA] Error data:', JSON.stringify(lastDisconnect.error.data));
        }
        
        // 401 = Unauthorized / pairing failed / bad creds
        // 515 = stream epoch replaced (reconnect normally)
        // 410 = stream closed (reconnect normally)
        // 400 = bad request
        if (statusCode === DisconnectReason.loggedOut) {
          connectionState = 'logged_out';
          console.log('[WA] ❌ Logged out. Cleaning auth and restarting fresh.');
          find_baileys_auth_delete();
          setTimeout(() => startSock(), 3000);
        } 
        else if (statusCode === 401 || statusCode === 400) {
          // Pairing failed or bad credentials — clean and restart fresh
          console.log('[WA] ❌ Auth failed (401/400). Cleaning auth, fresh start.');
          connectionState = 'disconnected';
          find_baileys_auth_delete();
          pairingCode = null;
          pairingPhoneNumber = null;
          reconnectAttempts++;
          if (shouldReconnect && reconnectAttempts < 10) {
            setTimeout(() => startSock(), 5000);
          }
        }
        else if (statusCode === 408) {
          // QR refs attempts ended — QR expired, reconnect
          // Keep pairingPhoneNumber so new QR event auto-generates a fresh code
          console.log('[WA] QR expired (408). Reconnecting, will re-generate pairing code...');
          connectionState = 'connecting';
          pairingCode = null;  // clear old code, new one will be generated on next QR event
          // NOTE: pairingPhoneNumber is preserved!
          reconnectAttempts++;
          if (shouldReconnect && reconnectAttempts < 10) {
            setTimeout(() => startSock(), 2000);
          }
        }
        else if (shouldReconnect) {
          // 515, 410, 428, 440, 500 etc — normal reconnect
          console.log('[WA] Reconnecting (normal)...');
          connectionState = 'connecting';
          reconnectAttempts++;
          if (reconnectAttempts < 10) {
            setTimeout(() => startSock(), 3000);
          }
        }
      }

      if (qr) {
        connectionState = 'waiting_qr';
        qrCodeData = qr;
        console.log('[WA] QR Code generated. Scan to connect.');
        // Generate QR image as base64
        try {
          qrCodeImage = await QRCode.toDataURL(qr, { width: 300 });
        } catch (e) {
          console.error('[WA] QR image error:', e.message);
        }
        
        // CRITICAL: If user requested pairing code, generate it HERE
        // (socket is ready after QR event — this is the correct timing)
        if (pairingPhoneNumber && !pairingCode) {
          try {
            console.log(`[WA] Auto-requesting pairing code for ${pairingPhoneNumber} on QR event...`);
            const code = await sock.requestPairingCode(pairingPhoneNumber);
            pairingCode = code;
            console.log(`[WA] ✅ Pairing code generated on QR: ${code}`);
          } catch (e) {
            console.error('[WA] Pairing code auto-request error:', e.message);
          }
        }
      }
    }

    // Save credentials
    if (events['creds.update']) {
      await saveCreds();
    }

    // Incoming messages
    if (events['messages.upsert']) {
      const upsert = events['messages.upsert'];
      
      if (upsert.type === 'notify') {
        for (const msg of upsert.messages) {
          await handleMessage(msg);
        }
      }
    }
  });
}

// Helper to delete auth folder (can't use rm -rf due to safety)
function find_baileys_auth_delete() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      const files = fs.readdirSync(AUTH_DIR);
      for (const f of files) {
        fs.unlinkSync(path.join(AUTH_DIR, f));
      }
      fs.rmdirSync(AUTH_DIR);
      console.log('[WA] Auth folder deleted.');
    }
  } catch (e) {
    console.error('[WA] Auth delete error:', e.message);
  }
}

// === MESSAGE HANDLER ===
async function handleMessage(msg) {
  try {
    const from = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;
    
    // Skip own messages and status broadcasts
    if (isFromMe || from === 'status@broadcast') return;

    const text = msg.message?.conversation 
      || msg.message?.extendedTextMessage?.text 
      || '';

    if (!text) return;

    console.log(`[WA] Message from ${from}: ${text}`);
    
    const command = text.trim().toLowerCase();
    const parts = text.trim().split(/\s+/);

    // === COMMANDS ===
    
    // Help / start
    if (command === 'hi' || command === 'hello' || command === 'help' || command === 'start' || command === 'salam') {
      const user = getOrCreateUser(from);
      const plan = getEffectivePlan(user);
      const planBadge = plan === 'free' ? '🆓 Free' : plan === 'pro' ? '⭐ Pro' : '👨‍👩‍👧‍👦 Family';
      
      await sock.sendMessage(from, { text: 
        `⚡ *BillBachat Bot*\n\n` +
        `Aapka Plan: ${planBadge}\n\n` +
        `Commands:\n` +
        `• *bill <refno> <company>* — Bill check karein\n` +
        `  Example: bill 06113530462901 lesco\n` +
        `• *subscribe <refno> <company>* — Daily alerts pao (Pro)\n` +
        `• *plan* — Apna plan dekhein\n` +
        `• *upgrade pro* — Pro lein (Rs.99/mo)\n` +
        `• *status* — Subscription dekhein\n` +
        `• *unsubscribe* — Alerts band karein\n` +
        `• *help* — Ye menu\n\n` +
        (plan === 'free' ? `💡 Free me 1 bill check/day. Pro lein for unlimited + alerts!\n\n` : ``) +
        `Companies: lesco, iesco, mepco, fesco, gepco, pesco, hesco, sepco, qesco\n\n` +
        `💡 BillBachat — Bijli ka bill bachao!`
      });
    }
    
    // Plan check: "plan"
    else if (command === 'plan' || command === 'myplan') {
      const user = getOrCreateUser(from);
      const plan = getEffectivePlan(user);
      const planName = plan === 'free' ? '🆓 Free Plan' : plan === 'pro' ? '⭐ Pro Plan' : '👨‍👩‍👧‍👦 Family Plan';
      
      let msg = `📋 *Aapka Plan*\n\n`;
      msg += `Plan: ${planName}\n`;
      if (user.planExpiry && plan !== 'free') {
        msg += `Expiry: ${new Date(user.planExpiry).toLocaleDateString()}\n`;
      }
      msg += `\n`;
      if (plan === 'free') {
        msg += `Free me:\n`;
        msg += `• 1 bill check/day\n`;
        msg += `• Slab status\n`;
        msg += `• Basic tips\n\n`;
        msg += `⭐ *Pro (Rs.99/mo):*\n`;
        msg += `• Unlimited bill checks\n`;
        msg += `• WhatsApp daily alerts\n`;
        msg += `• Slab crossing warning\n`;
        msg += `• Due date reminder\n\n`;
        msg += `Upgrade: "upgrade pro" likhein`;
      } else {
        msg += `✅ Sab features unlocked!\n`;
        msg += `• Unlimited bill checks\n`;
        msg += `• Daily WhatsApp alerts\n`;
        msg += `• Slab warnings\n\n`;
        msg += `Thanks for being a Pro user! 🙏`;
      }
      
      await sock.sendMessage(from, { text: msg });
    }
    
    // Upgrade: "upgrade pro" or "upgrade family"
    else if (parts[0]?.toLowerCase() === 'upgrade' && parts[1]) {
      const planChoice = parts[1].toLowerCase();
      const user = getOrCreateUser(from);
      const phone = jidToPhone(from);
      
      if (planChoice === 'pro' || planChoice === 'family') {
        const price = planChoice === 'pro' ? 99 : 199;
        
        let msg = `⭐ *Upgrade to ${planChoice.toUpperCase()}*\n\n`;
        msg += `Price: Rs. ${price}/month\n\n`;
        msg += `📲 *Payment kaise karein:*\n`;
        msg += `1. JazzCash / Easypaisa pe Rs. ${price} bhejein:\n`;
        msg += `   0322-5490551\n\n`;
        msg += `2. Screenshot lein\n`;
        msg += `3. "upgrade ${planChoice} done" likh kar screenshot bhejein\n\n`;
        msg += `⚡ Payment verify hote hi plan activate ho jayega (24 hours).\n\n`;
        msg += `🧪 Testing? "upgrade ${planChoice} test" likhein for instant activation.`;
        
        await sock.sendMessage(from, { text: msg });
      }
      else if (planChoice === 'pro' && parts[2]?.toLowerCase() === 'test') {
        // Test instant upgrade
        const updated = upgradeUserPlan(phone, 'pro', 1);
        if (updated) {
          await sock.sendMessage(from, { text: 
            `✅ *Pro Plan Activated! (Test)*\n\n` +
            `Plan: ⭐ Pro\n` +
            `Expiry: ${new Date(updated.planExpiry).toLocaleDateString()}\n\n` +
            `Ab unlimited bill checks + daily alerts on hain!`
          });
        }
      }
      else if (planChoice === 'family' && parts[2]?.toLowerCase() === 'test') {
        const updated = upgradeUserPlan(phone, 'family', 1);
        if (updated) {
          await sock.sendMessage(from, { text: 
            `✅ *Family Plan Activated! (Test)*\n\n` +
            `Plan: 👨‍👩‍👧‍👦 Family\n` +
            `Expiry: ${new Date(updated.planExpiry).toLocaleDateString()}\n\n` +
            `Ab 5 connections track kar sakte hain!`
          });
        }
      }
      else {
        await sock.sendMessage(from, { text: '❌ "upgrade pro" ya "upgrade family" likhein.' });
      }
    }
    
    // Check bill: "bill <refno> <company>"
    else if (parts[0]?.toLowerCase() === 'bill' && parts[1] && parts[2]) {
      const refNo = parts[1].replace(/\D/g, '');
      const company = parts[2].toLowerCase();
      
      if (refNo.length < 10) {
        await sock.sendMessage(from, { text: '❌ Reference number sahi nahi. 14-digit number daalo.' });
        return;
      }

      await sock.sendMessage(from, { text: '⏳ Bill fetch ho raha hai...' });
      
      try {
        const res = await axios.get(`${BILLBachat_API}/?ref=${refNo}&company=${company}`, { 
          timeout: 20000 
        });
        const bill = res.data;
        
        if (bill.success) {
          const status = bill.isProtected ? '✅ Protected' : '⚠️ Non-Protected';
          const remaining = 200 - (bill.unitsConsumed || 0);
          
          let message = `⚡ *BillBachat — Bill Result*\n\n`;
          if (bill.consumerName) message += `👤 *${bill.consumerName}*\n`;
          message += `🏢 ${bill.company || company.toUpperCase()}\n`;
          message += `🔢 Ref: ${bill.referenceNumber || refNo}\n\n`;
          message += `📊 *Units:* ${bill.unitsConsumed || '?'}\n`;
          message += `💰 *Total:* Rs. ${(bill.payableWithinDueDate || bill.grandTotal || 0).toLocaleString()}\n`;
          message += `📅 *Due Date:* ${bill.dueDate || 'N/A'}\n`;
          message += `🏷️ *Slab:* ${bill.slabCategory || 'N/A'}\n`;
          message += `🛡️ *Status:* ${status}\n\n`;
          
          if (bill.isProtected && remaining > 0) {
            message += `✅ Safe! ${remaining} units baaki hain.\n`;
          } else if (!bill.isProtected) {
            message += `⚠️ Limit cross! Bill double ho raha hai.\n`;
          }
          
          message += `\n💡 BillBachat Pro pe daily alerts pao. "subscribe" likhein.`;
          
          await sock.sendMessage(from, { text: message });
        } else {
          await sock.sendMessage(from, { text: `❌ Bill nahi mila. Reference number aur company check karein.\nError: ${bill.error || 'Unknown'}` });
        }
      } catch (err) {
        console.error('[WA] Bill fetch error:', err.message);
        await sock.sendMessage(from, { text: '❌ Bill fetch me error. Baad me try karein.' });
      }
    }
    
    // Subscribe: "subscribe <refno> <company>" — requires Pro plan
    else if (parts[0]?.toLowerCase() === 'subscribe' && parts[1] && parts[2]) {
      const refNo = parts[1].replace(/\D/g, '');
      const company = parts[2].toLowerCase();
      const user = getOrCreateUser(from);
      const plan = getEffectivePlan(user);
      
      if (refNo.length < 10) {
        await sock.sendMessage(from, { text: '❌ Reference number sahi nahi. 14-digit daalo.' });
        return;
      }

      // Free users can't subscribe
      if (plan === 'free') {
        await sock.sendMessage(from, { text: 
          `🔒 *Pro Feature*\n\n` +
          `Daily WhatsApp alerts sirf Pro plan me hain.\n\n` +
          `⭐ Pro = Rs. 99/month:\n` +
          `• Unlimited bill checks\n` +
          `• Daily slab alerts\n` +
          `• Due date reminders\n` +
          `• Slab crossing warnings\n\n` +
          `Upgrade: "upgrade pro" likhein\n` +
          `Test karna hai? "upgrade pro test" likhein`
        });
        return;
      }

      const subs = loadSubscribers();
      subs[from] = { refNo, company, subscribedAt: new Date().toISOString(), plan };
      saveSubscribers(subs);
      
      await sock.sendMessage(from, { text: 
        `✅ *Subscribed! (${plan.toUpperCase()})*\n\n` +
        `Ref: ${refNo}\n` +
        `Company: ${company.toUpperCase()}\n\n` +
        `Ab aapko slab alerts milenge jab units 200 ke qareeb pohchein.\n\n` +
        `Unsubscribe: "unsubscribe" likhein.`
      });
    }
    
    // Status
    else if (command === 'status') {
      const subs = loadSubscribers();
      const sub = subs[from];
      
      if (sub) {
        await sock.sendMessage(from, { text: 
          `📋 *Your Subscription*\n\n` +
          `Ref: ${sub.refNo}\n` +
          `Company: ${sub.company.toUpperCase()}\n` +
          `Subscribed: ${new Date(sub.subscribedAt).toLocaleDateString()}\n\n` +
          `Unsubscribe: "unsubscribe" likhein.`
        });
      } else {
        await sock.sendMessage(from, { text: '❌ Aap subscribed nahi hain. "subscribe <refno> <company>" likhein.' });
      }
    }
    
    // Unsubscribe
    else if (command === 'unsubscribe') {
      const subs = loadSubscribers();
      if (subs[from]) {
        delete subs[from];
        saveSubscribers(subs);
        await sock.sendMessage(from, { text: '✅ Unsubscribed. Alerts band kar diye.' });
      } else {
        await sock.sendMessage(from, { text: '❌ Aap subscribed nahi the.' });
      }
    }
    
    // Unknown command
    else {
      await sock.sendMessage(from, { text: 
        `❓ Samajh nahi aaya. "help" likhein ke commands dekhein.\n\n` +
        `⚡ BillBachat — Bijli ka bill bachao!`
      });
    }
  } catch (err) {
    console.error('[WA] Message handler error:', err.message);
  }
}

// === REST API ===
const app = express();
app.use(cors());
app.use(express.json());

// Get connection status + QR
app.get('/status', (req, res) => {
  res.json({
    state: connectionState,
    hasQr: !!qrCodeData,
    qrImage: qrCodeImage,
    pairingCode: pairingCode,
    pairingPhone: pairingPhoneNumber,
    botNumber: sock?.user?.id || null,
    lastUpdate: lastConnectionUpdate,
    subscribers: Object.keys(loadSubscribers()).length,
  });
});

// Get QR code as image
app.get('/qr', (req, res) => {
  if (qrCodeImage) {
    const base64 = qrCodeImage.split(',')[1];
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(Buffer.from(base64, 'base64'));
  } else {
    res.status(404).json({ error: 'No QR available. Bot may be connected or connecting.' });
  }
});

// Request pairing code — user enters their WhatsApp number, gets 8-digit code
app.post('/pair', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber required' });
    }
    
    if (connectionState === 'connected') {
      return res.status(400).json({ 
        error: 'Bot already connected! Logout first to pair a new number.' 
      });
    }
    
    // Clean number — E.164 format without + sign
    let cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.slice(1);
    }
    if (cleanNumber.length === 10) {
      cleanNumber = '92' + cleanNumber;
    }
    
    // Reset pairing state
    pairingPhoneNumber = cleanNumber;
    pairingCode = null;
    
    console.log(`[WA] Pairing request for ${cleanNumber} (state: ${connectionState})`);
    
    // If socket is ready and in waiting_qr state, request immediately
    if (sock && connectionState === 'waiting_qr') {
      try {
        const code = await sock.requestPairingCode(cleanNumber);
        pairingCode = code;
        console.log(`[WA] ✅ Pairing code for ${cleanNumber}: ${code}`);
        return res.json({ 
          success: true, 
          pairingCode: code,
          phoneNumber: cleanNumber,
          instructions: 'WhatsApp Settings > Linked Devices > Link with phone number me ye code daalein'
        });
      } catch (e) {
        console.error('[WA] Direct pairing code error:', e.message);
        // Fall through — will be auto-generated on next QR event
      }
    }
    
    // If not ready yet, pairingPhoneNumber is set — QR event will auto-generate
    // Wait up to 15 seconds for QR event to fire and generate code
    let attempts = 0;
    while (!pairingCode && attempts < 30) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }
    
    if (pairingCode) {
      console.log(`[WA] ✅ Pairing code (via QR event) for ${cleanNumber}: ${pairingCode}`);
      return res.json({ 
        success: true, 
        pairingCode: pairingCode,
        phoneNumber: cleanNumber,
        instructions: 'WhatsApp Settings > Linked Devices > Link with phone number me ye code daalein'
      });
    }
    
    // Still no code — socket might be connecting
    return res.status(503).json({ 
      error: 'Bot abhi connecting hai. 10 second wait karke dobara try karein.',
      state: connectionState
    });
  } catch (err) {
    console.error('[WA] /pair error:', err.message);
    console.error('[WA] /pair stack:', err.stack);
    res.status(500).json({ 
      error: err.message,
      tip: 'Bot connecting ho raha hai. 10 second wait karke dobara try karein.'
    });
  }
});

// Send message to a number
app.post('/send', async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) {
      return res.status(400).json({ error: 'number and message required' });
    }
    
    // Format number: 923XXXXXXXXX -> 923XXXXXXXXX@s.whatsapp.net
    let cleanNumber = number.replace(/[^\d]/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '92' + cleanNumber.slice(1);
    if (cleanNumber.length === 10) cleanNumber = '92' + cleanNumber;
    const jid = number.includes('@') ? number : `${cleanNumber}@s.whatsapp.net`;
    
    if (connectionState !== 'connected') {
      return res.status(503).json({ error: 'Bot not connected', state: connectionState });
    }
    
    // Retry up to 3 times
    let sent = false;
    let attempts = 0;
    while (!sent && attempts < 3) {
      try {
        await sock.sendMessage(jid, { text: message });
        sent = true;
      } catch (e) {
        attempts++;
        console.error(`[WA] Send attempt ${attempts} failed:`, e.message);
        if (attempts < 3) await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    if (sent) {
      res.json({ success: true, sentTo: jid });
    } else {
      res.status(500).json({ error: 'Send failed after retries' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get subscribers list
app.get('/subscribers', (req, res) => {
  res.json(loadSubscribers());
});

// Auto-subscribe: web app calls this after WhatsApp connects
// Sends a confirmation message with the user's bill data
app.post('/auto-subscribe', async (req, res) => {
  try {
    const { phoneNumber, refNo, company, billData } = req.body;
    
    if (!phoneNumber || !refNo || !company) {
      return res.status(400).json({ error: 'phoneNumber, refNo, company required' });
    }
    
    if (connectionState !== 'connected') {
      return res.status(503).json({ error: 'Bot not connected', state: connectionState });
    }
    
    // Format JID: 923XXXXXXXXX -> 923XXXXXXXXX@s.whatsapp.net
    let cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '92' + cleanNumber.slice(1);
    if (cleanNumber.length === 10) cleanNumber = '92' + cleanNumber;
    const jid = `${cleanNumber}@s.whatsapp.net`;
    
    // Subscribe the user
    const subs = loadSubscribers();
    subs[jid] = { 
      refNo, 
      company, 
      subscribedAt: new Date().toISOString(),
      consumerName: billData?.consumerName || '',
      unitsConsumed: billData?.unitsConsumed || 0,
    };
    saveSubscribers(subs);
    
    console.log(`[WA] Auto-subscribed ${jid} for ${refNo} (${company})`);
    
    // Build confirmation message with bill data
    const units = billData?.unitsConsumed || 0;
    const amount = billData?.payableWithinDueDate || billData?.grandTotal || 0;
    const dueDate = billData?.dueDate || 'N/A';
    const slab = billData?.slabCategory || 'N/A';
    const isProtected = billData?.isProtected;
    const name = billData?.consumerName || '';
    const remaining = Math.max(0, 200 - units);
    
    let msg = `✅ *BillBachat — Alerts On!*\n\n`;
    if (name) msg += `👤 ${name}\n`;
    msg += `🏢 ${company.toUpperCase()} · Ref: ${refNo}\n\n`;
    msg += `📊 *Bill Summary:*\n`;
    msg += `   Units: ${units}\n`;
    msg += `   Amount: Rs. ${amount.toLocaleString()}\n`;
    msg += `   Due Date: ${dueDate}\n`;
    msg += `   Slab: ${slab}\n`;
    msg += `   Status: ${isProtected ? '✅ Protected' : '⚠️ Non-Protected'}\n\n`;
    
    if (isProtected && remaining > 0) {
      msg += `🟢 Aap safe hain! ${remaining} units aur use kar sakte hain protected slab me.\n\n`;
    } else if (!isProtected) {
      msg += `🔴 Slab cross ho gaya hai. Bill double ho raha hai.\n`;
      msg += `💡 AC, geyser, iron kam use karein — next bill bach sakte hain.\n\n`;
    }
    
    msg += `🔔 Ab aapko WhatsApp pe ye alerts milenge:\n`;
    msg += `• Slab cross hone se pehle warning\n`;
    msg += `• Due date reminder\n`;
    msg += `• Bachat tips\n\n`;
    msg += `Unsubscribe: "unsubscribe" bhejein.\n`;
    msg += `Bill check: "bill ${refNo} ${company}"\n\n`;
    msg += `⚡ BillBachat — Bijli ka bill bachao!`;
    
    // Try sending with retry — first attempt may timeout on first message to new number
    let sent = false;
    let attempts = 0;
    while (!sent && attempts < 3) {
      try {
        await sock.sendMessage(jid, { text: msg });
        sent = true;
      } catch (e) {
        attempts++;
        console.error(`[WA] Send attempt ${attempts} failed:`, e.message);
        if (attempts < 3) await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    if (sent) {
      console.log(`[WA] Confirmation message sent to ${jid}`);
      res.json({ 
        success: true, 
        message: 'Subscribed and confirmation sent',
        jid: jid,
        sentMessage: true
      });
    } else {
      console.error(`[WA] Failed to send to ${jid} after 3 attempts`);
      res.status(500).json({ error: 'Message send failed after retries' });
    }
  } catch (err) {
    console.error('[WA] Auto-subscribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Disconnect / logout
app.post('/logout', async (req, res) => {
  try {
    shouldReconnect = false;
    if (sock) {
      try { await sock.logout(); } catch (e) { console.log('[WA] logout err:', e.message); }
    }
    // Clean auth folder
    find_baileys_auth_delete();
    pairingCode = null;
    pairingPhoneNumber = null;
    qrCodeData = null;
    qrCodeImage = null;
    connectionState = 'disconnected';
    reconnectAttempts = 0;
    shouldReconnect = true;
    res.json({ success: true, message: 'Logged out. Restarting fresh...' });
    setTimeout(() => startSock(), 2000);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, state: connectionState, port: PORT });
});

// Test command without WhatsApp — simulate a message
app.post('/test-command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'command required' });
    
    const parts = command.trim().split(/\s+/);
    const cmd = command.trim().toLowerCase();
    let response = '';
    
    // Simulate bill command
    if (parts[0]?.toLowerCase() === 'bill' && parts[1] && parts[2]) {
      const refNo = parts[1].replace(/\D/g, '');
      const company = parts[2].toLowerCase();
      
      if (refNo.length < 10) {
        return res.json({ command, response: '❌ Reference number sahi nahi. 14-digit number daalo.' });
      }

      try {
        const billRes = await axios.get(`${BILLBachat_API}/?ref=${refNo}&company=${company}`, { timeout: 20000 });
        const bill = billRes.data;
        
        if (bill.success) {
          const status = bill.isProtected ? '✅ Protected' : '⚠️ Non-Protected';
          const remaining = 200 - (bill.unitsConsumed || 0);
          
          let msg = `⚡ *BillBachat — Bill Result*\n\n`;
          if (bill.consumerName) msg += `👤 *${bill.consumerName}*\n`;
          msg += `🏢 ${bill.company || company.toUpperCase()}\n`;
          msg += `🔢 Ref: ${bill.referenceNumber || refNo}\n\n`;
          msg += `📊 *Units:* ${bill.unitsConsumed || '?'}\n`;
          msg += `💰 *Total:* Rs. ${(bill.payableWithinDueDate || bill.grandTotal || 0).toLocaleString()}\n`;
          msg += `📅 *Due Date:* ${bill.dueDate || 'N/A'}\n`;
          msg += `🏷️ *Slab:* ${bill.slabCategory || 'N/A'}\n`;
          msg += `🛡️ *Status:* ${status}\n\n`;
          
          if (bill.isProtected && remaining > 0) {
            msg += `✅ Safe! ${remaining} units baaki hain.\n`;
          } else if (!bill.isProtected) {
            msg += `⚠️ Limit cross! Bill double ho raha hai.\n`;
          }
          msg += `\n💡 BillBachat Pro pe daily alerts pao. "subscribe" likhein.`;
          
          return res.json({ command, response: msg, bill });
        } else {
          return res.json({ command, response: `❌ Bill nahi mila. Reference number aur company check karein.\nError: ${bill.error || 'Unknown'}` });
        }
      } catch (err) {
        return res.json({ command, response: '❌ Bill fetch me error. Baad me try karein.', error: err.message });
      }
    }
    
    // Simulate help
    if (cmd === 'hi' || cmd === 'hello' || cmd === 'help' || cmd === 'start' || cmd === 'salam') {
      const user = getOrCreateUser(req.body.from || '923225490551@s.whatsapp.net');
      const plan = getEffectivePlan(user);
      const planBadge = plan === 'free' ? '🆓 Free' : plan === 'pro' ? '⭐ Pro' : '👨‍👩‍👧‍👦 Family';
      response = `⚡ *BillBachat Bot*\n\nAapka Plan: ${planBadge}\n\nCommands:\n• *bill <refno> <company>* — Bill check karein\n  Example: bill 06113530462901 lesco\n• *subscribe <refno> <company>* — Daily alerts pao (Pro)\n• *plan* — Apna plan dekhein\n• *upgrade pro* — Pro lein (Rs.99/mo)\n• *status* — Subscription dekhein\n• *unsubscribe* — Alerts band karein\n• *help* — Ye menu\n\n${plan === 'free' ? '💡 Free me 1 bill check/day. Pro lein for unlimited + alerts!\n\n' : ''}Companies: lesco, iesco, mepco, fesco, gepco, pesco, hesco, sepco, qesco\n\n💡 BillBachat — Bijli ka bill bachao!`;
      return res.json({ command, response });
    }
    
    // Simulate plan
    if (cmd === 'plan' || cmd === 'myplan') {
      const user = getOrCreateUser(req.body.from || '923225490551@s.whatsapp.net');
      const plan = getEffectivePlan(user);
      const planName = plan === 'free' ? '🆓 Free Plan' : plan === 'pro' ? '⭐ Pro Plan' : '👨‍👩‍👧‍👦 Family Plan';
      let msg = `📋 *Aapka Plan*\n\nPlan: ${planName}\n`;
      if (user.planExpiry && plan !== 'free') msg += `Expiry: ${new Date(user.planExpiry).toLocaleDateString()}\n`;
      msg += `\n`;
      if (plan === 'free') {
        msg += `Free me:\n• 1 bill check/day\n• Slab status\n• Basic tips\n\n⭐ *Pro (Rs.99/mo):*\n• Unlimited bill checks\n• WhatsApp daily alerts\n• Slab crossing warning\n• Due date reminder\n\nUpgrade: "upgrade pro" likhein`;
      } else {
        msg += `✅ Sab features unlocked!\n• Unlimited bill checks\n• Daily WhatsApp alerts\n• Slab warnings\n\nThanks for being a Pro user! 🙏`;
      }
      return res.json({ command, response: msg });
    }
    
    // Simulate upgrade
    if (parts[0]?.toLowerCase() === 'upgrade' && parts[1]) {
      const planChoice = parts[1].toLowerCase();
      const jid = req.body.from || '923225490551@s.whatsapp.net';
      const phone = jidToPhone(jid);
      
      if (planChoice === 'pro' || planChoice === 'family') {
        if (parts[2]?.toLowerCase() === 'test') {
          const updated = upgradeUserPlan(phone, planChoice, 1);
          if (updated) {
            return res.json({ command, response: `✅ *${planChoice.toUpperCase()} Plan Activated! (Test)*\n\nPlan: ${planChoice === 'pro' ? '⭐ Pro' : '👨‍👩‍👧‍👦 Family'}\nExpiry: ${new Date(updated.planExpiry).toLocaleDateString()}\n\nAb unlimited bill checks + daily alerts on hain!` });
          }
        }
        
        const price = planChoice === 'pro' ? 99 : 199;
        let msg = `⭐ *Upgrade to ${planChoice.toUpperCase()}*\n\nPrice: Rs. ${price}/month\n\n📲 *Payment kaise karein:*\n1. JazzCash / Easypaisa pe Rs. ${price} bhejein:\n   0322-5490551\n\n2. Screenshot lein\n3. "upgrade ${planChoice} done" likh kar screenshot bhejein\n\n⚡ Payment verify hote hi plan activate ho jayega (24 hours).\n\n🧪 Testing? "upgrade ${planChoice} test" likhein for instant activation.`;
        return res.json({ command, response: msg });
      }
    }
    
    // Simulate subscribe
    if (parts[0]?.toLowerCase() === 'subscribe' && parts[1] && parts[2]) {
      const jid = req.body.from || '923225490551@s.whatsapp.net';
      const user = getOrCreateUser(jid);
      const plan = getEffectivePlan(user);
      const refNo = parts[1].replace(/\D/g, '');
      
      if (plan === 'free') {
        return res.json({ command, response: `🔒 *Pro Feature*\n\nDaily WhatsApp alerts sirf Pro plan me hain.\n\n⭐ Pro = Rs. 99/month:\n• Unlimited bill checks\n• Daily slab alerts\n• Due date reminders\n• Slab crossing warnings\n\nUpgrade: "upgrade pro" likhein\nTest? "upgrade pro test" likhein` });
      }
      
      const subs = loadSubscribers();
      subs[jid] = { refNo, company: parts[2].toLowerCase(), subscribedAt: new Date().toISOString(), plan };
      saveSubscribers(subs);
      return res.json({ command, response: `✅ *Subscribed! (${plan.toUpperCase()})*\n\nRef: ${refNo}\nCompany: ${parts[2].toUpperCase()}\n\nAb aapko slab alerts milenge jab units 200 ke qareeb pohchein.\n\nUnsubscribe: "unsubscribe" likhein.` });
    }
    
    // Simulate status
    if (cmd === 'status') {
      const jid = req.body.from || '923225490551@s.whatsapp.net';
      const subs = loadSubscribers();
      const sub = subs[jid];
      if (sub) {
        return res.json({ command, response: `📋 *Your Subscription*\n\nRef: ${sub.refNo}\nCompany: ${sub.company.toUpperCase()}\nSubscribed: ${new Date(sub.subscribedAt).toLocaleDateString()}\nPlan: ${sub.plan || 'free'}\n\nUnsubscribe: "unsubscribe" likhein.` });
      }
      return res.json({ command, response: '❌ Aap subscribed nahi hain. "subscribe <refno> <company>" likhein.' });
    }
    
    // Simulate unsubscribe
    if (cmd === 'unsubscribe') {
      const jid = req.body.from || '923225490551@s.whatsapp.net';
      const subs = loadSubscribers();
      if (subs[jid]) {
        delete subs[jid];
        saveSubscribers(subs);
        return res.json({ command, response: '✅ Unsubscribed. Alerts band kar diye.' });
      }
      return res.json({ command, response: '❌ Aap subscribed nahi the.' });
    }
    
    return res.json({ command, response: '❓ Samajh nahi aaya. "help" likhein ke commands dekhein.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === DAILY ALERT CHECK ===
// Fetches bill for each subscriber, checks slab boundary, sends alert if needed
async function checkAllSubscribers() {
  if (connectionState !== 'connected') {
    console.log('[ALERT] Bot not connected, skipping');
    return { error: 'Bot not connected' };
  }
  
  const subs = loadSubscribers();
  const jids = Object.keys(subs);
  console.log(`[ALERT] Checking ${jids.length} subscribers...`);
  
  const results = { checked: 0, alertsSent: 0, errors: 0, details: [] };
  
  for (const jid of jids) {
    const sub = subs[jid];
    try {
      // Fetch bill from PITC
      const billRes = await axios.get(`${BILLBachat_API}/?ref=${sub.refNo}&company=${sub.company}`, { 
        timeout: 20000 
      });
      const bill = billRes.data;
      
      if (!bill.success) {
        console.log(`[ALERT] Bill fetch failed for ${jid}: ${bill.error}`);
        results.errors++;
        continue;
      }
      
      results.checked++;
      const units = bill.unitsConsumed || 0;
      const remaining = 200 - units;
      const isProtected = bill.isProtected;
      const dueDate = bill.dueDate || '';
      const amount = bill.payableWithinDueDate || bill.grandTotal || 0;
      
      let shouldAlert = false;
      let alertType = '';
      let alertMsg = '';
      
      // Check 1: Near slab boundary (180-200 units, protected)
      if (isProtected && units >= 180 && units < 200) {
        shouldAlert = true;
        alertType = 'slab_warning';
        alertMsg = `⚠️ *Slab Alert!*\n\n`;
        alertMsg += `👤 ${bill.consumerName || 'N/A'}\n`;
        alertMsg += `📊 Units used: ${units}\n`;
        alertMsg += `🔴 Sirf *${remaining} units* baaki hain!\n\n`;
        alertMsg += `Agar 200 cross ho gaya to bill *double* ho jayega.\n\n`;
        alertMsg += `💡 *Bachao:*\n`;
        alertMsg += `• AC 1 ghanta band (−3 units)\n`;
        alertMsg += `• Geyser band (−2 units)\n`;
        alertMsg += `• Iron kam use karein\n\n`;
        alertMsg += `⚡ BillBachat — Bijli ka bill bachao!`;
      }
      
      // Check 2: Just crossed slab (>200, non-protected)
      if (!isProtected && units > 200 && units <= 220) {
        shouldAlert = true;
        alertType = 'slab_crossed';
        alertMsg = `🔴 *Slab Cross Ho Gaya!*\n\n`;
        alertMsg += `👤 ${bill.consumerName || 'N/A'}\n`;
        alertMsg += `📊 Units: ${units} (limit 200 cross)\n`;
        alertMsg += `💰 Bill: Rs. ${amount.toLocaleString()}\n\n`;
        alertMsg += `Ab aap *non-protected* me hain — rate mehenga hai.\n`;
        alertMsg += `Next bill bachane ke liye usage kam karein.\n\n`;
        alertMsg += `💡 AC, geyser, iron kam use karein.\n\n`;
        alertMsg += `⚡ BillBachat — Bijli ka bill bachao!`;
      }
      
      // Check 3: Due date reminder (parse date from bill)
      if (dueDate && dueDate.match(/\d{1,2}\s+\w{3}\s*\d{2}/i)) {
        try {
          const dueDateObj = new Date(dueDate.replace(/(\d{2})$/, '20$1'));
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDateObj - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue >= 0 && daysUntilDue <= 3) {
            shouldAlert = true;
            alertType = 'due_date';
            alertMsg = `📅 *Bill Due Date Reminder!*\n\n`;
            alertMsg += `👤 ${bill.consumerName || 'N/A'}\n`;
            alertMsg += `💰 Amount: Rs. ${amount.toLocaleString()}\n`;
            alertMsg += `📅 Due Date: ${dueDate}\n`;
            alertMsg += `⏰ Sirf *${daysUntilDue} din* baaki!\n\n`;
            alertMsg += `Jaldi bill jama karein — late fee bachao.\n\n`;
            alertMsg += `⚡ BillBachat — Bijli ka bill bachao!`;
          }
        } catch (e) {
          // date parse failed, skip
        }
      }
      
      if (shouldAlert) {
        // Check if we already sent this alert today (avoid spam)
        const today = new Date().toISOString().slice(0, 10);
        const lastAlertDate = sub.lastAlertDate;
        const lastAlertType = sub.lastAlertType;
        
        if (lastAlertDate === today && lastAlertType === alertType) {
          console.log(`[ALERT] Already sent ${alertType} to ${jid} today, skipping`);
          results.details.push({ jid, alertType, skipped: true });
          continue;
        }
        
        // Send alert
        let sent = false;
        let attempts = 0;
        while (!sent && attempts < 3) {
          try {
            await sock.sendMessage(jid, { text: alertMsg });
            sent = true;
          } catch (e) {
            attempts++;
            console.error(`[ALERT] Send attempt ${attempts} failed for ${jid}:`, e.message);
            if (attempts < 3) await new Promise(r => setTimeout(r, 2000));
          }
        }
        
        if (sent) {
          // Update subscriber with alert tracking
          subs[jid].lastAlertDate = today;
          subs[jid].lastAlertType = alertType;
          subs[jid].lastUnitsChecked = units;
          saveSubscribers(subs);
          
          results.alertsSent++;
          results.details.push({ jid, alertType, units, sent: true });
          console.log(`[ALERT] Sent ${alertType} to ${jid} (${units} units)`);
        } else {
          results.errors++;
          results.details.push({ jid, alertType, sent: false, error: 'send failed' });
        }
      } else {
        results.details.push({ jid, units, noAlert: true });
        console.log(`[ALERT] ${jid}: ${units} units — no alert needed`);
      }
      
      // Rate limit: wait 3s between each subscriber to avoid PITC rate limit
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (err) {
      console.error(`[ALERT] Error for ${jid}:`, err.message);
      results.errors++;
      results.details.push({ jid, error: err.message });
    }
  }
  
  console.log(`[ALERT] Done: ${results.checked} checked, ${results.alertsSent} alerts sent, ${results.errors} errors`);
  return results;
}

// Endpoint to trigger alert check manually or via cron
app.post('/check-alerts', async (req, res) => {
  try {
    const results = await checkAllSubscribers();
    res.json({ success: true, ...results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[API] BillBachat WhatsApp Bot API on http://localhost:${PORT}`);
  console.log(`[API] Endpoints: /status, /qr, /pair, /send, /subscribers, /health, /logout, /check-alerts, /test-command`);
  startSock();
});

// === USERS / PLAN INTEGRATION ===
// Reads users.json created by the web app's auth system
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveUsers(db) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2));
}

// Convert WhatsApp JID (923XXXXXXXXX@s.whatsapp.net) to phone (92XXXXXXXXXX)
function jidToPhone(jid) {
  return jid.replace('@s.whatsapp.net', '').replace('@s.whatsapp.com', '');
}

// Convert WhatsApp JID to local display (03XXXXXXXXX)
function jidToDisplay(jid) {
  const phone = jidToPhone(jid);
  if (phone.startsWith('92')) return '0' + phone.slice(2);
  return phone;
}

// Get or create user from WhatsApp JID
function getOrCreateUser(jid) {
  const db = loadUsers();
  const phone = jidToPhone(jid);
  const display = jidToDisplay(jid);
  
  if (!db[phone]) {
    const today = new Date().toISOString().split('T')[0];
    db[phone] = {
      phone,
      phoneDisplay: display,
      name: 'WhatsApp User',
      plan: 'free',
      planExpiry: null,
      createdAt: new Date().toISOString(),
      billChecksToday: 0,
      lastCheckDate: today,
      refNos: [],
    };
    saveUsers(db);
  }
  
  return db[phone];
}

function isPlanActive(user) {
  if (user.plan === 'free') return true;
  if (!user.planExpiry) return false;
  return new Date(user.planExpiry) > new Date();
}

function getEffectivePlan(user) {
  if (!isPlanActive(user)) return 'free';
  return user.plan;
}

function upgradeUserPlan(phone, plan, months = 1) {
  const db = loadUsers();
  const user = db[phone];
  if (!user) return null;
  
  user.plan = plan;
  const base = user.planExpiry && new Date(user.planExpiry) > new Date()
    ? new Date(user.planExpiry)
    : new Date();
  base.setMonth(base.getMonth() + months);
  user.planExpiry = base.toISOString();
  
  db[phone] = user;
  saveUsers(db);
  return user;
}
