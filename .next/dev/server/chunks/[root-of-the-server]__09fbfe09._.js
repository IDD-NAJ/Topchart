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
"[project]/src/app/api/admin/tables/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
const ALLOWED_TABLES = [
    "users",
    "user_profiles",
    "user_sessions",
    "wallets",
    "kyc_profiles",
    "kyc_documents",
    "kyc_reviews",
    "transactions",
    "payment_intents",
    "payment_provider_events",
    "ledger_accounts",
    "ledger_entries",
    "airtime_purchases",
    "data_bundle_purchases",
    "networks",
    "data_bundles",
    "data_bundle_categories",
    "referrals",
    "referral_rewards",
    "referral_visits",
    "promo_codes",
    "promo_redemptions",
    "tickets",
    "ticket_messages",
    "disputes",
    "admin_users",
    "admin_action_logs",
    "roles",
    "permissions",
    "role_assignments",
    "role_permissions",
    "auth_credentials",
    "auth_sessions"
];
async function verifyAdmin() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const sessionToken = cookieStore.get("session_token")?.value;
    if (!sessionToken) return false;
    const sessions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
    SELECT u.id, u.role FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `;
    if (!sessions.length) return false;
    const user = sessions[0];
    return user.role === "ADMIN";
}
async function GET(req) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100);
    const orderBy = searchParams.get("orderBy") || "id";
    const orderDir = searchParams.get("orderDir") === "asc" ? "ASC" : "DESC";
    const search = searchParams.get("search") || "";
    const searchColumns = (searchParams.get("searchColumns") || "").split(",").filter(Boolean);
    if (!table || !ALLOWED_TABLES.includes(table)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Invalid table"
        }, {
            status: 400
        });
    }
    const safeOrderBy = orderBy.replace(/[^a-zA-Z0-9_]/g, "");
    const offset = (page - 1) * pageSize;
    try {
        let whereClause = "";
        const params = [];
        if (search && searchColumns.length > 0) {
            const conditions = searchColumns.map((col, idx)=>{
                const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
                params.push(`%${search}%`);
                return `CAST("${safeCol}" AS TEXT) ILIKE $${idx + 1}`;
            });
            whereClause = `WHERE ${conditions.join(" OR ")}`;
        }
        const countQuery = `SELECT COUNT(*) as count FROM "${table}" ${whereClause}`;
        const countResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(countQuery, params);
        const totalRows = parseInt(countResult[0]?.count || "0", 10);
        const totalPages = Math.ceil(totalRows / pageSize);
        const dataParams = [
            ...params,
            pageSize,
            offset
        ];
        const dataQuery = `
      SELECT * FROM "${table}" 
      ${whereClause}
      ORDER BY "${safeOrderBy}" ${orderDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(dataQuery, dataParams);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data,
            totalRows,
            totalPages,
            page,
            pageSize
        });
    } catch (error) {
        console.error("Table fetch error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Database error"
        }, {
            status: 500
        });
    }
}
async function POST(req) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    try {
        const body = await req.json();
        const { table, data } = body;
        if (!table || !ALLOWED_TABLES.includes(table)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid table"
            }, {
                status: 400
            });
        }
        if (!data || typeof data !== "object") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid data"
            }, {
                status: 400
            });
        }
        const keys = Object.keys(data).filter((k)=>{
            const val = data[k];
            // For id, only include if it has a valid non-null value (let DB auto-generate otherwise)
            if (k === "id") return val && val !== null && val !== undefined && val !== "";
            // For other keys, filter out null/undefined
            return val !== null && val !== undefined;
        });
        if (keys.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "No valid data provided"
            }, {
                status: 400
            });
        }
        const values = keys.map((k)=>data[k]);
        const columns = keys.map((k)=>`"${k.replace(/[^a-zA-Z0-9_]/g, "")}"`).join(", ");
        const placeholders = keys.map((_, i)=>`$${i + 1}`).join(", ");
        const query = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(query, values);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error("Table insert error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Database error"
        }, {
            status: 500
        });
    }
}
async function PUT(req) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    try {
        const body = await req.json();
        const { table, id, ids, data } = body;
        if (!table || !ALLOWED_TABLES.includes(table)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid table"
            }, {
                status: 400
            });
        }
        if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "ID or IDs required"
            }, {
                status: 400
            });
        }
        if (!data || typeof data !== "object") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid data"
            }, {
                status: 400
            });
        }
        const keys = Object.keys(data).filter((k)=>k !== "id");
        const values = keys.map((k)=>data[k]);
        const setClause = keys.map((k, i)=>`"${k.replace(/[^a-zA-Z0-9_]/g, "")}" = $${i + 1}`).join(", ");
        // Handle batch update (ids array)
        if (ids && Array.isArray(ids) && ids.length > 0) {
            // Use ANY with array for batch update
            const batchValues = [
                ...values,
                ids
            ];
            const query = `UPDATE "${table}" SET ${setClause} WHERE id::text = ANY($${values.length + 1}::text[]) RETURNING *`;
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(query, batchValues);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: result,
                updated: result.length
            });
        }
        // Handle single update (id)
        values.push(id);
        const query = `UPDATE "${table}" SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(query, values);
        if (!result.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Record not found"
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error("Table update error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Database error"
        }, {
            status: 500
        });
    }
}
async function DELETE(req) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    try {
        const { searchParams } = new URL(req.url);
        const table = searchParams.get("table");
        const id = searchParams.get("id");
        const idsParam = searchParams.get("ids");
        if (!table || !ALLOWED_TABLES.includes(table)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Invalid table"
            }, {
                status: 400
            });
        }
        // Handle batch delete (ids array)
        if (idsParam) {
            const ids = idsParam.split(",").filter(Boolean);
            if (ids.length === 0) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: false,
                    error: "IDs required"
                }, {
                    status: 400
                });
            }
            const query = `DELETE FROM "${table}" WHERE id::text = ANY($1::text[]) RETURNING id`;
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(query, [
                ids
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                deleted: result.length,
                ids: result.map((r)=>r.id)
            });
        }
        // Handle single delete (id)
        if (!id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "ID required"
            }, {
                status: 400
            });
        }
        const query = `DELETE FROM "${table}" WHERE id = $1 RETURNING id`;
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqlUnsafe"])(query, [
            id
        ]);
        if (!result.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Record not found"
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            deleted: id
        });
    } catch (error) {
        console.error("Table delete error:", error);
        // Check for foreign key constraint violations
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error?.code;
        console.error("Error details:", {
            message: errorMessage,
            code: errorCode
        });
        const isForeignKeyError = errorMessage.includes("foreign key constraint") || errorMessage.includes("violates foreign key") || errorMessage.includes("is still referenced from table") || errorMessage.includes("update or delete on table") || errorCode === "23503" // PostgreSQL foreign_key_violation error code
        ;
        if (isForeignKeyError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Cannot delete: This record is referenced by other records (e.g., data bundles exist for this category). Please remove or reassign dependent records first."
            }, {
                status: 409
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: `Database error: ${errorMessage.slice(0, 100)}`
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__09fbfe09._.js.map