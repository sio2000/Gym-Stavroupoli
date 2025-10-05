import{d as o}from"./index-DXc16WYz.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=o("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=o("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function g(e){const n=e.getFullYear(),t=(e.getMonth()+1).toString().padStart(2,"0"),a=e.getDate().toString().padStart(2,"0");return`${n}-${t}-${a}`}function u(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(e))return new Date(NaN);const[n,t,a]=e.split("-").map(Number);return new Date(n,t-1,a,12,0,0,0)}function y(e,n){const t=new Date(e);return t.setDate(t.getDate()+n),t}function r(){const e=new Date;return new Date(e.getTime()+3*60*60*1e3)}function D(){const e=r(),n=e.getUTCDay(),t=n===0?-6:1-n,a=new Date(e);return a.setUTCDate(e.getUTCDate()+t),a.setUTCHours(0,0,0,0),console.log("🔥🔥🔥 getGreekMondayOfCurrentWeek called - Input day:",n,"Days to Monday:",t,"Result day:",a.getUTCDay(),"TIMESTAMP:",Date.now()),a}export{c as C,y as a,d as b,D as g,u as p,g as t};
