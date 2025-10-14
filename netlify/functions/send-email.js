// Netlify Function for sending emails via Resend API
// This function will handle the email sending server-side to avoid CORS issues

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { name, email, phone, subject, message } = data;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
      };
    }

    // Resend API configuration
    const RESEND_API_KEY = 're_QCA7LiUS_88xPaiq97Kpq7PTsUzPNNBTR';
    const API_URL = 'https://api.resend.com/emails';

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 0;">
            📧 Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit
          </h2>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">👤 Στοιχεία επικοινωνίας:</h3>
            <p style="margin: 5px 0;"><strong>Όνομα:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
            <p style="margin: 5px 0;"><strong>Τηλέφωνο:</strong> ${phone || 'Δεν δόθηκε'}</p>
            <p style="margin: 5px 0;"><strong>Θέμα:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #374151; margin-top: 0;">💬 Μήνυμα:</h3>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #4a5568;">${message}</div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>📅 <strong>Ημερομηνία:</strong> ${new Date().toLocaleString('el-GR')}</p>
            <p>🌐 <strong>Από:</strong> GetFit Contact Form</p>
          </div>
        </div>
      </div>
    `;

    const emailText = `
Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit

Στοιχεία επικοινωνίας:
- Όνομα: ${name}
- Email: ${email}
- Τηλέφωνο: ${phone || 'Δεν δόθηκε'}
- Θέμα: ${subject}

Μήνυμα:
${message}

---
Ημερομηνία: ${new Date().toLocaleString('el-GR')}
Από: GetFit Contact Form
    `.trim();

    // Send email using Resend API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GetFit Contact Form <onboarding@resend.dev>',
        to: ['devtaskhub@gmail.com'],
        reply_to: email,
        subject: `Contact Form: ${subject}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', responseData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: `Email sending failed: ${responseData.message || 'Unknown error'}` 
        }),
      };
    }

    console.log('Email sent successfully:', responseData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Το μήνυμα στάλθηκε επιτυχώς!',
        emailId: responseData.id
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
    };
  }
};
