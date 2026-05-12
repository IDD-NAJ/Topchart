//  network to Reloadly operator mappings
// These IDs are from Reloadly's API and should be verified
// GET /operators?countryCode=GH will return actual IDs

export const _RELOADLY_OPERATORS = {
  MTN: {
    id: 179,
    name: "MTN ",
    shortNames: ["MTN", "MTN Mobile Money"],
    phonePrefixes: ["024", "025", "054", "055", "059"],
    color: "#FFCC00",
  },
  VODAFONE: {
    id: 180,
    name: "Vodafone ",
    shortNames: ["Vodafone", "Telecel", "Vodafone Cash"],
    phonePrefixes: ["020", "050"],
    color: "#E60000",
  },
  AIRTELTIGO: {
    id: 181,
    name: "AirtelTigo ",
    shortNames: ["AirtelTigo", "Airtel", "Tigo", "Airtel Money"],
    phonePrefixes: ["026", "027", "056", "057"],
    color: "#0066CC",
  },
} as const;

export type Network = keyof typeof _RELOADLY_OPERATORS;

/**
 * Get Reloadly operator ID from network name
 */
export function getOperatorId(networkName: string): number | null {
  const normalized = networkName.toUpperCase().replace(/[^A-Z]/g, "");

  // Check all networks for matches
  for (const [key, operator] of Object.entries(_RELOADLY_OPERATORS)) {
    if (key === normalized) return operator.id;
    if (operator.shortNames.some((name) => name.toUpperCase().replace(/[^A-Z]/g, "") === normalized)) {
      return operator.id;
    }
  }

  // Partial matches
  if (normalized.includes("MTN")) return _RELOADLY_OPERATORS.MTN.id;
  if (normalized.includes("VODAFONE") || normalized.includes("TELECEL")) {
    return _RELOADLY_OPERATORS.VODAFONE.id;
  }
  if (normalized.includes("AIRTEL") || normalized.includes("TIGO")) {
    return _RELOADLY_OPERATORS.AIRTELTIGO.id;
  }

  return null;
}

/**
 * Get network name from Reloadly operator ID
 */
export function getNetworkName(operatorId: number): Network | null {
  for (const [key, operator] of Object.entries(_RELOADLY_OPERATORS)) {
    if (operator.id === operatorId) {
      return key as Network;
    }
  }
  return null;
}

/**
 * Detect network by phone number prefix ( format)
 */
export function detectNetworkByPhone(phone: string): Network | null {
  const cleanPhone = phone.replace(/\D/g, "");

  for (const [network, operator] of Object.entries(_RELOADLY_OPERATORS)) {
    if (operator.phonePrefixes.some((prefix) => cleanPhone.startsWith(prefix))) {
      return network as Network;
    }
  }

  return null;
}

/**
 * Get operator ID by phone number (auto-detect)
 */
export function getOperatorIdByPhone(phone: string): number | null {
  const network = detectNetworkByPhone(phone);
  if (!network) return null;
  return _RELOADLY_OPERATORS[network].id;
}

/**
 * Validate that a phone number matches the selected network
 */
export function validatePhoneNetwork(phone: string, networkName: string): boolean {
  const detected = detectNetworkByPhone(phone);
  if (!detected) return false;

  const normalizedInput = networkName.toUpperCase().replace(/[^A-Z]/g, "");
  const detectedNormalized = detected.toUpperCase();

  if (detectedNormalized === normalizedInput) return true;
  if (normalizedInput.includes(detectedNormalized)) return true;
  if (detectedNormalized.includes(normalizedInput)) return true;

  // Special case: Vodafone and Telecel are the same
  if (
    (normalizedInput.includes("VODAFONE") || normalizedInput.includes("TELECEL")) &&
    (detectedNormalized === "VODAFONE" || detectedNormalized === "TELECEL")
  ) {
    return true;
  }

  // Special case: AirtelTigo variants
  if (
    (normalizedInput.includes("AIRTEL") || normalizedInput.includes("TIGO")) &&
    detectedNormalized === "AIRTELTIGO"
  ) {
    return true;
  }

  return false;
}

/**
 * Get all  operator IDs for querying
 */
export function getAllOperatorIds(): number[] {
  return Object.values(_RELOADLY_OPERATORS).map((op) => op.id);
}

/**
 * Format phone number for Reloadly API (E.164 format without +)
 */
export function formatPhoneForReloadly(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  // If starts with 0, assume  number without country code
  if (clean.startsWith("0")) {
    return `233${clean.substring(1)}`;
  }
  // If already starts with 233, return as is
  if (clean.startsWith("233")) {
    return clean;
  }
  // Otherwise, assume it's missing country code
  return `233${clean}`;
}

/**
 * Get operator details by ID
 */
export function getOperatorDetails(operatorId: number) {
  for (const [key, operator] of Object.entries(_RELOADLY_OPERATORS)) {
    if (operator.id === operatorId) {
      return {
        id: operator.id,
        name: operator.name,
        shortNames: operator.shortNames,
        network: key as Network,
        color: operator.color,
      };
    }
  }
  return null;
}
