import React from 'react';
import PilatesScheduleDisplay from '@/components/pilates/PilatesScheduleDisplay';

const PilatesScheduleManagement: React.FC = () => {
  return (
    <PilatesScheduleDisplay
      readOnly={false}
      showAdminControls={true}
      title="Πρόγραμμα Pilates"
      subtitle="Κάντε κλικ στις ώρες που δεν θέλετε να είναι διαθέσιμες"
    />
  );
};

export default PilatesScheduleManagement;
