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
      <div className="bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 my-4 sm:my-0 max-h-[90vh] overflow-y-auto">
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
            <div className="p-2 sm:p-3 bg-yellow-600/20 rounded-full flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Ελέγξτε το Email σας
              </h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {isRegistration 
                  ? 'Έχει σταλεί email επιβεβαίωσης στη διεύθυνση email που καταχωρήσατε.'
                  : 'Έχει σταλεί email επιβεβαίωσης στη διεύθυνση email σας.'
                }
              </p>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="font-semibold text-blue-400 mb-2 text-sm sm:text-base">Τι πρέπει να κάνετε:</h4>
            <ol className="text-blue-300 text-xs sm:text-sm space-y-2">
              <li className="flex items-start">
                <span className="font-semibold mr-2 flex-shrink-0">1.</span>
                <span>Ελέγξτε το inbox (και το <span className="font-bold text-orange-400 bg-orange-600/20 px-1 rounded">spam folder</span>) του email σας</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 flex-shrink-0">2.</span>
                <span>Κάντε κλικ στον σύνδεσμο επιβεβαίωσης στο email</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2 flex-shrink-0">3.</span>
                <div className="flex-1 min-w-0">
                  <span>Επιστρέψτε εδώ και συνδεθείτε ξανά</span>
                  <div className="mt-2 p-2 bg-amber-600/20 border border-amber-600/30 rounded-lg">
                    <p className="text-amber-400 text-xs font-semibold">
                      ⚠️ ΣΗΜΕΙΩΣΗ: Σε περίπτωση που δεν δείτε το email, περιμένετε 10-15 δευτερόλεπτα και ελέγξτε ξανά!
                    </p>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold text-red-400 mb-1 text-sm sm:text-base">Σημαντική Παρατήρηση</h4>
                <p className="text-red-300 text-xs sm:text-sm leading-relaxed">
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
                  // Mobile device - try different mail apps in order of preference
                  const mailApps = [
                    'googlegmail://co',           // Gmail app - inbox
                    'message://',                 // Apple Mail - inbox
                    'ms-outlook://',              // Outlook mobile - inbox
                    'ymail://',                   // Yahoo Mail - inbox
                    'outlook://',                 // Outlook desktop
                    'thunderbird://',             // Thunderbird
                    'mailto:'                     // Fallback to compose
                  ];
                  
                  let opened = false;
                  
                  // Try each mail app
                  for (let i = 0; i < mailApps.length; i++) {
                    try {
                      console.log(`[EmailConfirmationPopup] Trying mail app ${i + 1}: ${mailApps[i]}`);
                      
                      // Create a hidden iframe to test if the app exists
                      const iframe = document.createElement('iframe');
                      iframe.style.display = 'none';
                      iframe.src = mailApps[i];
                      document.body.appendChild(iframe);
                      
                      // Set a timeout to remove the iframe
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 1000);
                      
                      // If we get here without error, the app might exist
                      opened = true;
                      break;
                      
                    } catch (e) {
                      console.log(`[EmailConfirmationPopup] Mail app ${i + 1} failed:`, e);
                      continue;
                    }
                  }
                  
                  if (!opened) {
                    // If nothing worked, try the simple approach
                    try {
                      window.location.href = 'mailto:';
                      opened = true;
                    } catch (e) {
                      console.log('[EmailConfirmationPopup] All mail attempts failed');
                    }
                  }
                  
                  if (!opened) {
                    // Show instructions if nothing worked
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
