import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Star,
  Award,
  Clock,
  Users
} from 'lucide-react';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { MembershipPackage, MembershipPackageDuration } from '@/types';
import { getDurationDisplayText } from '@/utils/membershipApi';
import toast from 'react-hot-toast';

interface RegistrationFormData {
  // Personal Information
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  language: 'el' | 'en';
  
  // Membership Selection
  selectedPackage: string;
  selectedDuration: string;
  
  // Referral Code
  referralCode: string;
  
  // Terms and Conditions
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
}

const PublicRegistration: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    language: 'el',
    selectedPackage: '',
    selectedDuration: '',
    referralCode: '',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false
  });

  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [packageDurations, setPackageDurations] = useState<MembershipPackageDuration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const steps = [
    { id: 1, title: 'Προσωπικά Στοιχεία', description: 'Βασικές πληροφορίες' },
    { id: 2, title: 'Επιλογή Πακέτου', description: 'Συνδρομή και διάρκεια' },
    { id: 3, title: 'Επιβεβαίωση', description: 'Έλεγχος και υποβολή' }
  ];

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('membership_packages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των πακέτων');
    }
  };

  const loadPackageDurations = async (packageId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('membership_package_durations')
        .select('*')
        .eq('package_id', packageId)
        .eq('is_active', true)
        .order('duration_days');

      if (error) throw error;
      setPackageDurations(data || []);
    } catch (error) {
      console.error('Error loading package durations:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των επιλογών διάρκειας');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePackageSelect = (packageId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPackage: packageId,
      selectedDuration: ''
    }));
    loadPackageDurations(packageId);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.first_name &&
          formData.last_name &&
          formData.phone &&
          formData.password === formData.confirmPassword
        );
      case 2:
        return !!(formData.selectedPackage && formData.selectedDuration);
      case 3:
        return formData.acceptTerms && formData.acceptPrivacy;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      toast.error('Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            language: formData.language
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{
          user_id: authData.user.id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          language: formData.language,
          role: 'user'
        }]);

      if (profileError) throw profileError;

      // Create membership request
      const selectedDuration = packageDurations.find(d => d.id === formData.selectedDuration);
      if (!selectedDuration) {
        throw new Error('Selected duration not found');
      }

      const { error: requestError } = await supabaseAdmin
        .from('membership_requests')
        .insert([{
          user_id: authData.user.id,
          package_id: formData.selectedPackage,
          duration_type: selectedDuration.duration_type,
          requested_price: selectedDuration.price,
          classes_count: selectedDuration.classes_count,
          status: 'pending'
        }]);

      if (requestError) throw requestError;

      // Process referral code if provided
      if (formData.referralCode.trim()) {
        try {
          const { processReferralSignup } = await import('@/services/referralService');
          const result = await processReferralSignup(authData.user.id, formData.referralCode.trim());
          
          if (result.success) {
            toast.success(`Ευχαριστούμε! ${result.message}`);
          } else {
            toast.error(result.message);
          }
        } catch (referralError) {
          console.error('Error processing referral:', referralError);
          // Don't fail registration if referral processing fails
          toast.error('Σφάλμα επεξεργασίας κωδικού παραπομπής, αλλά η εγγραφή ολοκληρώθηκε επιτυχώς.');
        }
      }

      setRegistrationSuccess(true);
      toast.success('Η εγγραφή σας ολοκληρώθηκε επιτυχώς! Θα ενημερωθείτε για την έγκριση.');
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Σφάλμα κατά την εγγραφή. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPackage = () => {
    return packages.find(p => p.id === formData.selectedPackage);
  };

  const getSelectedDuration = () => {
    return packageDurations.find(d => d.id === formData.selectedDuration);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Εγγραφή Ολοκληρώθηκε!</h1>
          <p className="text-gray-600 mb-6">
            Η εγγραφή σας υποβλήθηκε επιτυχώς. Θα ενημερωθείτε μέσω email για την έγκριση του αιτήματός σας.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Συνδεθείτε
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Αρχική Σελίδα
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Εγγραφή στο Get Fit</h1>
          <p className="text-gray-600">Γίνετε μέλος της οικογένειάς μας και ξεκινήστε το ταξίδι σας προς την υγεία</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Προσωπικά Στοιχεία</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Όνομα *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Επώνυμο *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Τηλέφωνο *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Κωδικός Πρόσβασης *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Επιβεβαίωση Κωδικού *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ημερομηνία Γέννησης
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Γλώσσα
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="el">Ελληνικά</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Διεύθυνση
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Περιγράψτε την διεύθυνσή σας..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Όνομα Επικοινωνίας Έκτακτης Ανάγκης
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Τηλέφωνο Επικοινωνίας Έκτακτης Ανάγκης
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Referral Code Field */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Κωδικός Παραπομπής (Προαιρετικό)
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε κωδικό παραπομπής"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Έχετε κωδικός παραπομπής; Εισάγετε τον εδώ για να κερδίσετε πόντους!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Package Selection */}
            {currentStep === 2 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Επιλογή Πακέτου</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        formData.selectedPackage === pkg.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Award className="h-8 w-8 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                        <div className="text-2xl font-bold text-primary-600 mb-4">
                          €{pkg.price?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pkg.duration_days} ημέρες
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.selectedPackage && packageDurations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Επιλέξτε Διάρκεια:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {packageDurations
                        .sort((a, b) => {
                          // For Pilates packages, sort by classes_count
                          if (formData.selectedPackage?.name === 'Pilates' && a.classes_count && b.classes_count) {
                            return a.classes_count - b.classes_count;
                          }
                          
                          // For other packages, use custom sorting by duration_type
                          const order = { 'lesson': 1, 'month': 30, '3 Μήνες': 90, 'semester': 180, 'year': 365 };
                          const aOrder = order[a.duration_type as keyof typeof order] || a.duration_days;
                          const bOrder = order[b.duration_type as keyof typeof order] || b.duration_days;
                          return aOrder - bOrder;
                        })
                        .map((duration) => (
                        <div
                          key={duration.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            formData.selectedDuration === duration.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, selectedDuration: duration.id }))}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {duration.duration_type}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {duration.classes_count ? `${duration.classes_count} μαθήματα` : getDurationDisplayText(duration.duration_type, duration.duration_days)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary-600">
                                €{duration.price?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Επιβεβαίωση</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Σύνοψη Εγγραφής</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Όνομα:</span>
                      <span className="font-medium">{formData.first_name} {formData.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Τηλέφωνο:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Πακέτο:</span>
                      <span className="font-medium">{getSelectedPackage()?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Διάρκεια:</span>
                      <span className="font-medium">{getSelectedDuration()?.duration_type}</span>
                    </div>
                    <div className="flex justify-between border-t pt-4">
                      <span className="text-lg font-semibold text-gray-900">Συνολικό Κόστος:</span>
                      <span className="text-lg font-bold text-primary-600">
                        €{getSelectedDuration()?.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      Αποδέχομαι τους <a href="/terms" className="text-primary-600 hover:underline">Όρους Χρήσης</a> *
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      Αποδέχομαι την <a href="/privacy" className="text-primary-600 hover:underline">Πολιτική Απορρήτου</a> *
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Θέλω να λαμβάνω ενημερώσεις και προσφορές μέσω email
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-8 py-6 flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Προηγούμενο
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <span>Επόμενο</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Εγγραφή...</span>
                    </>
                  ) : (
                    <>
                      <span>Ολοκλήρωση Εγγραφής</span>
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicRegistration;
