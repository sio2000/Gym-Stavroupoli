import React from 'react';
import { CheckCircle, X, ExternalLink } from 'lucide-react';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, onClose, packageName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 mobile-safe-top mobile-safe-bottom">
      <div className="bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 transform transition-all duration-300 ease-out max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 pb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-white">Επιτυχής Δημιουργία Αιτήματος</h3>
              <p className="text-sm text-gray-300 truncate">Πακέτο: {packageName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 sm:p-4 mb-4">
            <p className="text-green-400 text-sm leading-relaxed">
              Το αίτημα συνδρομής σας δημιουργήθηκε επιτυχώς και βρίσκεται σε εκκρεμότητα για έγκριση.
            </p>
          </div>
          
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 sm:p-4 mb-6">
            <p className="text-blue-400 text-sm leading-relaxed">
              Παρακαλούμε, μεταβείτε τώρα στη γραμματεία του γυμναστηρίου και πραγματοποιήστε την πληρωμή για το πακέτο που επιλέξατε, ώστε να εγκριθεί η συνδρομή σας.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onClose}
              className="w-full bg-dark-700 text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-dark-600 transition-colors"
            >
              Κατάλαβα
            </button>
            <button
              onClick={() => {
                // Open gym location in maps with specific address
                const address = 'Μαιάνδρου 43, Κορδελιό Εύοσμος 562 24';
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                window.open(mapsUrl, '_blank');
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Βρείτε το Γυμναστήριο</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-dark-700 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            Θα λάβετε ειδοποίηση όταν το αίτημά σας εγκριθεί
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
