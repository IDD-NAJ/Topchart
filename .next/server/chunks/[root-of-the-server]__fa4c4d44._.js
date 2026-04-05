module.exports=[918622,(e,r,t)=>{r.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,r,t)=>{r.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,r,t)=>{r.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,r,t)=>{r.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,r,t)=>{r.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,r,t)=>{r.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},802935,e=>{"use strict";let r={USER:"USER",ADMIN:"ADMIN",RESELLER:"RESELLER"},t=[r.USER,r.ADMIN,r.RESELLER];function s(e){return function(e){if(null==e||""===e)return null;let r=String(e).trim().toUpperCase();return t.includes(r)?r:null}(e)===r.ADMIN}function n(e){return t.includes(e)}e.s(["ROLES",0,r,"isAdmin",()=>s,"isValidRole",()=>n])},767417,e=>{"use strict";var r=e.i(493458),t=e.i(843793),s=e.i(802935);async function n(){try{let e=await (0,r.cookies)(),n=e.get("session_token")?.value;if(!n)return{ok:!1,status:401,error:"Unauthorized"};let i=[];try{i=await t.sql`
        SELECT
          s.user_id::text AS user_id,
          u.email,
          u.first_name,
          u.last_name,
          COALESCE(u.role, 'USER') AS role
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${n}
          AND s.expires_at > NOW()
        LIMIT 1
      `}catch(e){console.error("Auth sessions query failed:",e),i=[]}if(0===i.length)return{ok:!1,status:401,error:"Session expired"};let a=i[0];if(!(0,s.isAdmin)(a.role))return console.warn("[SECURITY] Unauthorized admin access attempt",{userId:a.user_id,email:a.email,role:a.role,timestamp:new Date().toISOString()}),{ok:!1,status:403,error:"Access denied"};return{ok:!0,userId:a.user_id,email:a.email,firstName:a.first_name,lastName:a.last_name}}catch(e){return console.error("Admin auth error:",e),{ok:!1,status:401,error:"Internal server error"}}}e.s(["requireAdmin",()=>n])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__fa4c4d44._.js.map