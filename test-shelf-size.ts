
const ulyText = `The aggregate offering price of the securities we sell pursuant to this prospectus will not exceed $25,000,000.`;

async function run() {
    console.log("Testing Shelf Size Extraction...");

    // Regex for "aggregate offering price ... not exceed ... $X"
    // Allow for some words in between
    const regex = /aggregate\s+offering\s+price[\s\S]*?not\s+exceed\s+\$([0-9,]+)/i;

    const match = ulyText.match(regex);

    if (match) {
        console.log("Match Found:", match[0]);
        console.log("Extracted Amount:", match[1]);

        const value = parseInt(match[1].replace(/,/g, ''), 10);
        console.log("Parsed Value:", value);
    } else {
        console.log("No match found.");
    }
}

run();
