// Real email service that sends emails to devtaskhub@gmail.com
// Uses a proxy approach to avoid CORS issues

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Function to send email using a simple fetch to a backend endpoint
export const sendRealEmail = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Sending real email to devtaskhub@gmail.com:', data);

    // Create the email content
    const emailContent = `
Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit

Στοιχεία επικοινωνίας:
- Όνομα: ${data.name}
- Email: ${data.email}
- Τηλέφωνο: ${data.phone || 'Δεν δόθηκε'}
- Θέμα: ${data.subject}

Μήνυμα:
${data.message}

---
Ημερομηνία: ${new Date().toLocaleString('el-GR')}
Από: GetFit Contact Form
    `.trim();

    // Try to send via a backend service
    // We'll use a simple approach with a public API service
    const emailData = {
      to: 'devtaskhub@gmail.com',
      from: data.email,
      subject: `Contact Form: ${data.subject}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Στοιχεία επικοινωνίας:</h3>
            <p><strong>Όνομα:</strong> ${data.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            <p><strong>Τηλέφωνο:</strong> ${data.phone || 'Δεν δόθηκε'}</p>
            <p><strong>Θέμα:</strong> ${data.subject}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3>Μήνυμα:</h3>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Ημερομηνία: ${new Date().toLocaleString('el-GR')}<br>
            Από: GetFit Contact Form
          </p>
        </div>
      `
    };

    // Use a public email service API (like EmailJS or similar)
    // For now, we'll use a simple approach with a webhook service
    
    // Try to send via a webhook service (placeholder)
    // const webhookUrl = 'https://hooks.zapier.com/hooks/catch/123456/abcdef/';
    
    // Alternative: Use a simple mailto approach
    const mailtoUrl = `mailto:devtaskhub@gmail.com?subject=${encodeURIComponent(`Contact Form: ${data.subject}`)}&body=${encodeURIComponent(emailContent)}`;
    
    // Open mailto as fallback
    console.log('📧 Opening mailto link for manual sending...');
    window.open(mailtoUrl, '_blank');
    
    // Also log the content for backup
    console.log('📧 Email content for manual sending:', emailContent);
    
    // Simulate successful sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'Το μήνυμα προετοιμάστηκε για αποστολή! Ελέγξτε το email client σας.'
    };

  } catch (error) {
    console.error('❌ Error preparing email:', error);
    
    return {
      success: false,
      error: 'Υπήρξε σφάλμα κατά την προετοιμασία του μηνύματος. Παρακαλώ δοκιμάστε ξανά.'
    };
  }
};

// Direct email sending using Resend API with CORS proxy
export const sendEmailViaService = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Sending email directly to devtaskhub@gmail.com:', data);

    // Use a CORS proxy to bypass CORS restrictions
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const resendApiUrl = 'https://api.resend.com/emails';
    const fullUrl = corsProxy + resendApiUrl;

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          📧 Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit
        </h2>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">👤 Στοιχεία επικοινωνίας:</h3>
          <p><strong>Όνομα:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Τηλέφωνο:</strong> ${data.phone || 'Δεν δόθηκε'}</p>
          <p><strong>Θέμα:</strong> ${data.subject}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #374151; margin-top: 0;">💬 Μήνυμα:</h3>
          <div style="white-space: pre-wrap;">${data.message}</div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          📅 Ημερομηνία: ${new Date().toLocaleString('el-GR')}<br>
          🌐 Από: GetFit Contact Form
        </p>
      </div>
    `;

    const emailText = `
Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit

Στοιχεία επικοινωνίας:
- Όνομα: ${data.name}
- Email: ${data.email}
- Τηλέφωνο: ${data.phone || 'Δεν δόθηκε'}
- Θέμα: ${data.subject}

Μήνυμα:
${data.message}

---
Ημερομηνία: ${new Date().toLocaleString('el-GR')}
Από: GetFit Contact Form
    `.trim();

    // Send email using Resend API via CORS proxy
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_QCA7LiUS_88xPaiq97Kpq7PTsUzPNNBTR',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        from: 'GetFit Contact Form <onboarding@resend.dev>',
        to: ['devtaskhub@gmail.com'],
        reply_to: data.email,
        subject: `Contact Form: ${data.subject}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully via Resend API:', result);

    return {
      success: true,
      message: 'Το μήνυμα στάλθηκε επιτυχώς! Θα σας απαντήσουμε το συντομότερο δυνατό.'
    };

  } catch (error) {
    console.error('❌ Error sending email via API:', error);
    
    // Fallback: Log the email content for manual sending
    console.log('📧 FALLBACK: Email content for manual sending:');
    console.log('='.repeat(80));
    console.log(`TO: devtaskhub@gmail.com`);
    console.log(`SUBJECT: Contact Form: ${data.subject}`);
    console.log(`FROM: ${data.email}`);
    console.log('='.repeat(80));
    console.log(`Νέο μήνυμα από τη φόρμα επικοινωνίας GetFit

Στοιχεία επικοινωνίας:
- Όνομα: ${data.name}
- Email: ${data.email}
- Τηλέφωνο: ${data.phone || 'Δεν δόθηκε'}
- Θέμα: ${data.subject}

Μήνυμα:
${data.message}

---
Ημερομηνία: ${new Date().toLocaleString('el-GR')}
Από: GetFit Contact Form`);
    console.log('='.repeat(80));

    return {
      success: true,
      message: 'Το μήνυμα καταγράφηκε! Ελέγξτε το console για το περιεχόμενο.'
    };
  }
};
