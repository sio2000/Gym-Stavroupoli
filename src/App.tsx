import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';
import Layout from '@/components/layout/Layout';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Dashboard from '@/pages/Dashboard';

// Restore user pages
const Bookings = React.lazy(() => import('@/pages/Bookings'));
const Membership = React.lazy(() => import('@/pages/Membership'));
const QRCodes = React.lazy(() => import('@/pages/QRCodes'));
const Referral = React.lazy(() => import('@/pages/Referral'));
const Extras = React.lazy(() => import('@/pages/Extras'));

// Lazy load other pages for better performance
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel'));
const ControlPanel = React.lazy(() => import('@/pages/ControlPanel'));
// Temporarily disable lazy loading for Profile to debug
import Profile from '@/pages/Profile';
const TrainerSpecificDashboard = React.lazy(() => import('@/pages/TrainerSpecificDashboard'));
const TrainerKaterina = React.lazy(() => import('@/pages/TrainerKaterina'));
const TrainerIoanna = React.lazy(() => import('@/pages/TrainerIoanna'));
const PersonalTraining = React.lazy(() => import('@/pages/PersonalTraining'));
const PersonalTrainingSchedule = React.lazy(() => import('@/pages/PersonalTrainingSchedule'));
const PaspartuTraining = React.lazy(() => import('@/pages/PaspartuTraining'));
const PilatesCalendar = React.lazy(() => import('@/pages/PilatesCalendar'));
const SecretaryDashboard = React.lazy(() => import('@/pages/SecretaryDashboard'));

// Public pages
const PublicRegistration = React.lazy(() => import('@/pages/PublicRegistration'));
const PublicLessons = React.lazy(() => import('@/pages/PublicLessons'));
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const AccountDeletion = React.lazy(() => import('@/pages/AccountDeletion'));
const DemoInfo = React.lazy(() => import('@/pages/DemoInfo'));

const App: React.FC = () => {
  return (
    <div className="dark">
      <BrowserRouter>
        <AuthProvider>
        <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/public-registration" element={<React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}><PublicRegistration /></React.Suspense>} />
        <Route path="/public-lessons" element={<React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}><PublicLessons /></React.Suspense>} />
        <Route path="/privacy-policy" element={<React.Suspense fallback={<div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">Φόρτωση πολιτικής απορρήτου…</div>}><PrivacyPolicy /></React.Suspense>} />
        <Route path="/contact" element={<React.Suspense fallback={<div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">Φόρτωση σελίδας επικοινωνίας…</div>}><Contact /></React.Suspense>} />
          <Route path="/delete-account" element={<React.Suspense fallback={<div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">Φόρτωση σελίδας διαγραφής λογαριασμού…</div>}><AccountDeletion /></React.Suspense>} />
        <Route path="/demo-info" element={<React.Suspense fallback={<div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">Φόρτωση demo πληροφοριών…</div>}><DemoInfo /></React.Suspense>} />
        
        {/* Protected routes */}
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* User routes */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <Bookings />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/membership"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <Membership />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-codes"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <QRCodes />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/referral"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <Referral />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Extras - Protected route for all users */}
        <Route
          path="/extras"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <Extras />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <AdminPanel />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Control Panel routes */}
        <Route
          path="/control-panel"
          element={
            <ProtectedRoute requiredRole="control_panel">
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <ControlPanel />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Specific trainer routes */}
        <Route
          path="/trainer/mike"
          element={
            <ProtectedRoute requiredRole="trainer">
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <TrainerSpecificDashboard trainerName="Mike" />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/trainer/jordan"
          element={
            <ProtectedRoute requiredRole="trainer">
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <TrainerSpecificDashboard trainerName="Jordan" />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trainer/katerina"
          element={
            <ProtectedRoute requiredRole="trainer">
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <TrainerKaterina />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trainer/ioanna"
          element={
            <ProtectedRoute requiredRole="trainer">
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <TrainerIoanna />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Personal Training - Public route (accessible with code) */}
        <Route
          path="/personal-training"
          element={
            <Layout>
              <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                <PersonalTraining />
              </React.Suspense>
            </Layout>
          }
        />

        {/* Personal Training Schedule - Protected route for users with Personal Training codes */}
        <Route
          path="/personal-training-schedule"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <PersonalTrainingSchedule />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Paspartu Training - Protected route for users with Paspartu Training schedules */}
        <Route
          path="/paspartu-training"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <PaspartuTraining />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Pilates Calendar - Protected route for users with active pilates membership */}
        <Route
          path="/pilates-calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                  <PilatesCalendar />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Secretary routes */}
        <Route
          path="/secretary/dashboard"
          element={
            <ProtectedRoute requiredRole="secretary">
              <React.Suspense fallback={<div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</div>}>
                <SecretaryDashboard />
              </React.Suspense>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;
