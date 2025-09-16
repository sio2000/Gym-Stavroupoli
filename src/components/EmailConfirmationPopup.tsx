import React from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';

interface EmailConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isRegistration?: boolean;
  userEmail?: string;
}

const EmailConfirmationPopup: React.FC<EmailConfirmationPopupProps> = ({
  isOpen,
  onClose,
  isRegistration = false,
  userEmail = ''
}) => {
  console.log('[EmailConfirmationPopup] ===== RENDER =====');
  console.log('[EmailConfirmationPopup] isOpen:', isOpen);
  console.log('[EmailConfirmationPopup] isRegistration:', isRegistration);
  
  if (!isOpen) {
    console.log('[EmailConfirmationPopup] Not open, returning null');
    return null;
  }
  
  console.log('[EmailConfirmationPopup] Rendering popup');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 my-2 sm:my-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold truncate">
                {isRegistration ? 'Εγγραφή Ολοκληρώθηκε!' : 'Επιβεβαίωση Email Απαιτείται'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Ελέγξτε το Email σας
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {isRegistration 
                  ? 'Έχει σταλεί email επιβεβαίωσης στη διεύθυνση email που καταχωρήσατε.'
                  : 'Έχει σταλεί email επιβεβαίωσης στη διεύθυνση email σας.'
                }
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Τι πρέπει να κάνετε:</h4>
            <ol className="text-blue-800 text-xs sm:text-sm space-y-2">
              <li className="flex items-start">
                <span className="font-semibold mr-2 flex-shrink-0">1.</span>
                <span>Ελέγξτε το inbox (και το <span className="font-bold text-orange-600 bg-orange-100 px-1 rounded">spam folder</span>) του email σας</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 flex-shrink-0">2.</span>
                <span>Κάντε κλικ στον σύνδεσμο επιβεβαίωσης στο email</span>
              </li>
            </ol>
            
            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
              <p className="text-amber-800 text-xs sm:text-sm font-semibold">
                ⚠️ ΣΗΜΕΙΩΣΗ: Σε περίπτωση που δεν δείτε το email, περιμένετε 10-15 δευτερόλεπτα και ελέγξτε ξανά!
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold text-red-900 mb-1 text-sm sm:text-base">Σημαντική Παρατήρηση</h4>
                <p className="text-red-800 text-xs sm:text-sm leading-relaxed">
                  Δεν μπορείτε να χρησιμοποιήσετε την εφαρμογή μέχρι να επιβεβαιώσετε το email σας. 
                  Αυτό απαιτείται για την ασφάλεια του λογαριασμού σας.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                // Try to open the device's mail app
                const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobile) {
                  // Mobile device - try different mail apps
                  const mailApps = [
                    'googlegmail://co',           // Gmail app
                    'message://',                 // Apple Mail
                    'ms-outlook://',              // Outlook mobile
                    'ymail://',                   // Yahoo Mail
                    'mailto:'                     // Fallback
                  ];
                  
                  let opened = false;
                  for (let i = 0; i < mailApps.length; i++) {
                    try {
                      if (i === mailApps.length - 1) {
                        // Last attempt - use location.href
                        window.location.href = mailApps[i];
                      } else {
                        // Try window.open first
                        const newWindow = window.open(mailApps[i], '_blank');
                        if (newWindow) {
                          opened = true;
                          break;
                        }
                      }
                    } catch (e) {
                      // Continue to next app
                      continue;
                    }
                  }
                  
                  if (!opened) {
                    // If nothing worked, show instructions
                    alert('Παρακαλώ ανοίξτε χειροκίνητα την εφαρμογή mail σας για να ελέγξετε τα εισερχόμενά σας.');
                  }
                } else {
                  // Desktop - try to open default mail client
                  try {
                    window.location.href = 'mailto:';
                  } catch (e) {
                    alert('Παρακαλώ ανοίξτε την εφαρμογή mail σας για να ελέγξετε τα εισερχόμενά σας.');
                  }
                }
                
                onClose();
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-center">Μετάβαση στο Mail για Επιβεβαίωση</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPopup;
