
import { getLatestSharesOutstanding } from "./src/lib/sec";

async function verify() {
    const cik = 320193; // AAPL
    console.log("Fetching shares for AAPL...");
    const result = await getLatestSharesOutstanding(cik);
    console.log("Result:", result);
}

verify();
