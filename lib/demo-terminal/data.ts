/**
 * Deterministic demo container database.
 *
 * These containers produce predictable results for the demo.
 * Dates are relative to "today" so the demo always works regardless of
 * when it is run — we compute them at startup.
 */

export interface DemoContainer {
  containerNumber: string;
  status: string;              // raw terminal text
  lastFreeDay?: string;        // ISO date string, or undefined for holds
  vesselName: string;
  terminalLocation: string;
  lineOperator: string;
}

/**
 * Build the demo container set with Last Free Day dates relative to `today`.
 * This ensures the demo always has a mix of CRITICAL/URGENT/NORMAL regardless
 * of the actual date.
 */
export function buildDemoContainers(today: Date = new Date()): DemoContainer[] {
  const d = (offsetDays: number): string => {
    const date = new Date(today);
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split("T")[0];
  };

  return [
    {
      containerNumber: "DRAY1000001",
      status: "Available for Pickup",
      lastFreeDay: d(4),
      vesselName: "EVER GIVEN",
      terminalLocation: "Yard B, Row 12",
      lineOperator: "Evergreen",
    },
    {
      containerNumber: "DRAY2000002",
      status: "Available for Pickup",
      lastFreeDay: d(1),
      vesselName: "MSC GULSUN",
      terminalLocation: "Yard A, Row 3",
      lineOperator: "MSC",
    },
    {
      containerNumber: "DRAY3000003",
      status: "Customs Hold — Do Not Release",
      lastFreeDay: undefined,
      vesselName: "MAERSK ELBA",
      terminalLocation: "Hold Area C",
      lineOperator: "Maersk",
    },
    {
      containerNumber: "DRAY4000004",
      status: "Available for Pickup",
      lastFreeDay: d(0), // today — critical
      vesselName: "CMA CGM MARCO POLO",
      terminalLocation: "Yard D, Row 7",
      lineOperator: "CMA CGM",
    },
    {
      containerNumber: "DRAY5000005",
      status: "Available for Pickup",
      lastFreeDay: d(7),
      vesselName: "COSCO SHIPPING UNIVERSE",
      terminalLocation: "Yard A, Row 15",
      lineOperator: "COSCO",
    },
    {
      containerNumber: "DRAY7000007",
      status: "Available for Pickup",
      lastFreeDay: d(2),
      vesselName: "ONE APUS",
      terminalLocation: "Yard B, Row 1",
      lineOperator: "ONE",
    },
    {
      containerNumber: "DRAY8000008",
      status: "Freight Hold — Pending Documentation",
      lastFreeDay: undefined,
      vesselName: "YANG MING WARRANTY",
      terminalLocation: "Hold Area A",
      lineOperator: "Yang Ming",
    },
    {
      containerNumber: "DRAY9000009",
      status: "Available for Pickup",
      lastFreeDay: d(9),
      vesselName: "HMM ALGECIRAS",
      terminalLocation: "Yard C, Row 22",
      lineOperator: "HMM",
    },
    {
      containerNumber: "DRAY0000010",
      status: "Available for Pickup",
      lastFreeDay: d(3),
      vesselName: "ZIM TARRAGONA",
      terminalLocation: "Yard D, Row 5",
      lineOperator: "ZIM",
    },
  ];
}

/** Lookup a single container from the demo database. Returns undefined if not found. */
export function lookupDemoContainer(
  containerNumber: string,
  today?: Date
): DemoContainer | undefined {
  const containers = buildDemoContainers(today);
  return containers.find((c) => c.containerNumber === containerNumber);
}
