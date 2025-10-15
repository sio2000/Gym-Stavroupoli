import React from 'react';

export type InstallmentStatusType = 'pending' | 'paid' | 'overdue';

interface InstallmentStatusProps {
  status: InstallmentStatusType;
  className?: string;
}

const InstallmentStatus: React.FC<InstallmentStatusProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: InstallmentStatusType) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Αναμένεται Πληρωμή',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: '⏳',
          animation: 'animate-pulse'
        };
      case 'paid':
        return {
          text: 'Πληρωμένη δόση',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: '✅',
          animation: ''
        };
      case 'overdue':
        return {
          text: 'Ανεξόφλητη δόση!',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: '⚠️',
          animation: 'animate-pulse'
        };
      default:
        return {
          text: 'Άγνωστη κατάσταση',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: '❓',
          animation: ''
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.animation}
        ${className}
      `}
    >
      <span className="mr-1.5">{config.icon}</span>
      {config.text}
    </div>
  );
};

export default InstallmentStatus;
