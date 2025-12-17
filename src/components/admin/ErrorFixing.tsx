import React, { useState } from 'react';
import { supabase } from '@/config/supabase';
import { AlertTriangle, RefreshCw, Loader2, User, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserWithoutProfile {
  id: string;
  email: string;
  created_at: string;
}

interface UnconfirmedEmailUser {
  user_id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  full_name: string | null;
  confirmation_status: string;
}

const ErrorFixing: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [usersWithoutProfiles, setUsersWithoutProfiles] = useState<UserWithoutProfile[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  // Feature toggle: hide Users Without Profile section while keeping code for reuse
  const showUsersWithoutProfileSection = false;

  // State για unconfirmed emails
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFixing, setEmailFixing] = useState(false);
  const [unconfirmedEmails, setUnconfirmedEmails] = useState<UnconfirmedEmailUser[]>([]);
  const [emailLastChecked, setEmailLastChecked] = useState<Date | null>(null);

  // State για Pilates lessons
  const [pilatesUserEmail, setPilatesUserEmail] = useState('');
  const [pilatesLoading, setPilatesLoading] = useState(false);
  const [pilatesUpdating, setPilatesUpdating] = useState(false);
  const [pilatesUserData, setPilatesUserData] = useState<any>(null);
  const [pilatesLessonCount, setPilatesLessonCount] = useState('');

  const checkUsersWithoutProfiles = async () => {
    setLoading(true);
    try {
      // Χρησιμοποιούμε το RPC function που δημιουργήσαμε
      const { data, error } = await supabase.rpc('get_users_without_profiles');

      if (error) {
        throw error;
      }

      const usersWithoutProfileData: UserWithoutProfile[] = data || [];

      setUsersWithoutProfiles(usersWithoutProfileData);
      setLastChecked(new Date());
      
      if (usersWithoutProfileData.length === 0) {
        toast.success('Δεν βρέθηκαν χρήστες με σφάλματα!');
      } else {
        toast.success(`Βρέθηκαν ${usersWithoutProfileData.length} χρήστες με σφάλματα`);
      }
    } catch (error) {
      console.error('Error checking users:', error);
      toast.error('Σφάλμα κατά τον έλεγχο χρηστών');
    } finally {
      setLoading(false);
    }
  };

  const fixUsersWithoutProfiles = async () => {
    if (usersWithoutProfiles.length === 0) {
      toast.error('Δεν υπάρχουν χρήστες προς διόρθωση');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ ΠΡΟΣΟΧΗ!\n\n` +
      `Πρόκειται να διορθώσετε ${usersWithoutProfiles.length} χρήστες.\n\n` +
      `Αυτή η ενέργεια θα δημιουργήσει user profiles για όλους αυτούς τους χρήστες.\n\n` +
      `Είστε σίγουροι ότι θέλετε να συνεχίσετε;`
    );

    if (!confirmed) {
      return;
    }

    setFixing(true);
    try {
      const { data, error } = await supabase.rpc('fix_users_without_profiles');

      if (error) {
        throw error;
      }

      const result = data?.[0];
      const createdCount = result?.created_count || 0;

      if (createdCount > 0) {
        toast.success(`✅ Επιτυχής διόρθωση! Δημιουργήθηκαν ${createdCount} user profiles`);
        // Ξανακάνουμε έλεγχο για να δούμε τα νέα αποτελέσματα
        await checkUsersWithoutProfiles();
      } else {
        toast.success('Δεν χρειάστηκε να δημιουργηθούν νέα profiles');
      }
    } catch (error) {
      console.error('Error fixing users:', error);
      toast.error('Σφάλμα κατά τη διόρθωση χρηστών');
    } finally {
      setFixing(false);
    }
  };

  const checkUnconfirmedEmails = async () => {
    setEmailLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_unconfirmed_emails');

      if (error) {
        throw error;
      }

      const unconfirmedUsers: UnconfirmedEmailUser[] = data || [];

      setUnconfirmedEmails(unconfirmedUsers);
      setEmailLastChecked(new Date());
      
      if (unconfirmedUsers.length === 0) {
        toast.success('Δεν βρέθηκαν χρήστες με μη επιβεβαιωμένο email!');
      } else {
        toast.success(`Βρέθηκαν ${unconfirmedUsers.length} χρήστες με μη επιβεβαιωμένο email`);
      }
    } catch (error) {
      console.error('Error checking unconfirmed emails:', error);
      toast.error('Σφάλμα κατά τον έλεγχο unconfirmed emails');
    } finally {
      setEmailLoading(false);
    }
  };

  const confirmAllEmails = async () => {
    if (unconfirmedEmails.length === 0) {
      toast.error('Δεν υπάρχουν emails προς επιβεβαίωση');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ ΠΡΟΣΟΧΗ!\n\n` +
      `Πρόκειται να επιβεβαιώσετε αυτόματα ${unconfirmedEmails.length} emails χρηστών.\n\n` +
      `Αυτή η ενέργεια θα θέσει το email_confirmed_at σε NOW() για όλους αυτούς τους χρήστες.\n\n` +
      `Οι χρήστες δεν θα χρειαστεί πλέον να επιβεβαιώσουν το email τους.\n\n` +
      `Είστε ΑΠΟΛΥΤΩΣ σίγουροι ότι θέλετε να συνεχίσετε;`
    );

    if (!confirmed) {
      return;
    }

    setEmailFixing(true);
    try {
      const { data, error } = await supabase.rpc('confirm_all_emails');

      if (error) {
        throw error;
      }

      const result = data?.[0];
      const confirmedCount = result?.confirmed_count || 0;

      if (confirmedCount > 0) {
        toast.success(`✅ Επιτυχής επιβεβαίωση! Επιβεβαιώθηκαν ${confirmedCount} emails`);
        // Ξανακάνουμε έλεγχο για να δούμε τα νέα αποτελέσματα
        await checkUnconfirmedEmails();
      } else {
        toast.success('Δεν χρειάστηκε να επιβεβαιωθούν emails');
      }
    } catch (error) {
      console.error('Error confirming emails:', error);
      toast.error('Σφάλμα κατά την επιβεβαίωση emails');
    } finally {
      setEmailFixing(false);
    }
  };

  const checkPilatesLessons = async () => {
    if (!pilatesUserEmail.trim()) {
      toast.error('Παρακαλώ εισάγετε email χρήστη');
      return;
    }

    setPilatesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_pilates_lessons', {
        p_user_email: pilatesUserEmail.trim()
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast.error('Δεν βρέθηκε χρήστης με αυτό το email');
        setPilatesUserData(null);
        return;
      }

      setPilatesUserData(data[0]);
      toast.success('Βρέθηκαν τα δεδομένα του χρήστη');
    } catch (error) {
      console.error('Error checking Pilates lessons:', error);
      toast.error('Σφάλμα κατά τον έλεγχο Pilates μαθημάτων');
      setPilatesUserData(null);
    } finally {
      setPilatesLoading(false);
    }
  };

  const updatePilatesLessons = async () => {
    if (!pilatesUserEmail.trim()) {
      toast.error('Παρακαλώ εισάγετε email χρήστη');
      return;
    }

    const lessonCount = parseInt(pilatesLessonCount);
    if (isNaN(lessonCount) || lessonCount < 0) {
      toast.error('Παρακαλώ εισάγετε έγκυρο αριθμό μαθημάτων (≥0)');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ ΠΡΟΣΟΧΗ!\n\n` +
      `Πρόκειται να ορίσετε τα διαθέσιμα Pilates μαθήματα του χρήστη ${pilatesUserEmail} σε ${lessonCount}.\n\n` +
      `Προηγούμενος αριθμός: ${pilatesUserData?.total_active_lessons || 0} μαθήματα\n` +
      `Νέος αριθμός: ${lessonCount} μαθήματα\n\n` +
      `Είστε ΑΠΟΛΥΤΩΣ σίγουροι ότι θέλετε να συνεχίσετε;`
    );

    if (!confirmed) {
      return;
    }

    setPilatesUpdating(true);
    try {
      const { data, error } = await supabase.rpc('set_user_pilates_lessons', {
        p_user_email: pilatesUserEmail.trim(),
        p_lesson_count: lessonCount
      });

      if (error) {
        throw error;
      }

      const result = data?.[0];
      if (result?.success) {
        toast.success(
          `✅ ${result.message}\n` +
          `Προηγούμενα: ${result.previous_lesson_count} → Νέα: ${result.new_lesson_count} μαθήματα`
        );
        // Ξανακάνουμε έλεγχο για να δούμε τα νέα αποτελέσματα
        await checkPilatesLessons();
        setPilatesLessonCount('');
      } else {
        toast.error(result?.message || 'Σφάλμα κατά την ενημέρωση');
      }
    } catch (error) {
      console.error('Error updating Pilates lessons:', error);
      toast.error('Σφάλμα κατά την ενημέρωση Pilates μαθημάτων');
    } finally {
      setPilatesUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-red-600 mb-3">
              ⚠️ ΠΡΟΣΟΧΗ - Σελίδα Διόρθωσης Σφαλμάτων
            </h3>
            <div className="text-red-800 space-y-2 text-base">
              <p className="font-medium">• Αυτή η σελίδα είναι <strong className="text-red-900">ΜΟΝΟ για περιπτώσεις ανάγκης</strong></p>
              <p className="font-medium">• ΜΗΝ χρησιμοποιείτε τα κουμπιά χωρίς λόγο</p>
              <p className="font-medium">• ΜΗΝ κάνετε spam (πολλαπλές χρήσεις σε λίγο χρονικό διάστημα)</p>
              <p className="font-medium">• Χρησιμοποιήστε ΜΟΝΟ όταν υπάρχει πραγματικό πρόβλημα</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {showUsersWithoutProfileSection && (
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Title Row with Example Image on the RIGHT */}
        <div className="flex items-start justify-between gap-6 mb-6">
          {/* Left: Title and Description */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">
              Έλεγχος Χρηστών Χωρίς Profile
            </h2>
            <p className="text-gray-400 text-sm">
              Ελέγχει για χρήστες που δεν αναγνωρίζονται από το σύστημα
            </p>
          </div>

          {/* RIGHT: Example Image Box - ΜΕΓΑΛΥΤΕΡΟ */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-300 font-bold text-sm">
                  📌 Πότε χρησιμοποιούμε αυτό το Section;
                </span>
              </div>
              
              <div className="bg-black/60 rounded p-2 mb-3 border border-gray-700">
                <img 
                  src="/sf.png" 
                  alt="Σφάλμα χρήστη" 
                  className="w-full h-auto rounded shadow-xl"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-red-300 text-center py-4 text-sm">⚠️ Η εικόνα sf.png<br/>δεν βρέθηκε στο /public</div>';
                    }
                  }}
                />
              </div>
              
              <p className="text-yellow-200 text-sm leading-relaxed">
                <strong className="text-yellow-300">Όταν βλέπετε αυτό το σφάλμα στον πελάτη</strong>, 
                χρησιμοποιήστε αυτό το section για να διορθώσετε το πρόβλημα! 
                <span className="block mt-3 text-red-300 font-bold">
                  ⚠️ ΠΡΟΣΟΧΗ: Αφού διορθώσετε το σφάλμα, πείτε στον πελάτη να αποσυνδεθεί και να επανασυνδεθεί ελέγχοντας ότι πλέον του λειτουργεί κανονικά η εφαρμογή.
                </span>
                <span className="block mt-2 text-green-300 font-semibold">
                  ✅ Αυτό είναι το σωστό section!
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Button Row */}
        <div className="flex justify-end mb-6">
          <button
            onClick={checkUsersWithoutProfiles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Έλεγχος...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                <span>Έλεγχος Χρηστών</span>
              </>
            )}
          </button>
        </div>

        {lastChecked && (
          <div className="mb-4 text-sm text-gray-400">
            Τελευταίος έλεγχος: {formatDate(lastChecked.toISOString())}
          </div>
        )}

        {/* Results Section */}
        {usersWithoutProfiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Χρήστες με Σφάλματα ({usersWithoutProfiles.length})
              </h3>
              <div className="px-3 py-1 bg-red-600 rounded-full text-white text-sm font-medium">
                {usersWithoutProfiles.length} Πρόβλημα{usersWithoutProfiles.length !== 1 ? 'τα' : ''}
              </div>
            </div>
            
            <div className="space-y-3">
              {usersWithoutProfiles.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">User ID</div>
                        <div className="text-sm text-white font-mono break-all">
                          {user.id}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">Email</div>
                        <div className="text-sm text-white break-all">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">Δημιουργήθηκε</div>
                        <div className="text-sm text-white">
                          {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fix Button */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={fixUsersWithoutProfiles}
                disabled={fixing || loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              >
                {fixing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Διόρθωση σε εξέλιξη...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6" />
                    <span>🔧 Διόρθωση Όλων των Χρηστών ({usersWithoutProfiles.length})</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Θα δημιουργηθούν user profiles για όλους τους χρήστες με σφάλματα
              </p>
            </div>
          </div>
        )}

        {!loading && usersWithoutProfiles.length === 0 && lastChecked && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
              <User className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Όλα Καλά! ✓
            </h3>
            <p className="text-gray-400">
              Δεν βρέθηκαν χρήστες χωρίς profile
            </p>
          </div>
        )}

        {!loading && !lastChecked && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <RefreshCw className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Έτοιμο για Έλεγχο
            </h3>
            <p className="text-gray-400">
              Πατήστε το κουμπί "Έλεγχος Χρηστών" για να ξεκινήσει ο έλεγχος
            </p>
          </div>
        )}
      </div>
      )}

      {/* UNCONFIRMED EMAILS SECTION */}
      <div className="bg-gray-800 rounded-lg p-6 border-t-4 border-orange-500">
        {/* Title Row with Example Image on the RIGHT */}
        <div className="flex items-start justify-between gap-6 mb-6">
          {/* Left: Title and Description */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Mail className="h-6 w-6 text-orange-500" />
              Έλεγχος Μη Επιβεβαιωμένων Emails
            </h2>
            <p className="text-gray-400 text-sm">
              Ελέγχει για χρήστες που δεν έχουν επιβεβαιώσει το email τους
            </p>
          </div>

          {/* RIGHT: Example Image Box - ΜΕΓΑΛΥΤΕΡΟ */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border-2 border-orange-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <span className="text-orange-300 font-bold text-sm">
                  📌 Πότε χρησιμοποιούμε αυτό το Section;
                </span>
              </div>
              
              <div className="bg-black/60 rounded p-2 mb-3 border border-gray-700">
                <img 
                  src="/mm.png" 
                  alt="Μη επιβεβαιωμένο email" 
                  className="w-full h-auto rounded shadow-xl"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-red-300 text-center py-4 text-sm">⚠️ Η εικόνα mm.png<br/>δεν βρέθηκε στο /public</div>';
                    }
                  }}
                />
              </div>
              
              <p className="text-orange-200 text-sm leading-relaxed">
                <strong className="text-orange-300">Όταν βλέπετε αυτό το σφάλμα</strong>, 
                χρησιμοποιήστε αυτό το section για να επιβεβαιώσετε τα emails! 
                <span className="block mt-2 text-green-300 font-semibold">
                  ✅ Αυτό είναι το σωστό section!
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Button Row */}
        <div className="flex justify-end mb-6">
          <button
            onClick={checkUnconfirmedEmails}
            disabled={emailLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {emailLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Έλεγχος...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                <span>Έλεγχος Emails</span>
              </>
            )}
          </button>
        </div>

        {emailLastChecked && (
          <div className="mb-4 text-sm text-gray-400">
            Τελευταίος έλεγχος: {formatDate(emailLastChecked.toISOString())}
          </div>
        )}

        {/* Results Section for Unconfirmed Emails */}
        {unconfirmedEmails.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Χρήστες με Μη Επιβεβαιωμένο Email ({unconfirmedEmails.length})
              </h3>
              <div className="px-3 py-1 bg-orange-600 rounded-full text-white text-sm font-medium">
                {unconfirmedEmails.length} Μη Επιβεβαιωμένο{unconfirmedEmails.length !== 1 ? 'α' : ''}
              </div>
            </div>
            
            <div className="space-y-3">
              {unconfirmedEmails.map((user) => (
                <div
                  key={user.user_id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">Email</div>
                        <div className="text-sm text-white break-all">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">Όνομα Χρήστη</div>
                        <div className="text-sm text-white">
                          {user.display_name || user.full_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">Δημιουργήθηκε</div>
                        <div className="text-sm text-white">
                          {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-400 font-medium">
                          {user.confirmation_status}
                        </span>
                      </div>
                      {user.last_sign_in_at && (
                        <div className="text-xs text-gray-400">
                          Τελευταία σύνδεση: {formatDate(user.last_sign_in_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm All Emails Button */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={confirmAllEmails}
                disabled={emailFixing || emailLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              >
                {emailFixing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Επιβεβαίωση σε εξέλιξη...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-6 w-6" />
                    <span>✅ Επιβεβαίωση Όλων των Emails ({unconfirmedEmails.length})</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                ⚠️ Θα επιβεβαιωθούν αυτόματα όλα τα μη επιβεβαιωμένα emails
              </p>
            </div>
          </div>
        )}

        {!emailLoading && unconfirmedEmails.length === 0 && emailLastChecked && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Όλα Καλά! ✓
            </h3>
            <p className="text-gray-400">
              Δεν βρέθηκαν χρήστες με μη επιβεβαιωμένο email
            </p>
          </div>
        )}

        {!emailLoading && !emailLastChecked && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <RefreshCw className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Έτοιμο για Έλεγχο
            </h3>
            <p className="text-gray-400">
              Πατήστε το κουμπί "Έλεγχος Emails" για να ξεκινήσει ο έλεγχος
            </p>
          </div>
        )}
      </div>

      {/* PILATES LESSONS SECTION */}
      <div className="bg-gray-800 rounded-lg p-6 border-t-4 border-purple-500">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-500" />
            Διαχείριση Pilates Μαθημάτων
          </h2>
          <p className="text-gray-400 text-sm">
            Έλεγχος και ενημέρωση διαθέσιμων Pilates μαθημάτων χρήστη
          </p>
        </div>

        {/* Input για Email */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium text-white mb-2">
            Email Χρήστη
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={pilatesUserEmail}
              onChange={(e) => setPilatesUserEmail(e.target.value)}
              placeholder="π.χ. evipana600@yahoo.gr"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              disabled={pilatesLoading || pilatesUpdating}
            />
            <button
              onClick={checkPilatesLessons}
              disabled={pilatesLoading || pilatesUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {pilatesLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Έλεγχος...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>Έλεγχος</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {pilatesUserData && (
          <div className="space-y-4">
            {/* User Info Card */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Στοιχεία Χρήστη
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="text-xs text-gray-400">Όνομα</div>
                    <div className="text-sm text-white">
                      {pilatesUserData.first_name} {pilatesUserData.last_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="text-xs text-gray-400">Email</div>
                    <div className="text-sm text-white break-all">
                      {pilatesUserData.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lessons Info Card */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Διαθέσιμα Μαθήματα Pilates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {pilatesUserData.total_active_lessons}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ενεργά Μαθήματα</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {pilatesUserData.total_all_lessons}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Συνολικά Μαθήματα</div>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {pilatesUserData.total_deposits}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Deposits</div>
                </div>
              </div>
            </div>

            {/* Update Lessons Section */}
            <div className="bg-gray-700/50 rounded-lg p-4 border-t-2 border-purple-500">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Ενημέρωση Μαθημάτων
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Ορίστε τον νέο αριθμό διαθέσιμων μαθημάτων για τον χρήστη
              </p>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    Νέος Αριθμός Μαθημάτων
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pilatesLessonCount}
                    onChange={(e) => setPilatesLessonCount(e.target.value)}
                    placeholder="π.χ. 12"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    disabled={pilatesUpdating}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={updatePilatesLessons}
                    disabled={pilatesUpdating || !pilatesLessonCount}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold shadow-lg"
                  >
                    {pilatesUpdating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Ενημέρωση...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5" />
                        <span>Ενημέρωση</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Προσοχή: Αυτή η ενέργεια θα αντικαταστήσει τον τρέχοντα αριθμό μαθημάτων
                </p>
              </div>
            </div>

            {/* Deposits Details (Optional) */}
            {pilatesUserData.deposits && pilatesUserData.deposits.length > 0 && (
              <details className="bg-gray-700/30 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white hover:text-purple-400 transition-colors">
                  Λεπτομέρειες Deposits ({pilatesUserData.deposits.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {pilatesUserData.deposits.map((deposit: any, index: number) => (
                    <div key={index} className="bg-gray-800/50 rounded p-3 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="text-gray-400">Μαθήματα:</span>
                          <span className="text-white ml-1 font-semibold">
                            {deposit.deposit_remaining}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className={`ml-1 font-semibold ${
                            deposit.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {deposit.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Δημιουργία:</span>
                          <span className="text-white ml-1">
                            {formatDate(deposit.credited_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Λήξη:</span>
                          <span className="text-white ml-1">
                            {deposit.expires_at ? formatDate(deposit.expires_at) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {!pilatesUserData && !pilatesLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Έτοιμο για Έλεγχο
            </h3>
            <p className="text-gray-400">
              Εισάγετε email χρήστη και πατήστε "Έλεγχος"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorFixing;

