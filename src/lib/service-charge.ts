/**
 * Service charge configuration.
 *
 * The customer pays this on top of the data bundle price. Edit the values
 * below to change how much is charged. It supports a percentage of the bundle
 * price, a flat fee, or both combined.
 */
export const SERVICE_CHARGE = {
  /** Percentage of the bundle price, e.g. 5 = 5%. Set to 0 to disable. */
  percent: 5,
  /** Flat fee in GHS added to every order. Set to 0 to disable. */
  flat: 0,
} as const;

/** Round to 2 decimal places (GHS) avoiding floating point drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Calculate just the service charge for a given base amount (in GHS). */
export function calculateServiceCharge(baseGhs: number): number {
  if (!Number.isFinite(baseGhs) || baseGhs <= 0) return 0;
  const percentPart = (baseGhs * SERVICE_CHARGE.percent) / 100;
  return round2(percentPart + SERVICE_CHARGE.flat);
}

export interface ServiceChargeBreakdown {
  /** Original bundle price. */
  base: number;
  /** Service charge added on top. */
  serviceCharge: number;
  /** Amount the customer actually pays. */
  total: number;
}

/** Calculate the base, service charge, and total the customer pays. */
export function calculateTotalWithServiceCharge(
  baseGhs: number
): ServiceChargeBreakdown {
  const base = round2(baseGhs);
  const serviceCharge = calculateServiceCharge(base);
  return {
    base,
    serviceCharge,
    total: round2(base + serviceCharge),
  };
}

/** Human-readable label describing the current service charge policy. */
export function serviceChargeLabel(): string {
  const parts: string[] = [];
  if (SERVICE_CHARGE.percent > 0) parts.push(`${SERVICE_CHARGE.percent}%`);
  if (SERVICE_CHARGE.flat > 0) parts.push(`GHS ${SERVICE_CHARGE.flat.toFixed(2)}`);
  return parts.join(" + ") || "No service charge";
}
