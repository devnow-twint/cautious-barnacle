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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/database.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canClaim",
    ()=>canClaim,
    "deleteClaim",
    ()=>deleteClaim,
    "getAllClaims",
    ()=>getAllClaims,
    "getConfig",
    ()=>getConfig,
    "saveClaim",
    ()=>saveClaim,
    "savePageLoad",
    ()=>savePageLoad,
    "setConfig",
    ()=>setConfig,
    "supabase",
    ()=>supabase,
    "updateClaimStatus",
    ()=>updateClaimStatus,
    "validateDelay",
    ()=>validateDelay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl || '', supabaseKey || '');
async function canClaim(ip) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.from('claims').select('claimed_at').eq('ip', ip).gt('claimed_at', twentyFourHoursAgo).order('claimed_at', {
        ascending: false
    }).limit(1);
    if (error) {
        console.error('canClaim error', error);
        return {
            allowed: false,
            message: 'Terjadi kesalahan database.'
        };
    }
    if (data && data.length > 0) {
        return {
            allowed: false,
            lastClaim: data[0].claimed_at,
            message: 'Kamu sudah claim hari ini. Coba lagi besok ya! 💎'
        };
    }
    return {
        allowed: true
    };
}
async function saveClaim(ip, url, count, status = 'pending') {
    const { data, error } = await supabase.from('claims').insert([
        {
            ip,
            tiktok_url: url,
            likes_count: count,
            status
        }
    ]).select('id');
    if (error) {
        console.error('saveClaim error', error);
        throw error;
    }
    return {
        lastInsertRowid: data[0].id
    };
}
async function updateClaimStatus(id, status) {
    const { error } = await supabase.from('claims').update({
        status
    }).eq('id', id);
    if (error) {
        console.error('updateClaimStatus error', error);
    }
}
async function deleteClaim(id) {
    const { error } = await supabase.from('claims').delete().eq('id', id);
    if (error) {
        console.error('deleteClaim error', error);
    }
}
async function getConfig(key) {
    const { data, error } = await supabase.from('config').select('value').eq('key', key).single();
    if (error || !data) {
        return null;
    }
    return data.value;
}
async function setConfig(key, value) {
    const { error } = await supabase.from('config').upsert([
        {
            key,
            value
        }
    ]);
    if (error) {
        console.error('setConfig error', error);
    }
}
async function savePageLoad(ip, token) {
    // Clean old tokens (> 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await supabase.from('page_loads').delete().lt('loaded_at', oneHourAgo);
    const { error } = await supabase.from('page_loads').insert([
        {
            ip,
            token
        }
    ]);
    if (error) {
        console.error('savePageLoad error', error);
    }
}
async function validateDelay(ip, token, minDelaySeconds = 10) {
    const { data, error } = await supabase.from('page_loads').select('loaded_at').eq('ip', ip).eq('token', token).single();
    if (error || !data) {
        return {
            valid: false,
            message: 'Sesi tidak valid. Refresh halaman dan coba lagi.'
        };
    }
    const loadedAt = new Date(data.loaded_at);
    const now = new Date();
    const diffSeconds = (now - loadedAt) / 1000;
    if (diffSeconds < minDelaySeconds) {
        return {
            valid: false,
            message: `Terlalu cepat! Tunggu ${Math.ceil(minDelaySeconds - diffSeconds)} detik lagi.`
        };
    }
    // Delete used token
    await supabase.from('page_loads').delete().eq('token', token);
    return {
        valid: true
    };
}
async function getAllClaims(limit = 50) {
    const { data, error } = await supabase.from('claims').select('*').order('claimed_at', {
        ascending: false
    }).limit(limit);
    if (error) {
        console.error('getAllClaims error', error);
        return [];
    }
    return data;
}
}),
"[project]/app/api/init/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/database.js [app-route] (ecmascript)");
;
;
;
function getRealIP(req) {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
}
async function GET(req) {
    const ip = getRealIP(req);
    const token = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('hex');
    const delay = Math.floor(Math.random() * 6) + 10;
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["savePageLoad"])(ip, token);
        const maxLikesConfig = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getConfig"])('max_likes');
        const maxLikes = parseInt(maxLikesConfig) || 20;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            token,
            delay,
            maxLikes
        });
    } catch (error) {
        console.error('Init error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            message: 'Server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0zpohy.._.js.map