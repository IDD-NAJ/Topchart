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
"[project]/src/lib/roles.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Role-based access control (RBAC) constants and helpers.
 * Centralizes role values and type-safe checks for security and maintainability.
 */ __turbopack_context__.s([
    "ALLOWED_ROLES",
    ()=>ALLOWED_ROLES,
    "ROLES",
    ()=>ROLES,
    "canAccessReseller",
    ()=>canAccessReseller,
    "hasRole",
    ()=>hasRole,
    "isAdmin",
    ()=>isAdmin,
    "isReseller",
    ()=>isReseller,
    "isUser",
    ()=>isUser,
    "isValidRole",
    ()=>isValidRole,
    "normalizeRole",
    ()=>normalizeRole
]);
const ROLES = {
    USER: "USER",
    ADMIN: "ADMIN",
    RESELLER: "RESELLER"
};
const ALLOWED_ROLES = [
    ROLES.USER,
    ROLES.ADMIN,
    ROLES.RESELLER
];
function normalizeRole(raw) {
    if (raw == null || raw === "") return null;
    const u = String(raw).trim().toUpperCase();
    return ALLOWED_ROLES.includes(u) ? u : null;
}
function isAdmin(role) {
    return normalizeRole(role) === ROLES.ADMIN;
}
function isUser(role, strict = false) {
    const r = normalizeRole(role);
    if (strict) return r === ROLES.USER;
    return r === ROLES.USER || r === null;
}
function hasRole(userRole, required) {
    const r = normalizeRole(userRole);
    if (!r) return required === ROLES.USER;
    if (required === ROLES.USER) return true;
    if (required === ROLES.ADMIN) return r === ROLES.ADMIN;
    return false;
}
function isReseller(role) {
    return normalizeRole(role) === ROLES.RESELLER;
}
function isValidRole(value) {
    return ALLOWED_ROLES.includes(value);
}
function canAccessReseller(role) {
    const r = normalizeRole(role);
    return r === ROLES.RESELLER || r === ROLES.ADMIN;
}
}),
"[project]/src/lib/admin-auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "requireAdmin",
    ()=>requireAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$roles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/roles.ts [app-route] (ecmascript)");
;
;
;
async function requireAdmin() {
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const sessionToken = cookieStore.get("session_token")?.value;
        console.log("[requireAdmin] Session token:", sessionToken ? sessionToken.substring(0, 8) + "..." : "NONE");
        if (!sessionToken) {
            return {
                ok: false,
                status: 401,
                error: "Unauthorized"
            };
        }
        // Simple query for auth_sessions table
        let sessions = [];
        try {
            sessions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT
          s.user_id::text AS user_id,
          u.email,
          u.first_name,
          u.last_name,
          COALESCE(u.role, 'USER') AS role
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${sessionToken}
          AND s.expires_at > NOW()
        LIMIT 1
      `;
        } catch (e) {
            console.error("Auth sessions query failed:", e);
            sessions = [];
        }
        if (sessions.length === 0) {
            return {
                ok: false,
                status: 401,
                error: "Session expired"
            };
        }
        let user = sessions[0];
        // Security: No auto-promotion - admin role must be explicitly assigned
        // This prevents privilege escalation vulnerabilities
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$roles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isAdmin"])(user.role)) {
            console.warn("[SECURITY] Unauthorized admin access attempt", {
                userId: user.user_id,
                email: user.email,
                role: user.role,
                timestamp: new Date().toISOString()
            });
            return {
                ok: false,
                status: 403,
                error: "Access denied"
            };
        }
        return {
            ok: true,
            userId: user.user_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        };
    } catch (error) {
        console.error("Admin auth error:", error);
        return {
            ok: false,
            status: 401,
            error: "Internal server error"
        };
    }
}
}),
"[project]/src/app/api/admin/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "revalidate",
    ()=>revalidate,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/admin-auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
const runtime = "nodejs";
const dynamic = "force-dynamic";
const revalidate = 0;
async function tableExists(table) {
    try {
        const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${table}
      ) AS exists
    `;
        return Boolean(rows[0]?.exists);
    } catch (error) {
        console.error(`Admin stats tableExists ${table} error:`, error);
        return false;
    }
}
async function safeNumberQuery(label, query, fallback = 0) {
    try {
        const rows = await query();
        const value = Array.isArray(rows) && rows.length > 0 ? rows[0]?.value : 0;
        const num = Number(value ?? 0);
        return Number.isFinite(num) ? num : fallback;
    } catch (error) {
        console.error(`Admin stats ${label} error:`, error);
        return fallback;
    }
}
async function safeRowsQuery(label, query, fallback = []) {
    try {
        const rows = await query();
        return Array.isArray(rows) ? rows : fallback;
    } catch (error) {
        console.error(`Admin stats ${label} error:`, error);
        return fallback;
    }
}
async function GET(request) {
    try {
        const admin = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])();
        if (!admin.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: admin.error
            }, {
                status: admin.status
            });
        }
        const [usersExists, transactionsExists, authSessionsExists, sessionsExists, ticketsExists, kycProfilesExists, referralsExists, airtimePurchasesExists, dataBundlePurchasesExists, walletsExists, disputesExists] = await Promise.all([
            tableExists("users"),
            tableExists("transactions"),
            tableExists("auth_sessions"),
            tableExists("sessions"),
            tableExists("tickets"),
            tableExists("kyc_profiles"),
            tableExists("referrals"),
            tableExists("airtime_purchases"),
            tableExists("data_bundle_purchases"),
            tableExists("wallets"),
            tableExists("disputes")
        ]);
        const totalUsersPromise = usersExists ? safeNumberQuery("total_users", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM users`) : Promise.resolve(0);
        const totalTransactionsPromise = transactionsExists ? safeNumberQuery("total_transactions", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM transactions`) : Promise.resolve(0);
        const recentSignupRowsPromise = usersExists ? safeRowsQuery("recent_signups", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT COALESCE(to_jsonb(u)->>'created_at', to_jsonb(u)->>'createdAt') AS created_at
          FROM users u
        `) : Promise.resolve([]);
        const revenueRowsPromise = transactionsExists ? safeRowsQuery("total_revenue", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT
            COALESCE(to_jsonb(t)->>'status', '') AS status,
            COALESCE(to_jsonb(t)->>'type', '') AS type,
            COALESCE(
              to_jsonb(t)->>'amount',
              to_jsonb(t)->>'amount_paid',
              to_jsonb(t)->>'amountPaid',
              ''
            ) AS amount
          FROM transactions t
        `) : Promise.resolve([]);
        const activeSessionRowsPromise = authSessionsExists ? safeRowsQuery("active_users", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT
            COALESCE(to_jsonb(s)->>'user_id', to_jsonb(s)->>'userId') AS user_id,
            COALESCE(to_jsonb(s)->>'expires_at', to_jsonb(s)->>'expiresAt') AS expires_at
          FROM auth_sessions s
        `) : sessionsExists ? safeRowsQuery("active_users_sessions", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
            SELECT
              COALESCE(to_jsonb(s)->>'user_id', to_jsonb(s)->>'userId') AS user_id,
              COALESCE(to_jsonb(s)->>'expires_at', to_jsonb(s)->>'expiresAt') AS expires_at
            FROM sessions s
          `) : Promise.resolve([]);
        const openTicketsPromise = ticketsExists ? safeNumberQuery("open_tickets", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM tickets WHERE status::text IN ('OPEN', 'IN_PROGRESS')`) : Promise.resolve(0);
        const pendingKycPromise = kycProfilesExists ? safeNumberQuery("pending_kyc", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM kyc_profiles WHERE status::text = 'PENDING'`) : Promise.resolve(0);
        const totalReferralsPromise = referralsExists ? safeNumberQuery("total_referrals", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM referrals`) : Promise.resolve(0);
        const totalAirtimePurchasesPromise = airtimePurchasesExists ? safeNumberQuery("airtime_purchases", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM airtime_purchases`) : Promise.resolve(0);
        const totalDataPurchasesPromise = dataBundlePurchasesExists ? safeNumberQuery("data_purchases", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM data_bundle_purchases`) : Promise.resolve(0);
        const totalWalletBalancePromise = walletsExists ? safeNumberQuery("wallet_balance", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COALESCE(SUM("availableBalance"), 0)::numeric AS value FROM wallets`) : Promise.resolve(0);
        const openDisputesPromise = disputesExists ? safeNumberQuery("open_disputes", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT COUNT(*)::int AS value FROM disputes WHERE status::text IN ('OPEN', 'IN_PROGRESS')`) : Promise.resolve(0);
        const recentTransactionsPromise = transactionsExists && usersExists ? safeRowsQuery("recent_transactions", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT t.*, u.email, u.first_name, u.last_name
          FROM transactions t
          LEFT JOIN users u ON u.id::text = t."userId"
          ORDER BY t."createdAt" DESC
          LIMIT 10
        `) : transactionsExists ? safeRowsQuery("recent_transactions_no_join", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
            SELECT * FROM transactions ORDER BY "createdAt" DESC LIMIT 10
          `) : Promise.resolve([]);
        const recentTicketsPromise = ticketsExists && usersExists ? safeRowsQuery("recent_tickets", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT t.*, u.email, u.first_name, u.last_name
          FROM tickets t
          LEFT JOIN users u ON u.id::text = t."userId"
          ORDER BY t."createdAt" DESC
          LIMIT 5
        `) : ticketsExists ? safeRowsQuery("recent_tickets_no_join", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
            SELECT * FROM tickets ORDER BY "createdAt" DESC LIMIT 5
          `) : Promise.resolve([]);
        const transactionsByTypePromise = transactionsExists ? safeRowsQuery("transactions_by_type", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT type, COUNT(*)::int as count, SUM(amount)::numeric as total
          FROM transactions
          WHERE status::text = 'SUCCESS'
          GROUP BY type
        `) : Promise.resolve([]);
        const transactionsByDayPromise = transactionsExists ? safeRowsQuery("transactions_by_day", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
          SELECT DATE("createdAt") as date, COUNT(*)::int as count, SUM(amount)::numeric as total
          FROM transactions
          WHERE "createdAt" >= NOW() - INTERVAL '7 days'
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
        `) : Promise.resolve([]);
        const [totalUsers, totalTransactions, recentSignupRows, revenueRows, activeSessionRows, openTickets, pendingKyc, totalReferrals, totalAirtimePurchases, totalDataPurchases, totalWalletBalance, openDisputes, recentTransactions, recentTickets, transactionsByType, transactionsByDay] = await Promise.all([
            totalUsersPromise,
            totalTransactionsPromise,
            recentSignupRowsPromise,
            revenueRowsPromise,
            activeSessionRowsPromise,
            openTicketsPromise,
            pendingKycPromise,
            totalReferralsPromise,
            totalAirtimePurchasesPromise,
            totalDataPurchasesPromise,
            totalWalletBalancePromise,
            openDisputesPromise,
            recentTransactionsPromise,
            recentTicketsPromise,
            transactionsByTypePromise,
            transactionsByDayPromise
        ]);
        const now = Date.now();
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        const recentSignups = Array.isArray(recentSignupRows) ? recentSignupRows.reduce((count, row)=>{
            const raw = row?.created_at;
            if (!raw) return count;
            const ts = Date.parse(String(raw));
            if (!Number.isNaN(ts) && ts > cutoff) return count + 1;
            return count;
        }, 0) : 0;
        const totalRevenue = Array.isArray(revenueRows) ? revenueRows.reduce((sum, row)=>{
            const status = String(row?.status ?? "").toUpperCase();
            const type = String(row?.type ?? "").toLowerCase();
            if (status !== "SUCCESS" || type !== "deposit") return sum;
            const amount = Number(row?.amount);
            if (!Number.isFinite(amount)) return sum;
            return sum + amount;
        }, 0) : 0;
        const activeUsers = (()=>{
            if (!Array.isArray(activeSessionRows)) return 0;
            const active = new Set();
            activeSessionRows.forEach((row)=>{
                const expiresRaw = row?.expires_at;
                if (!expiresRaw) return;
                const ts = Date.parse(String(expiresRaw));
                if (Number.isNaN(ts) || ts <= now) return;
                const userId = row?.user_id;
                if (userId) active.add(String(userId));
            });
            return active.size;
        })();
        const stats = {
            totalUsers,
            activeUsers,
            totalTransactions,
            totalRevenue,
            recentSignups,
            openTickets,
            pendingKyc,
            totalReferrals,
            totalAirtimePurchases,
            totalDataPurchases,
            totalWalletBalance: Number(totalWalletBalance) || 0,
            openDisputes,
            recentTransactions,
            recentTickets,
            transactionsByType,
            transactionsByDay
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            stats
        }, {
            status: 200
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            stats: {
                totalUsers: 0,
                activeUsers: 0,
                totalTransactions: 0,
                totalRevenue: 0,
                recentSignups: 0,
                openTickets: 0,
                pendingKyc: 0,
                totalReferrals: 0,
                totalAirtimePurchases: 0,
                totalDataPurchases: 0,
                totalWalletBalance: 0,
                openDisputes: 0,
                recentTransactions: [],
                recentTickets: [],
                transactionsByType: [],
                transactionsByDay: []
            }
        }, {
            status: 200
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8ef8b563._.js.map