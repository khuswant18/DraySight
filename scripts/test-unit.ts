import { parseContainerInput, validateContainers } from "../lib/validation/containers.js";
import { calculateUrgency } from "../lib/urgency/calculate.js";
import { normalizeResult } from "../lib/extraction/normalize.js";
import { createRun, saveContainerResult, getRun } from "../lib/db/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${testName}`);
    failed++;
  }
}

console.log("═══════════════════════════════════════════════════");
console.log("  DraySight — Core Unit Tests");
console.log("═══════════════════════════════════════════════════\n");

// 1. Validation & Input Parsing
console.log("1. Container Validation & Parsing:");

const rawInput = "MSCU1234567, dray1000001 \n MSCU1234567\nINVALID99\n";
const parsed = parseContainerInput(rawInput);
assert(parsed.length === 4, "parseContainerInput handles mixed commas, newlines, and whitespace");

const validated = validateContainers(parsed);
assert(validated.valid.length === 2, "Identifies 2 valid containers (MSCU1234567 and DRAY1000001)");
assert(validated.duplicatesRemoved === 1, "Detects and strips 1 duplicate container");
assert(validated.invalid.length === 1 && validated.invalid[0] === "INVALID99", "Flags invalid container format");

// 2. Urgency Calculation
console.log("\n2. Urgency Calculation:");

const today = new Date();
const todayIso = today.toISOString().split("T")[0];

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowIso = tomorrow.toISOString().split("T")[0];

const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
const dayAfterIso = dayAfterTomorrow.toISOString().split("T")[0];

const fiveDaysOut = new Date(today);
fiveDaysOut.setDate(fiveDaysOut.getDate() + 5);
const fiveDaysIso = fiveDaysOut.toISOString().split("T")[0];

assert(calculateUrgency(todayIso, today).urgency === "CRITICAL", "LFD today is CRITICAL");
assert(calculateUrgency(tomorrowIso, today).urgency === "CRITICAL", "LFD tomorrow (<= 1d) is CRITICAL");
assert(calculateUrgency(dayAfterIso, today).urgency === "URGENT", "LFD in 2 days is URGENT");
assert(calculateUrgency(fiveDaysIso, today).urgency === "NORMAL", "LFD in 5 days is NORMAL");
assert(calculateUrgency(undefined, today).urgency === "UNKNOWN", "Missing LFD is UNKNOWN");

// 3. Normalization
console.log("\n3. Result Extraction & Normalization:");

const mockRawReady = {
  containerNumber: "DRAY1000001",
  rawStatusText: "Available for Pickup",
  rawLastFreeDay: "09/05/2026",
};
const normReady = normalizeResult(mockRawReady, "PacificPort Demo Terminal", "sess_123");
assert(normReady.status === "READY", "Maps 'Available for Pickup' to READY status");
assert(normReady.lastFreeDay === "2026-09-05", "Parses MM/DD/YYYY to ISO date 2026-09-05");
assert(normReady.confidence === "HIGH", "High confidence on unambiguous status");
assert(normReady.sessionId === "sess_123", "Preserves Solari session ID");

const mockRawHold = {
  containerNumber: "DRAY3000003",
  rawStatusText: "Customs Hold — Documentation Required",
  rawLastFreeDay: undefined,
};
const normHold = normalizeResult(mockRawHold, "PacificPort Demo Terminal");
assert(normHold.status === "HOLD", "Maps 'Customs Hold' to HOLD status");
assert(normHold.urgency === "UNKNOWN", "Holds default to UNKNOWN urgency (no pickup allowed)");

// 3b. LBCT Normalization
console.log("\n3b. LBCT-Specific Normalization:");

const mockLbctNotFound = {
  containerNumber: "MSCU1234567",
  rawStatusText: "Not Found",
  rawLastFreeDay: undefined,
};
const normLbct = normalizeResult(mockLbctNotFound, "LBCT — Long Beach Container Terminal", "sess_lbct_1");
assert(normLbct.status === "ERROR", "LBCT 'Not Found' maps to ERROR status");
assert(normLbct.confidence === "HIGH", "LBCT 'Not Found' is HIGH confidence");
assert(normLbct.sourcePortal === "LBCT — Long Beach Container Terminal", "Preserves LBCT portal name");
assert(normLbct.sessionId === "sess_lbct_1", "Preserves LBCT session ID");
assert(normLbct.urgency === "UNKNOWN", "Not-found container has UNKNOWN urgency");

// 4. SQLite Storage
console.log("\n4. SQLite Storage & Runs DB:");

const testRunId = `test_run_${Date.now()}`;
createRun(testRunId, ["DRAY1000001", "DRAY2000002"], "PacificPort Demo Terminal");
saveContainerResult(testRunId, normReady);
saveContainerResult(testRunId, normHold);

const retrievedRun = getRun(testRunId);
assert(retrievedRun !== null, "Successfully retrieved run from SQLite database");
assert(retrievedRun?.totalContainers === 2, "Persisted total container count");
assert(retrievedRun?.completedCount === 2, "Tracked completed count");
assert(retrievedRun?.results.length === 2, "Persisted both container result records");

console.log("\n═══════════════════════════════════════════════════");
if (failed === 0) {
  console.log(`  🎉 ALL ${passed} UNIT TESTS PASSED`);
} else {
  console.error(`  ❌ ${failed} TESTS FAILED, ${passed} passed`);
  process.exit(1);
}
console.log("═══════════════════════════════════════════════════\n");
