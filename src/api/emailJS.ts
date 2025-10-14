// EmailJS service for sending emails directly from the browser
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

// EmailJS configuration - you need to set these up
const EMAILJS_SERVICE_ID = 'service_abc123'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_xyz789'; // Replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'user_def456'; // Replace with your EmailJS public key

export const sendEmailViaEmailJS = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Sending email via EmailJS:', data);

    // For now, we'll simulate the email sending since EmailJS needs setup
    console.log('📧 EmailJS configuration needed:');
    console.log('1. Go to https://emailjs.com');
    console.log('2. Create account and setup Gmail service');
    console.log('3. Create email template');
    console.log('4. Get your credentials and update the constants above');

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Log the email content for manual sending
    console.log('📧 EMAIL CONTENT FOR MANUAL SENDING:');
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

  } catch (error) {
    console.error('❌ Error in EmailJS service:', error);
    
    return {
      success: false,
      error: 'Υπήρξε σφάλμα κατά την καταγραφή. Παρακαλώ δοκιμάστε ξανά.'
    };
  }
};

// Real EmailJS implementation (uncomment when configured)
/*
export const sendEmailViaEmailJSReal = async (data: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Sending email via EmailJS (real):', data);

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

    return {
      success: true,
      message: 'Το μήνυμα στάλθηκε επιτυχώς! Θα σας απαντήσουμε το συντομότερο δυνατό.'
    };

  } catch (error) {
    console.error('❌ Error sending email via EmailJS:', error);
    
    return {
      success: false,
      error: 'Υπήρξε σφάλμα κατά την αποστολή. Παρακαλώ δοκιμάστε ξανά.'
    };
  }
};
*/
