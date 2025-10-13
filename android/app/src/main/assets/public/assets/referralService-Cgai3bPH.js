import{s as a}from"./index-ZmRz_kF8.js";const n=async s=>{try{const{data:e,error:r}=await a.rpc("get_user_referral_points",{p_user_id:s});if(r)throw console.error("Error getting referral points:",r),r;return e||0}catch(e){return console.error("Error in getUserReferralPoints:",e),0}},i=async(s,e)=>{try{const{data:r,error:t}=await a.rpc("process_referral_signup",{p_referred_user_id:s,p_referral_code:e});if(t)throw console.error("Error processing referral signup:",t),t;if(!r||r.length===0)throw new Error("No data returned from referral processing");const o=r[0];return{success:o.success,message:o.message,points_awarded:o.points_awarded}}catch(r){throw console.error("Error in processReferralSignup:",r),r}},l=async s=>{try{const e=await n(s),{data:r,error:t}=await a.from("referral_transactions").select(`
        *,
        referred_user:user_profiles!referral_transactions_referred_id_fkey(
          first_name,
          last_name,
          email
        )
      `).eq("referrer_id",s).order("created_at",{ascending:!1}).limit(10);if(t)throw console.error("Error getting referral transactions:",t),t;return{total_points:e,total_referrals:(r==null?void 0:r.length)||0,recent_transactions:r||[]}}catch(e){throw console.error("Error in getUserReferralStats:",e),e}};export{n as getUserReferralPoints,l as getUserReferralStats,i as processReferralSignup};
