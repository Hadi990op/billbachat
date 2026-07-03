import axios from "axios";
import * as cheerio from "cheerio";

export const DISCOS = [
  { code: "lesco", name: "LESCO", fullName: "Lahore Electric Supply Company" },
  { code: "iesco", name: "IESCO", fullName: "Islamabad Electric Supply Company" },
  { code: "mepco", name: "MEPCO", fullName: "Multan Electric Power Company" },
  { code: "fesco", name: "FESCO", fullName: "Faisalabad Electric Supply Company" },
  { code: "gepco", name: "GEPCO", fullName: "Gujranwala Electric Power Company" },
  { code: "pesco", name: "PESCO", fullName: "Peshawar Electric Supply Company" },
  { code: "hesco", name: "HESCO", fullName: "Hyderabad Electric Supply Company" },
  { code: "sepco", name: "SEPCO", fullName: "Sukkur Electric Supply Company" },
  { code: "qesco", name: "QESCO", fullName: "Quetta Electric Supply Company" },
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface BillData {
  success: boolean;
  company: string;
  referenceNumber: string;
  fetchedAt: string;
  consumerId?: string;
  consumerName?: string;
  address?: string;
  billMonth?: string;
  dueDate?: string;
  issueDate?: string;
  previousReading?: string;
  presentReading?: string;
  unitsConsumed?: number;
  totalElectricityCharges?: number;
  subsidies?: number;
  netElectricityCharges?: number;
  taxes?: number;
  currentBill?: number;
  totalFPA?: number;
  grandTotal?: number;
  payableWithinDueDate?: number;
  payableAfterDueDate?: number;
  slabCategory?: string;
  isProtected?: boolean;
  billUrl?: string;
  error?: string;
}

export async function fetchPITCBill(
  refNo: string,
  companyCode: string
): Promise<BillData> {
  const baseUrl = `https://bill.pitc.com.pk/${companyCode}bill`;
  const result: BillData = {
    success: false,
    company: companyCode.toUpperCase(),
    referenceNumber: refNo,
    fetchedAt: new Date().toISOString(),
  };

  try {
    // Step 1: GET form page to extract ViewState tokens
    const getRes = await axios.get(baseUrl, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(getRes.data);
    const viewState = String($("#__VIEWSTATE").val() || "");
    const viewStateGen = String($("#__VIEWSTATEGENERATOR").val() || "");
    const eventValidation = String($("#__EVENTVALIDATION").val() || "");
    const csrfToken = String($('[name="__RequestVerificationToken"]').val() || "");

    if (!viewState) {
      result.error = "Could not fetch bill form";
      return result;
    }

    // Step 2: POST form with reference number
    const formData = new URLSearchParams();
    formData.append("__EVENTTARGET", "");
    formData.append("__EVENTARGUMENT", "");
    formData.append("__VIEWSTATE", viewState);
    formData.append("__VIEWSTATEGENERATOR", viewStateGen);
    formData.append("__EVENTVALIDATION", eventValidation);
    if (csrfToken) formData.append("__RequestVerificationToken", csrfToken);
    formData.append("rbSearchByList", "refno");
    formData.append("searchTextBox", refNo);
    formData.append("btnSearch", "Search");

    const postRes = await axios.post(baseUrl, formData.toString(), {
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: baseUrl,
        Origin: "https://bill.pitc.com.pk",
        Cookie: getRes.headers["set-cookie"]?.join("; ") || "",
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $$ = cheerio.load(postRes.data);
    const pageText = $$.text().replace(/\s+/g, " ").trim();

    // Check for invalid reference
    if (
      pageText.includes("invalid") ||
      pageText.includes("Invalid") ||
      pageText.includes("does not belong")
    ) {
      result.error = "Invalid reference number for this company";
      return result;
    }

    // Check if we got actual bill data (look for bill-specific elements)
    const hasBillData =
      pageText.includes("CONSUMER") ||
      pageText.includes("Consumer") ||
      pageText.includes("Grand Total") ||
      pageText.includes("DUE DATE");

    if (!hasBillData) {
      result.error = "Bill not found";
      return result;
    }

    result.success = true;
    result.billUrl = `${baseUrl}`;

    // === EXTRACT FIELDS ===

    // Helper: find the value after a label element
    function valAfter(labelPattern: RegExp): string | undefined {
      let found: string | undefined;
      $$("span, div, td, p, label").each((i, el) => {
        const t = $$(el).text().trim();
        if (labelPattern.test(t) && t.length < 120) {
          const next = $$(el).next().text().trim();
          if (next && next.match(/^\d/) && next.length < 20) {
            found = next;
            return false;
          }
          const parentNext = $$(el).parent().next().text().trim();
          if (parentNext && parentNext.match(/^\d/) && parentNext.length < 20) {
            found = parentNext;
            return false;
          }
        }
      });
      return found;
    }

    // Consumer ID
    const consumerId = valAfter(/CONSUMER ID/i);
    if (consumerId) result.consumerId = consumerId;

    // Consumer Name & Address — PITC uses "NAME & ADDRESS" label followed by
    // <div class="val-space val-space--address"><span>NAME, ADDRESS</span></div>
    // The name and address are comma-separated in the same span
    $$("div.val-space--address span").each((i, el) => {
      const t = $$(el).text().trim();
      if (t && t.length > 2 && t.length < 200) {
        // Split into name and address at first comma
        const parts = t.split(/,([^,]+)/);
        if (parts.length >= 2) {
          result.consumerName = parts[0].trim();
          result.address = parts.slice(1).join("").trim();
        } else {
          result.consumerName = t;
        }
      }
    });

    // Fallback: old method if val-space--address didn't work
    if (!result.consumerName) {
      $$("span, div, td").each((i, el) => {
        const t = $$(el).text().trim();
        if (
          t.match(/NAME & ADDRESS|NAME AND ADDRESS/i) &&
          t.length < 60
        ) {
          const next = $$(el).next().text().trim();
          if (next && next.length > 2 && next.length < 200) {
            const parts = next.split(/,([^,]+)/);
            if (parts.length >= 2) {
              result.consumerName = parts[0].trim();
              result.address = parts.slice(1).join("").trim();
            } else {
              result.consumerName = next;
            }
          }
        }
      });
    }

    // Readings
    const prevReading = valAfter(/PREVIOUS READING/i);
    if (prevReading) result.previousReading = prevReading;

    const presReading = valAfter(/PRESENT READING/i);
    if (presReading) result.presentReading = presReading;

    // Calculate units
    if (prevReading && presReading) {
      result.unitsConsumed = Number(presReading) - Number(prevReading);
    }

    // Also try to find units directly
    const unitsDirect = valAfter(/Units Consumed|Total Units|Consumed Units/i);
    if (unitsDirect && !result.unitsConsumed) {
      result.unitsConsumed = Number(unitsDirect);
    }

    // Bill Month
    $$("div, td, span").each((i, el) => {
      const t = $$(el).text().trim();
      if (t.match(/BILL MONTH|Month/i) && t.length < 40) {
        const next = $$(el).next().text().trim();
        if (next && next.length < 20 && next.match(/\w{3}/i)) {
          result.billMonth = next;
        }
      }
    });

    // Due Date
    $$("div, td, span").each((i, el) => {
      const t = $$(el).text().trim();
      if (
        (t.match(/DUE DATE/i) || t.match(/مقررہ تاریخ/i)) &&
        !t.match(/PAYABLE|WITHIN|AFTER/i) &&
        !result.dueDate
      ) {
        const next = $$(el).next().text().trim();
        if (next && next.length < 30) {
          result.dueDate = next;
        }
        const parentNext = $$(el).parent().next().text().trim();
        if (parentNext && parentNext.length < 30 && !result.dueDate) {
          result.dueDate = parentNext;
        }
      }
    });

    // Issue Date
    const issueDate = valAfter(/ISSUE DATE|Billing Date/i);
    if (issueDate) result.issueDate = issueDate;

    // Charges
    const elecCharges = valAfter(/Total Electricity Charges/i);
    if (elecCharges) result.totalElectricityCharges = Number(elecCharges);

    const subsidies = valAfter(/Subsidies/i);
    if (subsidies) result.subsidies = Number(subsidies);

    const netCharges = valAfter(/Net Electricity Charges/i);
    if (netCharges) result.netElectricityCharges = Number(netCharges);

    const taxes = valAfter(/^Taxes$/i);
    if (taxes) result.taxes = Number(taxes);

    const currentBill = valAfter(/Current Bill/i);
    if (currentBill) result.currentBill = Number(currentBill);

    const totalFPA = valAfter(/Total FPA/i);
    if (totalFPA) result.totalFPA = Number(totalFPA);

    const grandTotal = valAfter(/Grand Total/i);
    if (grandTotal) result.grandTotal = Number(grandTotal);

    // Payable amounts
    $$("div, td, span").each((i, el) => {
      const t = $$(el).text().trim();
      if (t.match(/PAYABLE WITHIN DUE DATE|Payable Within/i)) {
        const next = $$(el).next().text().trim();
        if (next && next.match(/^\d/)) result.payableWithinDueDate = Number(next);
      }
      if (t.match(/PAYABLE AFTER DUE DATE|Payable After/i)) {
        const next = $$(el).next().text().trim();
        if (next && next.match(/^\d/)) result.payableAfterDueDate = Number(next);
      }
    });

    // Determine slab category and protected status
    if (result.unitsConsumed !== undefined) {
      if (result.unitsConsumed <= 100) {
        result.slabCategory = "1-100 units";
        result.isProtected = true;
      } else if (result.unitsConsumed <= 200) {
        result.slabCategory = "101-200 units";
        result.isProtected = true;
      } else if (result.unitsConsumed <= 300) {
        result.slabCategory = "201-300 units";
        result.isProtected = false;
      } else if (result.unitsConsumed <= 400) {
        result.slabCategory = "301-400 units";
        result.isProtected = false;
      } else {
        result.slabCategory = "401+ units";
        result.isProtected = false;
      }
    }

    return result;
  } catch (err: unknown) {
    result.error =
      err instanceof Error
        ? err.message
        : "Failed to fetch bill from PITC portal";
    return result;
  }
}
