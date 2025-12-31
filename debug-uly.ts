
import { getSubmissions } from "./src/lib/sec";

const SEC_USER_AGENT = "HuntSec (tan_v@example.com)";

async function run() {
    // ULY CIK
    const cik = 1603652;
    console.log("Fetching submissions for ULY...");
    const data = await getSubmissions(cik);

    if (!data || !data.filings || !data.filings.recent) return;

    const recent = data.filings.recent;
    // Find latest S-3
    let accessCode = "";
    let primaryDoc = "";

    for (let i = 0; i < recent.form.length; i++) {
        if (recent.form[i] === "S-3") {
            accessCode = recent.accessionNumber[i];
            primaryDoc = recent.primaryDocument[i];
            console.log(`Found S-3 filed on ${recent.filingDate[i]}`);
            break;
        }
    }

    if (!accessCode) {
        console.log("No S-3 found");
        return;
    }

    const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessCode.replace(/-/g, '')}/${primaryDoc}`;
    console.log(`Fetching ${url}...`);

    const response = await fetch(url, {
        headers: { "User-Agent": SEC_USER_AGENT }
    });
    const text = await response.text();

    // Test current regex
    const regex = /aggregate\s+market\s+value\s+of[\s\S]*?public\s+float[\s\S]*?\$([0-9,]+)/i;
    const match = text.match(regex);

    if (match) {
        console.log("Current Regex Match:", match[0]);
        console.log("Captured Group:", match[1]);
    } else {
        console.log("Current Regex: No match");
    }

    // Updated regex to capture decimals and units (million/billion)
    const newRegex = /aggregate\s+market\s+value\s+of[\s\S]*?public\s+float[\s\S]*?\$([0-9,.]+)\s*(million|billion)?/i;
    const newMatch = text.match(newRegex);

    if (newMatch) {
        console.log("New Regex Match:", newMatch[0]);
        console.log("Value:", newMatch[1]);
        console.log("Unit:", newMatch[2] || "None");
    } else {
        console.log("New Regex: No match");
    }

    // Look for context
    const idx = text.toLowerCase().indexOf("aggregate market value");
    if (idx !== -1) {
        console.log("\nContext around 'aggregate market value':");
        console.log(text.substring(idx, idx + 400));
    }
}

run();
