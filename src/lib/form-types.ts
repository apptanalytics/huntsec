
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

export const ITEM_DESCRIPTIONS: Record<string, string> = {
    "1.01": "Material Agreement",
    "1.02": "Terminated Agreement",
    "1.03": "Bankruptcy/Receivership",
    "1.04": "Mine Safety Reporting",
    "2.01": "Acquisition/Disposition of Assets",
    "2.02": "Earnings/Financial Results",
    "2.03": "New Financial Obligation",
    "2.04": "Triggering Event on Obligation",
    "2.05": "Restructuring/Exit Plan",
    "2.06": "Material Impairment",
    "3.01": "Notice of Delisting",
    "3.02": "Unregistered Equity Sales",
    "3.03": "Material Modification to Rights",
    "4.01": "Change in Accountant",
    "4.02": "Non-Reliance on Financials",
    "5.01": "Change in Control",
    "5.02": "Departure/Election of Directors/Officers",
    "5.03": "Amendments to Articles/Bylaws",
    "5.04": "Pension Fund Blackout",
    "5.05": "Code of Ethics Amendment",
    "5.06": "Change in Shell Company Status",
    "5.07": "Shareholder Vote Results",
    "5.08": "Director Nomination",
    "6.01": "ABS Informational and Computational Material",
    "6.02": "Change of Scervicer",
    "6.03": "Credit Support Update",
    "6.04": "Failure to Make Distribution",
    "6.05": "Securities Update",
    "7.01": "Reg FD Disclosure",
    "8.01": "Other Events",
    "9.01": "Financials/Exhibits"
};

export const FILING_CATEGORIES = {
    "Annual & Quarterly Reports": ["10-K", "10-Q", "10-K/A", "10-Q/A", "20-F", "6-K"],
    "Current Reports": ["8-K", "8-K/A"],
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

export function getItemDescription(item: string): string | null {
    return ITEM_DESCRIPTIONS[item] || null;
}
