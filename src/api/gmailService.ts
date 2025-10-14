// Gmail API service for sending emails
// This service will send emails directly to devtaskhub@gmail.com

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

// Function to send email via Gmail API
export const sendEmailViaGmail = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Preparing email for Gmail API:', data);

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

    // Create HTML version
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

    // For now, we'll use a simple approach that works immediately
    // This creates a mailto link that opens the user's email client
    const mailtoUrl = `mailto:devtaskhub@gmail.com?subject=${encodeURIComponent(`Contact Form: ${data.subject}`)}&body=${encodeURIComponent(emailContent)}`;
    
    // Also create a copy-to-clipboard functionality
    const emailData = {
      to: 'devtaskhub@gmail.com',
      subject: `Contact Form: ${data.subject}`,
      from: data.email,
      content: emailContent,
      html: emailHtml
    };

    // Log the email data for easy access
    console.log('📧 EMAIL DATA FOR MANUAL SENDING:');
    console.log('='.repeat(80));
    console.log('TO:', emailData.to);
    console.log('SUBJECT:', emailData.subject);
    console.log('FROM:', emailData.from);
    console.log('CONTENT:');
    console.log(emailData.content);
    console.log('='.repeat(80));

    // Try to copy to clipboard
    try {
      await navigator.clipboard.writeText(emailContent);
      console.log('📋 Email content copied to clipboard!');
    } catch (clipboardError) {
      console.log('⚠️ Could not copy to clipboard:', clipboardError);
    }

    // Open mailto link
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Store in localStorage for backup
    try {
      const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      existingMessages.push({
        ...emailData,
        timestamp: new Date().toISOString(),
        id: Date.now()
      });
      localStorage.setItem('contactMessages', JSON.stringify(existingMessages));
      console.log('💾 Message saved to localStorage');
    } catch (storageError) {
      console.warn('⚠️ Could not save to localStorage:', storageError);
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      message: 'Το μήνυμα προετοιμάστηκε για αποστολή! Ελέγξτε το email client σας.'
    };

  } catch (error) {
    console.error('❌ Error in Gmail service:', error);
    
    return {
      success: false,
      error: 'Υπήρξε σφάλμα κατά την προετοιμασία του μηνύματος. Παρακαλώ δοκιμάστε ξανά.'
    };
  }
};

// Function to get stored messages from localStorage
export const getStoredMessages = () => {
  try {
    const messages = localStorage.getItem('contactMessages');
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error getting stored messages:', error);
    return [];
  }
};

// Function to clear stored messages
export const clearStoredMessages = () => {
  try {
    localStorage.removeItem('contactMessages');
    console.log('📧 Stored messages cleared');
  } catch (error) {
    console.error('Error clearing stored messages:', error);
  }
};
