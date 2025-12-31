"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchForm() {
    const [ticker, setTicker] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ticker.trim()) {
            router.push(`/filings/${ticker.trim().toUpperCase()}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ position: "relative", width: "100%" }}>
            <input
                type="text"
                placeholder="Search for a ticker (e.g. AAPL)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: "1.2rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle)",
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(10px)"
                }}
                className="search-input"
            />
            <button
                type="submit"
                style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "var(--accent-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: "600"
                }}
            >
                Search
            </button>
            <style jsx>{`
        .search-input:focus {
          border-color: var(--accent-primary);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 4px var(--accent-glow);
        }
      `}</style>
        </form>
    );
}
