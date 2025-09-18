import{s as r}from"./index-eB7Silf9.js";const c=async()=>{const{data:e,error:s}=await r.from("pilates_schedule_slots").select("*").order("date",{ascending:!0}).order("start_time",{ascending:!0});if(s)throw console.error("Error fetching pilates schedule slots:",s),s;return e||[]},d=async()=>{try{console.log("Fetching available pilates slots...");const{data:e,error:s}=await r.from("pilates_schedule_slots").select("*").eq("is_active",!0).gte("date",new Date().toISOString().split("T")[0]).order("date",{ascending:!0}).order("start_time",{ascending:!0});if(s)throw console.error("Error fetching available pilates slots:",s),s;console.log("Fetched slots from DB:",(e==null?void 0:e.length)||0),console.log("Sample slots from DB:",e==null?void 0:e.slice(0,5));const o=(e||[]).map(t=>{const a=new Date(t.date+"T00:00:00").getDay(),l=a===0||a===6;return console.log(`Slot ${t.date} (day ${a}) - isWeekend: ${l} - KEPT (admin created it)`),t}).map(t=>({id:t.id,date:t.date,start_time:t.start_time,end_time:t.end_time,max_capacity:t.max_capacity,available_capacity:t.max_capacity,status:"available",is_active:t.is_active}));return console.log("Transformed slots:",o.length),console.log("Sample transformed slots:",o.slice(0,5)),o}catch(e){throw console.error("Error fetching available pilates slots:",e),e}},g=async e=>{let s=r.from("pilates_bookings").select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `).order("booking_date",{ascending:!1});e&&(s=s.eq("user_id",e));const{data:o,error:t}=await s;if(t)throw console.error("Error fetching pilates bookings:",t),t;return o||[]},_=async(e,s)=>{const{data:o,error:t}=await r.from("pilates_bookings").insert({user_id:s,slot_id:e.slotId,notes:e.notes,status:"confirmed"}).select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `).single();if(t)throw console.error("Error creating pilates booking:",t),t;return o},p=async e=>{const{data:s,error:o}=await r.from("pilates_bookings").update({status:"cancelled"}).eq("id",e).select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `).single();if(o)throw console.error("Error cancelling pilates booking:",o),o;return s};export{d as a,g as b,_ as c,p as d,c as g};
