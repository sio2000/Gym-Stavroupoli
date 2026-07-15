// ============================================================================
// PERSONAL SYSTEM CALENDAR (shared)
// ============================================================================
// Κοινό realtime εβδομαδιαίο ημερολόγιο του νέου Personal συστήματος.
// Modes:
//   trainer   - δημιουργία/επεξεργασία slots, προβολή συμμετεχόντων
//   reception - κράτηση/ακύρωση για επιλεγμένο χρήστη (booking_source='staff')
//   user      - self-booking (WOD "Κλείνουν μόνοι τους") με προειδοποίηση
//               μη αναπλήρωσης, ή απλή προβολή κρατήσεων
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Plus,
  X,
  Trash2,
  RefreshCw,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PersonalKind,
  PersonalSlotWithOccupancy,
  PersonalBooking,
  PERSONAL_TRAINERS,
  DEFAULT_SLOT_CAPACITY,
  getPersonalTrainerLabel,
  getPersonalSlotsWithOccupancy,
  getSlotBookings,
  createPersonalSlot,
  updatePersonalSlot,
  deactivatePersonalSlot,
  bookPersonalClass,
  cancelPersonalBooking,
  getUserPersonalBookings,
  subscribePersonalRealtime,
  formatDateLocalYMD,
  formatTimeHM,
} from '@/utils/personalSystemApi';

export interface PersonalSystemCalendarProps {
  mode: 'trainer' | 'reception' | 'user';
  kindFilter: PersonalKind | 'all';
  currentUserId: string;
  /** reception: ο χρήστης για τον οποίο γίνονται κρατήσεις */
  bookForUserId?: string | null;
  /** user/reception: επιτρέπεται κράτηση */
  canBook?: boolean;
  /** user mode: εμφάνιση προειδοποίησης μη αναπλήρωσης πριν την κράτηση */
  showBookingWarning?: boolean;
  /** trainer mode: προεπιλεγμένος trainer στη δημιουργία slot */
  defaultTrainerId?: string;
  /** callback μετά από κράτηση/ακύρωση (refresh πιστώσεων κλπ) */
  onBookingChange?: () => void;
}

const DAY_LABELS = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'];

const startOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Δευτέρα=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const kindBadge = (kind: PersonalKind) =>
  kind === 'personal'
    ? { label: 'Personal Ατομικό', cls: 'bg-blue-100 text-blue-800 border-blue-300' }
    : { label: 'Ομαδικό WOD', cls: 'bg-orange-100 text-orange-800 border-orange-300' };

const PersonalSystemCalendar: React.FC<PersonalSystemCalendarProps> = ({
  mode,
  kindFilter,
  currentUserId,
  bookForUserId,
  canBook = false,
  showBookingWarning = false,
  defaultTrainerId,
  onBookingChange,
}) => {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<PersonalSlotWithOccupancy[]>([]);
  const [myBookings, setMyBookings] = useState<PersonalBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PersonalSlotWithOccupancy | null>(null);
  const [slotParticipants, setSlotParticipants] = useState<PersonalBooking[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingBookSlot, setPendingBookSlot] = useState<PersonalSlotWithOccupancy | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create-slot form (trainer)
  const [newSlot, setNewSlot] = useState({
    kind: (kindFilter !== 'all' ? kindFilter : 'personal') as PersonalKind,
    date: formatDateLocalYMD(new Date()),
    startTime: '09:00',
    durationMinutes: 60,
    maxCapacity: DEFAULT_SLOT_CAPACITY[(kindFilter !== 'all' ? kindFilter : 'personal') as PersonalKind],
    trainerName: defaultTrainerId || PERSONAL_TRAINERS[0].id,
    notes: '',
  });
  const [editCapacity, setEditCapacity] = useState<number | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const bookTargetUserId = mode === 'reception' ? bookForUserId || null : currentUserId;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        getPersonalSlotsWithOccupancy(
          formatDateLocalYMD(weekStart),
          formatDateLocalYMD(weekEnd),
          kindFilter === 'all' ? undefined : kindFilter
        ),
        bookTargetUserId
          ? getUserPersonalBookings(bookTargetUserId, formatDateLocalYMD(weekStart), formatDateLocalYMD(weekEnd))
          : Promise.resolve([]),
      ]);
      setSlots(slotsData);
      setMyBookings(bookingsData);
    } catch (e) {
      console.error('[PersonalSystemCalendar] load error:', e);
      toast.error('Σφάλμα φόρτωσης ημερολογίου');
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, kindFilter, bookTargetUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime: κάθε αλλαγή σε slots/bookings ανανεώνει το ημερολόγιο
  useEffect(() => {
    const channel = subscribePersonalRealtime(() => {
      loadData();
    });
    return () => {
      channel.unsubscribe();
    };
  }, [loadData]);

  const bookedSlotIds = useMemo(
    () => new Set(myBookings.map(b => b.slot_id)),
    [myBookings]
  );

  const slotsByDate = useMemo(() => {
    const map: Record<string, PersonalSlotWithOccupancy[]> = {};
    slots.forEach(s => {
      (map[s.date] = map[s.date] || []).push(s);
    });
    Object.values(map).forEach(list => list.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return map;
  }, [slots]);

  const openSlotDetails = async (slot: PersonalSlotWithOccupancy) => {
    setSelectedSlot(slot);
    setEditCapacity(null);
    setParticipantsLoading(true);
    try {
      const participants = await getSlotBookings(slot.slot_id);
      setSlotParticipants(participants);
    } catch {
      setSlotParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const doBook = async (slot: PersonalSlotWithOccupancy) => {
    if (!bookTargetUserId) {
      toast.error('Επιλέξτε χρήστη πρώτα');
      return;
    }
    setActionLoading(true);
    try {
      await bookPersonalClass(
        bookTargetUserId,
        slot.slot_id,
        mode === 'user' ? 'user' : 'staff',
        currentUserId
      );
      toast.success('Η κράτηση καταχωρήθηκε!');
      setPendingBookSlot(null);
      setSelectedSlot(null);
      await loadData();
      onBookingChange?.();
    } catch (e: any) {
      toast.error(e?.message || 'Σφάλμα κράτησης');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookClick = (slot: PersonalSlotWithOccupancy) => {
    if (showBookingWarning) {
      setPendingBookSlot(slot);
    } else {
      doBook(slot);
    }
  };

  const handleCancelBooking = async (slot: PersonalSlotWithOccupancy) => {
    const booking = myBookings.find(b => b.slot_id === slot.slot_id);
    if (!booking || !bookTargetUserId) return;
    setActionLoading(true);
    try {
      await cancelPersonalBooking(booking.id, bookTargetUserId);
      toast.success('Η κράτηση ακυρώθηκε και η πίστωση επιστράφηκε');
      setSelectedSlot(null);
      await loadData();
      onBookingChange?.();
    } catch (e: any) {
      toast.error(e?.message || 'Σφάλμα ακύρωσης');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelParticipant = async (booking: PersonalBooking) => {
    setActionLoading(true);
    try {
      await cancelPersonalBooking(booking.id, booking.user_id);
      toast.success('Η κράτηση ακυρώθηκε');
      if (selectedSlot) await openSlotDetails(selectedSlot);
      await loadData();
      onBookingChange?.();
    } catch (e: any) {
      toast.error(e?.message || 'Σφάλμα ακύρωσης');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlot.date || !newSlot.startTime || newSlot.durationMinutes <= 0 || newSlot.maxCapacity <= 0) {
      toast.error('Συμπληρώστε σωστά όλα τα πεδία');
      return;
    }
    setActionLoading(true);
    try {
      const [h, m] = newSlot.startTime.split(':').map(Number);
      const endTotal = h * 60 + m + newSlot.durationMinutes;
      const endTime = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
      await createPersonalSlot({
        kind: newSlot.kind,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime,
        maxCapacity: newSlot.maxCapacity,
        trainerName: newSlot.trainerName,
        notes: newSlot.notes || undefined,
        createdBy: currentUserId,
      });
      toast.success('Το μάθημα δημιουργήθηκε');
      setShowCreateModal(false);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Σφάλμα δημιουργίας μαθήματος');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCapacity = async () => {
    if (!selectedSlot || editCapacity === null || editCapacity <= 0) return;
    setActionLoading(true);
    try {
      await updatePersonalSlot(selectedSlot.slot_id, { maxCapacity: editCapacity });
      toast.success('Η χωρητικότητα ενημερώθηκε');
      setSelectedSlot({ ...selectedSlot, max_capacity: editCapacity });
      setEditCapacity(null);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Σφάλμα ενημέρωσης');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateSlot = async () => {
    if (!selectedSlot) return;
    if (selectedSlot.booked_count > 0 && !window.confirm('Το μάθημα έχει κρατήσεις. Σίγουρα θέλετε να το καταργήσετε;')) {
      return;
    }
    setActionLoading(true);
    try {
      await deactivatePersonalSlot(selectedSlot.slot_id);
      toast.success('Το μάθημα καταργήθηκε');
      setSelectedSlot(null);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Σφάλμα κατάργησης');
    } finally {
      setActionLoading(false);
    }
  };

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const todayStr = formatDateLocalYMD(new Date());

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Προηγούμενη εβδομάδα"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">
            {weekStart.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })} –{' '}
            {weekEnd.toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Επόμενη εβδομάδα"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Σήμερα
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Ανανέωση"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {mode === 'trainer' && (
            <button
              onClick={() => {
                setNewSlot(prev => ({
                  ...prev,
                  kind: (kindFilter !== 'all' ? kindFilter : prev.kind) as PersonalKind,
                  maxCapacity: DEFAULT_SLOT_CAPACITY[(kindFilter !== 'all' ? kindFilter : prev.kind) as PersonalKind],
                  trainerName: defaultTrainerId || prev.trainerName,
                }));
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Νέο Μάθημα
            </button>
          )}
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-gray-200">
        {days.map((day, i) => {
          const dateStr = formatDateLocalYMD(day);
          const daySlots = slotsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={`bg-white min-h-[120px] p-2 ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}>
              <div className={`text-xs font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                {DAY_LABELS[i]} {day.getDate()}/{day.getMonth() + 1}
              </div>
              <div className="space-y-1.5">
                {daySlots.length === 0 && (
                  <div className="text-[11px] text-gray-300">—</div>
                )}
                {daySlots.map(slot => {
                  const badge = kindBadge(slot.kind);
                  const isFull = slot.booked_count >= slot.max_capacity;
                  const mine = bookedSlotIds.has(slot.slot_id);
                  return (
                    <button
                      key={slot.slot_id}
                      onClick={() => openSlotDetails(slot)}
                      className={`w-full text-left rounded-lg border p-1.5 text-[11px] leading-tight transition hover:shadow ${
                        mine
                          ? 'bg-green-50 border-green-400'
                          : isFull
                          ? 'bg-red-50 border-red-300'
                          : badge.cls.replace('text-', 'hover:text-').includes('blue')
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeHM(slot.start_time)}
                        </span>
                        <span className={`flex items-center gap-0.5 font-bold ${isFull ? 'text-red-600' : 'text-gray-600'}`}>
                          <Users className="h-3 w-3" />
                          {slot.booked_count}/{slot.max_capacity}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-1">
                        <span className={`px-1 py-0.5 rounded border text-[10px] font-medium ${badge.cls}`}>
                          {slot.kind === 'personal' ? 'Ατομικό' : 'WOD'}
                        </span>
                        <span className="text-gray-500 truncate">{getPersonalTrainerLabel(slot.trainer_name)}</span>
                      </div>
                      {mine && <div className="mt-0.5 text-green-700 font-semibold">✓ Κλεισμένο</div>}
                      {isFull && !mine && <div className="mt-0.5 text-red-600 font-semibold">Πλήρες</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slot details modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className={`p-4 rounded-t-2xl text-white ${selectedSlot.kind === 'personal' ? 'bg-blue-600' : 'bg-orange-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{kindBadge(selectedSlot.kind).label}</h3>
                  <p className="text-sm opacity-90">
                    {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('el-GR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}{' '}
                    · {formatTimeHM(selectedSlot.start_time)}–{formatTimeHM(selectedSlot.end_time)}
                  </p>
                </div>
                <button onClick={() => setSelectedSlot(null)} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Προπονητής (δημιουργός ώρας)</div>
                  <div className="font-semibold text-gray-900">{getPersonalTrainerLabel(selectedSlot.trainer_name)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Θέσεις</div>
                  <div className="font-semibold text-gray-900">
                    {selectedSlot.booked_count}/{selectedSlot.max_capacity}
                    <span className="ml-2 text-xs text-gray-500">
                      ({Math.max(0, selectedSlot.max_capacity - selectedSlot.booked_count)} διαθέσιμες)
                    </span>
                  </div>
                </div>
              </div>

              {selectedSlot.notes && (
                <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  {selectedSlot.notes}
                </div>
              )}

              {/* Participants */}
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Συμμετέχοντες ({slotParticipants.length})
                </h4>
                {participantsLoading ? (
                  <div className="text-sm text-gray-500">Φόρτωση...</div>
                ) : slotParticipants.length === 0 ? (
                  <div className="text-sm text-gray-400">Καμία κράτηση ακόμη</div>
                ) : (
                  <div className="space-y-1.5">
                    {slotParticipants.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-800 truncate">
                            {`${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || p.user?.email || 'Χρήστης'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              p.booking_source === 'user'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {p.booking_source === 'user' ? 'Έκλεισε μόνος/η' : 'Από γραμματεία'}
                          </span>
                        </div>
                        {(mode === 'reception' || mode === 'trainer') && (
                          <button
                            onClick={() => handleCancelParticipant(p)}
                            disabled={actionLoading}
                            className="text-red-500 hover:text-red-700 text-xs font-medium flex-shrink-0"
                          >
                            Ακύρωση
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trainer actions */}
              {mode === 'trainer' && (
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Χωρητικότητα:</label>
                    <input
                      type="number"
                      min={1}
                      value={editCapacity ?? selectedSlot.max_capacity}
                      onChange={e => setEditCapacity(parseInt(e.target.value) || 1)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={handleSaveCapacity}
                      disabled={actionLoading || editCapacity === null || editCapacity === selectedSlot.max_capacity}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-40"
                    >
                      Αποθήκευση
                    </button>
                    <button
                      onClick={handleDeactivateSlot}
                      disabled={actionLoading}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Κατάργηση
                    </button>
                  </div>
                </div>
              )}

              {/* Booking actions */}
              {(mode === 'user' || mode === 'reception') && canBook && (
                <div className="border-t pt-3 flex justify-end gap-2">
                  {bookedSlotIds.has(selectedSlot.slot_id) ? (
                    <button
                      onClick={() => handleCancelBooking(selectedSlot)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                    >
                      Ακύρωση κράτησης
                    </button>
                  ) : selectedSlot.booked_count >= selectedSlot.max_capacity ? (
                    <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-semibold">Πλήρες</span>
                  ) : (
                    <button
                      onClick={() => handleBookClick(selectedSlot)}
                      disabled={actionLoading || (mode === 'reception' && !bookForUserId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
                    >
                      {mode === 'reception' ? 'Κράτηση για χρήστη' : 'Κράτηση'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No-makeup warning modal (user self-booking) */}
      {pendingBookSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-yellow-100 rounded-full flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Προσοχή</h3>
                <p className="text-sm text-gray-600">
                  Αν δεν παρουσιαστείτε στο μάθημα, το μάθημα <strong>ΔΕΝ αναπληρώνεται</strong> και η
                  πίστωση χάνεται. Θέλετε να συνεχίσετε με την κράτηση;
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingBookSlot(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                Άκυρο
              </button>
              <button
                onClick={() => doBook(pendingBookSlot)}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Κράτηση...' : 'Κατάλαβα, κράτηση'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create slot modal (trainer) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Νέο Μάθημα</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {kindFilter === 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Είδος</label>
                  <div className="flex gap-2">
                    {(['personal', 'wod'] as PersonalKind[]).map(k => (
                      <button
                        key={k}
                        onClick={() =>
                          setNewSlot(prev => ({ ...prev, kind: k, maxCapacity: DEFAULT_SLOT_CAPACITY[k] }))
                        }
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 ${
                          newSlot.kind === k
                            ? k === 'personal'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {k === 'personal' ? 'Personal Ατομικό' : 'Ομαδικό WOD'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ημέρα</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={e => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ώρα έναρξης</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={e => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Διάρκεια (λεπτά)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={newSlot.durationMinutes}
                    onChange={e => setNewSlot(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Χωρητικότητα
                    <span className="text-xs text-gray-400 ml-1">
                      (default: {DEFAULT_SLOT_CAPACITY[newSlot.kind]})
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newSlot.maxCapacity}
                    onChange={e => setNewSlot(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Προπονητής</label>
                  <select
                    value={newSlot.trainerName}
                    onChange={e => setNewSlot(prev => ({ ...prev, trainerName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {PERSONAL_TRAINERS.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις (προαιρετικό)</label>
                <input
                  type="text"
                  value={newSlot.notes}
                  onChange={e => setNewSlot(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Άκυρο
                </button>
                <button
                  onClick={handleCreateSlot}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Δημιουργία...' : 'Δημιουργία'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSystemCalendar;
