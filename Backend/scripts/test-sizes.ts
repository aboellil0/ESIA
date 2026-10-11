// Focused validation test: free-text product sizes (no S/M/L/XL lock, any count).
// Run:  npx tsx scripts/test-sizes.ts   (or: npm run test:sizes)
// Pure function test — no database connection needed.
import { parseSizesInput } from "../src/controllers/product.controller";

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

function expectThrow(fn: () => void, contains: string) {
  try {
    fn();
  } catch (err) {
    const msg = (err as any)?.message ?? String(err);
    if (!String(msg).includes(contains)) {
      throw new Error(`expected error containing "${contains}", got: ${msg}`);
    }
    return;
  }
  throw new Error(`expected error containing "${contains}", but nothing was thrown`);
}

// 1. The reported case: 6 sizes including custom ones (previously failed at sizes[4])
check("6 sizes incl. custom names pass", () => {
  const out = parseSizesInput(["S", "M", "L", "XL", "XXL", "مقاس خاص 42"]);
  assert(out.length === 6, `expected 6, got ${out.length}`);
  assert(out[4].size === "XXL", "custom XXL kept");
  assert(out[5].size === "مقاس خاص 42", "arabic custom kept");
  assert(out.every((s) => s.isAvailable === true), "default available");
});

// 2. Old payloads keep working (objects, unavailable flag, coercion, parsing paths)
check("legacy object/JSON/comma payloads still work", () => {
  const a = parseSizesInput([{ size: "S", isAvailable: false }, { size: "M", isAvailable: "true" as any }]);
  assert(a[0].isAvailable === false && a[1].isAvailable === true, "flags parsed");
  const b = parseSizesInput(JSON.stringify(["S", "Oversize"]));
  assert(b.length === 2 && b[1].size === "Oversize", "JSON string parsed");
  const c = parseSizesInput("S,M,3XL");
  assert(c.length === 3 && c[2].size === "3XL", "comma string parsed");
});

// 3. Trim + dedupe (case-insensitive) + limits
check("trim applied", () => {
  const out = parseSizesInput(["  XL  "]);
  assert(out[0].size === "XL", "trimmed");
});
check("exact duplicate rejected", () => {
  expectThrow(() => parseSizesInput(["M", "M"]), "duplicate");
});
check("case-insensitive duplicate rejected", () => {
  expectThrow(() => parseSizesInput(["xxl", "XXL"]), "duplicate");
});
check("blank name rejected", () => {
  expectThrow(() => parseSizesInput(["S", "   "]), "non-empty");
});
check("name over 50 chars rejected", () => {
  expectThrow(() => parseSizesInput(["S", "x".repeat(51)]), "at most 50");
});
check("50-char name accepted", () => {
  const out = parseSizesInput(["y".repeat(50)]);
  assert(out[0].size.length === 50, "boundary ok");
});
check("empty array rejected", () => {
  expectThrow(() => parseSizesInput([]), "non-empty array");
});

// 4. No count cap anymore (old code capped at 10)
check("12 sizes pass (no count cap)", () => {
  const sizes = Array.from({ length: 12 }, (_, i) => `Size-${i + 1}`);
  const out = parseSizesInput(sizes);
  assert(out.length === 12, `expected 12, got ${out.length}`);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nAll size validation tests passed");
