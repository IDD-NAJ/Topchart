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
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
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
"[project]/src/lib/utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "shouldUseSecureCookies",
    ()=>shouldUseSecureCookies
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-route] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function shouldUseSecureCookies() {
    // Only mark cookies as Secure when served over HTTPS.
    // This prevents localhost HTTP from silently dropping auth cookies.
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
}
}),
"[project]/src/lib/actions/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"005285c2c2dde1d3bc04568825559f74aaf1120d88":"logout","00a454e227311f9c12de802da53866e9b6cac68634":"getCurrentUser","40554866622f9ecb6ce1409dc5383a5aa38c3f0d75":"register","409f1c46588f03a30c67fe3a8e46631bd04f8598ee":"login","70be005c35eef2345d299a80dfd7610bfb3ab0ab58":"updateWalletBalance"},"",""] */ __turbopack_context__.s([
    "getCurrentUser",
    ()=>getCurrentUser,
    "login",
    ()=>login,
    "logout",
    ()=>logout,
    "register",
    ()=>register,
    "updateWalletBalance",
    ()=>updateWalletBalance
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$roles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/roles.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
let _usersRoleColumnCache = null;
async function usersHasRoleColumn() {
    if (_usersRoleColumnCache !== null) return _usersRoleColumnCache;
    try {
        const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
      LIMIT 1
    `;
        _usersRoleColumnCache = rows.length > 0;
    } catch  {
        _usersRoleColumnCache = false;
    }
    return _usersRoleColumnCache;
}
let _usersUpdatedAtColumnCache = null;
async function usersHasUpdatedAtColumn() {
    if (_usersUpdatedAtColumnCache !== null) return _usersUpdatedAtColumnCache;
    try {
        const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'updated_at'
      LIMIT 1
    `;
        _usersUpdatedAtColumnCache = rows.length > 0;
    } catch  {
        _usersUpdatedAtColumnCache = false;
    }
    return _usersUpdatedAtColumnCache;
}
async function register(formData) {
    try {
        const { email, phone, password, firstName, lastName, referralCode } = formData;
        // Validation
        if (!email || !phone || !password || !firstName || !lastName) {
            return {
                success: false,
                error: "All fields are required"
            };
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: "Invalid email format"
            };
        }
        // Phone validation
        const phoneRegex = /^0[2-5][0-9]\d{7}$/;
        if (!phoneRegex.test(phone)) {
            return {
                success: false,
                error: "Please enter a valid Ghanaian phone number"
            };
        }
        // Password validation
        if (password.length < 8) {
            return {
                success: false,
                error: "Password must be at least 8 characters"
            };
        }
        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();
        // Check if user already exists
        const existingUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT id FROM users WHERE email = ${normalizedEmail} OR phone = ${phone}
    `;
        if (existingUser.length > 0) {
            return {
                success: false,
                error: "User with this email or phone already exists"
            };
        }
        // Hash password
        const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, 10);
        // Look up referrer if referral code provided
        let referredBy = null;
        if (referralCode) {
            const referrer = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT id FROM users WHERE referral_code = ${referralCode.toUpperCase()}
      `;
            if (referrer.length > 0) {
                referredBy = referrer[0].id;
            }
        }
        // Create user with explicit UUID and referral code
        const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        const newReferralCode = userId.slice(0, 8).toUpperCase();
        const now = new Date().toISOString();
        const hasRole = await usersHasRoleColumn();
        const hasUpdatedAt = await usersHasUpdatedAtColumn();
        const result = hasRole && hasUpdatedAt ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
              INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at, updated_at)
              VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$roles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ROLES"].USER}, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now}, ${now})
              RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
            ` : hasRole && !hasUpdatedAt ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
                INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at)
                VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$roles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ROLES"].USER}, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now})
                RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
              ` : !hasRole && hasUpdatedAt ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
                  INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, referral_code, referral_earnings, referred_by, total_deposits, created_at, updated_at)
                  VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now}, ${now})
                  RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, referral_code, created_at
                ` : await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
                  INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, referral_code, referral_earnings, referred_by, total_deposits, created_at)
                  VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now})
                  RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, referral_code, created_at
                `;
        const user = result[0];
        // Create session with explicit UUID
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        const sessionId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;
        // Set session cookie
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["shouldUseSecureCookies"])(),
            sameSite: "lax",
            expires: expiresAt,
            path: "/"
        });
        return {
            success: true,
            user
        };
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            error: "Failed to create account. Please try again."
        };
    }
}
async function login(formData) {
    try {
        const { email, password } = formData;
        // Validation
        if (!email || !password) {
            return {
                success: false,
                error: "Email and password are required"
            };
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: "Invalid email format"
            };
        }
        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();
        // Find user by email
        // Prefer selecting role directly. If the column doesn't exist, fall back.
        // This avoids false negatives when information_schema access is restricted.
        let result;
        try {
            result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, created_at
        FROM users WHERE email = ${normalizedEmail}
      `;
        } catch  {
            result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, created_at
        FROM users WHERE email = ${normalizedEmail}
      `;
        }
        if (result.length === 0) {
            return {
                success: false,
                error: "Invalid email or password"
            };
        }
        const user = result[0];
        // Verify password
        const isValidPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, user.password_hash);
        if (!isValidPassword) {
            return {
                success: false,
                error: "Invalid email or password"
            };
        }
        // Create session with explicit UUID
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        const sessionId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date().toISOString();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;
        // Cookie is set in the API route response (see /api/auth/login)
        const userResponse = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            first_name: user.first_name,
            last_name: user.last_name,
            wallet_balance: Number(user.wallet_balance),
            is_verified: user.is_verified,
            role: user.role,
            created_at: user.created_at
        };
        return {
            success: true,
            user: userResponse,
            token: token,
            expiresAt: expiresAt
        };
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            error: "Failed to login. Please try again."
        };
    }
}
async function logout() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get("session_token")?.value;
    if (token) {
        // Delete session from database
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`DELETE FROM auth_sessions WHERE token::text = ${token}`;
        cookieStore.delete("session_token");
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["redirect"])("/login");
}
async function getCurrentUser() {
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const token = cookieStore.get("session_token")?.value;
        if (!token) {
            return null;
        }
        // Get session with user data
        // Prefer selecting role directly. If the column doesn't exist, fall back.
        // This avoids false negatives when information_schema access is restricted.
        let result;
        try {
            result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT 
          u.id, u.email, u.phone, u.first_name, u.last_name, 
          u.wallet_balance, u.is_verified, u.role, u.created_at,
          s.expires_at
        FROM auth_sessions s
        JOIN users u ON s.user_id::text = u.id::text
        WHERE s.token::text = ${token} AND s.expires_at > NOW()
      `;
        } catch  {
            result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT 
          u.id, u.email, u.phone, u.first_name, u.last_name, 
          u.wallet_balance, u.is_verified, u.created_at,
          s.expires_at
        FROM auth_sessions s
        JOIN users u ON s.user_id::text = u.id::text
        WHERE s.token::text = ${token} AND s.expires_at > NOW()
      `;
        }
        if (result.length === 0) {
            // Session expired or invalid, delete it
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`DELETE FROM auth_sessions WHERE token::text = ${token}`;
            return null;
        }
        const user = result[0];
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            first_name: user.first_name,
            last_name: user.last_name,
            wallet_balance: Number(user.wallet_balance),
            is_verified: user.is_verified,
            role: user.role,
            created_at: user.created_at
        };
    } catch (error) {
        console.error("[getCurrentUser] Error:", error);
        return null;
    }
}
async function updateWalletBalance(userId, amount, operation) {
    try {
        const result = await (operation === "add" ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        UPDATE users
        SET wallet_balance = wallet_balance + ${amount}
        WHERE id = ${userId}
        RETURNING wallet_balance
      ` : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        UPDATE users
        SET wallet_balance = wallet_balance - ${amount}
        WHERE id = ${userId}
        RETURNING wallet_balance
      `);
        if (result.length === 0) {
            return {
                success: false,
                error: "User not found"
            };
        }
        return {
            success: true,
            newBalance: Number(result[0].wallet_balance)
        };
    } catch (error) {
        console.error("Update wallet balance error:", error);
        return {
            success: false,
            error: "Failed to update wallet balance"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    register,
    login,
    logout,
    getCurrentUser,
    updateWalletBalance
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(register, "40554866622f9ecb6ce1409dc5383a5aa38c3f0d75", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(login, "409f1c46588f03a30c67fe3a8e46631bd04f8598ee", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(logout, "005285c2c2dde1d3bc04568825559f74aaf1120d88", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getCurrentUser, "00a454e227311f9c12de802da53866e9b6cac68634", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(updateWalletBalance, "70be005c35eef2345d299a80dfd7610bfb3ab0ab58", null);
}),
"[project]/src/lib/actions/transactions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"400398d88dfbcf0eca039e035a26e01595b72c8f3b":"getTransactionByReference","4059de429dc4e400539ecfb4b986c7836e8ab739a7":"confirmPurchase","603615ff72351fbf345b10ca6799a4b2c92b64c000":"getTransactions","60d6c70ce68c3412417e8297ef043f8bfdab9da1ac":"fundWallet","70a39de3f8ed385fa6cd79790f3ac7f00be551920f":"purchaseAirtime","786bbc73c36bf76574e81e3540e80c321e3025e73c":"purchaseData"},"",""] */ __turbopack_context__.s([
    "confirmPurchase",
    ()=>confirmPurchase,
    "fundWallet",
    ()=>fundWallet,
    "getTransactionByReference",
    ()=>getTransactionByReference,
    "getTransactions",
    ()=>getTransactions,
    "purchaseAirtime",
    ()=>purchaseAirtime,
    "purchaseData",
    ()=>purchaseData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
function generateReference(prefix) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
async function fundWallet(amount, paymentMethod) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
        if (!user) {
            return {
                success: false,
                error: "Not authenticated"
            };
        }
        const reference = generateReference("DEP");
        const nowIso = new Date().toISOString();
        // Ensure wallet exists
        const userIdText = String(user.id);
        let walletId;
        const existingWallet = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT id FROM wallets WHERE "userId" = ${userIdText} LIMIT 1
    `;
        if (existingWallet.length > 0) {
            walletId = existingWallet[0].id;
        } else {
            walletId = `WALLET_${generateReference("W")}`;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${userIdText},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
        }
        // Create transaction record (align with current transactions schema)
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      )
      VALUES (
        ${generateReference("TX")},
        'DEPOSIT',
        'SUCCESS',
        ${amount},
        'GHS',
        ${walletId},
        ${userIdText},
        ${reference},
        ${paymentMethod.toUpperCase()},
        ${JSON.stringify({
            description: "Wallet funding via " + paymentMethod,
            payment_method: paymentMethod
        })}::jsonb,
        ${nowIso},
        ${nowIso}
      )
      RETURNING *
    `;
        // Update wallet balance
        const walletResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateWalletBalance"])(user.id, amount, "add");
        if (!walletResult.success) {
            // Mark transaction as failed
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        UPDATE transactions
        SET status = 'FAILED',
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
            return {
                success: false,
                error: walletResult.error
            };
        }
        return {
            success: true,
            transaction: result[0],
            newBalance: walletResult.newBalance
        };
    } catch (error) {
        console.error("Fund wallet error:", error);
        return {
            success: false,
            error: "Failed to fund wallet. Please try again."
        };
    }
}
async function purchaseAirtime(amount, phoneNumber, network) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
        if (!user) {
            return {
                success: false,
                error: "Not authenticated"
            };
        }
        // Check wallet balance
        if (Number(user.wallet_balance) < amount) {
            return {
                success: false,
                error: "Insufficient wallet balance"
            };
        }
        const reference = generateReference("AIR");
        const nowIso = new Date().toISOString();
        // Ensure wallet exists
        const userIdText = String(user.id);
        let walletId;
        const existingWallet = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT id FROM wallets WHERE "userId" = ${userIdText} LIMIT 1
    `;
        if (existingWallet.length > 0) {
            walletId = existingWallet[0].id;
        } else {
            walletId = `WALLET_${generateReference("W")}`;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${userIdText},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
        }
        // Create transaction record (start as PENDING until admin confirms)
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      )
      VALUES (
        ${generateReference("TX")},
        'AIRTIME',
        'PENDING',
        ${amount},
        'GHS',
        ${walletId},
        ${userIdText},
        ${reference},
        'WALLET',
        ${JSON.stringify({
            description: `${network} Airtime - ₵${amount.toLocaleString()}`,
            network,
            phoneNumber
        })}::jsonb,
        ${nowIso},
        ${nowIso}
      )
      RETURNING *
    `;
        // Deduct from wallet immediately; status will be updated to SUCCESS by admin
        const walletResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateWalletBalance"])(user.id, amount, "subtract");
        if (!walletResult.success) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        UPDATE transactions
        SET status = 'FAILED',
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
            return {
                success: false,
                error: walletResult.error
            };
        }
        return {
            success: true,
            transaction: result[0],
            newBalance: walletResult.newBalance
        };
    } catch (error) {
        console.error("Purchase airtime error:", error);
        return {
            success: false,
            error: "Failed to purchase airtime. Please try again."
        };
    }
}
async function purchaseData(amount, phoneNumber, network, dataPlan) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
        if (!user) {
            return {
                success: false,
                error: "Not authenticated"
            };
        }
        // Check wallet balance
        if (Number(user.wallet_balance) < amount) {
            return {
                success: false,
                error: "Insufficient wallet balance"
            };
        }
        const reference = generateReference("DAT");
        const nowIso = new Date().toISOString();
        // Ensure wallet exists
        const userIdText = String(user.id);
        let walletId;
        const existingWallet = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT id FROM wallets WHERE "userId" = ${userIdText} LIMIT 1
    `;
        if (existingWallet.length > 0) {
            walletId = existingWallet[0].id;
        } else {
            walletId = `WALLET_${generateReference("W")}`;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${userIdText},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
        }
        // Create transaction record (start as PENDING until admin confirms)
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      )
      VALUES (
        ${generateReference("TX")},
        'DATA',
        'PENDING',
        ${amount},
        'GHS',
        ${walletId},
        ${userIdText},
        ${reference},
        'WALLET',
        ${JSON.stringify({
            description: `${network} Data - ${dataPlan}`,
            network,
            phoneNumber,
            dataPlan
        })}::jsonb,
        ${nowIso},
        ${nowIso}
      )
      RETURNING *
    `;
        // Deduct from wallet
        const walletResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateWalletBalance"])(user.id, amount, "subtract");
        if (!walletResult.success) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        UPDATE transactions
        SET status = 'FAILED',
            updated_at = NOW()
        WHERE reference = ${reference}
      `;
            return {
                success: false,
                error: walletResult.error
            };
        }
        return {
            success: true,
            transaction: result[0],
            newBalance: walletResult.newBalance
        };
    } catch (error) {
        console.error("Purchase data error:", error);
        return {
            success: false,
            error: "Failed to purchase data. Please try again."
        };
    }
}
async function getTransactions(type, limit = 50) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
        if (!user) {
            return [];
        }
        let result;
        if (type) {
            result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT * FROM transactions 
        WHERE user_id = ${user.id} AND type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
        } else {
            result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
        SELECT * FROM transactions 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
        }
        return result;
    } catch (error) {
        console.error("Get transactions error:", error);
        return [];
    }
}
async function getTransactionByReference(reference) {
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT * FROM transactions 
      WHERE reference = ${reference}
    `;
        if (result.length === 0) {
            return null;
        }
        return result[0];
    } catch (error) {
        console.error("Get transaction error:", error);
        return null;
    }
}
async function confirmPurchase(reference) {
    try {
        const tx = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      SELECT type, status, amount
      FROM transactions
      WHERE reference = ${reference}
      LIMIT 1
    `;
        if (tx.length === 0) {
            return {
                success: false,
                error: "Transaction not found"
            };
        }
        const row = tx[0];
        if (row.type !== "AIRTIME" && row.type !== "DATA") {
            return {
                success: false,
                error: "Not an airtime or data transaction"
            };
        }
        if (row.status !== "PENDING") {
            return {
                success: false,
                error: "Transaction is not pending"
            };
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      UPDATE transactions
      SET status = 'SUCCESS',
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
            confirmed_at: new Date().toISOString()
        })}::jsonb
      WHERE reference = ${reference}
    `;
        return {
            success: true
        };
    } catch (error) {
        console.error("Confirm purchase error:", error);
        return {
            success: false,
            error: "Failed to confirm purchase"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    fundWallet,
    purchaseAirtime,
    purchaseData,
    getTransactions,
    getTransactionByReference,
    confirmPurchase
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(fundWallet, "60d6c70ce68c3412417e8297ef043f8bfdab9da1ac", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(purchaseAirtime, "70a39de3f8ed385fa6cd79790f3ac7f00be551920f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(purchaseData, "786bbc73c36bf76574e81e3540e80c321e3025e73c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getTransactions, "603615ff72351fbf345b10ca6799a4b2c92b64c000", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getTransactionByReference, "400398d88dfbcf0eca039e035a26e01595b72c8f3b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(confirmPurchase, "4059de429dc4e400539ecfb4b986c7836e8ab739a7", null);
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
"[project]/src/app/api/admin/purchases/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "revalidate",
    ()=>revalidate,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions/transactions.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/admin-auth.ts [app-route] (ecmascript)");
;
;
;
;
const runtime = "nodejs";
const dynamic = "force-dynamic";
const revalidate = 0;
async function fetchPendingPurchases() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
    SELECT
      to_jsonb(t) AS tx,
      to_jsonb(u) AS user_data
    FROM transactions t
    LEFT JOIN users u ON u.id::text = COALESCE(
      to_jsonb(t)->>'user_id',
      to_jsonb(t)->>'userId'
    )
    WHERE LOWER(COALESCE(to_jsonb(t)->>'status', '')) = 'pending'
      AND LOWER(COALESCE(to_jsonb(t)->>'type', '')) IN ('airtime', 'data')
    ORDER BY COALESCE(
      (to_jsonb(t)->>'created_at')::timestamptz,
      (to_jsonb(t)->>'createdAt')::timestamptz
    ) DESC
  `;
}
async function GET() {
    try {
        const adminCheck = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])();
        if (!adminCheck.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: adminCheck.error
            }, {
                status: adminCheck.status
            });
        }
        const rows = await fetchPendingPurchases();
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
        const readObject = (raw, keys)=>{
            for (const key of keys){
                const value = raw?.[key];
                if (value !== null && value !== undefined) return value;
            }
            return null;
        };
        const purchases = Array.isArray(rows) ? rows.map((r)=>{
            const tx = r.tx ?? {};
            const userRaw = r.user_data ?? null;
            const metadata = readObject(tx, [
                "metadata",
                "metaData"
            ]);
            const metadataPhone = metadata?.phoneNumber ?? metadata?.phone_number ?? null;
            const phoneNumber = readString(tx, [
                "phone_number",
                "phoneNumber"
            ]) || (metadataPhone ? String(metadataPhone) : "");
            const userId = userRaw ? readString(userRaw, [
                "id"
            ]) : "";
            const userEmail = userRaw ? readString(userRaw, [
                "email"
            ]) : "";
            const userPhone = userRaw ? readString(userRaw, [
                "phone",
                "phone_number",
                "phoneNumber"
            ]) : "";
            const userFirstName = userRaw ? readString(userRaw, [
                "first_name",
                "firstName"
            ]) : "";
            const userLastName = userRaw ? readString(userRaw, [
                "last_name",
                "lastName"
            ]) : "";
            const userWalletBalance = userRaw ? readNumber(userRaw, [
                "wallet_balance",
                "walletBalance"
            ], 0) : 0;
            const hasUser = Boolean(userId || userEmail || userPhone);
            return {
                reference: readString(tx, [
                    "reference"
                ]),
                type: readString(tx, [
                    "type"
                ]).toLowerCase(),
                status: readString(tx, [
                    "status"
                ]).toLowerCase(),
                amount: readNumber(tx, [
                    "amount"
                ], 0),
                created_at: readString(tx, [
                    "created_at",
                    "createdAt"
                ]),
                metadata: metadata ?? null,
                phoneNumber: phoneNumber || null,
                user: hasUser ? {
                    id: userId,
                    email: userEmail,
                    phone: userPhone,
                    first_name: userFirstName,
                    last_name: userLastName,
                    wallet_balance: userWalletBalance
                } : null
            };
        }) : [];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            purchases
        });
    } catch (error) {
        console.error("Admin purchases GET error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const adminCheck = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])();
        if (!adminCheck.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: adminCheck.error
            }, {
                status: adminCheck.status
            });
        }
        const body = await request.json();
        const reference = body?.reference;
        if (!reference) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Missing reference"
            }, {
                status: 400
            });
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["confirmPurchase"])(String(reference));
        if (!result.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: result.error || "Failed to confirm"
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true
        });
    } catch (error) {
        console.error("Admin purchases POST error:", error);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__7704680c._.js.map