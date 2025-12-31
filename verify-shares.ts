
import { getLatestSharesOutstanding } from "./src/lib/sec";

async function verify() {
    const cik = 320193; // AAPL
    console.log("Fetching shares for AAPL...");
    const shares = await getLatestSharesOutstanding(cik);
    console.log("Shares Outstanding:", shares);
}

verify();
