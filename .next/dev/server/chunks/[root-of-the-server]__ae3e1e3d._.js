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
"[project]/src/lib/textverified.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Textverified API Client
 * 
 * Integration with Textverified.com for phone number verification services
 * API Documentation: https://docs.textverified.com
 */ __turbopack_context__.s([
    "calculatePrice",
    ()=>calculatePrice,
    "calculateRentalPrice",
    ()=>calculateRentalPrice,
    "cancelOrder",
    ()=>cancelOrder,
    "checkSMS",
    ()=>checkSMS,
    "extendRental",
    ()=>extendRental,
    "getAvailableServices",
    ()=>getAvailableServices,
    "getBalance",
    ()=>getBalance,
    "getOrderStatus",
    ()=>getOrderStatus,
    "getSMS",
    ()=>getSMS,
    "getService",
    ()=>getService,
    "mapCategory",
    ()=>mapCategory,
    "purchaseNumber",
    ()=>purchaseNumber
]);
const TEXTVERIFIED_API_URL = process.env.TEXTVERIFIED_API_URL || "https://api.textverified.com";
const TEXTVERIFIED_API_KEY = process.env.TEXTVERIFIED_API_KEY || "";
/**
 * Make authenticated request to Textverified API
 */ async function textverifiedRequest(endpoint, options = {}) {
    if (!TEXTVERIFIED_API_KEY) {
        return {
            success: false,
            error: "Textverified API key not configured"
        };
    }
    try {
        const url = `${TEXTVERIFIED_API_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Bearer ${TEXTVERIFIED_API_KEY}`,
                "Content-Type": "application/json",
                ...options.headers
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Textverified API error (${response.status}):`, errorText);
            return {
                success: false,
                error: `API error: ${response.status} - ${errorText || response.statusText}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error) {
        console.error("Textverified API request failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Request failed"
        };
    }
}
async function getAvailableServices() {
    return textverifiedRequest("/services");
}
async function getService(serviceId) {
    return textverifiedRequest(`/services/${serviceId}`);
}
async function purchaseNumber(serviceId, type = "onetime", durationHours = 24) {
    const endpoint = type === "rental" ? `/rentals?service=${serviceId}&hours=${durationHours}` : `/purchases?service=${serviceId}`;
    return textverifiedRequest(endpoint, {
        method: "POST"
    });
}
async function checkSMS(orderId) {
    return textverifiedRequest(`/orders/${orderId}/sms`);
}
async function getSMS(smsId) {
    return textverifiedRequest(`/sms/${smsId}`);
}
async function cancelOrder(orderId) {
    return textverifiedRequest(`/orders/${orderId}/cancel`, {
        method: "POST"
    });
}
async function extendRental(orderId, extensionHours) {
    return textverifiedRequest(`/rentals/${orderId}/extend`, {
        method: "POST",
        body: JSON.stringify({
            hours: extensionHours
        })
    });
}
async function getOrderStatus(orderId) {
    return textverifiedRequest(`/orders/${orderId}`);
}
async function getBalance() {
    return textverifiedRequest("/account/balance");
}
function calculatePrice(baseCost, markupPercentage) {
    const markup = baseCost * (markupPercentage / 100);
    return Number((baseCost + markup).toFixed(2));
}
function calculateRentalPrice(baseCost, markupPercentage, rentalMultiplier, durationHours) {
    const hourlyRate = baseCost * rentalMultiplier;
    const totalBase = hourlyRate * (durationHours / 24);
    return calculatePrice(totalBase, markupPercentage);
}
function mapCategory(textverifiedCategory) {
    const categoryMap = {
        "social": "social_media",
        "messaging": "social_media",
        "financial": "ecommerce_financial",
        "payment": "ecommerce_financial",
        "shopping": "ecommerce_financial",
        "professional": "professional_tools",
        "entertainment": "streaming_entertainment",
        "streaming": "streaming_entertainment"
    };
    return categoryMap[textverifiedCategory.toLowerCase()] || "social_media";
}
}),
"[project]/src/app/api/verification/services/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$textverified$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/textverified.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(request) {
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const sessionToken = cookieStore.get("session_token")?.value;
        if (!sessionToken) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        // Verify session
        const sessions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT s.user_id
      FROM auth_sessions s
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;
        if (sessions.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Session expired"
            }, {
                status: 401
            });
        }
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        // Build query
        let query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT 
        id,
        textverified_service_id,
        name,
        category,
        description,
        icon_url,
        is_active,
        base_cost,
        markup_percentage,
        rental_multiplier
      FROM verification_services
      WHERE is_active = true
    `;
        if (category) {
            query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT 
          id,
          textverified_service_id,
          name,
          category,
          description,
          icon_url,
          is_active,
          base_cost,
          markup_percentage,
          rental_multiplier
        FROM verification_services
        WHERE is_active = true AND category = ${category}
      `;
        }
        const services = await query;
        // Calculate final prices
        const servicesWithPrices = services.map((service)=>({
                ...service,
                onetime_price: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$textverified$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculatePrice"])(Number(service.base_cost), Number(service.markup_percentage)),
                rental_price_per_day: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$textverified$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculatePrice"])(Number(service.base_cost) * Number(service.rental_multiplier), Number(service.markup_percentage))
            }));
        // Group by category
        const grouped = servicesWithPrices.reduce((acc, svc)=>{
            if (!acc[svc.category]) {
                acc[svc.category] = [];
            }
            acc[svc.category].push(svc);
            return acc;
        }, {});
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                services: servicesWithPrices,
                grouped,
                categories: [
                    {
                        id: "social_media",
                        name: "Social Media & Messaging",
                        icon: "MessageCircle"
                    },
                    {
                        id: "ecommerce_financial",
                        name: "E-commerce & Financial",
                        icon: "CreditCard"
                    },
                    {
                        id: "professional_tools",
                        name: "Professional Tools",
                        icon: "Briefcase"
                    },
                    {
                        id: "streaming_entertainment",
                        name: "Streaming & Entertainment",
                        icon: "Play"
                    }
                ]
            }
        });
    } catch (error) {
        console.error("Get verification services error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Failed to fetch services"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ae3e1e3d._.js.map