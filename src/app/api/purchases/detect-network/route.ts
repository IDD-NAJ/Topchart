export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { autoDetectOperator, mnpLookupGet } from "@/lib/reloadly";
import { detectNetworkByPhone, getOperatorIdByPhone, _RELOADLY_OPERATORS } from "@/lib/reloadly-networks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const useMnp = searchParams.get("mnp") === "true";

  if (!phone || phone.replace(/\D/g, "").length < 3) {
    return NextResponse.json(
      { success: false, error: "Valid phone number is required (min 3 digits)" },
      { status: 400 }
    );
  }

  const cleanPhone = phone.replace(/\D/g, "");

  // Step 1: Local prefix-based detection (instant, no API call)
  const localNetwork = detectNetworkByPhone(cleanPhone);
  const localOperatorId = getOperatorIdByPhone(cleanPhone);

  const result: {
    success: boolean;
    data: {
      phone: string;
      localDetection: {
        network: string | null;
        operatorId: number | null;
        source: "local";
      };
      apiDetection: {
        network: string | null;
        operatorId: number | null;
        operatorName: string | null;
        source: "reloadly" | null;
      } | null;
    };
  } = {
    success: true,
    data: {
      phone: cleanPhone,
      localDetection: {
        network: localNetwork,
        operatorId: localOperatorId,
        source: "local",
      },
      apiDetection: null,
    },
  };

  // Step 2: API-based detection for confirmation or when local fails
  if (!localNetwork || useMnp) {
    try {
      const detectMethod = useMnp ? mnpLookupGet : autoDetectOperator;
      const apiResult = await detectMethod(cleanPhone, "GH", {
        suggestedAmountsMap: false,
        suggestedAmounts: false,
      });

      if (apiResult.success && apiResult.data) {
        const op = apiResult.data;
        // Map operatorId back to local network name
        let mappedNetwork: string | null = null;
        for (const [network, operator] of Object.entries(_RELOADLY_OPERATORS)) {
          if (operator.id === op.operatorId) {
            mappedNetwork = network;
            break;
          }
        }

        result.data.apiDetection = {
          network: mappedNetwork,
          operatorId: op.operatorId,
          operatorName: op.name,
          source: useMnp ? "reloadly" : "reloadly",
        };
      }
    } catch (err) {
      console.warn("[Detect-Network] API detection failed:", err);
    }
  }

  return NextResponse.json(result);
}
