
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

export function getFormDescription(formType: string): string | null {
    // Normalize logic if needed, or simple lookup
    return FORM_TYPE_DESCRIPTIONS[formType] || null;
}
