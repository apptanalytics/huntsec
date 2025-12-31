
const SEC_USER_AGENT = "HuntSec (tan_v@example.com)";

async function checkSecData() {
    const cik = "0000320193"; // AAPL
    // Check submissions endpoint
    console.log("Checking Submissions...");
    const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
        headers: { "User-Agent": SEC_USER_AGENT }
    });
    const subData = await subRes.json();
    console.log("Submissions Keys:", Object.keys(subData));

    // Check company facts
    console.log("\nChecking Company Facts...");
    const factsRes = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
        headers: { "User-Agent": SEC_USER_AGENT }
    });
    if (factsRes.ok) {
        const factsData = await factsRes.json();
        const dei = factsData.facts?.["dei"];
        const shares = dei?.["EntityCommonStockSharesOutstanding"];
        // console.log("DEI Keys:", Object.keys(dei || {}));
        if (shares) {
            console.log("Found Shares Outstanding Data (Top 5):", JSON.stringify(shares.units?.shares?.slice(-5), null, 2));
        } else {
            console.log("EntityCommonStockSharesOutstanding not found in DEI.");
        }
    } else {
        console.log("Failed to fetch facts:", factsRes.status);
    }
}

checkSecData();
