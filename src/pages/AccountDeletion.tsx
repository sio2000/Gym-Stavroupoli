import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';

const AccountDeletion: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmText !== 'ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ') {
      toast.error('Παρακαλώ πληκτρολογήστε ακριβώς: ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ');
      return;
    }

    setIsDeleting(true);

    try {
      if (!user?.id) {
        throw new Error('Δεν βρέθηκε χρήστης');
      }

      // Διαγραφή προφίλ χρήστη
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      // Sign out
      await supabase.auth.signOut();
      
      toast.success('Ο λογαριασμός διαγράφηκε επιτυχώς!');
      
      // Redirect
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Υπήρξε σφάλμα κατά τη διαγραφή');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            🗑️ ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ
          </h1>
          <p className="text-gray-600 text-lg">
            Αυτή η ενέργεια είναι μη αναστρέψιμη!
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-100 border border-red-300 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-800">Προσοχή!</h2>
          </div>
          <ul className="text-red-700 space-y-2">
            <li>• Όλα τα δεδομένα σας θα διαγραφούν οριστικά</li>
            <li>• Δεν θα μπορείτε να ανακτήσετε τον λογαριασμό</li>
            <li>• Θα αποσυνδεθείτε από την εφαρμογή</li>
          </ul>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-gray-100 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-gray-800 mb-2">Διαγραφή για:</h3>
            <p className="text-gray-600">Email: {user.email}</p>
            <p className="text-gray-600 text-sm">ID: {user.id}</p>
          </div>
        )}

        {/* Confirmation */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Για να επιβεβαιώσετε, πληκτρολογήστε:
          </label>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-3">
            <code className="text-lg font-bold text-red-600">ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ</code>
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Πληκτρολογήστε: ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ' || isDeleting}
            className="flex-1 bg-red-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Trash2 className="h-6 w-6" />
            <span>{isDeleting ? 'Διαγραφή...' : '🗑️ ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ'}</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            disabled={isDeleting}
            className="flex-1 bg-gray-500 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Ακύρωση
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccountDeletion;
