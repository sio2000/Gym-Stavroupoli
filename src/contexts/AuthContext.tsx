import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthContextType } from '@/types';
import toast from 'react-hot-toast';
import { supabase } from '@/config/supabase';
import { cleanupSupabaseAdmin } from '@/config/supabaseAdmin';
import { trackAppVisit } from '@/utils/appVisits';
import EmailConfirmationPopup from '@/components/EmailConfirmationPopup';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [showEmailConfirmationPopup, setShowEmailConfirmationPopup] = useState(false);

  // Utility function to clear all auth data
  const clearAllAuthData = () => {
    console.log('[Auth] Clearing all auth data...');
    setUser(null);
    setJustLoggedIn(false);
    setJustRegistered(false);
    setShowEmailConfirmationPopup(false);
    setIsLoading(false);
    setIsInitialized(false);
    
    // Clear all localStorage items related to auth
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('freegym') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any Supabase clients from window
    const w = window as any;
    if (w.__freegym_supabase) {
      delete w.__freegym_supabase;
    }
    
    console.log('[Auth] All auth data cleared');
  };

  useEffect(() => {
    console.log('[Auth] ===== AUTH CONTEXT USEEFFECT STARTED =====');
    console.log('[Auth] isInitialized:', isInitialized);
    
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('[Auth] Already initialized, skipping...');
      return;
    }
    
    let mounted = true;

    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        console.log('[Auth] Getting initial session...');
        
        // Check if we have a cached user first
        const cachedUser = localStorage.getItem('freegym_user');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            console.log('[Auth] Found cached user:', userData.email);
            setUser(userData);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          } catch (e) {
            console.log('[Auth] Invalid cached user data, clearing...');
            localStorage.removeItem('freegym_user');
          }
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[Auth] Session query result - session:', session?.user?.email, 'error:', error);
        
        if (error) {
          console.error('[Auth] Session error:', error);
          if (mounted) {
            console.log('[Auth] Clearing auth data due to session error');
            clearAllAuthData();
          }
          return;
        }
        
        console.log('[Auth] Initial session:', session?.user?.email);
        console.log('[Auth] User ID from session:', session?.user?.id);
        
        if (mounted && session?.user) {
          console.log('[Auth] Session found, loading user profile...');
          await loadUserProfile(session.user.id);
        } else if (mounted) {
          console.log('[Auth] No session found, setting loading to false and marking as initialized');
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('[Auth] Error getting initial session:', error);
        console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack');
        if (mounted) {
          console.log('[Auth] Clearing auth data due to exception');
          clearAllAuthData();
          console.log('[Auth] Setting isLoading to false and marking as initialized after error');
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    console.log('[Auth] Calling getInitialSession...');
    getInitialSession();

    // Listen for auth changes with better session management
    console.log('[Auth] Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state change:', event, session?.user?.email);
      console.log('[Auth] Mounted:', mounted);
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] SIGNED_IN event, loading user profile...');
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] SIGNED_OUT event, clearing user data');
        setUser(null);
        localStorage.removeItem('freegym_user');
        setIsLoading(false);
        setIsInitialized(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[Auth] TOKEN_REFRESHED event, loading user profile...');
        // Handle token refresh to maintain session
        await loadUserProfile(session.user.id);
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('[Auth] USER_UPDATED event, reloading user profile...');
        await loadUserProfile(session.user.id);
      }
    });

    return () => {
      console.log('[Auth] Cleaning up auth context useEffect');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);


  const loadUserProfile = async (userId: string) => {
    try {
      console.log('[Auth] ===== LOADING USER PROFILE =====');
      console.log('[Auth] User ID:', userId);
      console.log('[Auth] Supabase client:', supabase);
      
      console.log('[Auth] Starting profile query...');
      
      // Optimized timeout and retry logic for faster email confirmation login
      let profile, error;
      let retryCount = 0;
      const maxRetries = 2; // Reduced from 3 to 2
      
      while (retryCount < maxRetries) {
        try {
          const profileQueryPromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          // Reduced timeout from 15s to 8s for faster response
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile query timeout')), 30000)
          );
          
          const result = await Promise.race([
            profileQueryPromise,
            timeoutPromise
          ]) as any;
          
          profile = result.data;
          error = result.error;
          
          if (!error) {
            console.log('[Auth] Profile query successful on attempt', retryCount + 1);
            break;
          } else if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
            console.log('[Auth] Profile not found, retrying...');
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
              continue;
            }
          } else {
            console.log('[Auth] Profile query error, retrying...', error);
            // If it's a 406 error, try to continue with fallback user
            if (error.status === 406) {
              console.log('[Auth] 406 error detected, creating fallback user...');
              throw new Error('Profile query 406 error - using fallback');
            }
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
              continue;
            }
          }
        } catch (retryError) {
          console.log('[Auth] Profile query retry error:', retryError);
          // If it's a 406 error, try to continue with fallback user
          if (retryError instanceof Error && retryError.message?.includes('406 error')) {
            console.log('[Auth] 406 error detected in catch, creating fallback user...');
            throw retryError;
          }
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
            continue;
          } else {
            throw retryError;
          }
        }
      }

      console.log('[Auth] Profile query completed');
      console.log('[Auth] Profile data:', profile);
      console.log('[Auth] Profile error:', error);

      if (error) {
        console.error('[Auth] Profile query error:', error);
        console.error('[Auth] Error code:', error.code);
        console.error('[Auth] Error message:', error.message);
        console.error('[Auth] Error details:', error.details);
        console.error('[Auth] Error hint:', error.hint);
        throw error;
      }

      console.log('[Auth] Profile data from database:', JSON.stringify(profile, null, 2));
      console.log('[Auth] Profile role from database:', profile.role);
      console.log('[Auth] Profile dob:', profile.dob);
      console.log('[Auth] Profile address:', profile.address);
      console.log('[Auth] Profile emergency_contact:', profile.emergency_contact);
      console.log('[Auth] Profile profile_photo:', profile.profile_photo);
      console.log('[Auth] Profile profile_photo_locked:', profile.profile_photo_locked);
      console.log('[Auth] Profile dob_locked:', profile.dob_locked);

      console.log('[Auth] Getting auth user data...');
      // Get user from Supabase Auth (email only)
      const { data: authUser } = await supabase.auth.getUser();
      console.log('[Auth] Auth user data:', authUser.user?.email);
      console.log('[Auth] Auth user metadata:', authUser.user?.user_metadata);
      
      // Determine role: prefer database role, fallback to metadata, then default to 'user'
      // TEMPORARY FIX: Force admin role for admin@freegym.gr
      let userRole = profile.role || (authUser.user?.user_metadata as any)?.role || 'user';
      
      // Force admin role for admin@freegym.gr if database shows 'user'
      if (authUser.user?.email === 'admin@freegym.gr' && userRole === 'user') {
        console.warn('[Auth] TEMPORARY FIX: Forcing admin role for admin@freegym.gr');
        userRole = 'admin';
      }
      
      // Force trainer role for trainer emails if database shows 'user'
      if (authUser.user?.email?.includes('trainer') && userRole === 'user') {
        console.warn('[Auth] TEMPORARY FIX: Forcing trainer role for', authUser.user.email);
        userRole = 'trainer';
      }
      
      console.log('[Auth] Final user role determined:', userRole);
      
      console.log('[Auth] Creating user data object...');
      
      // Set fallback names for trainers if empty
      let firstName = profile.first_name || '';
      let lastName = profile.last_name || '';
      
      if (userRole === 'trainer' && !firstName) {
        if (authUser.user?.email?.includes('trainer1')) {
          firstName = 'Trainer';
          lastName = 'One';
        } else if (authUser.user?.email?.includes('trainer')) {
          firstName = 'Trainer';
          lastName = 'User';
        }
      }
      
      // Get referral points
      let referralPoints = 0;
      try {
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_referral_points')
          .select('points')
          .eq('user_id', userId)
          .single();
        
        if (!pointsError && pointsData) {
          referralPoints = pointsData.points || 0;
        }
      } catch (error) {
        console.log('[Auth] No referral points found for user, using default 0');
      }

      // Ensure user has referral code - ALWAYS generate if missing
      let referralCode = profile.referral_code;
      console.log('[Auth] Current referral code from profile:', referralCode);
      
      // Always call get_user_referral_code to ensure user has a code
      // This function will generate one if missing
      console.log('[Auth] Ensuring user has referral code...');
      try {
        const { data: codeData, error: codeError } = await supabase
          .rpc('get_user_referral_code', { p_user_id: userId });
        
        if (!codeError && codeData) {
          referralCode = codeData;
          console.log('[Auth] Referral code ensured/generated:', referralCode);
        } else {
          console.log('[Auth] Error ensuring referral code:', codeError);
          // Fallback: use existing code or empty string
          referralCode = profile.referral_code || '';
        }
      } catch (error) {
        console.log('[Auth] Error ensuring referral code:', error);
        // Fallback: use existing code or empty string
        referralCode = profile.referral_code || '';
      }

      const userData: User = {
        id: userId,
        email: authUser.user?.email || '',
        firstName: firstName,
        lastName: lastName,
        role: userRole,
        referralCode: referralCode || '',
        referralPoints: referralPoints,
        phone: profile.phone || '',
        avatar: profile.avatar || '',
        language: profile.language || 'el',
        createdAt: profile.created_at || new Date().toISOString(),
        updatedAt: profile.updated_at || new Date().toISOString(),
        // New profile fields
        dob: profile.dob || '',
        address: profile.address || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        profile_photo: profile.profile_photo || '',
        profile_photo_locked: profile.profile_photo_locked || false,
        dob_locked: profile.dob_locked || false
      };

      console.log('[Auth] Final user data:', JSON.stringify(userData, null, 2));
      console.log('[Auth] Setting user state...');
      setUser(userData);
      console.log('[Auth] Saving to localStorage...');
      localStorage.setItem('freegym_user', JSON.stringify(userData));
      
      // Mark as initialized and not loading
      setIsLoading(false);
      setIsInitialized(true);
      
      console.log('[Auth] ===== USER PROFILE LOADED SUCCESSFULLY =====');
    } catch (error) {
      console.error('[Auth] ===== ERROR LOADING USER PROFILE =====');
      console.error('[Auth] Error details:', error);
      console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // If it's a 406 error, try to continue with fallback user immediately
      if (error instanceof Error && error.message?.includes('406 error')) {
        console.log('[Auth] 406 error detected, proceeding with fallback user...');
      }
      
      console.log('[Auth] Attempting to create fallback user...');
      // Create a fallback user with basic info to prevent infinite loading
      try {
        // Add timeout to fallback user creation as well - increased to 10 seconds
        const fallbackPromise = supabase.auth.getUser();
        const fallbackTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fallback user creation timeout')), 30000)
        );
        
        const { data: authUser } = await Promise.race([
          fallbackPromise,
          fallbackTimeoutPromise
        ]) as any;
        
        console.log('[Auth] Fallback auth user data:', authUser.user?.email);
        
        if (authUser.user) {
          console.log('[Auth] Creating fallback user due to profile loading error');
          
          // Try to load profile one more time before creating fallback
          try {
            console.log('[Auth] Attempting one final profile load...');
            const { data: finalProfile, error: finalError } = await supabase
              .from('user_profiles')
              .select('first_name, last_name, referral_code, role')
              .eq('user_id', userId)
              .single();
            
            if (!finalError && finalProfile) {
              console.log('[Auth] Final profile load successful, using real data');
              const fallbackUser: User = {
                id: userId,
                email: authUser.user.email || '',
                firstName: finalProfile.first_name || 'User',
                lastName: finalProfile.last_name || 'User',
                role: finalProfile.role || 'user',
                referralCode: finalProfile.referral_code || '',
                language: 'el',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              console.log('[Auth] Fallback user data with real profile:', fallbackUser);
              setUser(fallbackUser);
              localStorage.setItem('freegym_user', JSON.stringify(fallbackUser));
              console.log('[Auth] ===== FALLBACK USER WITH REAL PROFILE CREATED =====');
              return;
            }
          } catch (finalProfileError) {
            console.log('[Auth] Final profile load failed, using email-based fallback');
          }
          
          // If final profile load fails, use email-based fallback
          const email = authUser.user.email || '';
          const emailName = email.split('@')[0];
          const firstName = emailName || 'User';
          const lastName = 'User';
          
          // Try to get referral code even for fallback user
          let referralCode = '';
          try {
            const { data: codeData, error: codeError } = await supabase
              .rpc('get_user_referral_code', { p_user_id: userId });
            
            if (!codeError && codeData) {
              referralCode = codeData;
            }
          } catch (error) {
            console.log('[Auth] Could not get referral code for fallback user');
          }
          
          const fallbackUser: User = {
            id: userId,
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: 'user',
            referralCode: referralCode,
            language: 'el',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          console.log('[Auth] Fallback user data:', fallbackUser);
          setUser(fallbackUser);
          localStorage.setItem('freegym_user', JSON.stringify(fallbackUser));
          
          // Mark as initialized and not loading
          setIsLoading(false);
          setIsInitialized(true);
          
          console.log('[Auth] ===== FALLBACK USER CREATED =====');
        } else {
          console.log('[Auth] No auth user available, setting user to null');
          setUser(null);
        }
      } catch (fallbackError) {
        console.error('[Auth] Error creating fallback user:', fallbackError);
        // Create a minimal fallback user even if auth fails
        // Try to get user info from auth before creating minimal user
        let userEmail = 'unknown@example.com';
        let userFirstName = 'Unknown';
        let userLastName = 'User';
        
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user?.email) {
            userEmail = authUser.user.email;
            const emailName = authUser.user.email.split('@')[0];
            userFirstName = emailName || 'User';
            userLastName = 'User';
          }
        } catch (authError) {
          console.log('[Auth] Could not get auth user for minimal fallback');
        }
        
        const minimalUser: User = {
          id: userId,
          email: userEmail,
          firstName: userFirstName,
          lastName: userLastName,
          role: 'user',
          referralCode: '',
          language: 'el',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('[Auth] Creating minimal fallback user due to auth error');
        setUser(minimalUser);
        localStorage.setItem('freegym_user', JSON.stringify(minimalUser));
        
        // Mark as initialized and not loading
        setIsLoading(false);
        setIsInitialized(true);
      }
      
      console.log('[Auth] ===== LOADUSERPROFILE COMPLETED =====');
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    console.log('[Auth] ===== LOGIN STARTED =====');
    console.log('[Auth] Login attempt for email:', credentials.email);
    try {
      setIsLoading(true);
      
      // Check for temporary password first
      const tempPassword = localStorage.getItem('temp_password');
      const tempEmail = localStorage.getItem('temp_email');
      
      if (tempPassword && tempEmail && 
          credentials.email.toLowerCase().trim() === tempEmail && 
          credentials.password === tempPassword) {
        console.log('[Auth] Using temporary password for login');
        
        // Clear temporary password
        localStorage.removeItem('temp_password');
        localStorage.removeItem('temp_email');
        
        // Get user from database using email
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, email, first_name, last_name, role')
          .eq('email', credentials.email.toLowerCase().trim())
          .single();

        if (profileError || !userProfile) {
          throw new Error('Δεν βρέθηκε χρήστης με αυτό το email');
        }

        // Load user profile and continue with normal flow
        await loadUserProfile(userProfile.user_id);
        console.log('[Auth] Temporary password login successful for:', credentials.email);
        
        // Set flag to indicate user just logged in
        setJustLoggedIn(true);
        
        toast.success('Συνδεθήκατε με προσωρινό κωδικό. Παρακαλώ αλλάξτε τον κωδικό σας.');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      console.log('[Auth] Login response:', { user: data.user?.email, error });

      if (error) {
        console.error('[Auth] Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('[Auth] Login successful, loading user profile...');
        await loadUserProfile(data.user.id);
        console.log('[Auth] Login completed successfully for:', data.user.email);
        
        // Set flag to indicate user just logged in
        setJustLoggedIn(true);
        
        // Track app visit on login
        try {
          await trackAppVisit(data.user.id, 'Login');
        } catch (error) {
          console.warn('[Auth] Failed to track login visit:', error);
        }
        
        // Show appropriate welcome message based on email
        if (data.user.email?.includes('trainer')) {
          toast.success(`Καλησπέρα Προπονητή!`);
        } else if (data.user.email === 'admin@freegym.gr') {
          toast.success(`Καλώς ήρθες, Admin!`);
        } else if (data.user.email?.includes('secretary')) {
          toast.success(`Καλώς ήρθες, Γραμματεία!`);
        } else {
          toast.success(`Καλώς ήρθες!`);
        }
      }
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      const message = error instanceof Error ? error.message : 'Σφάλμα κατά τη σύνδεση';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const waitForProfile = async (userId: string, timeoutMs = 15000, intervalMs = 600): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return true;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const { email, password, firstName, lastName, phone, language, referralCode } = data;

      console.log('[Auth] ===== REGISTRATION STARTED =====');
      console.log('[Auth] Registering user:', email);

      // Show popup immediately when registration starts
      console.log('[Auth] ===== SHOWING EMAIL CONFIRMATION POPUP IMMEDIATELY =====');
      setShowEmailConfirmationPopup(true);
      setJustRegistered(true);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone.trim()
          }
        }
      });

      console.log('[Auth] Auth signup response:', { user: authData.user?.email, error: authError });

      if (authError) {
        console.error('[Auth] Auth error:', authError);
        throw authError;
      }

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at === null) {
          toast.success('Εγγραφή ολοκληρώθηκε! Ελέγξτε το email σας για επιβεβαίωση.');
          return;
        }

        // Περιμένουμε να δημιουργηθεί το profile από το trigger
        const profileReady = await waitForProfile(authData.user.id);

        // Αν δεν προλάβει, κάνουμε ένα ασφαλές insert με όλα τα στοιχεία
        if (!profileReady) {
          console.log('[Auth] Trigger did not create profile, creating manually...');
          const { error: insertFallbackError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              first_name: firstName?.trim() || '',
              last_name: lastName?.trim() || '',
              email: email?.trim() || '',
              phone: phone?.trim() || null,
              role: 'user',
              language: language || 'el'
            });

          if (insertFallbackError) {
            console.error('Profile insert fallback error:', insertFallbackError);
            // Αν αποτύχει και το fallback, δημιουργούμε έναν minimal user
            const { error: minimalError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: authData.user.id,
                first_name: 'User',
                last_name: 'User',
                email: email?.trim() || '',
                role: 'user',
                language: 'el'
              });
            
            if (minimalError) {
              console.error('Minimal profile insert error:', minimalError);
            }
          }
        }

        // Φόρτωση προφίλ
        await loadUserProfile(authData.user.id);
        
        // Process referral code if provided
        if (referralCode?.trim()) {
          try {
            const { processReferralSignup } = await import('@/services/referralService');
            const result = await processReferralSignup(authData.user.id, referralCode.trim());
            
            if (result.success) {
              toast.success(`Ευχαριστούμε! ${result.message}`);
            } else {
              toast.error(result.message);
            }
          } catch (referralError) {
            console.error('Error processing referral:', referralError);
            // Don't fail registration if referral processing fails
            toast.error('Σφάλμα επεξεργασίας κωδικού παραπομπής, αλλά η εγγραφή ολοκληρώθηκε επιτυχώς.');
          }
        }
        
        toast.success('Εγγραφή ολοκληρώθηκε επιτυχώς!');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error instanceof Error ? error.message : 'Σφάλμα κατά την εγγραφή';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('[Auth] ===== LOGOUT STARTED =====');
    console.log('[Auth] Current user:', user?.email);
    try {
      setIsLoading(true);
      
      // Clear all auth data first
      clearAllAuthData();
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      console.log('[Auth] Supabase signOut completed');
      
      // Cleanup admin client to avoid GoTrueClient conflicts
      cleanupSupabaseAdmin();
      
      console.log('[Auth] Logout completed successfully');
      toast.success('Αποσυνδέθηκες επιτυχώς');
    } catch (error) {
      console.error('[Auth] Error during logout:', error);
      // Still clear local state even if logout fails
      cleanupSupabaseAdmin();
      clearAllAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearJustLoggedIn = () => {
    setJustLoggedIn(false);
  };

  const clearJustRegistered = () => {
    setJustRegistered(false);
  };

  const handleEmailConfirmationPopupClose = () => {
    setShowEmailConfirmationPopup(false);
    // Clear the justRegistered flag after showing the popup
    clearJustRegistered();
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      console.log('[Auth] ===== UPDATE PROFILE STARTED =====');
      console.log('[Auth] Update data:', JSON.stringify(data, null, 2));
      console.log('[Auth] Current user ID:', user?.id);
      
      setIsLoading(true);
      
      if (!user) throw new Error('Δεν είσαι συνδεδεμένος');
      
      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        // Don't update email to avoid duplicate key errors
        // email: data.email,
        phone: data.phone,
        date_of_birth: data.dob && data.dob.trim() !== '' ? data.dob : null,
        address: data.address && data.address.trim() !== '' ? data.address : null,
        emergency_contact_name: data.emergency_contact_name && data.emergency_contact_name.trim() !== '' ? data.emergency_contact_name : null,
        emergency_contact_phone: data.emergency_contact_phone && data.emergency_contact_phone.trim() !== '' ? data.emergency_contact_phone : null,
        profile_photo: data.profile_photo && data.profile_photo.trim() !== '' ? data.profile_photo : null,
        profile_photo_locked: data.profile_photo_locked,
        dob_locked: data.dob_locked,
        language: data.language,
        updated_at: new Date().toISOString()
      };
      
      console.log('[Auth] Update payload:', JSON.stringify(updateData, null, 2));
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        console.error('[Auth] Update error:', error);
        throw error;
      }

      console.log('[Auth] Update successful, updating local state...');
      
      // Update local user state instead of reloading
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('freegym_user', JSON.stringify(updatedUser));
      
      console.log('[Auth] ===== UPDATE PROFILE COMPLETED =====');
      toast.success('Το προφίλ ενημερώθηκε επιτυχώς');
    } catch (error) {
      console.error('[Auth] ===== UPDATE PROFILE FAILED =====');
      console.error('[Auth] Update error details:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του προφίλ');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!(user && isInitialized && !isLoading),
    isLoading: isLoading || !isInitialized,
    isInitialized,
    justLoggedIn,
    justRegistered,
    showEmailConfirmationPopup,
    login,
    register,
    logout,
    updateProfile,
    clearJustLoggedIn,
    clearJustRegistered,
    handleEmailConfirmationPopupClose
  };


  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('[Auth] ===== STATE CHANGE =====');
    console.log('[Auth] showEmailConfirmationPopup changed to:', showEmailConfirmationPopup);
    console.log('[Auth] justRegistered changed to:', justRegistered);
  }, [showEmailConfirmationPopup, justRegistered]);

  console.log('[Auth] ===== RENDERING AUTH PROVIDER =====');
  console.log('[Auth] showEmailConfirmationPopup:', showEmailConfirmationPopup);
  console.log('[Auth] justRegistered:', justRegistered);
  console.log('[Auth] user:', user?.email);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Email Confirmation Popup */}
      <EmailConfirmationPopup
        isOpen={showEmailConfirmationPopup}
        onClose={handleEmailConfirmationPopupClose}
        isRegistration={justRegistered}
        userEmail={user?.email || ''}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
