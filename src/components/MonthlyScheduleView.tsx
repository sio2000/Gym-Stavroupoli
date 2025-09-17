import React from 'react';
import MonthlyScheduleSpreadsheetView from './MonthlyScheduleSpreadsheetView';

interface Session {
  id: string;
  scheduleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  trainer: string;
  room?: string;
  status: string;
  notes?: string;
}

interface MonthlyScheduleViewProps {
  sessions: Session[];
  trainerName: string;
  currentMonth: number;
  currentYear: number;
  onMonthChange?: (month: number, year: number) => void;
}

const MonthlyScheduleView: React.FC<MonthlyScheduleViewProps> = ({
  sessions,
  trainerName,
  currentMonth,
  currentYear,
  onMonthChange
}) => {

  // Always render the spreadsheet component (Excel-style only)
  return (
    <div>
      <MonthlyScheduleSpreadsheetView
        sessions={sessions}
        trainerName={trainerName}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={onMonthChange}
      />
    </div>
  );
};

export default MonthlyScheduleView;