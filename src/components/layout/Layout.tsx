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
  CreditCard,
  UserPlus,
  QrCode,
  Target,
  Star,
  Receipt
} from 'lucide-react';
import { cn } from '@/utils';
import { supabase } from '@/config/supabase';
import { trackPageVisit } from '@/utils/appVisits';
import { checkOverdueInstallment } from '@/services/api/installmentApi';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setHasApprovedMembership] = useState(false);
  const [hasPilatesMembership, setHasPilatesMembership] = useState(false);
  const [, setHasQRCodeAccess] = useState(false);
  const [hasPersonalTraining, setHasPersonalTraining] = useState(false);
  const [hasPaspartuTraining, setHasPaspartuTraining] = useState(false);
  // ADDED FOR INSTALLMENT_PLAN_PAGE - state for installment plan visibility
  const [hasInstallmentPlan, setHasInstallmentPlan] = useState(false);
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
      
      // Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
      const formatDateLocal = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      const todayStr = formatDateLocal(new Date());
      
      try {
        // Check for any active membership
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            id,
            package_id,
            end_date,
            membership_packages(package_type, name)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('end_date', todayStr); // Not expired

        // CRITICAL FIX: Client-side validation - filter out any memberships where end_date has passed
        // Using string comparison (YYYY-MM-DD format) to avoid timezone issues
        const validMemberships = (data || []).filter(membership => {
          // String comparison: "2026-02-02" >= "2026-02-02" is true (valid on last day)
          const isStillValid = membership.end_date >= todayStr;
          if (!isStillValid) {
            console.log('[Layout] Client-side filtering expired membership:', {
              id: membership.id,
              end_date: membership.end_date,
              todayStr: todayStr
            });
          }
          return isStillValid;
        });

        if (!error && validMemberships && validMemberships.length > 0) {
          setHasApprovedMembership(true);
        } else {
          setHasApprovedMembership(false);
        }

        // Check specifically for pilates membership - ONLY for pilates package type
        const { data: pilatesData } = await supabase
          .from('memberships')
          .select(`
            id,
            is_active,
            end_date,
            package_id,
            membership_packages(package_type, name)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('end_date', todayStr);

        // CRITICAL FIX: Client-side validation for pilates memberships too
        // Using string comparison (YYYY-MM-DD format) to avoid timezone issues
        const validPilatesData = (pilatesData || []).filter(membership => {
          return membership.end_date >= todayStr;
        });

        // Check if any of the active memberships is specifically for pilates
        const hasPilatesPackage = validPilatesData && validPilatesData.some(membership => {
          console.log('[Layout] Checking pilates membership:', membership);
          console.log('[Layout] Pilates membership packages:', membership.membership_packages);
          
          // Check if membership_packages is an array or single object
          const packages = Array.isArray(membership.membership_packages) 
            ? membership.membership_packages 
            : membership.membership_packages ? [membership.membership_packages] : [];
          
          return packages.some((pkg: any) => 
            pkg.package_type === 'pilates' || pkg.name === 'Pilates' || 
            pkg.package_type === 'ultimate' || pkg.name === 'Ultimate'
          );
        });

        if (hasPilatesPackage) {
          setHasPilatesMembership(true);
        } else {
          setHasPilatesMembership(false);
        }

        // Update QR Code access: show if user has Free Gym OR Pilates membership
        // Check for both Free Gym and Pilates package memberships
        console.log('[Layout] ===== CHECKING QR CODE ACCESS =====');
        console.log('[Layout] Active memberships data:', validMemberships);
        
        // CRITICAL FIX: Use validMemberships (client-side filtered) instead of raw data
        const hasQRCodeAccessMembership = validMemberships && validMemberships.some(membership => {
          console.log('[Layout] Checking membership:', membership);
          console.log('[Layout] Membership packages:', membership.membership_packages);
          
          // Check if membership_packages is an array or single object
          const packages = Array.isArray(membership.membership_packages) 
            ? membership.membership_packages 
            : membership.membership_packages ? [membership.membership_packages] : [];
          
          const hasPackage = packages.some((pkg: any) => {
            console.log('[Layout] Checking package:', pkg);
            const isFreeGym = pkg.package_type === 'free_gym' || 
                             pkg.package_type === 'standard' ||
                             pkg.name === 'Free Gym' ||
                             pkg.name === 'Ελεύθερο Gym';
            const isPilates = pkg.package_type === 'pilates' ||
                             pkg.name === 'Pilates' ||
                             pkg.name === 'Πιλάτες';
            const isUltimate = pkg.package_type === 'ultimate' ||
                              pkg.name === 'Ultimate' ||
                              pkg.name === 'Ultimate Medium';
            console.log('[Layout] Is Free Gym package?', isFreeGym);
            console.log('[Layout] Is Pilates package?', isPilates);
            console.log('[Layout] Is Ultimate package?', isUltimate);
            return isFreeGym || isPilates || isUltimate;
          });
          console.log('[Layout] Membership has QR access package?', hasPackage);
          return hasPackage;
        });
        
        console.log('[Layout] Has QR Code access membership?', hasQRCodeAccessMembership);
        
        // QR Code access for both Free Gym and Pilates memberships
        // Αλλά ελέγχουμε αν χρωστάει δόση που έχει κλειδωθεί
        if (hasQRCodeAccessMembership) {
          try {
            const hasOverdue = await checkOverdueInstallment();
            console.log('[Layout] Has overdue installment?', hasOverdue);
            
            // Αν έχει πρόσβαση από membership αλλά χρωστάει δόση, αποκρύπτουμε τα QR Codes
            setHasQRCodeAccess(!hasOverdue);
          } catch (error) {
            console.error('[Layout] Error checking overdue installment:', error);
            // Σε περίπτωση σφάλματος, δίνουμε πρόσβαση για ασφάλεια
            setHasQRCodeAccess(true);
          }
        } else {
          setHasQRCodeAccess(false);
        }
      } catch (error) {
        console.error('Error checking active membership:', error);
        setHasApprovedMembership(false);
        setHasPilatesMembership(false);
        setHasQRCodeAccess(false);
      }
    };

    checkActiveMembership();
  }, [user?.id, hasPersonalTraining]);

  // ADDED FOR INSTALLMENT_PLAN_PAGE - check if user has installment plan
  useEffect(() => {
    console.log('[Layout] useEffect triggered for installment plan check');
    console.log('[Layout] User object:', user);
    console.log('[Layout] User ID:', user?.id);
    
    const checkInstallmentPlan = async () => {
      console.log('[Layout] checkInstallmentPlan function called');
      
      if (!user?.id) {
        console.log('[Layout] No user ID, setting hasInstallmentPlan to false');
        setHasInstallmentPlan(false);
        return;
      }

      console.log('[Layout] User authenticated, checking installment plan for user:', user.id);

      try {
        // Dynamic import για να αποφύγουμε circular dependencies
        console.log('[Layout] Importing hasInstallmentPlan function...');
        const { hasInstallmentPlan: checkHasPlan } = await import('@/services/api/installmentApi');
        console.log('[Layout] Imported hasInstallmentPlan function');
        
        const hasPlan = await checkHasPlan();
        console.log('[Layout] hasInstallmentPlan result:', hasPlan);
        
        setHasInstallmentPlan(hasPlan);
        console.log('[Layout] Set hasInstallmentPlan state to:', hasPlan);
      } catch (error) {
        console.error('[Layout] Error checking installment plan:', error);
        setHasInstallmentPlan(false);
      }
    };

    // Προσθέτουμε ένα μικρό delay για να βεβαιωθούμε ότι ο χρήστης είναι πλήρως authenticated
    console.log('[Layout] Setting timeout for checkInstallmentPlan');
    const timeoutId = setTimeout(checkInstallmentPlan, 100);
    
    return () => {
      console.log('[Layout] Cleaning up timeout');
      clearTimeout(timeoutId);
    };
  }, [user?.id]);

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

  console.log('[Layout] Building navigation with hasInstallmentPlan:', hasInstallmentPlan);
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Αρχική', href: '/membership', icon: CreditCard },
    // Προσθέτουμε δυναμικά το Personal Training μόνο όταν είναι ενεργό
    ...(hasPersonalTraining ? [{ name: 'Personal Training', href: '/personal-training-schedule', icon: Calendar }] : []),
    // Προσθέτουμε δυναμικά το Paspartu Training μόνο όταν είναι ενεργό
    ...(hasPaspartuTraining ? [{ name: 'Paspartu Training', href: '/paspartu-training', icon: Target }] : []),
    // Προσθέτουμε δυναμικά το Ημερολόγιο Pilates μόνο όταν ο χρήστης έχει ενεργή pilates συνδρομή
    ...(hasPilatesMembership ? [{ name: 'Ημερολόγιο', href: '/pilates-calendar', icon: Calendar }] : []),
    // QR Codes εμφανίζεται πάντα στο μενού χρήστη
    { name: 'QR Codes', href: '/qr-codes', icon: QrCode },
    // ADDED FOR INSTALLMENT_PLAN_PAGE - add installment plan menu item conditionally
    ...(hasInstallmentPlan ? [{ name: 'Πλάνο Δόσεων', href: '/installment-plan', icon: Receipt }] : []),
    { name: 'Refer & Win', href: '/referral', icon: UserPlus },
    { name: 'Προφίλ', href: '/profile', icon: User },
    { name: 'Είσαι Γονέας?', href: '/extras', icon: Star },
  ];
  
  console.log('[Layout] Final navigation array:', navigation);

  // Admin specific navigation
  const adminNavigation = [
    { name: 'Διαχείριση Χρηστών', href: '/admin/users', icon: Users },
  ];

  // Trainer specific navigation
  const trainerNavigation = [
    { name: 'Mike', href: '/trainer/mike', icon: Users },
    { name: 'Jordan', href: '/trainer/jordan', icon: Users },
    { name: 'Katerina', href: '/trainer/katerina', icon: Users },
    { name: 'Ιωάννα', href: '/trainer/ioanna', icon: Users },
  ];

  // Control Panel specific navigation - empty array (no menu items)
  const controlPanelNavigation: { name: string; href: string; icon: any }[] = [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCurrentNavigation = () => {
    if (user?.role === 'admin') {
      return adminNavigation;
    } else if (user?.role === 'trainer') {
      return trainerNavigation; // μόνο για trainer
    } else if (user?.role === 'control_panel') {
      return controlPanelNavigation; // κενό μενού για control panel
    }
    return navigation;
  };

  const currentNav = getCurrentNavigation();

  return (
    <div className="min-h-screen bg-black mobile-safe-top mobile-full-height mobile-no-overflow flex flex-col">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-dark-900 mobile-safe-top mobile-safe-bottom">
          <div className="flex h-16 items-center justify-between px-4 border-b border-dark-700">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Get Fit Logo" 
                className="h-24 w-24 rounded-lg object-contain"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
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
                      ? "bg-primary-600 text-white"
                      : "text-gray-300 hover:bg-dark-700 hover:text-white"
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
          <div className="border-t border-dark-700 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-300 hover:bg-dark-700 hover:text-white rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              Αποσύνδεση
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-900 border-r border-dark-700">
          <div className="flex h-16 items-center px-4 border-b border-dark-700">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Get Fit Logo" 
                className="h-24 w-24 rounded-lg object-contain"
              />
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
                      ? "bg-primary-600 text-white"
                      : "text-gray-300 hover:bg-dark-700 hover:text-white"
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
          <div className="border-t border-dark-700 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-300 hover:bg-dark-700 hover:text-white rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              Αποσύνδεση
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-grow">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-dark-700 bg-dark-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 mobile-safe-top">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-4">
                <div className="text-sm">
                  <p className="font-medium text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-400 capitalize">{user?.role}</p>
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
        <main className="py-6 bg-black mobile-container flex-grow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mobile-container">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;
