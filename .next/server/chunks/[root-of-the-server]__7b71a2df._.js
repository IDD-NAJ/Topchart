module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},575172,e=>{"use strict";var t=e.i(747909),r=e.i(174017),s=e.i(996250),a=e.i(759756),n=e.i(561916),i=e.i(114444),o=e.i(837092),l=e.i(869741),u=e.i(316795),d=e.i(487718),c=e.i(995169),p=e.i(47587),h=e.i(666012),x=e.i(570101),R=e.i(626937),E=e.i(10372),m=e.i(193695);e.i(52474);var v=e.i(600220),_=e.i(89171),f=e.i(493458),g=e.i(843793);async function w(e){try{let{searchParams:t}=new URL(e.url),r=t.get("examType"),s=await (0,f.cookies)(),a=s.get("session_token")?.value;if(a){let e=await g.sql`
        SELECT u.id, u.role FROM auth_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${a} AND s.expires_at > NOW()
        LIMIT 1
      `;if(e.length>0){let t=e[0];t.id,t.role}}let n=`
      SELECT 
        id,
        exam_type,
        selling_price,
        wholesale_price,
        status,
        expiry_date
      FROM result_checker_cards
      WHERE status = 'available'
    `;r&&(n+=` AND exam_type = '${r}'`),n+=" ORDER BY exam_type, selling_price";let i=await (0,g.sqlUnsafe)(n);return _.NextResponse.json({success:!0,cards:i.map(e=>({id:e.id,examType:e.exam_type,price:e.selling_price,wholesalePrice:e.wholesale_price,status:e.status}))})}catch(e){return console.error("Result checkers GET error:",e),_.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}async function y(e){try{let t=await (0,f.cookies)(),r=t.get("session_token")?.value;if(!r)return _.NextResponse.json({success:!1,error:"Unauthorized"},{status:401});let s=await g.sql`
      SELECT u.id, u.role FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${r} AND s.expires_at > NOW()
      LIMIT 1
    `;if(!s.length)return _.NextResponse.json({success:!1,error:"Unauthorized"},{status:401});let a=s[0],{card_id:n,payment_reference:i}=await e.json();if(!n)return _.NextResponse.json({success:!1,error:"Card ID is required"},{status:400});let o=await g.sql`
      SELECT * FROM result_checker_cards
      WHERE id = ${n}
      AND status = 'available'
    `;if(0===o.length)return _.NextResponse.json({success:!1,error:"Card not available"},{status:404});let l=o[0],u="RESELLER"===a.role?l.wholesale_price:l.selling_price;await g.sql`
      UPDATE result_checker_cards
      SET 
        status = 'sold',
        purchased_by = ${a.id},
        purchased_at = NOW()
      WHERE id = ${n}
    `;let d=await g.sql`
      INSERT INTO result_checker_purchases (
        user_id,
        card_id,
        exam_type,
        amount_paid,
        payment_reference,
        status
      ) VALUES (
        ${a.id},
        ${n},
        ${l.exam_type},
        ${u},
        ${i||null},
        'completed'
      )
      RETURNING *
    `;return _.NextResponse.json({success:!0,message:"Purchase successful",purchase:d[0],card:{id:l.id,examType:l.exam_type,pin:l.card_pin,serialNumber:l.serial_number}})}catch(e){return console.error("Result checker purchase error:",e),_.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}e.s(["GET",()=>w,"POST",()=>y,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],188154);var N=e.i(188154);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/result-checkers/route",pathname:"/api/result-checkers",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/result-checkers/route.ts",nextConfigOutput:"",userland:N}),{workAsyncStorage:T,workUnitAsyncStorage:k,serverHooks:A}=C;function O(){return(0,s.patchFetch)({workAsyncStorage:T,workUnitAsyncStorage:k})}async function b(e,t,s){C.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/result-checkers/route";_=_.replace(/\/index$/,"")||"/";let f=await C.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!f)return t.statusCode=400,t.end("Bad Request"),null==s.waitUntil||s.waitUntil.call(s,Promise.resolve()),null;let{buildId:g,params:w,nextConfig:y,parsedUrl:N,isDraftMode:T,prerenderManifest:k,routerServerContext:A,isOnDemandRevalidate:O,revalidateOnlyGenerated:b,resolvedPathname:S,clientReferenceManifest:j,serverActionsManifest:q}=f,I=(0,l.normalizeAppPath)(_),P=!!(k.dynamicRoutes[I]||k.routes[S]),U=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,N,!1):t.end("This page could not be found"),null);if(P&&!T){let e=!!k.routes[S],t=k.dynamicRoutes[I];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await U();throw new m.NoFallbackError}}let H=null;!P||C.isDev||T||(H="/index"===(H=S)?"/":H);let M=!0===C.isDev||!P,D=P&&!M;q&&j&&(0,i.setReferenceManifestsSingleton)({page:_,clientReferenceManifest:j,serverActionsManifest:q,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:q})});let $=e.method||"GET",L=(0,n.getTracer)(),F=L.getActiveScopeSpan(),W={params:w,prerenderManifest:k,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:s.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,s)=>C.onRequestError(e,t,s,A)},sharedContext:{buildId:g}},K=new u.NodeNextRequest(e),B=new u.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i=async e=>C.handle(G,W).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=L.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=r.get("next.route");if(s){let t=`${$} ${s}`;e.setAttributes({"next.route":s,"http.route":s,"next.span_name":t}),e.updateName(t)}else e.updateName(`${$} ${_}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var n,l;let u=async({previousCacheEntry:r})=>{try{if(!o&&O&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(a);e.fetchMetrics=W.renderOpts.fetchMetrics;let l=W.renderOpts.pendingWaitUntil;l&&s.waitUntil&&(s.waitUntil(l),l=void 0);let u=W.renderOpts.collectedTags;if(!P)return await (0,h.sendResponse)(K,B,n,W.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(n.headers);u&&(t[E.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==W.renderOpts.collectedRevalidate&&!(W.renderOpts.collectedRevalidate>=E.INFINITE_CACHE)&&W.renderOpts.collectedRevalidate,s=void 0===W.renderOpts.collectedExpire||W.renderOpts.collectedExpire>=E.INFINITE_CACHE?void 0:W.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:s}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:O})},A),t}},d=await C.handleResponse({req:e,nextConfig:y,cacheKey:H,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:k,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:b,responseGenerator:u,waitUntil:s.waitUntil,isMinimalMode:o});if(!P)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",O?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),T&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,x.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&P||c.delete(E.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,R.getCacheControlHeader)(d.cacheControl)),await (0,h.sendResponse)(K,B,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};F?await l(F):await L.withPropagatedContext(e.headers,()=>L.trace(c.BaseServerSpan.handleRequest,{spanName:`${$} ${_}`,kind:n.SpanKind.SERVER,attributes:{"http.method":$,"http.target":e.url}},l))}catch(t){if(t instanceof m.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:O})}),P)throw t;return await (0,h.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>b,"patchFetch",()=>O,"routeModule",()=>C,"serverHooks",()=>A,"workAsyncStorage",()=>T,"workUnitAsyncStorage",()=>k],575172)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__7b71a2df._.js.map