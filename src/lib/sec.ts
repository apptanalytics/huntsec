
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

export async function getLatestSharesOutstanding(cik: number): Promise<{ value: number, date: string, source: '10-Q/K' | 'XBRL' } | null> {
    try {
        // Strategy 1: Parse latest 10-Q or 10-K filing text
        const submissions = await getSubmissions(cik);
        if (submissions && submissions.filings && submissions.filings.recent) {
            const recent = submissions.filings.recent;
            let accessCode = "";
            let primaryDoc = "";
            let filingDate = "";

            // Find latest 10-Q or 10-K
            for (let i = 0; i < recent.form.length; i++) {
                if (recent.form[i] === "10-Q" || recent.form[i] === "10-K") {
                    accessCode = recent.accessionNumber[i];
                    primaryDoc = recent.primaryDocument[i];
                    filingDate = recent.filingDate[i];
                    console.log(`[DEBUG] Found filing: ${recent.form[i]} Date: ${filingDate}`);
                    break;
                }
            }

            if (accessCode) {
                const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessCode.replace(/-/g, '')}/${primaryDoc}`;
                const response = await fetch(url, {
                    headers: { "User-Agent": SEC_USER_AGENT },
                    next: { revalidate: 3600 }
                });

                if (response.ok) {
                    const text = await response.text();
                    // Limit to first 300,000 characters to cover header information (cover page can be far down in HTML)
                    // Replace newlines and HTML tags to clean up the text for regex matching
                    const cleanText = text.substring(0, 300000)
                        .replace(/<[^>]+>/g, ' ') // Strip HTML tags
                        .replace(/\s+/g, ' '); // Normalize whitespace

                    // Regex patterns

                    // 1. "Indicate ... shares outstanding of each of the issuer's classes" (Multi-class table/list)
                    // e.g. SNAP: Class A ... 1.4B, Class B ... 22M, Class C ... 231M
                    const eachClassRegex = /indicate\s+the\s+number\s+of\s+shares\s+outstanding\s+of\s+each\s+of\s+the\s+issuer's\s+classes/i;
                    if (eachClassRegex.test(cleanText)) {
                        const sharesRegex = /([0-9,]{4,})\s+shares\s+outstanding/gi;
                        const matches = [...cleanText.matchAll(sharesRegex)];

                        let total = 0;
                        let count = 0;
                        for (const m of matches) {
                            const val = parseFloat(m[1].replace(/,/g, ''));
                            if (!isNaN(val) && val > 0) {
                                total += val;
                                count++;
                            }
                        }

                        // Heuristic: If we found multiple classes, or at least one large number in this context
                        if (count > 0) {
                            return { value: total, date: filingDate, source: '10-Q/K' };
                        }
                    }

                    // 2. "Number of ... shares outstanding ... was X and Y" (e.g. Class A and B)
                    // Use non-greedy .*? to prevent matching across too much text
                    const combinedRegex = /number\s+of\s+.*?shares\s+outstanding\s+as\s+of\s+.*?was\s+([0-9,]+)\s+and\s+([0-9,]+)/i;
                    const combinedMatch = cleanText.match(combinedRegex);
                    if (combinedMatch) {
                        const val = parseFloat(combinedMatch[1].replace(/,/g, '')) + parseFloat(combinedMatch[2].replace(/,/g, ''));
                        return { value: val, date: filingDate, source: '10-Q/K' };
                    }

                    // 3. "registrant had X shares ... outstanding"
                    const hadRegex = /registrant\s+had\s+([0-9,]+)\s+shares/i;
                    const hadMatch = cleanText.match(hadRegex);
                    if (hadMatch) {
                        return { value: parseFloat(hadMatch[1].replace(/,/g, '')), date: filingDate, source: '10-Q/K' };
                    }

                    // 4. "X shares ... outstanding as of"
                    // Allow for spaces in the number (caused by tag stripping e.g. "14,000, 000")
                    // Must start with a digit to avoid matching punctuation like ", shares of"
                    const asOfRegex = /([0-9][0-9,\s]*?)\s+shares\s+of\s+.*?outstanding\s+as\s+of/i;
                    const asOfMatch = cleanText.match(asOfRegex);
                    if (asOfMatch) {
                        return { value: parseFloat(asOfMatch[1].replace(/[\s,]/g, '')), date: filingDate, source: '10-Q/K' };
                    }

                    // 4. "outstanding ... : ... X shares" (Standard 10-Q header style)
                    const headerRegex = /outstanding.*?\:\s*.*?\s+([0-9,]+)\s+shares/i;
                    const headerMatch = cleanText.match(headerRegex);
                    if (headerMatch) {
                        return { value: parseFloat(headerMatch[1].replace(/,/g, '')), date: filingDate, source: '10-Q/K' };
                    }
                }
            }
        }

        // Strategy 2: Fallback to XBRL Company Facts
        const facts = await getCompanyFacts(cik);
        if (facts) {
            const dei = facts.facts?.["dei"];
            const sharesData = dei?.["EntityCommonStockSharesOutstanding"] || dei?.["CommonStockSharesOutstanding"];
            if (sharesData && sharesData.units && sharesData.units.shares) {
                // Get the latest entry based on 'end' date
                const entries = sharesData.units.shares;
                const latest = entries.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
                return latest ? { value: latest.val, date: latest.end, source: 'XBRL' } : null;
            }
        }
    } catch (e) {
        console.error("Failed to extract shares outstanding", e);
    }
    return null;
}

export async function getLatestPublicFloat(cik: number): Promise<{ value: number, date: string } | null> {
    try {
        const facts = await getCompanyFacts(cik);
        if (facts) {
            const dei = facts.facts?.["dei"];
            const floatData = dei?.["EntityPublicFloat"];
            if (floatData && floatData.units && floatData.units.USD) {
                // Get the latest entry based on 'end' date
                const entries = floatData.units.USD;
                const latest = entries.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
                return latest ? { value: latest.val, date: latest.end } : null;
            }
        }
    } catch (e) {
        console.error("Failed to extract public float", e);
    }
    return null;
}

export async function getLatestS3PublicFloat(cik: number): Promise<{
    value: number,
    date: string,
    source: 'S-3',
    expirationDate: string,
    shelfSize: number | null
} | null> {
    try {
        const submissions = await getSubmissions(cik);
        if (!submissions || !submissions.filings || !submissions.filings.recent) return null;

        const recent = submissions.filings.recent;
        // Find latest S-3
        let accessCode = "";
        let primaryDoc = "";
        let filingDate = "";

        for (let i = 0; i < recent.form.length; i++) {
            if (recent.form[i] === "S-3") {
                accessCode = recent.accessionNumber[i];
                primaryDoc = recent.primaryDocument[i];
                filingDate = recent.filingDate[i];
                break;
            }
        }

        if (!accessCode) return null;

        // Calculate Expiration (Filing Date + 3 Years)
        const dateObj = new Date(filingDate);
        dateObj.setFullYear(dateObj.getFullYear() + 3);
        const expirationDate = dateObj.toISOString().split('T')[0];

        const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessCode.replace(/-/g, '')}/${primaryDoc}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": SEC_USER_AGENT
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) return null;

        const text = await response.text();

        // Extract Shelf Size (Aggregate Offering Price)
        // Regex: "aggregate offering price ... not exceed ... $X"
        let shelfSize = null;
        const sizeRegex = /aggregate\s+offering\s+price[\s\S]*?not\s+exceed\s+\$([0-9,]+)/i;
        const sizeMatch = text.match(sizeRegex);
        if (sizeMatch && sizeMatch[1]) {
            shelfSize = parseInt(sizeMatch[1].replace(/,/g, ''), 10);
        }

        // Strategy 1: Calculate Float = (Non-Affiliate Shares) * (Price)
        // This avoids typo issues in the "Aggregate Market Value" text (e.g. ULY's "$8M million" typo).
        // Pattern: "based upon X shares ... price of $Y"
        const calcRegex = /based\s+(?:up)?on\s+([0-9,]+)\s+shares[\s\S]*?price\s+of\s+\$([0-9.]+)/i;
        const calcMatch = text.match(calcRegex);

        if (calcMatch && calcMatch[1] && calcMatch[2]) {
            const shares = parseFloat(calcMatch[1].replace(/,/g, ''));
            const price = parseFloat(calcMatch[2]);

            if (!isNaN(shares) && !isNaN(price)) {
                const calculatedFloat = shares * price;
                return { value: calculatedFloat, date: filingDate, source: 'S-3', expirationDate, shelfSize };
            }
        }

        // Strategy 2: Fallback to reading the "Aggregate Market Value" directly
        // Regex to find "aggregate market value ... $X,XXX,XXX [million|billion]"
        // Captures: 1=Amount, 2=Unit (optional)
        const regex = /aggregate\s+market\s+value\s+of[\s\S]*?public\s+float[\s\S]*?\$([0-9,.]+)\s*(million|billion)?/i;
        const match = text.match(regex);

        if (match && match[1]) {
            let rawValue = match[1].replace(/,/g, '');
            let value = parseFloat(rawValue);

            if (match[2]) {
                const unit = match[2].toLowerCase();
                // Heuristic: If value is already > 1,000,000 and unit is "million", it's likely a typo 
                // (e.g. "$8,635,571 million" in ULY filing). Ignore the unit.
                if (unit === 'million') {
                    if (value < 1_000_000) {
                        value *= 1_000_000;
                    }
                }
                if (unit === 'billion') value *= 1_000_000_000;
            }

            if (!isNaN(value)) {
                return { value, date: filingDate, source: 'S-3', expirationDate, shelfSize };
            }
        }

    } catch (e) {
        console.error("Error fetching S-3 float:", e);
    }
    return null;
}
