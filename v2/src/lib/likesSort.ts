import { pinyin } from "pinyin-pro";

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;
const TEENS = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

function numberToWords(n: number): string {
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 100) {
    const ones = n % 10;
    return TENS[Math.floor(n / 10)] + (ones ? ONES[ones] : "");
  }
  if (n < 1000) {
    const rest = n % 100;
    return ONES[Math.floor(n / 100)] + "hundred" + (rest ? numberToWords(rest) : "");
  }
  return String(n);
}

export function likesSortKey(item: string): string {
  const withNumbers = item.replace(/^\d+/, (digits) =>
    numberToWords(Number(digits)),
  );
  return pinyin(withNumbers, {
    toneType: "none",
    nonZh: "consecutive",
    v: true,
  }).toLowerCase();
}

export function formatLike(item: string): string {
  const chars = [...item];
  const first = chars[0];
  if (first && /[a-z]/i.test(first)) chars[0] = first.toUpperCase();
  return chars.join("");
}

export function sortLikes(items: readonly string[]): string[] {
  return items
    .map(formatLike)
    .toSorted((a, b) =>
      likesSortKey(a).localeCompare(likesSortKey(b), "en", { sensitivity: "base" }),
    );
}
