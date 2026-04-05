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
"[project]/src/app/api/wallet/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
const runtime = "nodejs";
const dynamic = "force-dynamic";
async function GET() {
    try {
        // Get session token from cookies
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
      SELECT s.user_id, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
      LIMIT 1
    `;
        if (sessions.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Session expired - Please log in again"
            }, {
                status: 401
            });
        }
        const userId = sessions[0].user_id;
        const walletBalance = parseFloat(sessions[0].wallet_balance) || 0;
        // Fetch transactions from database
        const transactions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT 
        id,
        type,
        amount,
        status,
        description,
        created_at
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
        // Calculate wallet statistics
        const totalDeposited = transactions.filter((tx)=>tx.type === 'deposit' && tx.status === 'success').reduce((acc, tx)=>acc + (parseFloat(tx.amount) || 0), 0);
        const totalSpent = transactions.filter((tx)=>tx.type !== 'deposit' && tx.status === 'success').reduce((acc, tx)=>acc + (parseFloat(tx.amount) || 0), 0);
        const pendingDeposits = transactions.filter((tx)=>tx.type === 'deposit' && tx.status === 'pending').reduce((acc, tx)=>acc + (parseFloat(tx.amount) || 0), 0);
        // Get recent transactions (last 10)
        const recentTransactions = transactions.slice(0, 10).map((tx)=>({
                id: tx.id,
                type: tx.type,
                amount: parseFloat(tx.amount) || 0,
                status: tx.status,
                description: tx.description || tx.type,
                created_at: tx.created_at
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                balance: walletBalance,
                totalDeposited,
                totalSpent,
                pendingBalance: pendingDeposits,
                recentTransactions
            }
        });
    } catch (error) {
        console.error("Wallet API error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Failed to fetch wallet data"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__62f72851._.js.map