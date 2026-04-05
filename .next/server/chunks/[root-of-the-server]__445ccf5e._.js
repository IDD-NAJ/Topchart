module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},964202,e=>{"use strict";var t=e.i(747909),r=e.i(174017),a=e.i(996250),n=e.i(759756),s=e.i(561916),i=e.i(114444),o=e.i(837092),l=e.i(869741),u=e.i(316795),d=e.i(487718),c=e.i(995169),p=e.i(47587),h=e.i(666012),R=e.i(570101),x=e.i(626937),E=e.i(10372),g=e.i(193695);e.i(52474);var w=e.i(600220),f=e.i(89171),v=e.i(843793);async function m(e){try{let t,{userId:r,amount:a,phone:n,networkId:s,networkName:i,planName:o,planSize:l,planPrice:u}=await e.json();if(!r||!a||!n||!s||!o||!l)return f.NextResponse.json({success:!1,error:"Missing required fields"},{status:400});let d=await v.sql`
      SELECT wallet_balance FROM users WHERE id = ${r}
    `;if(0===d.length)return f.NextResponse.json({success:!1,error:"User not found"},{status:404});let c=Number(d[0].wallet_balance);if(u>c)return f.NextResponse.json({success:!1,error:"Insufficient wallet balance"},{status:400});let p="string"==typeof o&&o.toLowerCase().includes("airtime")?"AIRTIME":"DATA",h=`${p}_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,R=await v.sql`
      SELECT id FROM wallets WHERE "userId" = ${String(r)} LIMIT 1
    `;return R.length>0?t=R[0].id:(t=`WALLET_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`.toUpperCase(),await v.sql`
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
          ${t},
          ${String(r)},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `),await v.sql`
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
      ) VALUES (
        gen_random_uuid(),
        ${p},
        'PENDING',
        ${u},
        'GHS',
        ${t},
        ${String(r)},
        ${h},
        'WALLET',
        ${JSON.stringify({description:`${"AIRTIME"===p?"Airtime":"Data bundle"} purchase: ${o} ${l}`,networkId:s,network:i,phoneNumber:n,plan:`${o} ${l}`})}::jsonb,
        NOW(),
        NOW()
      )
    `,await v.sql`
      UPDATE users 
      SET wallet_balance = wallet_balance - ${u}
      WHERE id = ${r}
    `,f.NextResponse.json({success:!0,message:"Purchase submitted for processing",transaction:{reference:h,amount:u,planName:`${o} ${l}`,network:i}})}catch(e){return console.error("Purchase data error:",e),f.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}e.s(["POST",()=>m],903112);var A=e.i(903112);let N=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/purchases/route",pathname:"/api/purchases",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/purchases/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:y,workUnitAsyncStorage:C,serverHooks:T}=N;function b(){return(0,a.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:C})}async function S(e,t,a){N.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let f="/api/purchases/route";f=f.replace(/\/index$/,"")||"/";let v=await N.prepare(e,t,{srcPage:f,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:m,params:A,nextConfig:y,parsedUrl:C,isDraftMode:T,prerenderManifest:b,routerServerContext:S,isOnDemandRevalidate:$,revalidateOnlyGenerated:_,resolvedPathname:I,clientReferenceManifest:O,serverActionsManifest:P}=v,q=(0,l.normalizeAppPath)(f),j=!!(b.dynamicRoutes[q]||b.routes[I]),M=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,C,!1):t.end("This page could not be found"),null);if(j&&!T){let e=!!b.routes[I],t=b.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await M();throw new g.NoFallbackError}}let k=null;!j||N.isDev||T||(k="/index"===(k=I)?"/":k);let H=!0===N.isDev||!j,U=j&&!H;P&&O&&(0,i.setReferenceManifestsSingleton)({page:f,clientReferenceManifest:O,serverActionsManifest:P,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:P})});let D=e.method||"GET",L=(0,s.getTracer)(),W=L.getActiveScopeSpan(),F={params:A,prerenderManifest:b,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a)=>N.onRequestError(e,t,a,S)},sharedContext:{buildId:m}},K=new u.NodeNextRequest(e),B=new u.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i=async e=>N.handle(G,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=L.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${D} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${D} ${f}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let u=async({previousCacheEntry:r})=>{try{if(!o&&$&&_&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(n);e.fetchMetrics=F.renderOpts.fetchMetrics;let l=F.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let u=F.renderOpts.collectedTags;if(!j)return await (0,h.sendResponse)(K,B,s,F.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,R.toNodeOutgoingHttpHeaders)(s.headers);u&&(t[E.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=E.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,a=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=E.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:w.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:f,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:$})},S),t}},d=await N.handleResponse({req:e,nextConfig:y,cacheKey:k,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:b,isRoutePPREnabled:!1,isOnDemandRevalidate:$,revalidateOnlyGenerated:_,responseGenerator:u,waitUntil:a.waitUntil,isMinimalMode:o});if(!j)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==w.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",$?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),T&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,R.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&j||c.delete(E.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,x.getCacheControlHeader)(d.cacheControl)),await (0,h.sendResponse)(K,B,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};W?await l(W):await L.withPropagatedContext(e.headers,()=>L.trace(c.BaseServerSpan.handleRequest,{spanName:`${D} ${f}`,kind:s.SpanKind.SERVER,attributes:{"http.method":D,"http.target":e.url}},l))}catch(t){if(t instanceof g.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:$})}),j)throw t;return await (0,h.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>S,"patchFetch",()=>b,"routeModule",()=>N,"serverHooks",()=>T,"workAsyncStorage",()=>y,"workUnitAsyncStorage",()=>C],964202)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__445ccf5e._.js.map