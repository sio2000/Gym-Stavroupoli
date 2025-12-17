import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NoActiveMembershipMessageProps {
  showQRMessage?: boolean;
  className?: string;
}

const NoActiveMembershipMessage: React.FC<NoActiveMembershipMessageProps> = ({ 
  showQRMessage = false, 
  className = '' 
}) => {
  return (
    <div className={`bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {showQRMessage ? 'Δεν έχετε ενεργές συνδρομές' : 'Κανένα ενεργό πακέτο'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {showQRMessage 
              ? 'Για να δημιουργήσετε QR codes, χρειάζεστε ενεργή συνδρομή. Παρακαλώ επικοινωνήστε με το γυμναστήριο για να συνεχίσετε.'
              : 'Δεν έχετε καμία ενεργή συνδρομή αυτή τη στιγμή. Επιλέξτε ένα πακέτο για να ξεκινήσετε.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Επιστροφή στο Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoActiveMembershipMessage;
