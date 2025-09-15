import React from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';

interface EmailConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isRegistration?: boolean;
}

const EmailConfirmationPopup: React.FC<EmailConfirmationPopupProps> = ({
  isOpen,
  onClose,
  isRegistration = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">
                {isRegistration ? 'Εγγραφή Ολοκληρώθηκε!' : 'Επιβεβαίωση Email Απαιτείται'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-3 bg-yellow-100 rounded-full flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ελέγξτε το Email σας
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isRegistration 
                  ? 'Έχει σταλεί email επιβεβαίωσης στη διεύθυνση email που καταχωρήσατε.'
                  : 'Έχει σταλεί email επιβεβαίωσης στη διεύθυνση email σας.'
                }
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Τι πρέπει να κάνετε:</h4>
            <ol className="text-blue-800 text-sm space-y-2">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Ελέγξτε το inbox (και το spam folder) του email σας</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Κάντε κλικ στον σύνδεσμο επιβεβαίωσης στο email</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Επιστρέψτε εδώ και συνδεθείτε ξανά</span>
              </li>
            </ol>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Σημαντική Παρατήρηση</h4>
                <p className="text-red-800 text-sm">
                  Δεν μπορείτε να χρησιμοποιήσετε την εφαρμογή μέχρι να επιβεβαιώσετε το email σας. 
                  Αυτό απαιτείται για την ασφάλεια του λογαριασμού σας.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Κατάλαβα
            </button>
            <button
              onClick={() => {
                // Redirect to logout
                window.location.href = '/login';
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Μετάβαση στη Σύνδεση
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPopup;
