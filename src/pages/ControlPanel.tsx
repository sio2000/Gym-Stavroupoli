import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock,
  DollarSign,
  Settings,
  Users,
  AlertTriangle,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import PilatesScheduleManagement from '@/components/admin/PilatesScheduleManagement';
import CashRegister from '@/components/admin/CashRegister';
import UsersInformation from '@/components/admin/UsersInformation';
import ErrorFixing from '@/components/admin/ErrorFixing';
import WorkoutProgramsManager from '@/components/admin/WorkoutProgramsManager';
import ErrorBoundary from '@/components/ErrorBoundary';



const ControlPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pilates-schedule' | 'cash-register' | 'users-information' | 'error-fixing' | 'workout-programs'>('pilates-schedule');

  // Tabs configuration
  const tabs = [
    { id: 'pilates-schedule', name: 'Πρόγραμμα Pilates', icon: Clock },
    { id: 'cash-register', name: 'Ταμείο', icon: DollarSign },
    { id: 'users-information', name: 'Χρήστες-Πληροφορίες', icon: Users },
    { id: 'workout-programs', name: 'Προγράμματα Προπόνησης', icon: Activity },
    { id: 'error-fixing', name: 'Διόρθωση Σφαλμάτων', icon: AlertTriangle }
  ];




  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
                  <p className="text-sm text-gray-500">Διαχείριση Pilates, Ταμείου, Πακέτων & Χρηστών</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Control Panel</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mx-4 mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto space-x-2 sm:space-x-8 px-3 sm:px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-3 font-semibold text-xs sm:text-sm flex items-center space-x-2 sm:space-x-3 transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {/* Pilates Schedule Tab */}
            {activeTab === 'pilates-schedule' && (
              <PilatesScheduleManagement />
            )}


            {/* Cash Register Tab */}
            {activeTab === 'cash-register' && (
              <CashRegister />
            )}

            {/* Users Information Tab */}
            {activeTab === 'users-information' && (
              <UsersInformation />
            )}

            {/* Workout Programs Tab */}
            {activeTab === 'workout-programs' && (
              <WorkoutProgramsManager />
            )}

            {/* Error Fixing Tab */}
            {activeTab === 'error-fixing' && (
              <ErrorFixing />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ControlPanel;
