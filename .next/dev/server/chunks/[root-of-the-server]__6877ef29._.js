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
"[project]/src/app/api/admin/users/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
function clampInt(value, def, min, max) {
    const n = value == null ? def : Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return def;
    return Math.max(min, Math.min(max, n));
}
async function GET(request) {
    try {
        // Check if user is admin
        const admin = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])();
        if (!admin.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: admin.error
            }, {
                status: admin.status
            });
        }
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        const recentDays = clampInt(url.searchParams.get("recentDays"), 0, 0, 3650);
        const rawRows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT to_jsonb(u) AS data
      FROM users u
    `;
        const usersArray = Array.isArray(rawRows) ? rawRows.map((row)=>row.data) : [];
        const readString = (raw, keys)=>{
            for (const key of keys){
                const value = raw?.[key];
                if (value !== null && value !== undefined) return String(value);
            }
            return "";
        };
        const readNumber = (raw, keys, fallback = 0)=>{
            for (const key of keys){
                const value = raw?.[key];
                if (value !== null && value !== undefined && value !== "") return Number(value);
            }
            return fallback;
        };
        const readBoolean = (raw, keys, fallback = false)=>{
            for (const key of keys){
                const value = raw?.[key];
                if (value === null || value === undefined || value === "") continue;
                if (typeof value === "boolean") return value;
                if (typeof value === "number") return value === 1;
                return String(value).toLowerCase() === "true";
            }
            return fallback;
        };
        const readDate = (raw, keys)=>{
            for (const key of keys){
                const value = raw?.[key];
                if (value) return String(value);
            }
            return "";
        };
        const formattedUsers = usersArray.map((raw)=>({
                id: String(raw?.id || ""),
                email: readString(raw, [
                    "email"
                ]),
                first_name: readString(raw, [
                    "first_name",
                    "firstName"
                ]),
                last_name: readString(raw, [
                    "last_name",
                    "lastName"
                ]),
                phone: readString(raw, [
                    "phone",
                    "phone_number",
                    "phoneNumber"
                ]),
                wallet_balance: readNumber(raw, [
                    "wallet_balance",
                    "walletBalance"
                ], 0),
                is_verified: readBoolean(raw, [
                    "is_verified",
                    "isVerified"
                ], false),
                created_at: readDate(raw, [
                    "created_at",
                    "createdAt"
                ]),
                role: readString(raw, [
                    "role"
                ]) || "USER"
            }));
        const qLower = q.toLowerCase();
        const filteredUsers = formattedUsers.filter((user)=>{
            if (qLower) {
                const haystack = `${user.email} ${user.first_name} ${user.last_name} ${user.phone}`.toLowerCase();
                if (!haystack.includes(qLower)) return false;
            }
            if (recentDays > 0 && user.created_at) {
                const created = new Date(user.created_at);
                if (Number.isNaN(created.valueOf())) return false;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - recentDays);
                if (created < cutoff) return false;
            }
            return true;
        });
        filteredUsers.sort((a, b)=>{
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
        });
        const totalCount = filteredUsers.length;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            users: filteredUsers,
            total: totalCount
        }, {
            status: 200
        });
    } catch (error) {
        console.error("Admin users error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6877ef29._.js.map