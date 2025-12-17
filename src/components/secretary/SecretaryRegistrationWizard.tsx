import React, { useState } from 'react';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { Mail, Phone, User, Lock, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  language: 'el' | 'en';
}

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  language: 'el'
};

const SecretaryRegistrationWizard: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const updateField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Συμπλήρωσε όνομα και επώνυμο');
      return false;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      toast.error('Έγκυρο email απαιτείται');
      return false;
    }
    if (!form.password || form.password.length < 8) {
      toast.error('Ο κωδικός χρειάζεται τουλάχιστον 8 χαρακτήρες');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Οι κωδικοί δεν ταιριάζουν');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccessEmail(null);

    try {
      // 1. Δημιουργία auth user με service client (δεν χάνεται το session της γραμματείας)
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            phone: form.phone.trim(),
            language: form.language
          }
        }
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('Αποτυχία δημιουργίας χρήστη');
      }

      // 2. Εξασφάλιση profile χωρίς overwrite δεδομένων
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          user_id: userId,
          email: form.email.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim() || null,
          language: form.language,
          role: 'user'
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        throw profileError;
      }

      setSuccessEmail(form.email.trim());
      toast.success('Καταχώρηση ολοκληρώθηκε. Εστάλη email επιβεβαίωσης.');
      setForm(initialForm);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Σφάλμα εγγραφής';
      console.error('[SecretaryRegistrationWizard] Error:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Εγγραφή Νέου Μέλους</h2>
          <p className="text-gray-600 mt-1">
            Η γραμματεία συλλέγει τα στοιχεία, δημιουργεί προφίλ και ο χρήστης επιβεβαιώνει το email.
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-semibold">Ασφαλές & χωρίς απώλειες δεδομένων</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Όνομα *</span>
            <div className="mt-1 relative">
              <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Επώνυμο *</span>
            <div className="mt-1 relative">
              <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
              />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email *</span>
            <div className="mt-1 relative">
              <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Κινητό</span>
            <div className="mt-1 relative">
              <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="tel"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="69xxxxxxxx"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Κωδικός *</span>
            <div className="mt-1 relative">
              <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Επιβεβαίωση Κωδικού *</span>
            <div className="mt-1 relative">
              <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
              />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Με την καταχώρηση στέλνουμε email επιβεβαίωσης στον χρήστη.
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
            Καταχώρηση
          </button>
        </div>

        {successEmail && (
          <div className="mt-4 flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm">
              Ο χρήστης δημιουργήθηκε επιτυχώς. Ελέγξτε το email <strong>{successEmail}</strong> για επιβεβαίωση.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default SecretaryRegistrationWizard;

