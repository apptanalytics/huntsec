
const ulyText = `As of July 2, 2025, the aggregate market value of our common stock held by our non-affiliates, as calculated pursuant to the rules of the Securities and Exchange Commission, was approximately $8,635,571 million, based upon 1,233,653 shares of our outstanding common stock held by non-affiliates at the per share price of $7.00, the closing sale price of our common stock on the Nasdaq Capital Market on July 1, 2025.`;

const drmaText = `As of the date of this prospectus, the aggregate market value of our outstanding common stock held by non-affiliates, or the public float, was $2,258,226, which was calculated based on 910,575 shares of our outstanding common stock held by non-affiliates at a price of $2.48 per share, the closing price of our common stock on November 20, 2025.`;

function testRegex(text: string, name: string) {
    console.log(`--- Testing ${name} ---`);
    // Regex to capture:
    // 1. Share count (after "based upon/on")
    // 2. Price (after "price of")

    // Pattern: based (up)on X shares ... price of $Y
    const regex = /based\s+(?:up)?on\s+([0-9,]+)\s+shares[\s\S]*?price\s+of\s+\$([0-9.]+)/i;

    const match = text.match(regex);
    if (match) {
        const shares = parseFloat(match[1].replace(/,/g, ''));
        const price = parseFloat(match[2]);
        const calcFloat = shares * price;

        console.log(`Shares: ${shares}`);
        console.log(`Price: $${price}`);
        console.log(`Calculated Float: $${calcFloat.toLocaleString()}`);
    } else {
        console.log("No match found.");
    }
}

testRegex(ulyText, "ULY");
testRegex(drmaText, "DRMA");
