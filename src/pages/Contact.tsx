import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { sendRealEmailToGmail } from '@/api/realGmailService';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Το όνομα είναι υποχρεωτικό';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Το email είναι υποχρεωτικό';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Παρακαλώ εισάγετε ένα έγκυρο email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Το θέμα είναι υποχρεωτικό';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Το μήνυμα είναι υποχρεωτικό';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες';
    }

    if (!formData.consent) {
      newErrors.consent = 'Πρέπει να αποδεχτείτε την επεξεργασία των δεδομένων σας';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send email using real Gmail service
      const result = await sendRealEmailToGmail({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      
      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          consent: false
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Επικοινωνία</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Έχεις ερωτήσεις ή χρειάζεσαι βοήθεια; Επικοινώνησε μαζί μας και θα σου απαντήσουμε το συντομότερο δυνατό.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Στοιχεία Επικοινωνίας</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">devtaskhub@gmail.com</p>
                    <p className="text-sm text-gray-500">Απαντάμε συνήθως εντός 24 ωρών</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Τηλέφωνο</h3>
                    <p className="text-gray-600">+30 6971982563</p>
                    <p className="text-sm text-gray-500">Δευτέρα - Παρασκευή 09:00-18:00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Διεύθυνση</h3>
                    <p className="text-gray-600">Θεσσαλονίκη, Ελλάδα</p>
                    <p className="text-sm text-gray-500">Γραφείο για προσωπικές συναντήσεις</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ώρες Λειτουργίας</h3>
                    <p className="text-gray-600">Δευτέρα - Παρασκευή</p>
                    <p className="text-sm text-gray-500">09:00 - 18:00 (EET)</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Συχνές Ερωτήσεις</h3>
                <p className="text-blue-800 text-sm">
                  Πριν επικοινωνήσεις μαζί μας, ρίξε μια ματιά στις{' '}
                  <a href="/faq" className="underline hover:text-blue-600">
                    Συχνές Ερωτήσεις
                  </a>{' '}
                  για να δεις αν βρεις την απάντηση που ψάχνεις.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Στείλτε μας μήνυμα</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800">
                    Το μήνυμά σας στάλθηκε επιτυχώς! Θα σας απαντήσουμε το συντομότερο δυνατό.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800">
                    Υπήρξε σφάλμα κατά την αποστολή του μηνύματος. Παρακαλώ δοκιμάστε ξανά.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Όνομα *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Το πλήρες όνομά σας"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Τηλέφωνο
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="π.χ. +306912345678"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Θέμα *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.subject ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Επιλέξτε θέμα</option>
                      <option value="technical">Τεχνικό πρόβλημα</option>
                      <option value="account">Πρόβλημα λογαριασμού</option>
                      <option value="billing">Ερώτηση χρέωσης</option>
                      <option value="feature">Πρόταση νέου χαρακτηριστικού</option>
                      <option value="other">Άλλο</option>
                    </select>
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Μήνυμα *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Περιγράψτε το πρόβλημά σας ή την ερώτησή σας..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={formData.consent}
                      onChange={handleInputChange}
                      className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                        errors.consent ? 'border-red-300' : ''
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      Αποδέχομαι την επεξεργασία των προσωπικών μου δεδομένων σύμφωνα με την{' '}
                      <a href="/privacy-policy" className="text-blue-600 hover:underline">
                        Πολιτική Απορρήτου
                      </a>{' '}
                      *
                    </span>
                  </label>
                  {errors.consent && (
                    <p className="mt-1 text-sm text-red-600">{errors.consent}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Αποστολή...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Στείλτε Μήνυμα</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Πώς μπορούμε να σας βοηθήσουμε;</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Γενικές Ερωτήσεις</h3>
              <p className="text-gray-600 text-sm">
                Για οποιαδήποτε ερώτηση σχετικά με την εφαρμογή, τα χαρακτηριστικά ή τη χρήση.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Τεχνική Υποστήριξη</h3>
              <p className="text-gray-600 text-sm">
                Αν αντιμετωπίζετε τεχνικά προβλήματα ή σφάλματα στην εφαρμογή.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Απορρήτου & Ασφάλειας</h3>
              <p className="text-gray-600 text-sm">
                Για ερωτήσεις σχετικά με τα δεδομένα σας, την ασφάλεια και το απόρρητό σας.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
