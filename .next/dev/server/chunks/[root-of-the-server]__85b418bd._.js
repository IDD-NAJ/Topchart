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
"[project]/src/lib/actions/disputes.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"004232ac6287fc2fc7c7aaddfefa0253481cdd001d":"getDisputes","4028cfb87755b2b248d7af272644bfab9308cac72a":"createDispute"},"",""] */ __turbopack_context__.s([
    "createDispute",
    ()=>createDispute,
    "getDisputes",
    ()=>getDisputes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/nanoid/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
;
async function getDisputes() {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
    if (!user) throw new Error("Unauthorized");
    const disputes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
    SELECT d.*, t.type as "transactionType", t.amount as "transactionAmount"
    FROM disputes d
    JOIN transactions t ON d."transactionId" = t.id
    WHERE d."userId" = ${user.id}
    ORDER BY d."createdAt" DESC
  `;
    return disputes;
}
async function createDispute(data) {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
    if (!user) throw new Error("Unauthorized");
    // Verify transaction ownership
    const txResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
    SELECT id FROM transactions WHERE id = ${data.transactionId} AND user_id = ${user.id}
  `;
    if (!txResult || txResult.length === 0) throw new Error("Transaction not found or unauthorized");
    // Check if dispute already exists for this transaction
    const existingDispute = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
    SELECT id FROM disputes WHERE "transactionId" = ${data.transactionId}
  `;
    if (existingDispute && existingDispute.length > 0) throw new Error("A dispute already exists for this transaction");
    const disputeId = `DSP-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10).toUpperCase()}`;
    const now = new Date();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
    INSERT INTO disputes (id, "transactionId", "userId", status, reason, "createdAt")
    VALUES (
      ${disputeId}, 
      ${data.transactionId}, 
      ${user.id}, 
      'OPEN'::"DisputeStatus", 
      ${data.reason}, 
      ${now}
    )
  `;
    return {
        id: disputeId
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getDisputes,
    createDispute
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getDisputes, "004232ac6287fc2fc7c7aaddfefa0253481cdd001d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(createDispute, "4028cfb87755b2b248d7af272644bfab9308cac72a", null);
}),
"[project]/src/app/api/dashboard/disputes/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$disputes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions/disputes.ts [app-route] (ecmascript)");
;
;
async function GET() {
    try {
        const disputes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$disputes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDisputes"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            disputes
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message
        }, {
            status: 500
        });
    }
}
async function POST(req) {
    try {
        const body = await req.json();
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$disputes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createDispute"])(body);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            ...result
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__85b418bd._.js.map