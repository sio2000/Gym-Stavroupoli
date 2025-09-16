import{d as r,u as I,r as n,j as e,S as j,o as h,e as C,C as S,z as l}from"./index-DAzIvS6A.js";import{A as U}from"./award-C9sMODQM.js";import{S as M}from"./share-2-DY9goGfK.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=r("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=r("Facebook",[["path",{d:"M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",key:"1jg4f8"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=r("Gift",[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=r("Instagram",[["rect",{width:"20",height:"20",x:"2",y:"2",rx:"5",ry:"5",key:"2e1cvw"}],["path",{d:"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z",key:"9exkf1"}],["line",{x1:"17.5",x2:"17.51",y1:"6.5",y2:"6.5",key:"r4j83e"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=r("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=r("ShoppingBag",[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=r("Twitter",[["path",{d:"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",key:"pff0z6"}]]),Y=()=>{const{user:t}=I(),[g,p]=n.useState(!1),[c,b]=n.useState(0),[m,u]=n.useState(!1),[f]=n.useState({total_points:0,total_referrals:0,recent_transactions:[]}),d=f.recent_transactions||[],N=f.total_referrals||0,v=null;n.useEffect(()=>{b((t==null?void 0:t.referralPoints)||0)},[t==null?void 0:t.id,t==null?void 0:t.referralPoints]),n.useEffect(()=>{if(m){const s=setTimeout(()=>u(!1),1e3);return()=>clearTimeout(s)}},[m]);const w=async()=>{try{const s=(t==null?void 0:t.referralCode)||"";if(!s){l.error("Δεν υπάρχει κωδικός παραπομπής");return}await navigator.clipboard.writeText(s),l.success("Ο κωδικός αντιγράφηκε επιτυχώς!")}catch{l.error("Σφάλμα κατά την αντιγραφή")}},k=async()=>{const s=(t==null?void 0:t.referralCode)||"";if(!s){l.error("Δεν υπάρχει κωδικός παραπομπής");return}if(navigator.share)try{await navigator.share({title:"Get Fit - Κωδικός Παραπομπής",text:`Γίνετε μέλος στο Get Fit χρησιμοποιώντας τον κωδικό παραπομπής μου: ${s}`,url:`https://freegym.com/register?ref=${s}`})}catch(a){console.log("Error sharing:",a)}else p(!0)},o=s=>{const a=(t==null?void 0:t.referralCode)||"";if(!a){l.error("Δεν υπάρχει κωδικός παραπομπής");return}const y=`Γίνετε μέλος στο Get Fit χρησιμοποιώντας τον κωδικό παραπομπής μου: ${a}`,x=`https://freegym.com/register?ref=${a}`;let i="";switch(s){case"facebook":i=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(x)}`;break;case"instagram":i="https://www.instagram.com/";break;case"twitter":i=`https://twitter.com/intent/tweet?text=${encodeURIComponent(y)}&url=${encodeURIComponent(x)}`;break;case"whatsapp":i=`https://wa.me/?text=${encodeURIComponent(y+" "+x)}`;break}i&&(window.open(i,"_blank"),l.success(`Μοιρασμός στο ${s} επιτυχής!`))};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
    
    .animate-fadeInUp {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .animate-fadeInScale {
      animation: fadeInScale 0.4s ease-out forwards;
    }
    
    .animate-slideInLeft {
      animation: slideInLeft 0.5s ease-out forwards;
    }
    
    .animate-slideInRight {
      animation: slideInRight 0.5s ease-out forwards;
    }
    
    .animate-bounce {
      animation: bounce 1s ease-in-out;
    }
  `}),e.jsxs("div",{className:"space-y-6 px-4 sm:px-0",children:[e.jsxs("div",{className:"text-center sm:text-left animate-fadeInUp",style:{opacity:0},children:[e.jsx("h1",{className:"text-2xl sm:text-3xl font-bold text-white mb-2",children:"Σύστημα Παραπομπών"}),e.jsx("p",{className:"text-gray-300 text-sm sm:text-base",children:"Κερδίστε πιστώσεις παρακαλώντας φίλους να εγγραφούν"}),e.jsxs("div",{className:"mt-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-4 border border-green-600/30",children:[e.jsxs("div",{className:"flex items-center justify-center space-x-2 mb-2",children:[e.jsx(j,{className:"h-5 w-5 text-yellow-500"}),e.jsx("span",{className:"text-sm font-semibold text-gray-300",children:"Πόντοι Παραπομπής"})]}),e.jsx("div",{className:"text-2xl font-bold text-primary-600 mb-1",children:c}),e.jsx("p",{className:"text-xs text-gray-400",children:"Κερδίστε 10 πόντους για κάθε επιτυχή παραπομπή!"})]})]}),e.jsxs("div",{className:"bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-2xl p-6 text-white shadow-2xl animate-fadeInUp",style:{opacity:0,animationDelay:"0.1s"},children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"p-3 bg-dark-800/20 rounded-2xl backdrop-blur-sm",children:e.jsx(j,{className:"h-8 w-8 text-yellow-300"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl sm:text-2xl font-bold",children:"Στορ Πιστώσεις"}),e.jsx("p",{className:"text-purple-100 text-sm",children:"Κερδίστε 10 πιστώσεις για κάθε φίλο!"})]})]}),e.jsxs("div",{className:`text-right ${m?"animate-bounce":""}`,children:[e.jsx("div",{className:"text-3xl sm:text-4xl font-bold text-yellow-300",children:c}),e.jsx("p",{className:"text-purple-100 text-sm",children:"πιστώσεις"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"Πρόοδος προς επόμενη ανταμοιβή"}),e.jsxs("span",{children:[c,"/100"]})]}),e.jsx("div",{className:"w-full bg-dark-800/20 rounded-full h-3 overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full transition-all duration-1000 ease-out",style:{width:`${Math.min(c/100*100,100)}%`}})})]})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6",style:{opacity:0},children:[e.jsxs("div",{className:"card text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale",style:{opacity:0,animationDelay:"0.2s"},children:[e.jsx("div",{className:"p-3 bg-blue-100 rounded-lg inline-block mb-3",children:e.jsx(h,{className:"h-6 w-6 text-blue-600"})}),e.jsx("h3",{className:"text-2xl font-bold text-white mb-1",children:N}),e.jsx("p",{className:"text-gray-600 text-sm",children:"Συνολικές παραπομπές"})]}),e.jsxs("div",{className:"card text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale",style:{opacity:0,animationDelay:"0.3s"},children:[e.jsx("div",{className:"p-3 bg-green-100 rounded-lg inline-block mb-3",children:e.jsx(C,{className:"h-6 w-6 text-green-600"})}),e.jsx("h3",{className:"text-2xl font-bold text-white mb-1",children:d.filter(s=>s.status==="completed").length}),e.jsx("p",{className:"text-gray-600 text-sm",children:"Ολοκληρωμένες"})]}),e.jsxs("div",{className:"card text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale",style:{opacity:0,animationDelay:"0.4s"},children:[e.jsx("div",{className:"p-3 bg-yellow-100 rounded-lg inline-block mb-3",children:e.jsx(S,{className:"h-6 w-6 text-yellow-600"})}),e.jsx("h3",{className:"text-2xl font-bold text-white mb-1",children:d.filter(s=>s.status==="pending").length}),e.jsx("p",{className:"text-gray-600 text-sm",children:"Σε εκκρεμότητα"})]}),e.jsxs("div",{className:"card text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale",style:{opacity:0,animationDelay:"0.5s"},children:[e.jsx("div",{className:"p-3 bg-purple-100 rounded-lg inline-block mb-3",children:e.jsx(U,{className:"h-6 w-6 text-purple-600"})}),e.jsx("h3",{className:"text-2xl font-bold text-white mb-1",children:c}),e.jsx("p",{className:"text-gray-600 text-sm",children:"Συνολικές πιστώσεις"})]})]}),e.jsxs("div",{className:"card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 animate-fadeInUp",style:{opacity:0,animationDelay:"0.6s"},children:[e.jsxs("div",{className:"text-center mb-6",children:[e.jsx("h2",{className:"text-xl font-bold text-primary-900 mb-2",children:"Ο Κωδικός Παραπομπής σας"}),e.jsx("p",{className:"text-primary-700",children:"Μοιραστείτε αυτόν τον κωδικό με φίλους για να κερδίσετε πιστώσεις"})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6",children:[e.jsx("div",{className:"bg-dark-800 px-6 py-3 rounded-lg border-2 border-primary-400 shadow-lg",children:e.jsx("span",{className:"text-2xl font-bold text-primary-400 font-mono",children:(t==null?void 0:t.referralCode)||"Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα."})}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsxs("button",{onClick:w,className:"btn-secondary flex items-center hover:scale-105 active:scale-95 transition-transform duration-200",children:[e.jsx(D,{className:"h-4 w-4 mr-2"}),"Αντιγραφή"]}),e.jsxs("button",{onClick:k,className:"btn-primary flex items-center hover:scale-105 active:scale-95 transition-transform duration-200",children:[e.jsx(M,{className:"h-4 w-4 mr-2"}),"Μοιρασμός"]})]})]}),e.jsxs("div",{className:"mb-6",children:[e.jsx("h3",{className:"text-center text-primary-900 font-semibold mb-4",children:"Μοιραστείτε στα Social Media"}),e.jsxs("div",{className:"flex justify-center space-x-4",children:[e.jsx("button",{onClick:()=>o("facebook"),className:"p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all duration-200",children:e.jsx($,{className:"h-5 w-5"})}),e.jsx("button",{onClick:()=>o("instagram"),className:"p-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 hover:scale-110 active:scale-95 transition-all duration-200",children:e.jsx(z,{className:"h-5 w-5"})}),e.jsx("button",{onClick:()=>o("twitter"),className:"p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 hover:scale-110 active:scale-95 transition-all duration-200",children:e.jsx(_,{className:"h-5 w-5"})}),e.jsx("button",{onClick:()=>o("whatsapp"),className:"p-3 bg-green-600 text-white rounded-full hover:bg-green-700 hover:scale-110 active:scale-95 transition-all duration-200",children:e.jsx(A,{className:"h-5 w-5"})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-primary-800",children:[e.jsxs("div",{className:"flex items-start space-x-2 animate-slideInLeft",style:{opacity:0,animationDelay:"0.7s"},children:[e.jsx("div",{className:"w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 text-xs font-bold mt-0.5",children:"1"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"Μοιραστείτε τον κωδικό"}),e.jsx("p",{children:"Με φίλους και συγγενείς"})]})]}),e.jsxs("div",{className:"flex items-start space-x-2 animate-fadeInUp",style:{opacity:0,animationDelay:"0.8s"},children:[e.jsx("div",{className:"w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 text-xs font-bold mt-0.5",children:"2"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"Εγγραφή με κωδικό"}),e.jsx("p",{children:"Ο φίλος εγγράφεται χρησιμοποιώντας τον κωδικό"})]})]}),e.jsxs("div",{className:"flex items-start space-x-2 animate-slideInRight",style:{opacity:0,animationDelay:"0.9s"},children:[e.jsx("div",{className:"w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 text-xs font-bold mt-0.5",children:"3"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"Κερδίστε 10 πιστώσεις"}),e.jsx("p",{children:"Και οι δύο λαμβάνετε πιστώσεις"})]})]})]})]}),e.jsxs("div",{className:"card animate-fadeInUp",style:{opacity:0,animationDelay:"1.0s"},children:[e.jsxs("div",{className:"flex items-center space-x-3 mb-6",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl",children:e.jsx(L,{className:"h-6 w-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-white",children:"Κατάλογος Ανταμοιβών"}),e.jsx("p",{className:"text-gray-300",children:"Εξαργυρώστε τις πιστώσεις σας"})]})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",children:e.jsxs("div",{className:"text-center p-8 bg-dark-700 rounded-xl",children:[e.jsx(R,{className:"h-12 w-12 text-gray-400 mx-auto mb-4"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-300 mb-2",children:"Ανταμοιβές"}),e.jsx("p",{className:"text-gray-400 text-sm",children:"Σύντομα διαθέσιμες!"})]})})]}),e.jsxs("div",{className:"card animate-fadeInUp",style:{opacity:0,animationDelay:"1.8s"},children:[e.jsx("h2",{className:"text-lg font-semibold text-white mb-4",children:"Ιστορικό Παραπομπών"}),e.jsx("div",{className:"space-y-3",children:d.length>0?d.map((s,a)=>e.jsxs("div",{className:"flex items-center justify-between p-4 bg-dark-700 rounded-lg animate-slideInLeft",style:{opacity:0,animationDelay:`${1.9+a*.1}s`},children:[e.jsxs("div",{className:"flex items-center space-x-4",children:[e.jsx("div",{className:`p-2 rounded-lg ${s.status==="completed"?"bg-green-600/20":s.status==="pending"?"bg-yellow-600/20":"bg-dark-600"}`,children:e.jsx(h,{className:`h-5 w-5 ${s.status==="completed"?"text-green-400":s.status==="pending"?"text-yellow-400":"text-gray-400"}`})}),e.jsxs("div",{children:[e.jsxs("h4",{className:"font-medium text-gray-900",children:["Παραπομπή #",a+1]}),e.jsxs("p",{className:"text-sm text-gray-600",children:[new Date(s.created_at).toLocaleDateString("el-GR")," • Ολοκληρώθηκε"]})]})]}),e.jsx("div",{className:"text-right",children:e.jsx("div",{className:"flex items-center space-x-3",children:e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"text-lg font-bold text-primary-600",children:["+",s.points_awarded||10]}),e.jsx("p",{className:"text-xs text-gray-500",children:"πιστώσεις"})]})})})]},s.id)):e.jsxs("div",{className:"text-center py-8 text-gray-500 animate-fadeInUp",style:{opacity:0,animationDelay:"1.9s"},children:[e.jsx(h,{className:"h-12 w-12 text-gray-300 mx-auto mb-3"}),e.jsx("p",{children:"Δεν έχετε παραπομπές ακόμα"}),e.jsx("p",{className:"text-sm",children:"Μοιραστείτε τον κωδικό σας για να ξεκινήσετε"})]})})]}),v,e.jsxs("div",{className:"card bg-yellow-50 border-yellow-200 animate-fadeInUp",style:{opacity:0,animationDelay:"2.1s"},children:[e.jsx("h3",{className:"text-lg font-semibold text-yellow-900 mb-3",children:"Πώς λειτουργούν οι ανταμοιβές"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-yellow-800",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-start space-x-2",children:[e.jsx("div",{className:"w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5",children:"✓"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"10 πιστώσεις για κάθε επιτυχημένη παραπομπή"}),e.jsx("p",{children:"Όταν ο φίλος σας εγγραφεί και ενεργοποιήσει τη συνδρομή"})]})]}),e.jsxs("div",{className:"flex items-start space-x-2",children:[e.jsx("div",{className:"w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5",children:"✓"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"Άμεση πίστωση"}),e.jsx("p",{children:"Οι πιστώσεις προστίθενται άμεσα στο λογαριασμό σας"})]})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-start space-x-2",children:[e.jsx("div",{className:"w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5",children:"✓"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"Απεριόριστες παραπομπές"}),e.jsx("p",{children:"Δεν υπάρχει όριο στον αριθμό των παραπομπών"})]})]}),e.jsxs("div",{className:"flex items-start space-x-2",children:[e.jsx("div",{className:"w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5",children:"✓"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium",children:"Win-win για όλους"}),e.jsx("p",{children:"Και οι δύο λαμβάνετε πιστώσεις"})]})]})]})]})]}),g&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeInUp",children:e.jsx("div",{className:"bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fadeInScale",children:e.jsxs("div",{className:"text-center",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900 mb-4",children:"Μοιρασμός Κωδικού"}),e.jsxs("div",{className:"p-4 bg-gray-50 rounded-lg mb-4",children:[e.jsx("p",{className:"text-sm text-gray-600 mb-2",children:"Κωδικός παραπομπής:"}),e.jsx("p",{className:"font-mono text-lg font-bold text-primary-600",children:t==null?void 0:t.referralCode})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("button",{onClick:()=>{navigator.clipboard.writeText(`Γίνετε μέλος στο Get Fit χρησιμοποιώντας τον κωδικό παραπομπής μου: ${t==null?void 0:t.referralCode}`),l.success("Το μήνυμα αντιγράφηκε!")},className:"btn-secondary w-full hover:scale-105 active:scale-95 transition-transform duration-200",children:"Αντιγραφή μηνύματος"}),e.jsx("button",{onClick:()=>{navigator.clipboard.writeText(`https://freegym.com/register?ref=${t==null?void 0:t.referralCode}`),l.success("Το link αντιγράφηκε!")},className:"btn-primary w-full hover:scale-105 active:scale-95 transition-transform duration-200",children:"Αντιγραφή link"})]}),e.jsx("button",{onClick:()=>p(!1),className:"text-gray-500 hover:text-gray-700 mt-4 text-sm hover:scale-105 transition-transform duration-200",children:"Κλείσιμο"})]})})})]})]})};export{Y as default};
