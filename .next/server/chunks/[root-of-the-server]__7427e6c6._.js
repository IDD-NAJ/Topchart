module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},802935,e=>{"use strict";let t={USER:"USER",ADMIN:"ADMIN",RESELLER:"RESELLER"},r=[t.USER,t.ADMIN,t.RESELLER];function s(e){return function(e){if(null==e||""===e)return null;let t=String(e).trim().toUpperCase();return r.includes(t)?t:null}(e)===t.ADMIN}function a(e){return r.includes(e)}e.s(["ROLES",0,t,"isAdmin",()=>s,"isValidRole",()=>a])},767417,e=>{"use strict";var t=e.i(493458),r=e.i(843793),s=e.i(802935);async function a(){try{let e=await (0,t.cookies)(),a=e.get("session_token")?.value;if(!a)return{ok:!1,status:401,error:"Unauthorized"};let n=[];try{n=await r.sql`
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
      `}catch(e){console.error("Auth sessions query failed:",e),n=[]}if(0===n.length)return{ok:!1,status:401,error:"Session expired"};let i=n[0];if(!(0,s.isAdmin)(i.role))return console.warn("[SECURITY] Unauthorized admin access attempt",{userId:i.user_id,email:i.email,role:i.role,timestamp:new Date().toISOString()}),{ok:!1,status:403,error:"Access denied"};return{ok:!0,userId:i.user_id,email:i.email,firstName:i.first_name,lastName:i.last_name}}catch(e){return console.error("Admin auth error:",e),{ok:!1,status:401,error:"Internal server error"}}}e.s(["requireAdmin",()=>a])},456271,e=>{"use strict";var t=e.i(747909),r=e.i(174017),s=e.i(996250),a=e.i(759756),n=e.i(561916),i=e.i(114444),o=e.i(837092),u=e.i(869741),l=e.i(316795),d=e.i(487718),c=e.i(995169),p=e.i(47587),v=e.i(666012),m=e.i(570101),E=e.i(626937),R=e.i(10372),h=e.i(193695);e.i(52474);var f=e.i(600220),_=e.i(89171),x=e.i(493458),N=e.i(843793),g=e.i(767417);async function C(e){try{let t=await (0,x.cookies)();if(!t.get("session_token")?.value)return _.NextResponse.json({success:!1,error:"Unauthorized"},{status:401});let r=await (0,g.requireAdmin)();if(!r.ok)return _.NextResponse.json({success:!1,error:r.error},{status:r.status});let{searchParams:s}=new URL(e.url),a=s.get("status"),n=s.get("service_id"),i=s.get("user_id"),o=parseInt(s.get("limit")||"50"),u=parseInt(s.get("offset")||"0"),l=N.sql`WHERE 1=1`;a&&(l=N.sql`${l} AND vn.status = ${a}`),n&&(l=N.sql`${l} AND vn.service_id = ${n}`),i&&(l=N.sql`${l} AND vn.user_id = ${i}`);let d=await N.sql`
      SELECT 
        vn.id,
        vn.number,
        vn.type,
        vn.status,
        vn.purchase_price,
        vn.rental_duration_hours,
        vn.expires_at,
        vn.completed_at,
        vn.created_at,
        vn.updated_at,
        vn.textverified_order_id,
        u.id as user_id,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        vs.id as service_id,
        vs.name as service_name,
        vs.category as service_category,
        COUNT(vsms.id) as sms_count
      FROM verification_numbers vn
      JOIN users u ON vn.user_id = u.id
      JOIN verification_services vs ON vn.service_id = vs.id
      LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
      ${l}
      GROUP BY vn.id, u.id, u.email, u.first_name, u.last_name, vs.id, vs.name, vs.category
      ORDER BY vn.created_at DESC
      LIMIT ${o} OFFSET ${u}
    `,c=await N.sql`
      SELECT COUNT(*) as total
      FROM verification_numbers vn
      ${l}
    `,p=await N.sql`
      SELECT 
        COUNT(*) as total_numbers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_numbers,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_numbers,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_numbers,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_numbers,
        SUM(purchase_price) as total_revenue
      FROM verification_numbers
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;return _.NextResponse.json({success:!0,data:{numbers:d,pagination:{total:parseInt(c[0]?.total||"0"),limit:o,offset:u},stats:p[0]}})}catch(e){return console.error("Admin verification numbers error:",e),_.NextResponse.json({success:!1,error:"Failed to fetch numbers"},{status:500})}}e.s(["GET",()=>C],169231);var A=e.i(169231);let w=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/verification/numbers/route",pathname:"/api/admin/verification/numbers",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/admin/verification/numbers/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:O,workUnitAsyncStorage:S,serverHooks:T}=w;function y(){return(0,s.patchFetch)({workAsyncStorage:O,workUnitAsyncStorage:S})}async function b(e,t,s){w.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/admin/verification/numbers/route";_=_.replace(/\/index$/,"")||"/";let x=await w.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==s.waitUntil||s.waitUntil.call(s,Promise.resolve()),null;let{buildId:N,params:g,nextConfig:C,parsedUrl:A,isDraftMode:O,prerenderManifest:S,routerServerContext:T,isOnDemandRevalidate:y,revalidateOnlyGenerated:b,resolvedPathname:I,clientReferenceManifest:U,serverActionsManifest:k}=x,q=(0,u.normalizeAppPath)(_),D=!!(S.dynamicRoutes[q]||S.routes[I]),H=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,A,!1):t.end("This page could not be found"),null);if(D&&!O){let e=!!S.routes[I],t=S.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(C.experimental.adapterPath)return await H();throw new h.NoFallbackError}}let M=null;!D||w.isDev||O||(M="/index"===(M=I)?"/":M);let P=!0===w.isDev||!D,L=D&&!P;k&&U&&(0,i.setReferenceManifestsSingleton)({page:_,clientReferenceManifest:U,serverActionsManifest:k,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:k})});let j=e.method||"GET",$=(0,n.getTracer)(),F=$.getActiveScopeSpan(),W={params:g,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:P,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:C.cacheLife,waitUntil:s.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,s)=>w.onRequestError(e,t,s,T)},sharedContext:{buildId:N}},K=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i=async e=>w.handle(G,W).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=$.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=r.get("next.route");if(s){let t=`${j} ${s}`;e.setAttributes({"next.route":s,"http.route":s,"next.span_name":t}),e.updateName(t)}else e.updateName(`${j} ${_}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),u=async a=>{var n,u;let l=async({previousCacheEntry:r})=>{try{if(!o&&y&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(a);e.fetchMetrics=W.renderOpts.fetchMetrics;let u=W.renderOpts.pendingWaitUntil;u&&s.waitUntil&&(s.waitUntil(u),u=void 0);let l=W.renderOpts.collectedTags;if(!D)return await (0,v.sendResponse)(K,B,n,W.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(n.headers);l&&(t[R.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==W.renderOpts.collectedRevalidate&&!(W.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&W.renderOpts.collectedRevalidate,s=void 0===W.renderOpts.collectedExpire||W.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:W.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:s}}}}catch(t){throw(null==r?void 0:r.isStale)&&await w.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:y})},T),t}},d=await w.handleResponse({req:e,nextConfig:C,cacheKey:M,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:y,revalidateOnlyGenerated:b,responseGenerator:l,waitUntil:s.waitUntil,isMinimalMode:o});if(!D)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(u=d.value)?void 0:u.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",y?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,m.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&D||c.delete(R.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,E.getCacheControlHeader)(d.cacheControl)),await (0,v.sendResponse)(K,B,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};F?await u(F):await $.withPropagatedContext(e.headers,()=>$.trace(c.BaseServerSpan.handleRequest,{spanName:`${j} ${_}`,kind:n.SpanKind.SERVER,attributes:{"http.method":j,"http.target":e.url}},u))}catch(t){if(t instanceof h.NoFallbackError||await w.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:y})}),D)throw t;return await (0,v.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>b,"patchFetch",()=>y,"routeModule",()=>w,"serverHooks",()=>T,"workAsyncStorage",()=>O,"workUnitAsyncStorage",()=>S],456271)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__7427e6c6._.js.map