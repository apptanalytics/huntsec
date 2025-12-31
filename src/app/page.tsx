import Link from "next/link";
import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <div className="container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <main style={{ textAlign: "center", width: "100%", maxWidth: "600px" }}>
        <h1 style={{ fontSize: "5rem", fontWeight: "800", letterSpacing: "-0.05em", marginBottom: "0.5rem", background: "linear-gradient(to bottom right, #fff, #999)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          HuntSec
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", marginBottom: "4rem" }}>
          The fastest way to search SEC filings.
        </p>

        {/* Search Component */}
        <SearchForm />
      </main>

      <footer style={{ position: "absolute", bottom: "32px", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
        Built for speed and simplicity.
      </footer>
    </div>
  );
}
