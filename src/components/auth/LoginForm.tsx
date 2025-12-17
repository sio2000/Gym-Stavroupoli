import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types';
import { isValidEmail } from '@/utils';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

type LoginFormErrors = Partial<LoginCredentials> & { acceptPolicies?: string };

const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!credentials.email) {
      newErrors.email = 'Το email είναι υποχρεωτικό';
    } else if (!isValidEmail(credentials.email)) {
      newErrors.email = 'Παρακαλώ εισάγετε ένα έγκυρο email';
    }

    if (!credentials.password) {
      newErrors.password = 'Ο κωδικός πρόσβασης είναι υποχρεωτικός';
    }

    if (!acceptPolicies) {
      newErrors.acceptPolicies = 'Πρέπει να αποδεχτείτε την πολιτική απορρήτου και τους όρους χρήσης';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await login(credentials);
      navigate('/');
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePoliciesChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const checked = e.target.checked;
    setAcceptPolicies(checked);
    if (errors.acceptPolicies && checked) {
      setErrors(prev => ({ ...prev, acceptPolicies: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-48 w-48 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Get Fit Logo" 
              className="h-44 w-44 object-contain"
            />
          </div>
          <h2 className="mt-4 text-4xl font-bold text-white">
            Καλώς ήρθες στο Get Fit
          </h2>
          <p className="mt-3 text-base text-gray-300">
            Σύνδεση στην εφαρμογή διαχείρισης γυμναστηρίου
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-dark-800 border-dark-600 text-white ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="εισάγετε το email σας"
                  value={credentials.email}
                  onChange={handleInputChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Κωδικός Πρόσβασης
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`w-full px-3 py-2 pl-10 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-dark-800 border-dark-600 text-white ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="εισάγετε τον κωδικό πρόσβασης"
                  value={credentials.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                Ξεχάσατε τον κωδικό;
              </Link>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              id="acceptPolicies"
              name="acceptPolicies"
              type="checkbox"
              checked={acceptPolicies}
              onChange={handlePoliciesChange}
              className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="acceptPolicies" className="text-sm text-gray-300">
              Αποδέχομαι την{' '}
              <a
                href="/privacy-policy"
                className="text-primary-400 hover:text-primary-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Πολιτική Απορρήτου &amp; Όρους Χρήσης (GDPR)
              </a>
            </label>
          </div>
          {errors.acceptPolicies && (
            <p className="text-sm text-red-400">{errors.acceptPolicies}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Σύνδεση...
                </>
              ) : (
                'Σύνδεση'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-300">
              Δεν έχετε λογαριασμό;{' '}
              <Link
                to="/register"
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
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

export default LoginForm;
