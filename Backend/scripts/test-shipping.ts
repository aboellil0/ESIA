// Focused pricing test: backend-computed order total (subtotal + shipping fee).
// Run:  npx tsx scripts/test-shipping.ts   (or: npm run test:shipping)
// Pure function test — no database connection needed.
import { computeItemsSubtotal, computeOrderTotal } from "../src/utils/pricing";
import config from "../src/config";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log("PASS:", name);
  } catch (err) {
    failures++;
    console.error("FAIL:", name, "-", (err as Error).message);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

check("default shipping fee is 80 (env override respected)", () => {
  const expected = process.env.SHIPPING_FEE ? Number(process.env.SHIPPING_FEE) : 80;
  assert(config.shippingFee === expected, `expected ${expected}, got ${config.shippingFee}`);
});

check("total = subtotal + 80 fee", () => {
  const total = computeOrderTotal(
    [
      { unitPrice: 500, quantity: 2 },
      { price: 300, qty: 1 },
    ],
    80,
  );
  assert(total === 1380, `expected 1380, got ${total}`);
});

check("legacy item shapes (unitPrice/price, quantity/qty) all count", () => {
  const sub = computeItemsSubtotal([
    { unitPrice: 100, quantity: 1 },
    { price: 200, qty: 3 },
  ]);
  assert(sub === 700, `expected 700, got ${sub}`);
});

check("empty cart totals 0 (no fee on empty)", () => {
  assert(computeOrderTotal([], 80) === 0, "empty must be 0");
});

check("string numbers from multipart FormData are handled", () => {
  const total = computeOrderTotal([{ unitPrice: "250" as any, quantity: "2" as any }], 80);
  assert(total === 580, `expected 580, got ${total}`);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nAll shipping tests passed");
