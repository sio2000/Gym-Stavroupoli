import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { name, email, phone, subject, message }: ContactFormData = await req.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create email content
    const emailContent = `
Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit:

Στοιχεία επικοινωνίας:
- Όνομα: ${name}
- Email: ${email}
- Τηλέφωνο: ${phone || 'Δεν δόθηκε'}
- Θέμα: ${subject}

Μήνυμα:
${message}

---
Αυτό το μήνυμα στάλθηκε από την ιστοσελίδα GetFit.
Ημερομηνία: ${new Date().toLocaleString('el-GR')}
    `.trim()

    // Send email using Supabase Auth admin API
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      'devtaskhub@gmail.com',
      {
        data: {
          contact_form_message: emailContent,
          contact_name: name,
          contact_email: email,
          contact_phone: phone,
          contact_subject: subject,
          contact_message: message,
        }
      }
    )

    if (error) {
      console.error('Supabase error:', error)
      
      // Fallback: Store in database for manual processing
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          name,
          email,
          phone,
          subject,
          message,
          created_at: new Date().toISOString(),
          status: 'pending'
        }])

      if (dbError) {
        console.error('Database error:', dbError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to store message' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message stored successfully, will be processed manually',
          note: 'Email delivery failed but message was saved'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
