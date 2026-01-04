// Weekly Pilates Refill Edge Function
// Εκτελείται αυτόματα κάθε Κυριακή μέσω Supabase Cron
// Ultimate: Reset σε 3 μαθήματα
// Ultimate Medium: Reset σε 1 μάθημα

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefillResult {
  processed_count: number;
  success_count: number;
  error_count: number;
  details: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Έλεγχος αν είναι Κυριακή (προαιρετικό - μπορεί να παρακαμφθεί με force=true)
    const url = new URL(req.url)
    const forceRefill = url.searchParams.get('force') === 'true'
    
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Κυριακή
    
    if (dayOfWeek !== 0 && !forceRefill) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Σήμερα δεν είναι Κυριακή. Χρησιμοποίησε ?force=true για να τρέξεις χειροκίνητα.',
          dayOfWeek: dayOfWeek
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`[Weekly Pilates Refill] Εκκίνηση refill - Force: ${forceRefill}, Day: ${dayOfWeek}`)

    // Κάλεσε τη database function
    const { data, error } = await supabase.rpc('process_weekly_pilates_refills')

    if (error) {
      console.error('[Weekly Pilates Refill] Error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: error 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const result: RefillResult = data?.[0] || { 
      processed_count: 0, 
      success_count: 0, 
      error_count: 0, 
      details: [] 
    }

    console.log(`[Weekly Pilates Refill] Αποτέλεσμα:`, result)

    // Log το event για auditing
    await supabase.from('system_logs').insert({
      event_type: 'weekly_pilates_refill',
      event_data: {
        date: today.toISOString(),
        force: forceRefill,
        result: result
      },
      created_at: new Date().toISOString()
    }).catch(() => {
      // Ignore if system_logs table doesn't exist
      console.log('[Weekly Pilates Refill] system_logs table not available')
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ολοκληρώθηκε! Επεξεργασία: ${result.processed_count}, Επιτυχείς: ${result.success_count}, Σφάλματα: ${result.error_count}`,
        result: result,
        timestamp: today.toISOString(),
        forced: forceRefill
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[Weekly Pilates Refill] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

