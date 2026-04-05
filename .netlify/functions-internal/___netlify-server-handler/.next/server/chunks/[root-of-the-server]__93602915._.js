module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},802935,e=>{"use strict";let t={USER:"USER",ADMIN:"ADMIN"},r=[t.USER,t.ADMIN];function s(e){return function(e){if(null==e||""===e)return null;let t=String(e).trim().toUpperCase();return r.includes(t)?t:null}(e)===t.ADMIN}function a(e){return r.includes(e)}e.s(["ROLES",0,t,"isAdmin",()=>s,"isValidRole",()=>a])},767417,e=>{"use strict";var t=e.i(493458),r=e.i(843793),s=e.i(802935);async function a(){try{let e=await (0,t.cookies)(),a=e.get("session_token")?.value;if(console.log("[requireAdmin] Session token:",a?a.substring(0,8)+"...":"NONE"),!a)return{ok:!1,status:401,error:"Unauthorized"};let n=[];try{n=await r.sql`
        SELECT
          s.user_id::text AS user_id,
          u.email,
          u.first_name,
          u.last_name,
          COALESCE(u.role, 'USER') AS role
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${a}
          AND s.expires_at > NOW()
        LIMIT 1
      `}catch(e){console.error("Auth sessions query failed:",e),n=[]}if(0===n.length)return{ok:!1,status:401,error:"Session expired"};let o=n[0];if(!(0,s.isAdmin)(o.role))return console.warn("[SECURITY] Unauthorized admin access attempt",{userId:o.user_id,email:o.email,role:o.role,timestamp:new Date().toISOString()}),{ok:!1,status:403,error:"Access denied"};return{ok:!0,userId:o.user_id,email:o.email,firstName:o.first_name,lastName:o.last_name}}catch(e){return console.error("Admin auth error:",e),{ok:!1,status:401,error:"Internal server error"}}}e.s(["requireAdmin",()=>a])},584189,e=>{"use strict";var t=e.i(747909),r=e.i(174017),s=e.i(996250),a=e.i(759756),n=e.i(561916),o=e.i(114444),i=e.i(837092),l=e.i(869741),u=e.i(316795),d=e.i(487718),c=e.i(995169),p=e.i(47587),m=e.i(666012),R=e.i(570101),h=e.i(626937),E=e.i(10372),x=e.i(193695);e.i(52474);var f=e.i(600220),g=e.i(89171),w=e.i(843793),N=e.i(767417),v=e.i(802935);async function A(e){try{let t=await (0,N.requireAdmin)();if(!t.ok)return g.NextResponse.json({success:!1,error:t.error},{status:t.status});let{action:r,userId:s,role:a,email:n,firstName:o,lastName:i,phone:l}=await e.json();switch(console.log("[AUDIT] Admin management action",{adminId:t.userId,action:r,targetUserId:s,timestamp:new Date().toISOString(),ip:e.headers.get("x-forwarded-for")||"unknown"}),r){case"promoteToAdmin":if(!s||!a)return g.NextResponse.json({success:!1,error:"User ID and role are required"},{status:400});if("ADMIN"!==a)return g.NextResponse.json({success:!1,error:"Invalid role. Only ADMIN role allowed."},{status:400});let u=await w.sql`
          UPDATE users
          SET role = ${v.ROLES.ADMIN},
              updated_at = NOW()
          WHERE id::text = ${s}
          RETURNING id, email, role
        `;if(0===u.length)return g.NextResponse.json({success:!1,error:"User not found or update failed"},{status:404});return g.NextResponse.json({success:!0,message:"User promoted to admin successfully",user:u[0]});case"demoteToUser":if(!s)return g.NextResponse.json({success:!1,error:"User ID is required"},{status:400});let d=await w.sql`
          UPDATE users
          SET role = ${v.ROLES.USER},
              updated_at = NOW()
          WHERE id::text = ${s}
          RETURNING id, email, role
        `;if(0===d.length)return g.NextResponse.json({success:!1,error:"User not found or update failed"},{status:404});return g.NextResponse.json({success:!0,message:"User demoted to user role successfully",user:d[0]});case"createAdmin":if(!n||!o||!i||!l)return g.NextResponse.json({success:!1,error:"All fields are required"},{status:400});if((await w.sql`
          SELECT id FROM users WHERE LOWER(email) = ${n.toLowerCase()}
        `).length>0)return g.NextResponse.json({success:!1,error:"User with this email already exists"},{status:409});let c=await w.sql`
          INSERT INTO users (
            id,
            email,
            first_name,
            last_name,
            phone,
            wallet_balance,
            is_verified,
            role,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            ${n.toLowerCase()},
            ${o},
            ${i},
            ${l||"0000000000"},
            0,
            true,
            ${v.ROLES.ADMIN},
            NOW(),
            NOW()
          )
          RETURNING id, email, first_name, last_name, phone, role, created_at
        `;return g.NextResponse.json({success:!0,message:"Admin user created successfully",user:c[0]});default:return g.NextResponse.json({success:!1,error:"Invalid action"},{status:400})}}catch(e){return console.error("Admin management API error:",e),g.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}async function I(e){try{let t=await (0,N.requireAdmin)();if(!t.ok)return g.NextResponse.json({success:!1,error:t.error},{status:t.status});let{searchParams:r}=new URL(e.url),s=r.get("search")||"",a=parseInt(r.get("page")||"1"),n=parseInt(r.get("limit")||"20"),o=(a-1)*n,i=`
      SELECT id, email, first_name, last_name, phone, wallet_balance, 
             is_verified, role, created_at, updated_at
      FROM users
      WHERE 1=1
    `,l=[];s&&(i+=` AND (
        LOWER(email) LIKE $${l.length+1} OR
        LOWER(first_name) LIKE $${l.length+2} OR
        LOWER(last_name) LIKE $${l.length+3}
      )`,l.push(`%${s.toLowerCase()}%`),l.push(`%${s.toLowerCase()}%`),l.push(`%${s.toLowerCase()}%`)),i+=` ORDER BY created_at DESC LIMIT $${l.length+4} OFFSET $${l.length+5}`,l.push(n.toString()),l.push(o.toString());let u=await (0,w.sql)(i,...l),d="SELECT COUNT(*) as total FROM users WHERE 1=1",c=[];s&&(d+=` AND (
        LOWER(email) LIKE $${c.length+1} OR
        LOWER(first_name) LIKE $${c.length+2} OR
        LOWER(last_name) LIKE $${c.length+3}
      )`,c.push(`%${s.toLowerCase()}%`),c.push(`%${s.toLowerCase()}%`),c.push(`%${s.toLowerCase()}%`));let p=await (0,w.sql)(d,...c),m=parseInt(p[0]?.total||"0");return g.NextResponse.json({success:!0,users:u,pagination:{page:a,limit:n,total:m,totalPages:Math.ceil(m/n)}})}catch(e){return console.error("Admin users list API error:",e),g.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}e.s(["GET",()=>I,"POST",()=>A,"dynamic",0,"force-dynamic","revalidate",0,0,"runtime",0,"nodejs"],900753);var O=e.i(900753);let _=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/admin/api/admin-management/route",pathname:"/admin/api/admin-management",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/admin/api/admin-management/route.ts",nextConfigOutput:"standalone",userland:O}),{workAsyncStorage:C,workUnitAsyncStorage:S,serverHooks:y}=_;function T(){return(0,s.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:S})}async function U(e,t,s){_.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let g="/admin/api/admin-management/route";g=g.replace(/\/index$/,"")||"/";let w=await _.prepare(e,t,{srcPage:g,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==s.waitUntil||s.waitUntil.call(s,Promise.resolve()),null;let{buildId:N,params:v,nextConfig:A,parsedUrl:I,isDraftMode:O,prerenderManifest:C,routerServerContext:S,isOnDemandRevalidate:y,revalidateOnlyGenerated:T,resolvedPathname:U,clientReferenceManifest:$,serverActionsManifest:L}=w,j=(0,l.normalizeAppPath)(g),q=!!(C.dynamicRoutes[j]||C.routes[U]),k=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,I,!1):t.end("This page could not be found"),null);if(q&&!O){let e=!!C.routes[U],t=C.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(A.experimental.adapterPath)return await k();throw new x.NoFallbackError}}let D=null;!q||_.isDev||O||(D="/index"===(D=U)?"/":D);let M=!0===_.isDev||!q,b=q&&!M;L&&$&&(0,o.setReferenceManifestsSingleton)({page:g,clientReferenceManifest:$,serverActionsManifest:L,serverModuleMap:(0,i.createServerModuleMap)({serverActionsManifest:L})});let P=e.method||"GET",H=(0,n.getTracer)(),W=H.getActiveScopeSpan(),F={params:v,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!A.experimental.authInterrupts},cacheComponents:!!A.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:A.cacheLife,waitUntil:s.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,s)=>_.onRequestError(e,t,s,S)},sharedContext:{buildId:N}},K=new u.NodeNextRequest(e),G=new u.NodeNextResponse(t),B=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let o=async e=>_.handle(B,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=r.get("next.route");if(s){let t=`${P} ${s}`;e.setAttributes({"next.route":s,"http.route":s,"next.span_name":t}),e.updateName(t)}else e.updateName(`${P} ${g}`)}),i=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var n,l;let u=async({previousCacheEntry:r})=>{try{if(!i&&y&&T&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await o(a);e.fetchMetrics=F.renderOpts.fetchMetrics;let l=F.renderOpts.pendingWaitUntil;l&&s.waitUntil&&(s.waitUntil(l),l=void 0);let u=F.renderOpts.collectedTags;if(!q)return await (0,m.sendResponse)(K,G,n,F.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,R.toNodeOutgoingHttpHeaders)(n.headers);u&&(t[E.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=E.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,s=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=E.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:s}}}}catch(t){throw(null==r?void 0:r.isStale)&&await _.onRequestError(e,t,{routerKind:"App Router",routePath:g,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:b,isOnDemandRevalidate:y})},S),t}},d=await _.handleResponse({req:e,nextConfig:A,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:y,revalidateOnlyGenerated:T,responseGenerator:u,waitUntil:s.waitUntil,isMinimalMode:i});if(!q)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",y?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,R.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&q||c.delete(E.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,h.getCacheControlHeader)(d.cacheControl)),await (0,m.sendResponse)(K,G,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};W?await l(W):await H.withPropagatedContext(e.headers,()=>H.trace(c.BaseServerSpan.handleRequest,{spanName:`${P} ${g}`,kind:n.SpanKind.SERVER,attributes:{"http.method":P,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await _.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:b,isOnDemandRevalidate:y})}),q)throw t;return await (0,m.sendResponse)(K,G,new Response(null,{status:500})),null}}e.s(["handler",()=>U,"patchFetch",()=>T,"routeModule",()=>_,"serverHooks",()=>y,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>S],584189)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__93602915._.js.map