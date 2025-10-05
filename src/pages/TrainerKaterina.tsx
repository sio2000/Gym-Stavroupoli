import React from 'react';
import PilatesScheduleDisplay from '@/components/pilates/PilatesScheduleDisplay';

const TrainerKaterina: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-pink-600 font-bold text-lg">K</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Katerina - Pilates Schedule</h1>
            <p className="text-gray-600">Πρόγραμμα Pilates - Προβολή μόνο</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mr-4 shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">👁️ Προβολή Προγράμματος</span>
              </h4>
              <p className="text-gray-700 leading-relaxed">
                🎯 Αυτή η σελίδα εμφανίζει το <strong>πρόγραμμα Pilates</strong> όπως το έχει δημοσιεύσει ο Admin. 
                <br />
                🔒 <strong>Δεν μπορείτε να κάνετε αλλαγές</strong> - είναι προβολή μόνο για να δείτε τις κρατήσεις και τις ώρες.
                <br />
                💡 <strong>Tip:</strong> Κάντε κλικ σε μαθήματα με 👆 για να δείτε τις κρατήσεις!
              </p>
            </div>
          </div>
        </div>
      </div>

      <PilatesScheduleDisplay
        readOnly={true}
        trainerName="Katerina"
        showAdminControls={false}
        title="Πρόγραμμα Pilates - Katerina"
        subtitle=""
      />
    </div>
  );
};

export default TrainerKaterina;
