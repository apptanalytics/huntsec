
export const FORM_TYPE_DESCRIPTIONS: Record<string, string> = {
    "10-K": "Annual report",
    "10-Q": "Quarterly report",
    "8-K": "Current report (major events)",
    "4": "Insider trading (Statement of Changes in Beneficial Ownership)",
    "3": "Insider trading (Initial Statement of Beneficial Ownership)",
    "5": "Insider trading (Annual Statement of Changes in Beneficial Ownership)",
    "S-1": "IPO / General Registration Statement",
    "S-3": "Simplified Registration Statement",
    "S-8": "Securities offered to employees",
    "DEF 14A": "Definitive Proxy Statement",
    "DEFA14A": "Additional Proxy Soliciting Materials",
    "13F-HR": "Quarterly Institutional Holdings",
    "SC 13G": "Beneficial ownership (>5%)",
    "SC 13D": "Beneficial ownership (>5% active)",
    "SD": "Special Disclosure (Conflict Minerals, etc.)",
    "UPLOAD": "SEC Staff Letter / Correspondence",
    "CORRESP": "Correspondence with SEC",
    "CT ORDER": "Confidential Treatment Order"
};

export const FILING_CATEGORIES = {
    "Annual & Quarterly Reports": ["10-K", "10-Q", "8-K", "10-K/A", "10-Q/A", "20-F", "6-K"],
    "Insider Trading": ["3", "4", "5"],
    "Registration Statements": ["S-1", "S-3", "S-8", "424B", "424B2", "424B3", "424B4", "424B5", "POS Is", "FWP"],
    "Beneficial Ownership": ["SC 13G", "SC 13D", "13F-HR", "SC 13G/A", "SC 13D/A"],
    "Proxy Materials": ["DEF 14A", "DEFA14A", "PRE 14A"],
};

export function getFilingCategory(formType: string): string {
    for (const [category, types] of Object.entries(FILING_CATEGORIES)) {
        if (types.some(t => formType.startsWith(t))) { // simple prefix check often helps with /A
            return category;
        }
    }
    return "Other";
}

export function getFormDescription(formType: string): string | null {
    return FORM_TYPE_DESCRIPTIONS[formType] || null;
}
