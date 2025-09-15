import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home,
  Calendar,
  Users, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Settings,
  CreditCard,
  UserPlus,
  QrCode,
  Target
} from 'lucide-react';
import { cn } from '@/utils';
import { supabase } from '@/config/supabase';
import { trackPageVisit } from '@/utils/appVisits';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasApprovedMembership, setHasApprovedMembership] = useState(false);
  const [hasPilatesMembership, setHasPilatesMembership] = useState(false);
  const [hasQRCodeAccess, setHasQRCodeAccess] = useState(false);
  const [hasPersonalTraining, setHasPersonalTraining] = useState(false);
  const [hasPaspartuTraining, setHasPaspartuTraining] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check personal training status from database
  useEffect(() => {
    const checkPersonalTraining = async () => {
      if (!user?.id) {
        setHasPersonalTraining(false);
        setHasPaspartuTraining(false);
        return;
      }

      try {
        // Check if user has an accepted personal training schedule
        const { data: schedule, error } = await supabase
          .from('personal_training_schedules')
          .select('id, status, user_type, is_flexible')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error checking personal training schedule:', error);
          setHasPersonalTraining(false);
          setHasPaspartuTraining(false);
          return;
        }

        if (schedule && schedule.length > 0) {
          const scheduleData = schedule[0];
          // Check if it's a Personal user (locked schedule)
          if (scheduleData.user_type === 'personal' || (!scheduleData.user_type && !scheduleData.is_flexible)) {
            setHasPersonalTraining(true);
            setHasPaspartuTraining(false);
          }
          // Check if it's a Paspartu user (flexible schedule)
          else if (scheduleData.user_type === 'paspartu' || scheduleData.is_flexible) {
            setHasPersonalTraining(false);
            setHasPaspartuTraining(true);
          }
          // Default to Personal for backward compatibility
          else {
            setHasPersonalTraining(true);
            setHasPaspartuTraining(false);
          }
        } else {
          setHasPersonalTraining(false);
          setHasPaspartuTraining(false);
        }
      } catch (error) {
        console.error('Exception checking personal training:', error);
        setHasPersonalTraining(false);
        setHasPaspartuTraining(false);
      }
    };

    checkPersonalTraining();
  }, [user?.id]);

  // Check if user has active membership and track page visits
  useEffect(() => {
    const checkActiveMembership = async () => {
      if (!user?.id) return;
      
      try {
        // Check for any active membership
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            id,
            membership_packages(package_type)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          setHasApprovedMembership(true);
        } else {
          setHasApprovedMembership(false);
        }

        // Check specifically for pilates membership - ONLY for pilates package type
        const { data: pilatesData, error: pilatesError } = await supabase
          .from('memberships')
          .select(`
            id,
            is_active,
            end_date,
            membership_packages(package_type)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString().split('T')[0]);

        // Check if any of the active memberships is specifically for pilates
        const hasPilatesPackage = pilatesData && pilatesData.some(membership => 
          membership.membership_packages?.package_type === 'pilates'
        );

        if (hasPilatesPackage) {
          setHasPilatesMembership(true);
        } else {
          setHasPilatesMembership(false);
        }

        // Update QR Code access: only show if user has Free Gym membership (package appears locked in membership page)
        // Check specifically for Free Gym/standard package membership
        const hasFreeGymMembership = data && data.some(membership => 
          membership.membership_packages?.package_type === 'free_gym' || 
          membership.membership_packages?.package_type === 'standard'
        );
        
        // QR Code access should only be for Free Gym memberships, NOT for personal training or pilates
        setHasQRCodeAccess(hasFreeGymMembership);
      } catch (error) {
        console.error('Error checking active membership:', error);
        setHasApprovedMembership(false);
        setHasPilatesMembership(false);
        setHasQRCodeAccess(false);
      }
    };

    checkActiveMembership();
  }, [user?.id, hasPersonalTraining]);

  // Track page visits when location changes (with debouncing)
  useEffect(() => {
    if (user?.id) {
      const pageName = location.pathname.split('/').pop() || 'Home';
      
      // Only track if it's not a duplicate visit within 5 seconds
      const now = Date.now();
      const lastVisitKey = `lastVisit_${pageName}`;
      const lastVisit = localStorage.getItem(lastVisitKey);
      
      if (!lastVisit || now - parseInt(lastVisit) > 5000) {
        trackPageVisit(user.id, pageName);
        localStorage.setItem(lastVisitKey, now.toString());
      }
    }
  }, [location.pathname, user?.id]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Συνδρομή', href: '/membership', icon: CreditCard },
    // Προσθέτουμε δυναμικά το Personal Training μόνο όταν είναι ενεργό
    ...(hasPersonalTraining ? [{ name: 'Personal Training', href: '/personal-training-schedule', icon: Calendar }] : []),
    // Προσθέτουμε δυναμικά το Paspartu Training μόνο όταν είναι ενεργό
    ...(hasPaspartuTraining ? [{ name: 'Paspartu Training', href: '/paspartu-training', icon: Target }] : []),
    // Προσθέτουμε δυναμικά το Ημερολόγιο Pilates μόνο όταν ο χρήστης έχει ενεργή pilates συνδρομή
    ...(hasPilatesMembership ? [{ name: 'Ημερολόγιο', href: '/pilates-calendar', icon: Calendar }] : []),
    // Προσθέτουμε δυναμικά το QR Codes μόνο όταν ο χρήστης έχει personal training ή pilates συνδρομή
    ...(hasQRCodeAccess ? [{ name: 'QR Codes', href: '/qr-codes', icon: QrCode }] : []),
    { name: 'Παραπομπές', href: '/referral', icon: UserPlus },
    { name: 'Προφίλ', href: '/profile', icon: User },
  ];

  // Admin specific navigation
  const adminNavigation = [
    { name: 'Διαχείριση Χρηστών', href: '/admin/users', icon: Users },
  ];

  // Trainer specific navigation
  const trainerNavigation = [
    { name: 'Mike', href: '/trainer/mike', icon: Users },
    { name: 'Jordan', href: '/trainer/jordan', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCurrentNavigation = () => {
    if (user?.role === 'admin') {
      return adminNavigation;
    } else if (user?.role === 'trainer') {
      return trainerNavigation; // μόνο για trainer
    }
    return navigation;
  };

  const currentNav = getCurrentNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Get Fit</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {currentNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Αποσύνδεση
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Get Fit</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {currentNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Αποσύνδεση
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                <Settings className="h-6 w-6" />
              </button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
