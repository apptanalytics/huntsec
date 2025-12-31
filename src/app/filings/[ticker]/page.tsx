
import { getTickerToCikMap, getSubmissions } from "@/lib/sec";
import { getFormDescription, getFilingCategory, getItemDescription } from "@/lib/form-types";
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

    // Fetch shares outstanding and public float (S-3 preferred, then XBRL)
    let sharesOutstanding = null;
    let publicFloat = null;

    try {
        const { getLatestSharesOutstanding, getLatestPublicFloat, getLatestS3PublicFloat } = await import("@/lib/sec");

        // Parallel data fetching
        const [sharesResult, xbrlFloatResult, s3FloatResult] = await Promise.all([
            getLatestSharesOutstanding(cik),
            getLatestPublicFloat(cik),
            getLatestS3PublicFloat(cik)
        ]);

        sharesOutstanding = sharesResult;

        // Prefer S-3 data if available (usually newer), otherwise fallback to XBRL
        if (s3FloatResult) {
            publicFloat = { ...s3FloatResult, type: 'S-3' };
        } else if (xbrlFloatResult) {
            publicFloat = { ...xbrlFloatResult, type: 'XBRL' };
        }

    } catch (e) {
        console.error("Failed to fetch financial data", e);
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
        "Current Reports": [],
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
        "Current Reports",
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

                    {/* Dilution Analysis / Baby Shelf Rule */}
                    {publicFloat && (
                        <div style={{ marginTop: "1.5rem", padding: "1rem 1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "inline-flex", gap: "2rem", alignItems: "center" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Public Float</span>
                                <span style={{ color: "var(--text-secondary)", fontSize: "1rem", fontWeight: "500" }}>
                                    ${formatLargeNumber(publicFloat.value)}{" "}
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "block" }}>
                                        ({publicFloat.date}) • {publicFloat.type === 'S-3' ? 'S-3 (Fresher)' : 'XBRL (Lagging)'}
                                    </span>
                                </span>
                            </div>

                            <div style={{ height: "30px", width: "1px", background: "var(--border-subtle)" }}></div>

                            {publicFloat.value < 75_000_000 ? (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ fontSize: "0.75rem", color: "#F59E0B", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(245, 158, 11, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>Baby Shelf Restriction</span>
                                    </div>
                                    <span style={{ color: "var(--text-primary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                                        Max 12mo Dilution: <span style={{ fontWeight: "600" }}>${formatLargeNumber(publicFloat.value / 3)}</span>
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>Unrestricted S-3</span>
                                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Float {">"} $75M</span>
                                </div>
                            )}

                            {/* Status & Shelf Size */}
                            {'expirationDate' in publicFloat && (
                                <>
                                    <div style={{ height: "30px", width: "1px", background: "var(--border-subtle)" }}></div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            {new Date(publicFloat.expirationDate as string) > new Date() ? (
                                                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                                                    ACTIVE <span style={{ fontWeight: "400", opacity: 0.7 }}>until {publicFloat.expirationDate}</span>
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                                    EXPIRED {publicFloat.expirationDate}
                                                </span>
                                            )}
                                        </div>
                                        {publicFloat.shelfSize && (
                                            <span style={{ color: "var(--text-primary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                                                Total Capacity: <span style={{ fontWeight: "600" }}>${formatLargeNumber(publicFloat.shelfSize)}</span>
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
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
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{filing.form}</span>
                                                {getFormDescription(filing.form) && (
                                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                                                        {getFormDescription(filing.form)}
                                                    </span>
                                                )}
                                                {/* 8-K Item Tags */}
                                                {(filing.form === "8-K" || filing.form === "8-K/A") && filing.items && (
                                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                        {Array.from(new Set(filing.items.split(','))).map((item: any) => {
                                                            const desc = getItemDescription(item.trim());
                                                            if (!desc) return null;
                                                            return (
                                                                <span key={item} style={{ fontSize: "0.75rem", color: "#60A5FA", background: "rgba(96, 165, 250, 0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(96, 165, 250, 0.2)" }}>
                                                                    {desc}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
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
