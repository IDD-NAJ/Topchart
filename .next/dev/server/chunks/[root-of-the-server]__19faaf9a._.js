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
"[project]/src/app/api/wallet/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function GET() {
    try {
        // Get auth token from cookies
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        // Verify token and get user
        const authResponse = await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000") || ''}/api/auth/me`, {
            headers: {
                Cookie: `auth_token=${token}`
            }
        });
        if (!authResponse.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        const authData = await authResponse.json();
        if (!authData.success || !authData.user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        const userId = authData.user.id;
        // Fetch wallet data from transactions API
        const transactionsResponse = await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000") || ''}/api/transactions?userId=${userId}`, {
            headers: {
                Cookie: `auth_token=${token}`
            }
        });
        let transactions = [];
        if (transactionsResponse.ok) {
            const txData = await transactionsResponse.json();
            if (txData.success && txData.transactions) {
                transactions = txData.transactions;
            }
        }
        // Calculate wallet statistics
        const totalDeposited = transactions.filter((tx)=>tx.type === 'deposit' && tx.status === 'success').reduce((acc, tx)=>acc + (tx.amount || 0), 0);
        const totalSpent = transactions.filter((tx)=>tx.type !== 'deposit' && tx.status === 'success').reduce((acc, tx)=>acc + (tx.amount || 0), 0);
        const balance = totalDeposited - totalSpent;
        const pendingDeposits = transactions.filter((tx)=>tx.type === 'deposit' && tx.status === 'pending').reduce((acc, tx)=>acc + (tx.amount || 0), 0);
        // Get recent wallet transactions
        const recentTransactions = transactions.filter((tx)=>[
                'deposit',
                'withdrawal',
                'airtime',
                'data'
            ].includes(tx.type)).sort((a, b)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map((tx)=>({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                status: tx.status,
                description: tx.description,
                created_at: tx.created_at
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                balance: Math.max(0, balance),
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

//# sourceMappingURL=%5Broot-of-the-server%5D__19faaf9a._.js.map