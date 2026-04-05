module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},802935,e=>{"use strict";let t={USER:"USER",ADMIN:"ADMIN",RESELLER:"RESELLER"},r=[t.USER,t.ADMIN,t.RESELLER];function s(e){return function(e){if(null==e||""===e)return null;let t=String(e).trim().toUpperCase();return r.includes(t)?t:null}(e)===t.ADMIN}function a(e){return r.includes(e)}e.s(["ROLES",0,t,"isAdmin",()=>s,"isValidRole",()=>a])},767417,e=>{"use strict";var t=e.i(493458),r=e.i(843793),s=e.i(802935);async function a(){try{let e=await (0,t.cookies)(),a=e.get("session_token")?.value;if(!a)return{ok:!1,status:401,error:"Unauthorized"};let i=[];try{i=await r.sql`
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
      `}catch(e){console.error("Auth sessions query failed:",e),i=[]}if(0===i.length)return{ok:!1,status:401,error:"Session expired"};let n=i[0];if(!(0,s.isAdmin)(n.role))return console.warn("[SECURITY] Unauthorized admin access attempt",{userId:n.user_id,email:n.email,role:n.role,timestamp:new Date().toISOString()}),{ok:!1,status:403,error:"Access denied"};return{ok:!0,userId:n.user_id,email:n.email,firstName:n.first_name,lastName:n.last_name}}catch(e){return console.error("Admin auth error:",e),{ok:!1,status:401,error:"Internal server error"}}}e.s(["requireAdmin",()=>a])},171171,e=>{"use strict";var t=e.i(747909),r=e.i(174017),s=e.i(996250),a=e.i(759756),i=e.i(561916),n=e.i(114444),o=e.i(837092),l=e.i(869741),d=e.i(316795),u=e.i(487718),E=e.i(995169),p=e.i(47587),c=e.i(666012),A=e.i(570101),_=e.i(626937),R=e.i(10372),T=e.i(193695);e.i(52474);var m=e.i(600220),I=e.i(89171),f=e.i(843793),N=e.i(767417);async function C(e){try{let e=await (0,N.requireAdmin)();if(!e.ok)return I.NextResponse.json({success:!1,error:e.error},{status:e.status});let t=[];return await f.sql`
      CREATE TABLE IF NOT EXISTS reseller_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        business_phone VARCHAR(20),
        business_email VARCHAR(255),
        business_type VARCHAR(50),
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        id_document_url TEXT,
        custom_fields JSONB DEFAULT '{}'::jsonb,
        application_status VARCHAR(20) DEFAULT 'pending',
        application_fee DECIMAL(10, 2) DEFAULT 100.00,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_reference VARCHAR(100),
        transaction_id UUID,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `,t.push("reseller_applications table ensured"),await f.sql`ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb`,await f.sql`ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS transaction_id UUID`,t.push("reseller_applications columns patched"),await f.sql`
      CREATE TABLE IF NOT EXISTS reseller_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        business_phone VARCHAR(20),
        reseller_code VARCHAR(20) UNIQUE,
        commission_rate DECIMAL(5, 2) DEFAULT 5.00,
        discount_rate DECIMAL(5, 2) DEFAULT 10.00,
        wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
        total_sales DECIMAL(12, 2) DEFAULT 0.00,
        total_commission_earned DECIMAL(12, 2) DEFAULT 0.00,
        total_referrals INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `,t.push("reseller_profiles table ensured"),await f.sql`
      CREATE TABLE IF NOT EXISTS reseller_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        customer_phone VARCHAR(20),
        product_type VARCHAR(50),
        network VARCHAR(50),
        bundle_id UUID,
        amount DECIMAL(10, 2),
        cost_price DECIMAL(10, 2),
        selling_price DECIMAL(10, 2),
        profit DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'pending',
        reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `,t.push("reseller_sales table ensured"),await f.sql`
      CREATE TABLE IF NOT EXISTS reseller_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        referred_user_id UUID REFERENCES users(id),
        transaction_id UUID,
        transaction_amount DECIMAL(10, 2),
        commission_amount DECIMAL(10, 2),
        commission_rate DECIMAL(5, 2),
        status VARCHAR(20) DEFAULT 'pending',
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `,t.push("reseller_commissions table ensured"),await f.sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID REFERENCES users(id)
      )
    `,t.push("system_config table ensured"),await f.sql`
      CREATE TABLE IF NOT EXISTS custom_form_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_name VARCHAR(100) NOT NULL,
        field_label VARCHAR(200) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        field_options JSONB,
        is_required BOOLEAN DEFAULT false,
        is_enabled BOOLEAN DEFAULT true,
        placeholder TEXT,
        help_text TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,t.push("custom_form_fields table ensured"),await f.sql`
      INSERT INTO system_config (config_key, config_value, description) VALUES
      ('reseller_form_config', '{"business_name":{"enabled":true,"required":true},"business_address":{"enabled":true,"required":false},"business_phone":{"enabled":true,"required":false},"business_email":{"enabled":true,"required":false},"business_type":{"enabled":true,"required":false},"application_fee":100.00,"currency":"GHS","require_payment_before_approval":true}'::jsonb, 'Reseller application form configuration'),
      ('reseller_form_custom_fields', '[]'::jsonb, 'Custom fields for reseller application form')
      ON CONFLICT (config_key) DO NOTHING
    `,t.push("system_config default rows seeded"),await f.sql`CREATE INDEX IF NOT EXISTS idx_reseller_applications_user ON reseller_applications(user_id)`,await f.sql`CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON reseller_applications(application_status)`,await f.sql`CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user ON reseller_profiles(user_id)`,await f.sql`CREATE INDEX IF NOT EXISTS idx_reseller_profiles_code ON reseller_profiles(reseller_code)`,await f.sql`CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key)`,t.push("indexes created"),I.NextResponse.json({success:!0,steps:t})}catch(t){console.error("Migration error:",t);let e=t instanceof Error?t.message:"Migration failed";return I.NextResponse.json({success:!1,error:e},{status:500})}}e.s(["POST",()=>C,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],493185);var U=e.i(493185);let D=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/migrate/route",pathname:"/api/admin/migrate",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/admin/migrate/route.ts",nextConfigOutput:"",userland:U}),{workAsyncStorage:L,workUnitAsyncStorage:S,serverHooks:h}=D;function O(){return(0,s.patchFetch)({workAsyncStorage:L,workUnitAsyncStorage:S})}async function g(e,t,s){D.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let I="/api/admin/migrate/route";I=I.replace(/\/index$/,"")||"/";let f=await D.prepare(e,t,{srcPage:I,multiZoneDraftMode:!1});if(!f)return t.statusCode=400,t.end("Bad Request"),null==s.waitUntil||s.waitUntil.call(s,Promise.resolve()),null;let{buildId:N,params:C,nextConfig:U,parsedUrl:L,isDraftMode:S,prerenderManifest:h,routerServerContext:O,isOnDemandRevalidate:g,revalidateOnlyGenerated:x,resolvedPathname:M,clientReferenceManifest:v,serverActionsManifest:w}=f,y=(0,l.normalizeAppPath)(I),b=!!(h.dynamicRoutes[y]||h.routes[M]),F=async()=>((null==O?void 0:O.render404)?await O.render404(e,t,L,!1):t.end("This page could not be found"),null);if(b&&!S){let e=!!h.routes[M],t=h.dynamicRoutes[y];if(t&&!1===t.fallback&&!e){if(U.experimental.adapterPath)return await F();throw new T.NoFallbackError}}let H=null;!b||D.isDev||S||(H="/index"===(H=M)?"/":H);let q=!0===D.isDev||!b,P=b&&!q;w&&v&&(0,n.setReferenceManifestsSingleton)({page:I,clientReferenceManifest:v,serverActionsManifest:w,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:w})});let k=e.method||"GET",V=(0,i.getTracer)(),X=V.getActiveScopeSpan(),j={params:C,prerenderManifest:h,renderOpts:{experimental:{authInterrupts:!!U.experimental.authInterrupts},cacheComponents:!!U.cacheComponents,supportsDynamicResponse:q,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:U.cacheLife,waitUntil:s.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,s)=>D.onRequestError(e,t,s,O)},sharedContext:{buildId:N}},B=new d.NodeNextRequest(e),W=new d.NodeNextResponse(t),K=u.NextRequestAdapter.fromNodeNextRequest(B,(0,u.signalFromNodeResponse)(t));try{let n=async e=>D.handle(K,j).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=V.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==E.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=r.get("next.route");if(s){let t=`${k} ${s}`;e.setAttributes({"next.route":s,"http.route":s,"next.span_name":t}),e.updateName(t)}else e.updateName(`${k} ${I}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&g&&x&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await n(a);e.fetchMetrics=j.renderOpts.fetchMetrics;let l=j.renderOpts.pendingWaitUntil;l&&s.waitUntil&&(s.waitUntil(l),l=void 0);let d=j.renderOpts.collectedTags;if(!b)return await (0,c.sendResponse)(B,W,i,j.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,A.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[R.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==j.renderOpts.collectedRevalidate&&!(j.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&j.renderOpts.collectedRevalidate,s=void 0===j.renderOpts.collectedExpire||j.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:j.renderOpts.collectedExpire;return{value:{kind:m.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:s}}}}catch(t){throw(null==r?void 0:r.isStale)&&await D.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:g})},O),t}},u=await D.handleResponse({req:e,nextConfig:U,cacheKey:H,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:h,isRoutePPREnabled:!1,isOnDemandRevalidate:g,revalidateOnlyGenerated:x,responseGenerator:d,waitUntil:s.waitUntil,isMinimalMode:o});if(!b)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==m.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",g?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),S&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let E=(0,A.fromNodeOutgoingHttpHeaders)(u.value.headers);return o&&b||E.delete(R.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||E.get("Cache-Control")||E.set("Cache-Control",(0,_.getCacheControlHeader)(u.cacheControl)),await (0,c.sendResponse)(B,W,new Response(u.value.body,{headers:E,status:u.value.status||200})),null};X?await l(X):await V.withPropagatedContext(e.headers,()=>V.trace(E.BaseServerSpan.handleRequest,{spanName:`${k} ${I}`,kind:i.SpanKind.SERVER,attributes:{"http.method":k,"http.target":e.url}},l))}catch(t){if(t instanceof T.NoFallbackError||await D.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:g})}),b)throw t;return await (0,c.sendResponse)(B,W,new Response(null,{status:500})),null}}e.s(["handler",()=>g,"patchFetch",()=>O,"routeModule",()=>D,"serverHooks",()=>h,"workAsyncStorage",()=>L,"workUnitAsyncStorage",()=>S],171171)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__bf5fb0b4._.js.map