
import { formatLargeNumber } from "./src/lib/format";

console.log("15,000,000,000 ->", formatLargeNumber(15_000_000_000));
console.log("10,000,000 ->", formatLargeNumber(10_000_000));
console.log("500,000 ->", formatLargeNumber(500_000));
console.log("1,000 ->", formatLargeNumber(1_000));
console.log("999 ->", formatLargeNumber(999));
