
import { NextRequest, NextResponse } from "next/server";
import { getTickerToCikMap, getSubmissions } from "@/lib/sec";

export async function GET(
    request: NextRequest,
    { params }: { params: { ticker: string } }
) {
    const ticker = (await params).ticker.toUpperCase();

    if (!ticker) {
        return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    try {
        const tickerMap = await getTickerToCikMap();
        const cik = tickerMap[ticker];

        if (!cik) {
            return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
        }

        const submissions = await getSubmissions(cik);

        if (!submissions) {
            return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
        }

        // We can also process the data here to include ONLY what we need (e.g. valid filings)
        // But for now, returning raw submissions is fine.

        return NextResponse.json({
            ticker,
            cik,
            name: submissions.name,
            filings: submissions.filings
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
