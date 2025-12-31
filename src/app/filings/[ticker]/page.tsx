
import { getTickerToCikMap, getSubmissions } from "@/lib/sec";
import { getFormDescription, getFilingCategory } from "@/lib/form-types";
import { formatLargeNumber } from "@/lib/format";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FilingsPage({
    params,
}: {
    params: { ticker: string };
}) {
    const ticker = (await params).ticker.toUpperCase();
    const tickerMap = await getTickerToCikMap();
    const cik = tickerMap[ticker];

    if (!cik) {
        notFound();
    }

    const data = await getSubmissions(cik);

    // Fetch shares outstanding in parallel (or sequentially, but safely)
    let sharesOutstanding = null;
    try {
        const { getLatestSharesOutstanding } = await import("@/lib/sec");
        sharesOutstanding = await getLatestSharesOutstanding(cik);
    } catch (e) {
        console.error("Failed to fetch shares on page", e);
    }

    if (!data) {
        return (
            <div className="container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <h1>Error loading data</h1>
                <p>Could not retrieve filings for {ticker}.</p>
            </div>
        );
    }

    const { filings } = data;
    const recentFilings = filings?.recent || {};

    // SEC JSON structure for 'recent' is arrays of values, accessed by index
    // e.g. accessionNumber: ["...", "..."], filingDate: ["...", "..."]
    // We need to pivot this to an array of objects

    const entries = recentFilings.accessionNumber?.map((_: any, index: number) => {
        return {
            accessionNumber: recentFilings.accessionNumber[index],
            filingDate: recentFilings.filingDate[index],
            reportDate: recentFilings.reportDate[index],
            acceptanceDateTime: recentFilings.acceptanceDateTime[index],
            act: recentFilings.act[index],
            form: recentFilings.form[index],
            fileNumber: recentFilings.fileNumber[index],
            filmNumber: recentFilings.filmNumber[index],
            items: recentFilings.items[index],
            size: recentFilings.size[index],
            isXBRL: recentFilings.isXBRL[index],
            isInlineXBRL: recentFilings.isInlineXBRL[index],
            primaryDocument: recentFilings.primaryDocument[index],
            primaryDocDescription: recentFilings.primaryDocDescription[index]
        };
    }) || [];

    const categories: Record<string, any[]> = {
        "Annual & Quarterly Reports": [],
        "Registration Statements": [],
        "Proxy Materials": [],
        "Beneficial Ownership": [],
        "Insider Trading": [],
        "Other": []
    };

    // Process top 100 entries
    entries.slice(0, 100).forEach((filing: any) => {
        const category = getFilingCategory(filing.form);
        if (categories[category]) {
            categories[category].push(filing);
        } else {
            categories["Other"].push(filing);
        }
    });

    // Define display order
    const displayOrder = [
        "Annual & Quarterly Reports",
        "Registration Statements",
        "Proxy Materials",
        "Beneficial Ownership",
        "Insider Trading",
        "Other"
    ];

    return (
        <div className="container" style={{ padding: "4rem 0" }}>
            <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Link href="/" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>
                        ← Back to Search
                    </Link>
                    <h1 style={{ fontSize: "3rem", fontWeight: "800" }}>
                        {data.name} <span style={{ color: "var(--text-secondary)", fontWeight: "400" }}>{ticker}</span>
                    </h1>
                    <div style={{ display: "flex", gap: "1.5rem", color: "var(--text-secondary)", marginTop: "0.75rem", alignItems: "center", fontSize: "1rem" }}>
                        <span>CIK: {cik}</span>
                        {sharesOutstanding && (
                            <span>
                                Shares: {formatLargeNumber(sharesOutstanding.value)}{" "}
                                <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginLeft: "0.25rem" }}>
                                    ({sharesOutstanding.date})
                                </span>
                            </span>
                        )}
                        <span>SIC: {data.sic}</span>
                        <span>{data.sicDescription}</span>
                    </div>
                </div>
            </header>

            <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                {displayOrder.map(category => {
                    const categoryFilings = categories[category];
                    if (categoryFilings.length === 0) return null;

                    return (
                        <section key={category}>
                            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", color: "var(--text-primary)" }}>
                                {category}
                            </h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {categoryFilings.map((filing: any) => (
                                    <a
                                        key={filing.accessionNumber}
                                        href={`https://www.sec.gov/Archives/edgar/data/${cik}/${filing.accessionNumber.replace(/-/g, '')}/${filing.primaryDocument}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-panel"
                                        style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit", transition: "all 0.2s ease" }}
                                    >
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{filing.form}</span>
                                                {getFormDescription(filing.form) && (
                                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                                                        {getFormDescription(filing.form)}
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>{filing.primaryDocDescription || filing.primaryDocument}</span>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{filing.filingDate}</span>
                                            {filing.isInlineXBRL === 1 && (
                                                <span style={{ fontSize: "0.75rem", background: "var(--accent-glow)", color: "var(--accent-primary)", padding: "2px 6px", borderRadius: "4px" }}>iXBRL</span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            <style>{`
        .glass-panel:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
      `}</style>
        </div>
    );
}
