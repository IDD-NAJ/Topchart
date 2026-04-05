module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "query",
    ()=>query,
    "sql",
    ()=>sql,
    "sqlUnsafe",
    ()=>sqlUnsafe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@neondatabase/serverless/index.mjs [app-route] (ecmascript)");
;
function getCleanConnectionString() {
    const rawConnection = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || "";
    let connectionString = rawConnection;
    const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
    if (postgresMatch) {
        connectionString = postgresMatch[0];
    }
    connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");
    connectionString = connectionString.replace(/&&/g, "&").replace(/\?&/g, "?").replace(/[?&]$/, "");
    return connectionString.trim();
}
let _sql = null;
function getSql() {
    if (_sql) return _sql;
    const connectionString = getCleanConnectionString();
    if (connectionString && (connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://"))) {
        _sql = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["neon"])(connectionString);
        return _sql;
    }
    throw new Error("Database not configured. Please set DATABASE_URL environment variable in .env.local file.\n" + "Example: DATABASE_URL=postgresql://username:password@hostname/database\n" + "Get your connection string from your Neon dashboard at https://console.neon.tech");
}
function sql(strings, ...values) {
    return getSql()(strings, ...values);
}
async function sqlUnsafe(queryText, params) {
    const neonSql = getSql();
    if (params && params.length > 0) {
        let idx = 0;
        const parts = queryText.split(/\$\d+/);
        const strings = parts;
        Object.defineProperty(strings, 'raw', {
            value: parts
        });
        return neonSql(strings, ...params);
    }
    const strings = [
        queryText
    ];
    Object.defineProperty(strings, 'raw', {
        value: [
            queryText
        ]
    });
    return neonSql(strings);
}
;
async function query(queryText, params) {
    try {
        const result = await sqlUnsafe(queryText, params);
        return result;
    } catch (error) {
        console.error("[v0] Database query error:", error);
        throw error;
    }
}
}),
"[project]/src/lib/paystack.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generatePaystackReference",
    ()=>generatePaystackReference,
    "getPaystackTransaction",
    ()=>getPaystackTransaction,
    "initializePaystackTransaction",
    ()=>initializePaystackTransaction,
    "listPaystackTransactions",
    ()=>listPaystackTransactions,
    "verifyPaystackTransaction",
    ()=>verifyPaystackTransaction
]);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";
if (!PAYSTACK_SECRET_KEY) {
    console.error("PAYSTACK_SECRET_KEY environment variable is not set");
}
function generatePaystackReference() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `Topchart_${timestamp}_${randomStr}`.toUpperCase();
}
async function initializePaystackTransaction(email, amount, reference, metadata = {}, callbackUrl) {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            return {
                success: false,
                error: "Paystack configuration error - secret key not set"
            };
        }
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                amount,
                reference,
                currency: "GHS",
                callback_url: callbackUrl,
                metadata: {
                    ...metadata,
                    custom_fields: [
                        {
                            display_name: "Platform",
                            variable_name: "platform",
                            value: "Topchart Ghana"
                        }
                    ]
                }
            })
        });
        const result = await response.json();
        if (!result.status) {
            return {
                success: false,
                error: result.message
            };
        }
        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error("Paystack initialization error:", error);
        return {
            success: false,
            error: "Failed to initialize payment"
        };
    }
}
async function verifyPaystackTransaction(reference) {
    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        if (!result.status) {
            return {
                success: false,
                error: result.message
            };
        }
        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error("Paystack verification error:", error);
        return {
            success: false,
            error: "Failed to verify payment"
        };
    }
}
async function listPaystackTransactions(perPage = 50, page = 1, status) {
    try {
        const params = new URLSearchParams({
            perPage: perPage.toString(),
            page: page.toString()
        });
        if (status) {
            params.append("status", status);
        }
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction?${params.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        if (!result.status) {
            return {
                success: false,
                error: result.message
            };
        }
        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error("Paystack list transactions error:", error);
        return {
            success: false,
            error: "Failed to list transactions"
        };
    }
}
async function getPaystackTransaction(transactionId) {
    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/${transactionId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        if (!result.status) {
            return {
                success: false,
                error: result.message
            };
        }
        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error("Paystack get transaction error:", error);
        return {
            success: false,
            error: "Failed to get transaction"
        };
    }
}
}),
"[project]/src/app/api/payments/initialize/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$paystack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/paystack.ts [app-route] (ecmascript)");
;
;
;
;
;
async function POST(request) {
    try {
        // Get the session token from cookies
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const sessionToken = cookieStore.get("session_token")?.value;
        if (!sessionToken) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Unauthorized - Please log in"
            }, {
                status: 401
            });
        }
        // Verify session and get user
        const sessions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT s.user_id, u.email, u.first_name, u.last_name
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;
        if (sessions.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Session expired - Please log in again"
            }, {
                status: 401
            });
        }
        const user = sessions[0];
        const userId = user.user_id;
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid request body"
            }, {
                status: 400
            });
        }
        const { amount } = body;
        // Validate amount
        if (!amount || typeof amount !== "number" || amount < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid amount - minimum is GH₵1"
            }, {
                status: 400
            });
        }
        if (amount > 10000) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Maximum amount is GH₵10,000"
            }, {
                status: 400
            });
        }
        // Calculate surcharge (4% of amount)
        const surcharge = Number((amount * 0.04).toFixed(2));
        const chargeAmount = amount + surcharge;
        // Generate unique reference
        const reference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$paystack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generatePaystackReference"])();
        // Convert to pesewas (Paystack uses smallest currency unit)
        const amountInPesewas = Math.round(chargeAmount * 100);
        // Get the callback URL
        const baseUrl = request.headers.get("origin") || request.nextUrl.origin || ("TURBOPACK compile-time value", "http://localhost:3000") || "";
        const callbackUrl = ("TURBOPACK compile-time truthy", 1) ? `${baseUrl}/dashboard?payment=callback&reference=${reference}` : "TURBOPACK unreachable";
        // Create pending transaction in database
        const txId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        status,
        reference,
        payment_method,
        currency,
        fees,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${txId},
        ${userId},
        'deposit',
        ${amount},
        'pending',
        ${reference},
        'PAYSTACK',
        'GHS',
        ${surcharge},
        ${JSON.stringify({
            payment_method: "paystack",
            initiated_at: new Date().toISOString(),
            base_amount: amount,
            surcharge,
            charge_amount: chargeAmount
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;
        // Initialize Paystack transaction
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$paystack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initializePaystackTransaction"])(user.email, amountInPesewas, reference, {
            user_id: userId,
            user_name: `${user.first_name} ${user.last_name}`,
            transaction_type: "wallet_funding"
        }, callbackUrl);
        if (!result.success) {
            // Update transaction status to failed
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        UPDATE transactions
        SET status = 'failed',
            updated_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                error: result.error || "Paystack initialization failed"
            })}::jsonb
        WHERE reference = ${reference}
      `;
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: result.error
            }, {
                status: 400
            });
        }
        // Update transaction with Paystack details
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      UPDATE transactions
      SET paystack_access_code = ${result.data?.access_code || null},
          paystack_authorization_url = ${result.data?.authorization_url || null},
          updated_at = NOW(),
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            paystack_access_code: result.data?.access_code
        })}::jsonb
      WHERE reference = ${reference}
    `;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                authorization_url: result.data?.authorization_url,
                access_code: result.data?.access_code,
                reference: result.data?.reference
            }
        });
    } catch (error) {
        console.error("Payment initialization error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: errorMessage
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6084a82d._.js.map