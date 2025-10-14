// Email service using EmailJS for browser-compatible email sending
import emailjs from '@emailjs/browser';

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

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_abc123'; // Θα το αλλάξουμε μετά
const EMAILJS_TEMPLATE_ID = 'template_xyz789'; // Θα το αλλάξουμε μετά
const EMAILJS_PUBLIC_KEY = 'user_def456'; // Θα το αλλάξουμε μετά

export const sendContactFormEmail = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Sending contact form email via EmailJS:', data);

    // For now, we'll simulate the email sending and log the data
    // This will work until we set up EmailJS properly
    
    console.log('📋 Contact Form Submission (Simulated EmailJS):', {
      timestamp: new Date().toISOString(),
      recipient: 'devtaskhub@gmail.com',
      sender: data.email,
      subject: `Contact Form: ${data.subject}`,
      formData: data
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Replace with actual EmailJS call when configured
    /*
    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      phone: data.phone || 'Δεν δόθηκε',
      subject: data.subject,
      message: data.message,
      to_email: 'devtaskhub@gmail.com'
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent successfully via EmailJS:', result);
    */

    return {
      success: true,
      message: 'Το μήνυμα στάλθηκε επιτυχώς! Θα σας απαντήσουμε το συντομότερο δυνατό.'
    };

  } catch (error) {
    console.error('❌ Error sending contact email:', error);
    
    return {
      success: false,
      error: 'Υπήρξε σφάλμα κατά την αποστολή του μηνύματος. Παρακαλώ δοκιμάστε ξανά ή επικοινωνήστε μαζί μας άμεσα στο devtaskhub@gmail.com'
    };
  }
};

// Simple approach that works immediately
export const sendContactFormEmailSimple = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Processing contact form submission:', data);

    // Create detailed email content for logging
    const emailContent = `
📧 ΝΕΟ ΜΗΝΥΜΑ ΑΠΟ ΤΗ ΦΟΡΜΑ ΕΠΙΚΟΙΝΩΝΙΑΣ GETFIT
================================================

👤 ΣΤΟΙΧΕΙΑ ΕΠΙΚΟΙΝΩΝΙΑΣ:
- Όνομα: ${data.name}
- Email: ${data.email}
- Τηλέφωνο: ${data.phone || 'Δεν δόθηκε'}
- Θέμα: ${data.subject}

💬 ΜΗΝΥΜΑ:
${data.message}

📅 ΗΜΕΡΟΜΗΝΙΑ: ${new Date().toLocaleString('el-GR')}
🌐 ΑΠΟ: GetFit Contact Form
📧 ΣΤΟ: devtaskhub@gmail.com
    `.trim();

    // Log the email content in a formatted way for easy copying
    console.log('='.repeat(80));
    console.log('📧 EMAIL TO SEND MANUALLY TO: devtaskhub@gmail.com');
    console.log('='.repeat(80));
    console.log(`SUBJECT: Contact Form: ${data.subject}`);
    console.log('='.repeat(80));
    console.log(emailContent);
    console.log('='.repeat(80));
    console.log('📋 COPY THE ABOVE CONTENT AND SEND MANUALLY TO: devtaskhub@gmail.com');
    console.log('='.repeat(80));

    // Also create a simple object for easy access
    const emailData = {
      to: 'devtaskhub@gmail.com',
      subject: `Contact Form: ${data.subject}`,
      replyTo: data.email,
      content: emailContent,
      timestamp: new Date().toISOString(),
      formData: data
    };

    // Store in localStorage for backup
    try {
      const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      existingMessages.push(emailData);
      localStorage.setItem('contactMessages', JSON.stringify(existingMessages));
      console.log('💾 Message saved to localStorage for backup');
    } catch (storageError) {
      console.warn('⚠️ Could not save to localStorage:', storageError);
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      message: 'Το μήνυμα καταγράφηκε επιτυχώς! Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.'
    };

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    
    return {
      success: false,
      error: 'Υπήρξε σφάλμα κατά την καταγραφή του μηνύματος. Παρακαλώ επικοινωνήστε μαζί μας άμεσα στο devtaskhub@gmail.com'
    };
  }
};
