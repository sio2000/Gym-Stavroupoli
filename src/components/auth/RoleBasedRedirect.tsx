import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/users" replace />;
    case 'trainer':
      return <Navigate to="/trainer/mike" replace />;
    case 'secretary':
      return <Navigate to="/secretary/dashboard" replace />;
    case 'control_panel':
      return <Navigate to="/control-panel" replace />;
    case 'user':
    default:
      return <Navigate to="/membership" replace />;
  }
};

export default RoleBasedRedirect;
