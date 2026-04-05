module.exports=[270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},120635,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/action-async-storage.external.js",()=>require("next/dist/server/app-render/action-async-storage.external.js"))},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},666680,(e,t,r)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},802935,e=>{"use strict";let t={USER:"USER",ADMIN:"ADMIN"},r=[t.USER,t.ADMIN];function a(e){return function(e){if(null==e||""===e)return null;let t=String(e).trim().toUpperCase();return r.includes(t)?t:null}(e)===t.ADMIN}function n(e){return r.includes(e)}e.s(["ROLES",0,t,"isAdmin",()=>a,"isValidRole",()=>n])},689960,e=>{"use strict";var t=e.i(666680);let r={randomUUID:t.randomUUID},a=new Uint8Array(256),n=a.length,s=[];for(let e=0;e<256;++e)s.push((e+256).toString(16).slice(1));e.s(["v4",0,function(e,o,i){if(r.randomUUID&&!o&&!e)return r.randomUUID();var d=e,u=i;let l=(d=d||{}).random??d.rng?.()??(n>a.length-16&&((0,t.randomFillSync)(a),n=0),a.slice(n,n+=16));if(l.length<16)throw Error("Random bytes length must be >= 16");if(l[6]=15&l[6]|64,l[8]=63&l[8]|128,o){if((u=u||0)<0||u+16>o.length)throw RangeError(`UUID byte range ${u}:${u+15} is out of buffer bounds`);for(let e=0;e<16;++e)o[u+e]=l[e];return o}return function(e,t=0){return(s[e[t+0]]+s[e[t+1]]+s[e[t+2]]+s[e[t+3]]+"-"+s[e[t+4]]+s[e[t+5]]+"-"+s[e[t+6]]+s[e[t+7]]+"-"+s[e[t+8]]+s[e[t+9]]+"-"+s[e[t+10]]+s[e[t+11]]+s[e[t+12]]+s[e[t+13]]+s[e[t+14]]+s[e[t+15]]).toLowerCase()}(l)}],689960)},160626,e=>{"use strict";var t=e.i(747909),r=e.i(174017),a=e.i(996250),n=e.i(759756),s=e.i(561916),o=e.i(114444),i=e.i(837092),d=e.i(869741),u=e.i(316795),l=e.i(487718),p=e.i(995169),c=e.i(47587),m=e.i(666012),E=e.i(570101),h=e.i(626937),R=e.i(10372),C=e.i(193695);e.i(52474);var S=e.i(600220),x=e.i(89171),f=e.i(745015),A=e.i(843793),g=e.i(67669);async function v(e){let t=e?.recentLimit??5,r=e?.beneficiaryLimit??4,a=await (0,g.getCurrentUser)();if(!a)return{totals:{totalDeposits:0,totalSpend:0,airtimeSpend:0,dataSpend:0,successfulCount:0,totalCount:0},recentTransactions:[],beneficiaries:[],processingPurchases:[]};let[n,s,o,i]=await Promise.all([A.sql`
      SELECT
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type = 'deposit'
        ), 0) AS "totalDeposits",
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type IN ('airtime', 'data')
        ), 0) AS "totalSpend",
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type = 'airtime'
        ), 0) AS "airtimeSpend",
        COALESCE(SUM(amount) FILTER (
          WHERE status = 'success'
            AND type = 'data'
        ), 0) AS "dataSpend",
        COALESCE(COUNT(*) FILTER (WHERE status = 'success'), 0) AS "successfulCount",
        COALESCE(COUNT(*), 0) AS "totalCount"
      FROM transactions
      WHERE user_id = ${a.id}
    `,A.sql`
      SELECT
        id,
        type,
        amount,
        status,
        metadata,
        created_at
      FROM transactions
      WHERE user_id = ${a.id}
      ORDER BY created_at DESC
      LIMIT ${t}
    `,A.sql`
      SELECT
        id,
        type,
        amount,
        status,
        metadata,
        created_at
      FROM transactions
      WHERE user_id = ${a.id}
        AND type IN ('airtime', 'data', 'AIRTIME', 'DATA')
        AND status IN ('pending', 'PENDING', 'processing', 'PROCESSING')
      ORDER BY created_at DESC
      LIMIT 10
    `,A.sql`
      SELECT DISTINCT ON (
        COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        )
      )
        COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        ) AS phone_number,
        COALESCE(
          metadata->>'network',
          metadata->>'network_name',
          metadata->>'provider'
        ) AS network,
        created_at AS created_at
      FROM transactions
      WHERE user_id = ${a.id}
        AND status IN ('success', 'SUCCESS')
        AND type IN ('airtime', 'data', 'AIRTIME', 'DATA')
        AND COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        ) IS NOT NULL
      ORDER BY
        COALESCE(
          metadata->>'phoneNumber',
          metadata->>'phone_number'
        ),
        created_at DESC
      LIMIT ${r}
    `]),d=n?.[0]??{},u=e=>({id:e.id,type:String(e.type||"").toLowerCase(),amount:Number(e.amount??0),status:String(e.status||"").toLowerCase(),description:e.metadata?.description||e.metadata?.memo||null,network:e.metadata?.network||e.metadata?.network_name||e.metadata?.provider||null,phone_number:e.metadata?.phoneNumber||e.metadata?.phone_number||null,created_at:e.created_at}),l=s.map(u),p=o.map(u),c=i.map(e=>({phone_number:e.phone_number,network:e.network,created_at:e.created_at}));return{totals:{totalDeposits:Number(d.totalDeposits??0),totalSpend:Number(d.totalSpend??0),airtimeSpend:Number(d.airtimeSpend??0),dataSpend:Number(d.dataSpend??0),successfulCount:Number(d.successfulCount??0),totalCount:Number(d.totalCount??0)},recentTransactions:l,beneficiaries:c,processingPurchases:p}}async function b(){try{let e=await v({recentLimit:5,beneficiaryLimit:4});return x.NextResponse.json({success:!0,data:e},{headers:{"Cache-Control":"no-store, max-age=0"}})}catch(e){return console.error("Dashboard API error:",e),x.NextResponse.json({success:!1,error:"Failed to load dashboard data"},{status:500,headers:{"Cache-Control":"no-store, max-age=0"}})}}(0,e.i(195975).ensureServerEntryExports)([v]),(0,f.registerServerReference)(v,"400290102503b97ca10fd779917223a5dd87abafa3",null),e.s(["GET",()=>b,"dynamic",0,"force-dynamic","revalidate",0,0,"runtime",0,"nodejs"],532933);var N=e.i(532933);let y=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/dashboard/route",pathname:"/api/dashboard",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/dashboard/route.ts",nextConfigOutput:"standalone",userland:N}),{workAsyncStorage:w,workUnitAsyncStorage:I,serverHooks:T}=y;function D(){return(0,a.patchFetch)({workAsyncStorage:w,workUnitAsyncStorage:I})}async function _(e,t,a){y.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/dashboard/route";x=x.replace(/\/index$/,"")||"/";let f=await y.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!f)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:A,params:g,nextConfig:v,parsedUrl:b,isDraftMode:N,prerenderManifest:w,routerServerContext:I,isOnDemandRevalidate:T,revalidateOnlyGenerated:D,resolvedPathname:_,clientReferenceManifest:O,serverActionsManifest:U}=f,L=(0,d.normalizeAppPath)(x),M=!!(w.dynamicRoutes[L]||w.routes[_]),k=async()=>((null==I?void 0:I.render404)?await I.render404(e,t,b,!1):t.end("This page could not be found"),null);if(M&&!N){let e=!!w.routes[_],t=w.dynamicRoutes[L];if(t&&!1===t.fallback&&!e){if(v.experimental.adapterPath)return await k();throw new C.NoFallbackError}}let P=null;!M||y.isDev||N||(P="/index"===(P=_)?"/":P);let q=!0===y.isDev||!M,H=M&&!q;U&&O&&(0,o.setReferenceManifestsSingleton)({page:x,clientReferenceManifest:O,serverActionsManifest:U,serverModuleMap:(0,i.createServerModuleMap)({serverActionsManifest:U})});let j=e.method||"GET",F=(0,s.getTracer)(),$=F.getActiveScopeSpan(),W={params:g,prerenderManifest:w,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:q,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:v.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a)=>y.onRequestError(e,t,a,I)},sharedContext:{buildId:A}},B=new u.NodeNextRequest(e),K=new u.NodeNextResponse(t),G=l.NextRequestAdapter.fromNodeNextRequest(B,(0,l.signalFromNodeResponse)(t));try{let o=async e=>y.handle(G,W).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=F.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${j} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${j} ${x}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),d=async n=>{var s,d;let u=async({previousCacheEntry:r})=>{try{if(!i&&T&&D&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=W.renderOpts.fetchMetrics;let d=W.renderOpts.pendingWaitUntil;d&&a.waitUntil&&(a.waitUntil(d),d=void 0);let u=W.renderOpts.collectedTags;if(!M)return await (0,m.sendResponse)(B,K,s,W.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,E.toNodeOutgoingHttpHeaders)(s.headers);u&&(t[R.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==W.renderOpts.collectedRevalidate&&!(W.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&W.renderOpts.collectedRevalidate,a=void 0===W.renderOpts.collectedExpire||W.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:W.renderOpts.collectedExpire;return{value:{kind:S.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await y.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:T})},I),t}},l=await y.handleResponse({req:e,nextConfig:v,cacheKey:P,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:w,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:D,responseGenerator:u,waitUntil:a.waitUntil,isMinimalMode:i});if(!M)return null;if((null==l||null==(s=l.value)?void 0:s.kind)!==S.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(d=l.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",T?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let p=(0,E.fromNodeOutgoingHttpHeaders)(l.value.headers);return i&&M||p.delete(R.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||t.getHeader("Cache-Control")||p.get("Cache-Control")||p.set("Cache-Control",(0,h.getCacheControlHeader)(l.cacheControl)),await (0,m.sendResponse)(B,K,new Response(l.value.body,{headers:p,status:l.value.status||200})),null};$?await d($):await F.withPropagatedContext(e.headers,()=>F.trace(p.BaseServerSpan.handleRequest,{spanName:`${j} ${x}`,kind:s.SpanKind.SERVER,attributes:{"http.method":j,"http.target":e.url}},d))}catch(t){if(t instanceof C.NoFallbackError||await y.onRequestError(e,t,{routerKind:"App Router",routePath:L,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:T})}),M)throw t;return await (0,m.sendResponse)(B,K,new Response(null,{status:500})),null}}e.s(["handler",()=>_,"patchFetch",()=>D,"routeModule",()=>y,"serverHooks",()=>T,"workAsyncStorage",()=>w,"workUnitAsyncStorage",()=>I],160626)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__96951b21._.js.map