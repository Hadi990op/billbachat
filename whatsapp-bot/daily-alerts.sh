#!/bin/bash
# Daily slab alert check for BillBachat
# Runs via cron at 9 AM daily
# Checks all subscribers' bills, sends WhatsApp alerts if near slab boundary

echo "[$(date)] Starting daily alert check..."
RESULT=$(curl -s --max-time 180 -X POST http://localhost:9200/check-alerts -H "Content-Type: application/json")
echo "[$(date)] Result: $RESULT"
echo "[$(date)] Done."
