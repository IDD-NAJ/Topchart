module.exports=[591119,a=>{"use strict";var b=a.i(187924),c=a.i(368114);function d({className:a,...d}){return(0,b.jsx)("div",{"data-slot":"card",className:(0,c.cn)("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",a),...d})}function e({className:a,...d}){return(0,b.jsx)("div",{"data-slot":"card-header",className:(0,c.cn)("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",a),...d})}function f({className:a,...d}){return(0,b.jsx)("div",{"data-slot":"card-title",className:(0,c.cn)("leading-none font-semibold",a),...d})}function g({className:a,...d}){return(0,b.jsx)("div",{"data-slot":"card-description",className:(0,c.cn)("text-muted-foreground text-sm",a),...d})}function h({className:a,...d}){return(0,b.jsx)("div",{"data-slot":"card-content",className:(0,c.cn)("px-6",a),...d})}function i({className:a,...d}){return(0,b.jsx)("div",{"data-slot":"card-footer",className:(0,c.cn)("flex items-center px-6 [.border-t]:pt-6",a),...d})}a.s(["Card",()=>d,"CardContent",()=>h,"CardDescription",()=>g,"CardFooter",()=>i,"CardHeader",()=>e,"CardTitle",()=>f])},562213,a=>{"use strict";let b=(0,a.i(170106).default)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);a.s(["default",()=>b])},30553,a=>{"use strict";var b=a.i(572131),c=a.i(935112),d=a.i(811011),e=a.i(187924),f=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"].reduce((a,c)=>{let f=b.forwardRef((a,b)=>{let{asChild:f,...g}=a,h=f?d.Slot:c;return(0,e.jsx)(h,{...g,ref:b})});return f.displayName=`Primitive.${c}`,{...a,[c]:f}},{});function g(a,b){a&&c.flushSync(()=>a.dispatchEvent(b))}a.s(["Primitive",()=>f,"dispatchDiscreteCustomEvent",()=>g])},507554,a=>{"use strict";function b(a,c,{checkForDefaultPrevented:d=!0}={}){return function(b){if(a?.(b),!1===d||!b.defaultPrevented)return c?.(b)}}a.s(["composeEventHandlers",()=>b])},750104,a=>{"use strict";var b=a.i(572131),c=a.i(187924);function d(a,d){let e=b.createContext(d),f=a=>{let{children:d,...f}=a,g=b.useMemo(()=>f,Object.values(f));return(0,c.jsx)(e.Provider,{value:g,children:d})};return f.displayName=a+"Provider",[f,function(c){let f=b.useContext(e);if(f)return f;if(void 0!==d)return d;throw Error(`\`${c}\` must be used within \`${a}\``)}]}function e(a,d=[]){let f=[],g=()=>{let c=f.map(a=>b.createContext(a));return function(d){let e=d?.[a]||c;return b.useMemo(()=>({[`__scope${a}`]:{...d,[a]:e}}),[d,e])}};return g.scopeName=a,[function(d,e){let g=b.createContext(e),h=f.length;f=[...f,e];let i=d=>{let{scope:e,children:f,...i}=d,j=e?.[a]?.[h]||g,k=b.useMemo(()=>i,Object.values(i));return(0,c.jsx)(j.Provider,{value:k,children:f})};return i.displayName=d+"Provider",[i,function(c,f){let i=f?.[a]?.[h]||g,j=b.useContext(i);if(j)return j;if(void 0!==e)return e;throw Error(`\`${c}\` must be used within \`${d}\``)}]},function(...a){let c=a[0];if(1===a.length)return c;let d=()=>{let d=a.map(a=>({useScope:a(),scopeName:a.scopeName}));return function(a){let e=d.reduce((b,{useScope:c,scopeName:d})=>{let e=c(a)[`__scope${d}`];return{...b,...e}},{});return b.useMemo(()=>({[`__scope${c.scopeName}`]:e}),[e])}};return d.scopeName=c.scopeName,d}(g,...d)]}a.s(["createContext",()=>d,"createContextScope",()=>e])},872752,a=>{"use strict";var b=a.i(572131),c=globalThis?.document?b.useLayoutEffect:()=>{};a.s(["useLayoutEffect",()=>c])},225152,746872,a=>{"use strict";var b=a.i(572131);function c(a){let c=b.useRef(a);return b.useEffect(()=>{c.current=a}),b.useMemo(()=>(...a)=>c.current?.(...a),[])}function d({prop:a,defaultProp:d,onChange:e=()=>{}}){let[f,g]=function({defaultProp:a,onChange:d}){let e=b.useState(a),[f]=e,g=b.useRef(f),h=c(d);return b.useEffect(()=>{g.current!==f&&(h(f),g.current=f)},[f,g,h]),e}({defaultProp:d,onChange:e}),h=void 0!==a,i=h?a:f,j=c(e);return[i,b.useCallback(b=>{if(h){let c="function"==typeof b?b(a):b;c!==a&&j(c)}else g(b)},[h,a,g,j])]}a.s(["useCallbackRef",()=>c],746872),a.s(["useControllableState",()=>d],225152)},777192,a=>{"use strict";var b=a.i(572131),c=a.i(470121),d=a.i(872752),e=a=>{var e;let g,h,{present:i,children:j}=a,k=function(a){var c,e;let[g,h]=b.useState(),i=b.useRef({}),j=b.useRef(a),k=b.useRef("none"),[l,m]=(c=a?"mounted":"unmounted",e={mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}},b.useReducer((a,b)=>e[a][b]??a,c));return b.useEffect(()=>{let a=f(i.current);k.current="mounted"===l?a:"none"},[l]),(0,d.useLayoutEffect)(()=>{let b=i.current,c=j.current;if(c!==a){let d=k.current,e=f(b);a?m("MOUNT"):"none"===e||b?.display==="none"?m("UNMOUNT"):c&&d!==e?m("ANIMATION_OUT"):m("UNMOUNT"),j.current=a}},[a,m]),(0,d.useLayoutEffect)(()=>{if(g){let a,b=g.ownerDocument.defaultView??window,c=c=>{let d=f(i.current).includes(c.animationName);if(c.target===g&&d&&(m("ANIMATION_END"),!j.current)){let c=g.style.animationFillMode;g.style.animationFillMode="forwards",a=b.setTimeout(()=>{"forwards"===g.style.animationFillMode&&(g.style.animationFillMode=c)})}},d=a=>{a.target===g&&(k.current=f(i.current))};return g.addEventListener("animationstart",d),g.addEventListener("animationcancel",c),g.addEventListener("animationend",c),()=>{b.clearTimeout(a),g.removeEventListener("animationstart",d),g.removeEventListener("animationcancel",c),g.removeEventListener("animationend",c)}}m("ANIMATION_END")},[g,m]),{isPresent:["mounted","unmountSuspended"].includes(l),ref:b.useCallback(a=>{a&&(i.current=getComputedStyle(a)),h(a)},[])}}(i),l="function"==typeof j?j({present:k.isPresent}):b.Children.only(j),m=(0,c.useComposedRefs)(k.ref,(e=l,(h=(g=Object.getOwnPropertyDescriptor(e.props,"ref")?.get)&&"isReactWarning"in g&&g.isReactWarning)?e.ref:(h=(g=Object.getOwnPropertyDescriptor(e,"ref")?.get)&&"isReactWarning"in g&&g.isReactWarning)?e.props.ref:e.props.ref||e.ref));return"function"==typeof j||k.isPresent?b.cloneElement(l,{ref:m}):null};function f(a){return a?.animationName||"none"}e.displayName="Presence",a.s(["Presence",()=>e])},973365,a=>{"use strict";let b=(0,a.i(170106).default)("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);a.s(["default",()=>b])},400210,a=>{"use strict";var b=a.i(973365);a.s(["ArrowLeft",()=>b.default])},667937,a=>{"use strict";let b=(0,a.i(170106).default)("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);a.s(["default",()=>b])},941675,a=>{"use strict";var b=a.i(667937);a.s(["Calendar",()=>b.default])},533579,a=>{"use strict";var b=a.i(187924),c=a.i(238246),d=a.i(50944),e=a.i(914700),f=a.i(11416),g=a.i(941675),h=a.i(546842),i=a.i(400210),j=a.i(699570),k=a.i(591119);let l=[{slug:"new-data-bundles-2026",title:"Expanding our Network: New Data Bundles for 2026",excerpt:"We are excited to announce a range of new, more affordable data bundles across all networks.",content:`
      <p>We're thrilled to announce a major expansion of our data bundle offerings across all major networks in Ghana. Starting this month, Topchart users will have access to a wider range of data packages designed to meet every need and budget.</p>
      
      <h3>What's New?</h3>
      <p>We've worked closely with MTN, Vodafone, and AirtelTigo to bring you:</p>
      <ul>
        <li>More affordable daily bundles starting from just GH₵1</li>
        <li>Flexible weekly packages for moderate users</li>
        <li>Enhanced monthly plans with bonus data</li>
        <li>Special night bundles for heavy downloaders</li>
      </ul>

      <h3>Better Value for Everyone</h3>
      <p>Whether you're a student on a budget, a professional needing constant connectivity, or a family looking for shared data plans, we've got you covered. Our new bundles offer up to 30% more data for the same price compared to previous offerings.</p>

      <h3>How to Purchase</h3>
      <p>Getting your new data bundle is as simple as:</p>
      <ol>
        <li>Log into your Topchart dashboard</li>
        <li>Navigate to "Buy Data"</li>
        <li>Select your preferred network</li>
        <li>Choose from the new bundle options</li>
        <li>Complete payment and receive instant delivery</li>
      </ol>

      <p>We're committed to making digital connectivity accessible to all Ghanaians. Stay tuned for more exciting updates!</p>
    `,date:"Jan 15, 2026",author:"Product Team",category:"Product Updates",readTime:"3 min read"},{slug:"security-best-practices",title:"Securing your Transactions: Best Practices",excerpt:"Learn how to keep your Topchart account and transactions secure with these simple tips.",content:`
      <p>In today's digital world, security is paramount. At Topchart, we employ bank-grade encryption and security measures to protect your transactions, but there are also steps you can take to enhance your account security.</p>

      <h3>Use a Strong, Unique Password</h3>
      <p>Your password is your first line of defense. Make sure it's:</p>
      <ul>
        <li>At least 8 characters long</li>
        <li>Contains uppercase and lowercase letters</li>
        <li>Includes numbers and special characters</li>
        <li>Not used on any other website or service</li>
      </ul>

      <h3>Enable Two-Factor Authentication</h3>
      <p>Whenever possible, enable 2FA on your account. This adds an extra layer of security by requiring a second form of verification beyond your password.</p>

      <h3>Be Wary of Phishing Attempts</h3>
      <p>Topchart will never ask you to provide your password via email or SMS. If you receive suspicious communications:</p>
      <ul>
        <li>Don't click on unknown links</li>
        <li>Verify the sender's email address</li>
        <li>Contact our support team directly if unsure</li>
      </ul>

      <h3>Monitor Your Account Regularly</h3>
      <p>Check your transaction history frequently. If you notice any unauthorized activity, report it immediately through our dispute system.</p>

      <h3>Keep Your Devices Secure</h3>
      <p>Ensure your phone and computer have:</p>
      <ul>
        <li>Updated operating systems</li>
        <li>Reliable antivirus software</li>
        <li>Screen locks with PINs or biometrics</li>
      </ul>

      <p>Remember, security is a shared responsibility. Together, we can keep your digital transactions safe and secure.</p>
    `,date:"Jan 10, 2026",author:"Security Team",category:"Security",readTime:"4 min read"},{slug:"500k-users-milestone",title:"Topchart Reaches 500,000 Users in Ghana",excerpt:"A major milestone in our journey to build the ultimate digital infrastructure for Ghana.",content:`
      <p>Today marks a monumental milestone for our team and community: Topchart now serves over 500,000 registered users across Ghana! This achievement represents more than just a number—it's a testament to the trust you've placed in us to handle your digital transactions.</p>

      <h3>Our Journey So Far</h3>
      <p>Since our launch, we've:</p>
      <ul>
        <li>Processed over 2 million transactions</li>
        <li>Maintained 99.9% uptime</li>
        <li>Expanded from 3 to 10 team members</li>
        <li>Partnered with all major Ghanaian networks</li>
        <li>Launched our dispute resolution system</li>
      </ul>

      <h3>What Our Users Say</h3>
      <p>We're humbled by the feedback from our community. Users consistently praise our:</p>
      <ul>
        <li>Lightning-fast delivery (average 5 seconds)</li>
        <li>Reliable service even during peak hours</li>
        <li>Responsive customer support team</li>
        <li>Easy-to-use interface</li>
      </ul>

      <h3>Looking Ahead</h3>
      <p>This milestone fuels our ambition to do more. Our roadmap for 2026 includes:</p>
      <ul>
        <li>Launching utility bill payments</li>
        <li>Introducing international airtime top-ups</li>
        <li>Developing a mobile app for iOS and Android</li>
        <li>Expanding to additional African markets</li>
      </ul>

      <h3>Thank You</h3>
      <p>To every user who has chosen Topchart for their digital needs: thank you. Your trust drives us to build better infrastructure every day. Here's to the next 500,000!</p>
    `,date:"Jan 5, 2026",author:"Press Office",category:"Company News",readTime:"3 min read"}];function m(){let a=(0,d.useParams)().slug,m=l.find(b=>b.slug===a);return m||(0,d.notFound)(),(0,b.jsxs)("div",{className:"min-h-screen flex flex-col bg-background selection:bg-primary/10 selection:text-primary",children:[(0,b.jsx)(e.Header,{}),(0,b.jsx)("main",{className:"flex-1 pt-28 pb-12",children:(0,b.jsxs)("div",{className:"container mx-auto px-4 max-w-3xl",children:[(0,b.jsxs)(c.default,{href:"/blog",className:"inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8",children:[(0,b.jsx)(i.ArrowLeft,{className:"h-4 w-4"}),"Back to Blog"]}),(0,b.jsxs)("div",{className:"mb-8",children:[(0,b.jsxs)("div",{className:"flex items-center gap-3 mb-4",children:[(0,b.jsx)("span",{className:"px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider",children:m.category}),(0,b.jsx)("span",{className:"text-xs text-muted-foreground",children:m.readTime})]}),(0,b.jsx)("h1",{className:"text-3xl md:text-4xl font-extrabold tracking-tight mb-4",children:m.title}),(0,b.jsxs)("div",{className:"flex items-center gap-4 text-sm text-muted-foreground",children:[(0,b.jsxs)("div",{className:"flex items-center gap-2",children:[(0,b.jsx)(h.User,{className:"h-4 w-4"}),(0,b.jsx)("span",{children:m.author})]}),(0,b.jsxs)("div",{className:"flex items-center gap-2",children:[(0,b.jsx)(g.Calendar,{className:"h-4 w-4"}),(0,b.jsx)("span",{children:m.date})]})]})]}),(0,b.jsx)(k.Card,{className:"border-border/50",children:(0,b.jsx)(k.CardContent,{className:"p-8 md:p-12",children:(0,b.jsx)("div",{className:"prose prose-slate max-w-none dark:prose-invert   prose-headings:font-bold prose-headings:tracking-tight   prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4   prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4   prose-ul:my-6 prose-ul:space-y-2 prose-ul:text-muted-foreground   prose-ol:my-6 prose-ol:space-y-2 prose-ol:text-muted-foreground   prose-li:marker:text-primary",dangerouslySetInnerHTML:{__html:m.content}})})}),(0,b.jsxs)("div",{className:"mt-12 pt-8 border-t",children:[(0,b.jsx)("p",{className:"text-sm font-medium text-muted-foreground mb-4",children:"Share this article"}),(0,b.jsxs)("div",{className:"flex gap-3",children:[(0,b.jsxs)(j.Button,{variant:"outline",size:"sm",className:"gap-2",children:[(0,b.jsx)("svg",{className:"h-4 w-4",fill:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{d:"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"})}),"Twitter"]}),(0,b.jsxs)(j.Button,{variant:"outline",size:"sm",className:"gap-2",children:[(0,b.jsx)("svg",{className:"h-4 w-4",fill:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{d:"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"})}),"LinkedIn"]})]})]})]})}),(0,b.jsx)(f.Footer,{})]})}a.s(["default",()=>m])}];

//# sourceMappingURL=_10bc26ce._.js.map