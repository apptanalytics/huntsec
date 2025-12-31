
const SEC_USER_AGENT = "HuntSec (tan_v@example.com)"; // Placeholder - typically requires "App Name (email)"

export async function getTickerToCikMap(): Promise<Record<string, number>> {
    try {
        const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
            headers: {
                "User-Agent": SEC_USER_AGENT,
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch tickers: ${response.statusText}`);
        }

        const data = await response.json();

        // transform { "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." }, ... }
        // to { "AAPL": 320193, ... }

        const tickerMap: Record<string, number> = {};
        Object.values(data).forEach((entry: any) => {
            tickerMap[entry.ticker] = entry.cik_str;
        });

        return tickerMap;
    } catch (error) {
        console.error("Error fetching ticker map:", error);
        return {};
    }
}

export async function getSubmissions(cik: number) {
    // CIK must be 10 digits, padded with zeros
    const paddedCik = cik.toString().padStart(10, '0');
    const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": SEC_USER_AGENT,
            },
            next: { revalidate: 60 }, // Cache for 1 minute
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch submissions for CIK ${cik}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching submissions for ${cik}:`, error);
        return null;
    }
}

export async function getCompanyFacts(cik: number) {
    const paddedCik = cik.toString().padStart(10, '0');
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": SEC_USER_AGENT,
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            // Not all companies have XBRL facts
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch facts for CIK ${cik}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching facts for ${cik}:`, error);
        return null;
    }
}

export async function getLatestSharesOutstanding(cik: number): Promise<{ value: number, date: string } | null> {
    try {
        const facts = await getCompanyFacts(cik);
        if (facts) {
            const dei = facts.facts?.["dei"];
            const sharesData = dei?.["EntityCommonStockSharesOutstanding"] || dei?.["CommonStockSharesOutstanding"];
            if (sharesData && sharesData.units && sharesData.units.shares) {
                // Get the latest entry based on 'end' date
                const entries = sharesData.units.shares;
                const latest = entries.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
                return latest ? { value: latest.val, date: latest.end } : null;
            }
        }
    } catch (e) {
        console.error("Failed to extract shares outstanding", e);
    }
    return null;
}
