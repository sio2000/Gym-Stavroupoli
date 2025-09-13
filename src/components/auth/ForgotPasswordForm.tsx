import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { isValidEmail } from '@/utils';
import toast from 'react-hot-toast';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; phone?: string } = {};

    if (!email) {
      newErrors.email = 'Το email είναι υποχρεωτικό';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Παρακαλώ εισάγετε ένα έγκυρο email';
    }

    if (!phone) {
      newErrors.phone = 'Το τηλέφωνο είναι υποχρεωτικό';
    } else if (phone.length < 10) {
      newErrors.phone = 'Παρακαλώ εισάγετε ένα έγκυρο τηλέφωνο';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Check if user exists in database (READ-ONLY check)
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('user_id, email, phone, first_name, last_name')
        .eq('email', email.toLowerCase().trim())
        .eq('phone', phone.trim())
        .single();

      if (error || !userProfile) {
        setErrors({
          email: 'Δεν βρέθηκε χρήστης με αυτά τα στοιχεία',
          phone: 'Δεν βρέθηκε χρήστης με αυτά τα στοιχεία'
        });
        return;
      }

      // Generate a simple temporary password
      const tempPass = Math.random().toString(36).slice(-8).toUpperCase();
      setTempPassword(tempPass);
      setIsVerified(true);

      // Store temporary password in localStorage for login
      localStorage.setItem('temp_password', tempPass);
      localStorage.setItem('temp_email', email.toLowerCase().trim());

      toast.success('Επιτυχής επαλήθευση! Χρησιμοποιήστε τον προσωρινό κωδικό για σύνδεση.');

    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Σφάλμα κατά την επαλήθευση. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'phone') {
      setPhone(value);
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Επιτυχής Επαλήθευση
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Τα στοιχεία σας επαληθεύτηκαν επιτυχώς
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Προσωρινός Κωδικός Πρόσβασης
                </h3>
                <div className="bg-white border-2 border-green-300 rounded-lg p-3 text-center">
                  <code className="text-2xl font-mono font-bold text-green-900 tracking-wider">
                    {tempPassword}
                  </code>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Χρησιμοποιήστε αυτόν τον κωδικό με το email σας για να συνδεθείτε στο σύστημα.
                </p>
                <div className="mt-3 p-2 bg-white border border-green-300 rounded text-xs text-green-800">
                  <strong>Email:</strong> {email}<br/>
                  <strong>Κωδικός:</strong> {tempPassword}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Σημαντικές Οδηγίες:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Πατήστε "Συνδεθείτε Τώρα" για να μεταβείτε στη σελίδα σύνδεσης</li>
                      <li>Χρησιμοποιήστε το email και τον κωδικό που εμφανίζονται παραπάνω</li>
                      <li>Αλλάξτε τον κωδικό σας αμέσως μετά τη σύνδεση</li>
                      <li>Ο προσωρινός κωδικός είναι μοναδικός και ασφαλής</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <Link
                  to="/login"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
                >
                  Συνδεθείτε Τώρα
                </Link>
                <button
                  onClick={() => {
                    setIsVerified(false);
                    setEmail('');
                    setPhone('');
                    setTempPassword('');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Νέα Αίτηση
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Επαναφορά Κωδικού
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Εισάγετε τα στοιχεία σας για να λάβετε προσωρινό κωδικό πρόσβασης
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="εισάγετε το email σας"
                  value={email}
                  onChange={handleInputChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Τηλέφωνο
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="εισάγετε το τηλέφωνο σας"
                  value={phone}
                  onChange={handleInputChange}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/login"
              className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Επιστροφή στη Σύνδεση
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Επαλήθευση...
                </>
              ) : (
                'Επαλήθευση Στοιχείων'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Δεν έχετε λογαριασμό;{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Εγγραφείτε εδώ
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
