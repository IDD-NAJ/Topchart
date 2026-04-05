module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},333621,e=>{"use strict";var t=e.i(747909),r=e.i(174017),s=e.i(996250),n=e.i(759756),a=e.i(561916),i=e.i(114444),o=e.i(837092),l=e.i(869741),u=e.i(316795),d=e.i(487718),c=e.i(995169),v=e.i(47587),p=e.i(666012),m=e.i(570101),_=e.i(626937),h=e.i(10372),x=e.i(193695);e.i(52474);var R=e.i(600220),f=e.i(89171),E=e.i(493458),g=e.i(843793);async function N(e){try{let t=await (0,E.cookies)(),r=t.get("session_token")?.value;if(!r)return f.NextResponse.json({success:!1,error:"Unauthorized"},{status:401});let s=await g.sql`
      SELECT s.user_id
      FROM auth_sessions s
      WHERE s.token = ${r}
        AND s.expires_at > NOW()
    `;if(0===s.length)return f.NextResponse.json({success:!1,error:"Session expired"},{status:401});let n=s[0].user_id,{searchParams:a}=new URL(e.url),i=a.get("status"),o="true"===a.get("include_expired"),l=g.sql`
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
        vs.id as service_id,
        vs.name as service_name,
        vs.category as service_category,
        vs.icon_url as service_icon,
        COUNT(vsms.id) as sms_count
      FROM verification_numbers vn
      JOIN verification_services vs ON vn.service_id = vs.id
      LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
      WHERE vn.user_id = ${n}
    `;i&&!o?l=g.sql`
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
          vs.id as service_id,
          vs.name as service_name,
          vs.category as service_category,
          vs.icon_url as service_icon,
          COUNT(vsms.id) as sms_count
        FROM verification_numbers vn
        JOIN verification_services vs ON vn.service_id = vs.id
        LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
        WHERE vn.user_id = ${n} AND vn.status = ${i}
      `:o||(l=g.sql`
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
          vs.id as service_id,
          vs.name as service_name,
          vs.category as service_category,
          vs.icon_url as service_icon,
          COUNT(vsms.id) as sms_count
        FROM verification_numbers vn
        JOIN verification_services vs ON vn.service_id = vs.id
        LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
        WHERE vn.user_id = ${n}
          AND (vn.status != 'expired' OR vn.expires_at > NOW() - INTERVAL '24 hours')
      `);let u=await g.sql`
      ${l}
      GROUP BY vn.id, vs.id, vs.name, vs.category, vs.icon_url
      ORDER BY vn.created_at DESC
    `,d=new Date,c=u.map(e=>{let t=e.expires_at?new Date(e.expires_at):null,r=t&&"active"===e.status?Math.max(0,t.getTime()-d.getTime()):0;return{...e,time_remaining_ms:r,time_remaining_formatted:function(e){if(e<=0)return"Expired";let t=Math.floor(e/36e5),r=Math.floor(e%36e5/6e4);return t>0?`${t}h ${r}m`:`${r}m`}(r),is_expired:0===r&&"active"===e.status}});return f.NextResponse.json({success:!0,data:{numbers:c,summary:{total:u.length,active:u.filter(e=>"active"===e.status).length,completed:u.filter(e=>"completed"===e.status).length}}})}catch(e){return console.error("Get verification numbers error:",e),f.NextResponse.json({success:!1,error:"Failed to fetch numbers"},{status:500})}}e.s(["GET",()=>N],738387);var y=e.i(738387);let w=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/verification/numbers/route",pathname:"/api/verification/numbers",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/verification/numbers/route.ts",nextConfigOutput:"",userland:y}),{workAsyncStorage:O,workUnitAsyncStorage:b,serverHooks:C}=w;function T(){return(0,s.patchFetch)({workAsyncStorage:O,workUnitAsyncStorage:b})}async function A(e,t,s){w.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let f="/api/verification/numbers/route";f=f.replace(/\/index$/,"")||"/";let E=await w.prepare(e,t,{srcPage:f,multiZoneDraftMode:!1});if(!E)return t.statusCode=400,t.end("Bad Request"),null==s.waitUntil||s.waitUntil.call(s,Promise.resolve()),null;let{buildId:g,params:N,nextConfig:y,parsedUrl:O,isDraftMode:b,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:A,revalidateOnlyGenerated:S,resolvedPathname:q,clientReferenceManifest:k,serverActionsManifest:P}=E,M=(0,l.normalizeAppPath)(f),I=!!(C.dynamicRoutes[M]||C.routes[q]),U=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,O,!1):t.end("This page could not be found"),null);if(I&&!b){let e=!!C.routes[q],t=C.dynamicRoutes[M];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await U();throw new x.NoFallbackError}}let j=null;!I||w.isDev||b||(j="/index"===(j=q)?"/":j);let H=!0===w.isDev||!I,D=I&&!H;P&&k&&(0,i.setReferenceManifestsSingleton)({page:f,clientReferenceManifest:k,serverActionsManifest:P,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:P})});let $=e.method||"GET",F=(0,a.getTracer)(),L=F.getActiveScopeSpan(),K={params:N,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:s.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,s)=>w.onRequestError(e,t,s,T)},sharedContext:{buildId:g}},W=new u.NodeNextRequest(e),B=new u.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(W,(0,d.signalFromNodeResponse)(t));try{let i=async e=>w.handle(G,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=F.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=r.get("next.route");if(s){let t=`${$} ${s}`;e.setAttributes({"next.route":s,"http.route":s,"next.span_name":t}),e.updateName(t)}else e.updateName(`${$} ${f}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var a,l;let u=async({previousCacheEntry:r})=>{try{if(!o&&A&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await i(n);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&s.waitUntil&&(s.waitUntil(l),l=void 0);let u=K.renderOpts.collectedTags;if(!I)return await (0,p.sendResponse)(W,B,a,K.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(a.headers);u&&(t[h.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,s=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:s}}}}catch(t){throw(null==r?void 0:r.isStale)&&await w.onRequestError(e,t,{routerKind:"App Router",routePath:f,routeType:"route",revalidateReason:(0,v.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:A})},T),t}},d=await w.handleResponse({req:e,nextConfig:y,cacheKey:j,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:S,responseGenerator:u,waitUntil:s.waitUntil,isMinimalMode:o});if(!I)return null;if((null==d||null==(a=d.value)?void 0:a.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",A?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),b&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,m.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&I||c.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,_.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(W,B,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};L?await l(L):await F.withPropagatedContext(e.headers,()=>F.trace(c.BaseServerSpan.handleRequest,{spanName:`${$} ${f}`,kind:a.SpanKind.SERVER,attributes:{"http.method":$,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await w.onRequestError(e,t,{routerKind:"App Router",routePath:M,routeType:"route",revalidateReason:(0,v.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:A})}),I)throw t;return await (0,p.sendResponse)(W,B,new Response(null,{status:500})),null}}e.s(["handler",()=>A,"patchFetch",()=>T,"routeModule",()=>w,"serverHooks",()=>C,"workAsyncStorage",()=>O,"workUnitAsyncStorage",()=>b],333621)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__6637e6d7._.js.map