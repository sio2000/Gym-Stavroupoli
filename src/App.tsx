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

// Lazy load other pages for better performance
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel'));
// Temporarily disable lazy loading for Profile to debug
import Profile from '@/pages/Profile';
const TrainerSpecificDashboard = React.lazy(() => import('@/pages/TrainerSpecificDashboard'));
const PersonalTraining = React.lazy(() => import('@/pages/PersonalTraining'));
const PersonalTrainingSchedule = React.lazy(() => import('@/pages/PersonalTrainingSchedule'));
const PaspartuTraining = React.lazy(() => import('@/pages/PaspartuTraining'));
const PilatesCalendar = React.lazy(() => import('@/pages/PilatesCalendar'));
const SecretaryDashboard = React.lazy(() => import('@/pages/SecretaryDashboard'));

// Public pages
const PublicRegistration = React.lazy(() => import('@/pages/PublicRegistration'));
const PublicLessons = React.lazy(() => import('@/pages/PublicLessons'));

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/public-registration" element={<React.Suspense fallback={<div>Φόρτωση...</div>}><PublicRegistration /></React.Suspense>} />
        <Route path="/public-lessons" element={<React.Suspense fallback={<div>Φόρτωση...</div>}><PublicLessons /></React.Suspense>} />
        
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
                  <Referral />
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
                  <AdminPanel />
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
                  <TrainerSpecificDashboard trainerName="Jordan" />
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
              <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
                <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
              <React.Suspense fallback={<div>Φόρτωση...</div>}>
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
  );
};

export default App;
