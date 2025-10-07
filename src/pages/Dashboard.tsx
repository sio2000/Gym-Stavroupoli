import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target,
  Clock,
  Weight,
  Ruler,
  Heart,
  ChevronDown,
  Moon,
  Dumbbell,
  Save,
  Sparkles,
  X,
  Activity
} from 'lucide-react';
// import { getAvailableQRCategories } from '@/utils/activeMemberships';
import { addUserMetric, getUserMetrics, getUserGoals, upsertUserGoal } from '@/utils/profileUtils';
import { trackPageVisit } from '@/utils/appVisits';
import Toast from '@/components/Toast';

// Simple Popup Modal Component
const PopupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = React.memo(({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-dark-800 rounded-xl shadow-xl border border-dark-600 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4">
          {children}
      </div>
      </div>
    </div>
  );
});

// Individual Metric Popup Components
const WeightPopup: React.FC<{
  userId: string; 
  onSaved: () => Promise<void> | void; 
  onShowToast: (type: 'success' | 'error', message: string) => void;
  goals?: any[];
}> = React.memo(({ userId, onSaved, onShowToast, goals = [] }) => {
  const [weight, setWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Get existing weight goal
  const weightGoal = goals.find(g => g.goal_type === 'weight');
  React.useEffect(() => {
    if (weightGoal?.target_value) {
      setTargetWeight(weightGoal.target_value.toString());
    }
  }, [weightGoal]);

  const handleSaveAll = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      let hasChanges = false;
      
      // Save goal if provided
      if (targetWeight) {
        await upsertUserGoal(userId, {
          goal_type: 'weight',
          target_value: parseFloat(targetWeight),
          unit: 'kg',
          title: 'Στόχος Βάρους'
        });
        hasChanges = true;
      }
      
      // Save metric if provided
      if (weight) {
        await addUserMetric(userId, {
          metric_date: new Date().toISOString().slice(0,10),
          weight_kg: parseFloat(weight)
        });
        setWeight('');
        hasChanges = true;
      }
      
      if (hasChanges) {
        await onSaved();
        onShowToast('success', 'Όλα τα δεδομένα αποθηκεύτηκαν επιτυχώς!');
      }
    } catch (error) {
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των δεδομένων.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Goal Setting */}
      <div className="bg-green-600/10 rounded-lg p-4 border border-green-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-green-500" />
          <h4 className="font-semibold text-white">Στόχος Βάρους</h4>
      </div>
        <input 
          type="number" 
          step="0.1" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={targetWeight} 
          onChange={e => setTargetWeight(e.target.value)} 
          placeholder="Στόχος βάρους (kg)" 
          />
        </div>

      {/* Current Weight Input */}
      <div className="bg-green-600/10 rounded-lg p-4 border border-green-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Weight className="h-5 w-5 text-green-500" />
          <h4 className="font-semibold text-white">Τρέχον Βάρος</h4>
          </div>
        <input 
          type="number" 
          step="0.1" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={weight} 
          onChange={e => setWeight(e.target.value)} 
          placeholder="Βάρος (kg)" 
        />
      </div>

      <button 
        onClick={handleSaveAll} 
        disabled={saving || (!targetWeight && !weight)} 
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </button>
    </div>
  );
});

const HeightPopup: React.FC<{
  userId: string;
  onSaved: () => Promise<void> | void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
}> = React.memo(({ userId, onSaved, onShowToast }) => {
  const [height, setHeight] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const handleSave = async () => {
    if (!userId || !height) return;
    
    setSaving(true);
    try {
      await addUserMetric(userId, {
        metric_date: new Date().toISOString().slice(0,10),
        height_cm: parseFloat(height)
      });
      
      setHeight('');
      await onSaved();
      onShowToast('success', 'Το ύψος αποθηκεύτηκε επιτυχώς!');
    } catch (error) {
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση του ύψους.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="h-5 w-5 text-purple-500" />
          <h4 className="font-semibold text-white">Ύψος</h4>
        </div>
        <input 
          type="number" 
          step="0.1" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={height} 
          onChange={e => setHeight(e.target.value)} 
          placeholder="Ύψος (cm)" 
        />
        </div>

      <button 
        onClick={handleSave} 
        disabled={saving || !height} 
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </button>
  </div>
);
});

const BodyFatPopup: React.FC<{
  userId: string; 
  onSaved: () => Promise<void> | void; 
  onShowToast: (type: 'success' | 'error', message: string) => void;
  goals?: any[];
}> = React.memo(({ userId, onSaved, onShowToast, goals = [] }) => {
  const [bodyFat, setBodyFat] = useState<string>('');
  const [targetBodyFat, setTargetBodyFat] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Get existing body fat goal
  const bodyFatGoal = goals.find(g => g.goal_type === 'body_fat');
  React.useEffect(() => {
    if (bodyFatGoal?.target_value) {
      setTargetBodyFat(bodyFatGoal.target_value.toString());
    }
  }, [bodyFatGoal]);

  const handleSaveAll = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      let hasChanges = false;
      
      // Save goal if provided
      if (targetBodyFat) {
        await upsertUserGoal(userId, {
          goal_type: 'body_fat',
          target_value: parseFloat(targetBodyFat),
          unit: '%',
          title: 'Στόχος Λίπους'
        });
        hasChanges = true;
      }
      
      // Save metric if provided
      if (bodyFat) {
        await addUserMetric(userId, {
          metric_date: new Date().toISOString().slice(0,10),
          body_fat_pct: parseFloat(bodyFat)
        });
        setBodyFat('');
        hasChanges = true;
      }
      
      if (hasChanges) {
        await onSaved();
        onShowToast('success', 'Όλα τα δεδομένα αποθηκεύτηκαν επιτυχώς!');
      }
    } catch (error) {
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των δεδομένων.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Goal Setting */}
      <div className="bg-red-600/10 rounded-lg p-4 border border-red-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-red-500" />
          <h4 className="font-semibold text-white">Στόχος Λίπους</h4>
        </div>
        <input 
          type="number" 
          step="0.1" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={targetBodyFat} 
          onChange={e => setTargetBodyFat(e.target.value)} 
          placeholder="Στόχος λίπους (%)" 
        />
      </div>

      {/* Current Body Fat Input */}
      <div className="bg-red-600/10 rounded-lg p-4 border border-red-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-5 w-5 text-red-500" />
          <h4 className="font-semibold text-white">Τρέχον Λίπος</h4>
        </div>
        <input 
          type="number" 
          step="0.1" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={bodyFat} 
          onChange={e => setBodyFat(e.target.value)} 
          placeholder="Λίπος (%)" 
        />
      </div>

      <button 
        onClick={handleSaveAll} 
        disabled={saving || (!targetBodyFat && !bodyFat)} 
        className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </button>
    </div>
  );
});

const SleepPopup: React.FC<{
  userId: string;
  onSaved: () => Promise<void> | void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
  goals?: any[];
}> = React.memo(({ userId, onSaved, onShowToast, goals = [] }) => {
  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [targetSleep, setTargetSleep] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Get existing sleep goal
  const sleepGoal = goals.find(g => g.goal_type === 'sleep');
  React.useEffect(() => {
    if (sleepGoal?.target_value) {
      setTargetSleep(sleepGoal.target_value.toString());
    }
  }, [sleepGoal]);

  const handleSaveAll = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      let hasChanges = false;
      
      // Save goal if provided
      if (targetSleep) {
        await upsertUserGoal(userId, {
          goal_type: 'sleep',
          target_value: parseFloat(targetSleep),
          unit: 'hours',
          title: 'Στόχος Ύπνου'
        });
        hasChanges = true;
      }
      
      // Save metric if provided
      if (sleepHours || sleepQuality) {
        const payload: any = {
          metric_date: new Date().toISOString().slice(0,10)
        };
        
        if (sleepHours) payload.sleep_hours = parseFloat(sleepHours);
        if (sleepQuality) payload.sleep_quality = sleepQuality;
        
        await addUserMetric(userId, payload);
        setSleepHours('');
        setSleepQuality('');
        hasChanges = true;
      }
      
      if (hasChanges) {
        await onSaved();
        onShowToast('success', 'Όλα τα δεδομένα αποθηκεύτηκαν επιτυχώς!');
      }
    } catch (error) {
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των δεδομένων.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Goal Setting */}
      <div className="bg-indigo-600/10 rounded-lg p-4 border border-indigo-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-indigo-500" />
          <h4 className="font-semibold text-white">Στόχος Ύπνου</h4>
        </div>
        <input 
          type="number" 
          step="0.5" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={targetSleep} 
          onChange={e => setTargetSleep(e.target.value)} 
          placeholder="Στόχος ύπνου (ώρες)" 
        />
      </div>

      {/* Sleep Hours Input */}
      <div className="bg-indigo-600/10 rounded-lg p-4 border border-indigo-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-5 w-5 text-indigo-500" />
          <h4 className="font-semibold text-white">Ώρες Ύπνου</h4>
        </div>
        <input 
          type="number" 
          step="0.5" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={sleepHours} 
          onChange={e => setSleepHours(e.target.value)} 
          placeholder="Ώρες ύπνου" 
        />
      </div>

      {/* Sleep Quality Input */}
      <div className="bg-indigo-600/10 rounded-lg p-4 border border-indigo-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-5 w-5 text-indigo-500" />
          <h4 className="font-semibold text-white">Ποιότητα Ύπνου</h4>
        </div>
        <select 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white" 
          value={sleepQuality} 
          onChange={e => setSleepQuality(e.target.value)}
        >
          <option value="">Επιλέξτε...</option>
          <option value="excellent">Εξαιρετική</option>
          <option value="good">Καλή</option>
          <option value="average">Μέτρια</option>
          <option value="poor">Κακή</option>
        </select>
      </div>

      <button 
        onClick={handleSaveAll} 
        disabled={saving || (!targetSleep && !sleepHours && !sleepQuality)} 
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </button>
    </div>
  );
});

const StepsPopup: React.FC<{
  userId: string;
  onSaved: () => Promise<void> | void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
  goals?: any[];
}> = React.memo(({ userId, onSaved, onShowToast, goals = [] }) => {
  const [steps, setSteps] = useState<string>('');
  const [targetSteps, setTargetSteps] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Get existing steps goal
  const stepsGoal = goals.find(g => g.goal_type === 'steps');
  React.useEffect(() => {
    if (stepsGoal?.target_value) {
      setTargetSteps(stepsGoal.target_value.toString());
    }
  }, [stepsGoal]);

  const handleSaveAll = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      let hasChanges = false;
      
      // Save goal if provided
      if (targetSteps) {
        await upsertUserGoal(userId, {
          goal_type: 'steps',
          target_value: parseInt(targetSteps),
          unit: 'steps',
          title: 'Στόχος Βημάτων'
        });
        hasChanges = true;
      }
      
      // Save metric if provided
      if (steps) {
        await addUserMetric(userId, {
          metric_date: new Date().toISOString().slice(0,10),
          steps_per_day: parseInt(steps)
        });
        setSteps('');
        hasChanges = true;
      }
      
      if (hasChanges) {
        await onSaved();
        onShowToast('success', 'Όλα τα δεδομένα αποθηκεύτηκαν επιτυχώς!');
      }
    } catch (error) {
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των δεδομένων.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Goal Setting */}
      <div className="bg-emerald-600/10 rounded-lg p-4 border border-emerald-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-emerald-500" />
          <h4 className="font-semibold text-white">Στόχος Βημάτων</h4>
        </div>
        <input 
          type="number" 
          step="100" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={targetSteps} 
          onChange={e => setTargetSteps(e.target.value)} 
          placeholder="Στόχος βημάτων/ημέρα" 
        />
      </div>

      {/* Current Steps Input */}
      <div className="bg-emerald-600/10 rounded-lg p-4 border border-emerald-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-emerald-500" />
          <h4 className="font-semibold text-white">Βήματα Σήμερα</h4>
        </div>
        <input 
          type="number" 
          step="100" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={steps} 
          onChange={e => setSteps(e.target.value)} 
          placeholder="Βήματα σήμερα" 
        />
      </div>

      <button 
        onClick={handleSaveAll} 
        disabled={saving || (!targetSteps && !steps)} 
        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </button>
    </div>
  );
});

const WorkoutPopup: React.FC<{
  userId: string; 
  onSaved: () => Promise<void> | void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
  goals?: any[];
}> = React.memo(({ userId, onSaved, onShowToast, goals = [] }) => {
  const [workoutType, setWorkoutType] = useState<string>('');
  const [targetWorkoutDays, setTargetWorkoutDays] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Get existing workout days goal
  const workoutDaysGoal = goals.find(g => g.goal_type === 'workout_days');
  React.useEffect(() => {
    if (workoutDaysGoal?.target_value) {
      setTargetWorkoutDays(workoutDaysGoal.target_value.toString());
    }
  }, [workoutDaysGoal]);

  const handleSaveAll = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      let hasChanges = false;
      
      // Save goal if provided
      if (targetWorkoutDays) {
          await upsertUserGoal(userId, { 
          goal_type: 'workout_days',
          target_value: parseInt(targetWorkoutDays),
          unit: 'days/week',
          title: 'Στόχος Προπόνησης'
        });
        hasChanges = true;
      }
      
      // Save metric if provided
      if (workoutType) {
        await addUserMetric(userId, {
          metric_date: new Date().toISOString().slice(0,10),
          workout_type: workoutType
        });
        setWorkoutType('');
        hasChanges = true;
      }
      
      if (hasChanges) {
        await onSaved();
        onShowToast('success', 'Όλα τα δεδομένα αποθηκεύτηκαν επιτυχώς!');
      }
    } catch (error) {
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των δεδομένων.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Goal Setting */}
      <div className="bg-orange-600/10 rounded-lg p-4 border border-orange-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-orange-500" />
          <h4 className="font-semibold text-white">Στόχος Προπόνησης</h4>
        </div>
        <input 
          type="number" 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white placeholder-gray-400" 
          value={targetWorkoutDays} 
          onChange={e => setTargetWorkoutDays(e.target.value)} 
          placeholder="Ημέρες προπόνησης/εβδομάδα" 
        />
      </div>

      {/* Workout Type Input */}
      <div className="bg-orange-600/10 rounded-lg p-4 border border-orange-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="h-5 w-5 text-orange-500" />
          <h4 className="font-semibold text-white">Είδος Προπόνησης</h4>
        </div>
        <select 
          className="w-full border border-dark-600 rounded-lg px-3 py-2 bg-dark-700 text-white" 
          value={workoutType} 
          onChange={e => setWorkoutType(e.target.value)}
        >
          <option value="">Επιλέξτε...</option>
          <option value="weights">Βάρη</option>
          <option value="cardio">Καρδιο</option>
          <option value="hiit">HIIT</option>
          <option value="yoga">Γιόγκα</option>
          <option value="pilates">Πιλάτες</option>
          <option value="crossfit">CrossFit</option>
        </select>
      </div>

      <button 
        onClick={handleSaveAll} 
        disabled={saving || (!targetWorkoutDays && !workoutType)} 
        className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
      </button>
    </div>
  );
});

const StatCard: React.FC<{
  name: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend?: string;
  trendColor?: string;
  index?: number;
  onClick?: () => void;
}> = React.memo(({ name, value, icon: Icon, color, bgColor, trend, trendColor = 'text-green-600', index = 0, onClick }) => (
  <div
    onClick={onClick}
    className="group relative overflow-hidden bg-dark-800 rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-dark-600 hover:border-primary-400 hover:-translate-y-1 hover:scale-105 mobile-card-hover mobile-touch-feedback cursor-pointer"
      style={{
      animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <div 
      className="absolute inset-0 bg-gradient-to-br from-dark-700 via-primary-600/20 to-primary-500/30 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
    />
    
    {/* Always visible clickable indicator */}
    <div className="absolute top-3 right-3">
      <div className="w-2 h-2 bg-primary-500 rounded-full shadow-lg"></div>
    </div>
    
    <div className="relative p-3 md:p-6">
      <div className="flex flex-col md:flex-row items-center md:justify-between mb-2 md:mb-4">
        <div 
          className={`p-2 md:p-4 rounded-xl md:rounded-2xl ${bgColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg mb-2 md:mb-0 relative`}
        >
          <Icon className={`h-4 w-4 md:h-6 md:w-6 ${color}`} />
          </div>
        {trend && (
          <span 
            className={`text-xs font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 ${trendColor} shadow-sm group-hover:scale-105 transition-transform duration-300 hidden md:inline-block`}
          >
            {trend}
          </span>
        )}
        </div>
      <div className="text-center md:text-left mobile-text">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <p className="text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2 tracking-wide">{name}</p>
          {/* Always visible click hint */}
          <div className="text-xs text-primary-400 font-medium opacity-80">
            κλικ
          </div>
        </div>
        <p className="text-lg md:text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">
          {value}
        </p>
        </div>

      {/* Always visible bottom indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
          <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
          <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
          </div>
            </div>
            </div>
          </div>
));

const ProgressBar: React.FC<{
  label: string;
  current: number;
  target: number;
  color: string;
  bgColor: string;
  unit: string;
  showPercentage?: boolean;
}> = React.memo(({ label, current, target, color, bgColor, unit, showPercentage = true }) => {
  // Υπολογισμός απόστασης από τον στόχο
  const isGoalAchieved = Math.abs(current - target) < 0.1; // Στόχος πετυχαίνεται μόνο αν η διαφορά είναι < 0.1
  const difference = Math.abs(current - target);
  
  // Για βάρος, λίπος, βήματα και ύπνο, δείχνουμε την απόσταση από τον στόχο αντί για ποσοστό προόδου
  const isGoalBased = label === 'Βάρος' || label === 'Λίπος' || label === 'Βήματα' || label === 'Ύπνος';
  
  let displayText: string;
  let progressPercentage: number;
  
  if (isGoalBased) {
    if (isGoalAchieved) {
      displayText = '🎯 Στόχος πετυχημένος!';
      progressPercentage = 100;
    } else {
      // Δημιουργούμε πιο εντυπωσιακό κείμενο για την απόσταση
      const distanceValue = difference.toFixed(1);
      
      // Διαφορετικά εικονίδια ανάλογα με το μέτρο
      let icon = '📏';
      if (label === 'Βήματα') icon = '👟';
      else if (label === 'Ύπνος') icon = '😴';
      else if (label === 'Λίπος') icon = '💪';
      else if (label === 'Βάρος') icon = '⚖️';
      
      displayText = `${icon} Απόσταση: ${distanceValue} ${unit}`;
      
      // Για την progress bar, χρησιμοποιούμε διαφορετική λογική ανάλογα με το μέτρο
      if (label === 'Βάρος' || label === 'Λίπος') {
        // Για βάρος και λίπος, θέλουμε να μειώσουμε
        if (current > target) {
          progressPercentage = Math.min((target / current) * 100, 100);
        } else {
          progressPercentage = Math.min((current / target) * 100, 100);
        }
      } else {
        // Για βήματα και ύπνο, θέλουμε να αυξήσουμε
        progressPercentage = Math.min((current / target) * 100, 100);
      }
    }
  } else {
    // Για άλλες μετρήσεις, κρατάμε την παλιά λογική
    progressPercentage = Math.min((current / target) * 100, 100);
    displayText = `${progressPercentage.toFixed(1)}% προόδου`;
  }
  
  return (
    <div 
      className="space-y-3 md:space-y-4 p-3 md:p-4 bg-gradient-to-r from-dark-700 to-dark-600 rounded-xl md:rounded-2xl border border-dark-600 hover:shadow-lg transition-all duration-300"
      style={{
        animation: 'fadeInScale 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
        <span className="text-sm md:text-sm font-bold text-white tracking-wide">{label}</span>
        <span 
          className="text-xs md:text-sm font-semibold text-gray-300 bg-dark-800 px-2 md:px-3 py-1 rounded-full shadow-sm"
          style={{
            animation: 'slideInRight 0.6s ease-out 0.2s forwards',
            opacity: 0,
            transform: 'translateX(20px)'
          }}
        >
          {current} {unit} / {target} {unit}
        </span>
          </div>
      <div className="relative">
        <div className="w-full bg-dark-600 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
          <div 
            className={`h-3 md:h-4 rounded-full ${bgColor} shadow-lg transition-all duration-1000 ease-out`}
            style={{ 
              width: `${progressPercentage}%`,
              ['--progress-width' as any]: `${progressPercentage}%`,
              animation: 'progressFill 1.2s ease-out 0.3s forwards'
            }}
              />
            </div>
        {showPercentage && (
          <div 
            className="flex flex-col md:flex-row justify-between text-xs font-semibold text-gray-600 mt-2 md:mt-3 space-y-1 md:space-y-0"
            style={{
              animation: 'fadeInUp 0.6s ease-out 0.5s forwards',
              opacity: 0,
              transform: 'translateY(10px)'
            }}
          >
            <span className="bg-dark-700 px-2 py-1 rounded-full text-center md:text-left text-gray-300">Στόχος: {target} {unit}</span>
            <span 
              className={`px-3 md:px-4 py-2 rounded-full text-center md:text-right font-bold text-sm shadow-lg border-2 transition-all duration-300 hover:scale-105 ${
                isGoalBased && !isGoalAchieved 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 animate-pulse' 
                  : isGoalAchieved
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 animate-bounce'
                  : `${color} bg-opacity-10 animate-pulse`
              }`}
            >
              {displayText}
            </span>
          </div>
        )}
        </div>
    </div>
  );
});


// Mobile-Specific Components
const MobileCollapsibleSection: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  index?: number;
}> = React.memo(({ title, icon: Icon, children, defaultOpen = false, index = 0 }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div 
      className="bg-dark-800 rounded-2xl md:rounded-3xl shadow-xl border border-dark-600 mb-4 md:mb-6 overflow-hidden hover:shadow-2xl transition-all duration-500"
          style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
          }}
        >
          <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gradient-to-r hover:from-primary-600/20 hover:to-primary-500/20 hover:scale-105 transition-all duration-300 group"
          >
        <div className="flex items-center space-x-3 md:space-x-4">
            <div
            className="p-3 md:p-4 bg-gradient-to-br from-primary-600/20 to-primary-500/30 rounded-xl md:rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg"
            >
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
          <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-primary-400 transition-colors duration-300">{title}</h3>
        </div>
        <div
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-primary-400 transition-colors duration-300" />
      </div>
      </button>
      {isOpen && (
        <div 
          className="border-t border-dark-600 overflow-hidden transition-all duration-400 ease-in-out"
          style={{
            animation: 'fadeInUp 0.4s ease-out forwards',
            opacity: 0,
            transform: 'translateY(-20px)'
          }}
        >
          <div className="px-4 md:px-6 pb-4 md:pb-6 pt-3 md:pt-4">
            {children}
        </div>
      </div>
      )}
    </div>
  );
});



const Dashboard: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  // const [visitStats, setVisitStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key
  
  // Toast state
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });

  // Popup states
  const [popupStates, setPopupStates] = useState({
    weight: false,
    height: false,
    bodyFat: false,
    sleep: false,
    steps: false,
    workout: false
  });

  // Toast functions
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Popup functions
  const openPopup = (popupType: keyof typeof popupStates) => {
    setPopupStates(prev => ({ ...prev, [popupType]: true }));
  };

  const closePopup = (popupType: keyof typeof popupStates) => {
    setPopupStates(prev => ({ ...prev, [popupType]: false }));
  };

  // Function to refresh all data - memoized to prevent unnecessary re-renders
  const refreshData = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // console.log('[Dashboard] ===== REFRESHING DATA =====');
      // console.log('[Dashboard] User ID:', user.id);
      
      // const categories = await getAvailableQRCategories(user.id);
      // console.log('[Dashboard] Available QR categories:', categories);
      
      // console.log('[Dashboard] Fetching user metrics...');
      const m = await getUserMetrics(user.id, 90);
      // console.log('[Dashboard] User metrics fetched:', m);
      
      // console.log('[Dashboard] Fetching user goals...');
      const g = await getUserGoals(user.id);
      // console.log('[Dashboard] User goals fetched:', g);
      
      // console.log('[Dashboard] Fetching visit stats...');
      // const v = await getUserVisitStats(user.id);
      // console.log('[Dashboard] Visit stats fetched:', v);
      
      setMetrics(m);
      setGoals(g);
      // setVisitStats(v);
      
      // Force re-render
      setRefreshKey(prev => prev + 1);
      
      // console.log('[Dashboard] ===== DATA REFRESHED SUCCESSFULLY =====');
      // console.log('[Dashboard] Metrics count:', m?.length || 0);
      // console.log('[Dashboard] Goals count:', g?.length || 0);
      // console.log('[Dashboard] Latest metric:', m?.[0] || 'None');
      // console.log('[Dashboard] Refresh key updated:', refreshKey + 1);
    } catch (error) {
      console.error('[Dashboard] Error refreshing data:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      
      // Track this dashboard visit
      await trackPageVisit(user.id, 'Dashboard');
      
      await refreshData();
    };
    load();
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  const latest = metrics[0] || {} as any;
  const weightGoal = goals.find((g:any)=>g.goal_type==='weight');
  const bodyFatGoal = goals.find((g:any)=>g.goal_type==='body_fat');
  const stepsGoal = goals.find((g:any)=>g.goal_type==='steps');
  const sleepGoal = goals.find((g:any)=>g.goal_type==='sleep');
  // const workoutDaysGoal = goals.find((g:any)=>g.goal_type==='workout_days');
  
  // Debug logs for latest metric - REMOVED TO PREVENT UNNECESSARY RENDERS
  // console.log('[Dashboard] ===== LATEST METRIC DEBUG =====');
  // console.log('[Dashboard] Metrics array:', metrics);
  // console.log('[Dashboard] Metrics length:', metrics?.length || 0);
  
  // Debug logs for goals - REMOVED TO PREVENT UNNECESSARY RENDERS
  // console.log('[Dashboard] ===== GOALS DEBUG =====');
  // console.log('[Dashboard] Goals array:', goals);
  // console.log('[Dashboard] Goals length:', goals?.length || 0);
  // console.log('[Dashboard] Weight goal:', weightGoal);
  // console.log('[Dashboard] Steps goal:', stepsGoal);
  // console.log('[Dashboard] Sleep goal:', sleepGoal);
  // console.log('[Dashboard] Workout days goal:', workoutDaysGoal);
  // console.log('[Dashboard] ===== END GOALS DEBUG =====');
  // console.log('[Dashboard] All metrics data:', metrics.map((m, i) => ({
  //   index: i,
  //   date: m.metric_date,
  //   weight: m.weight_kg,
  //   body_fat: m.body_fat_pct,
  //   height: m.height_cm
  // })));
  // console.log('[Dashboard] Latest metric (metrics[0]):', latest);
  // console.log('[Dashboard] Latest weight:', latest?.weight_kg);
  // console.log('[Dashboard] Latest body fat:', latest?.body_fat_pct);
  // console.log('[Dashboard] Latest height:', latest?.height_cm);
  // console.log('[Dashboard] ===== END LATEST METRIC DEBUG =====');

  // Memoize personal stats cards to prevent unnecessary recalculations
  const personalStatsCards = React.useMemo(() => {
    // console.log('[Dashboard] ===== RECALCULATING PERSONAL STATS =====');
    // console.log('[Dashboard] Latest metric for stats:', latest);
    // console.log('[Dashboard] Visit stats for stats:', null);
    
    return [
    {
      name: 'Βάρος',
        value: latest.weight_kg ? `${latest.weight_kg} kg` : '—',
      icon: Weight,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
        trend: '',
        onClick: () => openPopup('weight')
    },
    {
      name: 'Ύψος',
        value: latest.height_cm ? `${latest.height_cm} cm` : '—',
      icon: Ruler,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
        trend: '',
        onClick: () => openPopup('height')
    },
    {
      name: 'Λίπος',
        value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : '—',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
        trend: '',
        onClick: () => openPopup('bodyFat')
      },
      {
        name: 'Ύπνος',
        value: latest.sleep_hours ? `${latest.sleep_hours} ώρες` : '—',
        icon: Clock,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        trend: '',
        onClick: () => openPopup('sleep')
      },
      {
        name: 'Βήματα/ημέρα',
        value: typeof latest.steps_per_day === 'number' ? latest.steps_per_day : '—',
        icon: Activity,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        trend: '',
        onClick: () => openPopup('steps')
      },
      {
        name: 'Προπόνηση',
        value: latest.workout_type || '—',
        icon: Dumbbell,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        trend: '',
        onClick: () => openPopup('workout')
      }
    ];
  }, [latest]);

  return (
    <>
      {/* CSS Animations & Mobile Optimizations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: var(--progress-width, 0%);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
        
        /* Mobile-specific enhancements */
        @media (max-width: 768px) {
          .mobile-touch-feedback {
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          .mobile-smooth-scroll {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          .mobile-card-hover {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .mobile-card-hover:active {
            transform: scale(0.98);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          /* Enhanced mobile gradients */
          .mobile-gradient-bg {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
          }
          
          /* Mobile-optimized shadows */
          .mobile-shadow {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          
          /* Mobile text optimization */
          .mobile-text {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
        }
        
        /* Touch-friendly button enhancements */
        button, .clickable {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }
        
        /* Mobile-optimized animations */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Enhanced mobile performance */
        .mobile-optimized {
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
      
      {/* Toast Component */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={4000}
      />
      
      <div 
        key={refreshKey} 
        className="min-h-screen bg-black mobile-smooth-scroll mobile-optimized"
        style={{
          animation: 'fadeInUp 0.8s ease-out forwards',
          opacity: 0
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Modern Header */}
        <div 
          className="mb-8 md:mb-12"
          style={{
            animation: 'fadeInUp 0.8s ease-out forwards',
            opacity: 0
          }}
        >
          <div 
            className="bg-dark-800 rounded-2xl md:rounded-3xl shadow-2xl border border-dark-600 p-4 md:p-8 mb-4 md:mb-6 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div
                style={{
                  animation: 'slideInLeft 0.8s ease-out 0.3s forwards',
                  opacity: 0,
                  transform: 'translateX(-30px)'
                }}
              >
                <h1 
                  className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3"
                  style={{
                    animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
                    opacity: 0,
                    transform: 'translateY(20px)'
                  }}
                >
                  Καλώς ήρθες, {user?.firstName || user?.email?.split('@')[0] || 'Χρήστη'}! 
                  <span
                    className="ml-2 md:ml-3 animate-bounce"
                    style={{
                      animation: 'bounce 2s infinite 3s'
                    }}
                  >
                    👋
                  </span>
        </h1>
                <p 
                  className="text-base md:text-xl text-gray-300 font-medium"
                  style={{
                    animation: 'fadeInUp 0.8s ease-out 0.5s forwards',
                    opacity: 0,
                    transform: 'translateY(20px)'
                  }}
                >
          Εδώ είναι η επισκόπηση της δραστηριότητάς σου στο Get Fit
        </p>
      </div>
              <div 
                className="hidden md:block"
                style={{
                  animation: 'slideInRight 0.8s ease-out 0.6s forwards',
                  opacity: 0,
                  transform: 'translateX(30px)'
                }}
              >
                <div 
                  className="p-6 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-3xl text-white text-center shadow-xl hover:scale-105 hover:rotate-1 transition-all duration-300"
                >
                  <div
                    className="animate-pulse"
                    style={{
                      animation: 'bounce 2s infinite'
                    }}
                  >
                    <Sparkles className="h-8 w-8 mx-auto mb-2" />
              </div>
                  <p className="text-xl font-bold">Έτοιμος για μια νέα μέρα προπόνησης!</p>
                  <p 
                    className="text-sm opacity-90 mt-2 font-medium animate-pulse"
                  >
                    Καλή πρόοδος! 💪
                  </p>
              </div>
            </div>
              </div>
            </div>
          </div>


        {/* Personal Stats Grid - Mobile Optimized */}
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 mb-8 md:mb-12"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
            opacity: 0,
            transform: 'translateY(30px)'
          }}
        >
          {personalStatsCards.map((stat, index) => (
            <StatCard key={index} {...stat} index={index} />
        ))}
      </div>

        {/* Progress Towards Goals - Enhanced */}
        <div 
          className="mb-8 md:mb-12"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            opacity: 0,
            transform: 'translateY(30px)'
          }}
        >
          <div 
            className="bg-dark-800 rounded-2xl md:rounded-3xl shadow-2xl border border-dark-600 p-4 md:p-8 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500"
          >
            <div 
              className="flex items-center space-x-3 md:space-x-4 mb-6 md:mb-10"
              style={{
                animation: 'slideInLeft 0.8s ease-out 0.6s forwards',
                opacity: 0,
                transform: 'translateX(-20px)'
              }}
            >
              <div 
                className="p-3 md:p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl md:rounded-2xl shadow-lg hover:rotate-3 hover:scale-110 transition-all duration-300"
              >
                <Target className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                  </div>
              <h2 className="text-xl md:text-3xl font-bold text-white">Πρόοδος προς τους Στόχους</h2>
                </div>

            {/* Global Notifications for Goals Section */}
            <div className="space-y-3 mb-6">
              <div className="text-purple-400 text-sm bg-purple-600/20 border border-purple-600/30 rounded-lg p-3 font-medium">
                🎯 Στο τμήμα "Ορισμός Στόχων" μπορείς να προσθέσεις τους στόχους σου!
              </div>
              <div className="text-blue-400 text-sm bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 font-medium">
                💡 Στο τμήμα "Καταχώρηση Μετρήσεων" μπορείς να καταχωρείς τις μετρήσεις σου για να βλέπεις την πρόοδό σου!
              </div>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              {/* Weight & Body Fat Goals */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Weight className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Στόχοι Βάρους & Λίπους
              </h3>
                <div className="space-y-4">
                  {latest.weight_kg ? (
                <ProgressBar
                  label="Βάρος"
                      current={latest.weight_kg}
                      target={weightGoal?.target_value || latest.weight_kg}
                      color="text-blue-600"
                      bgColor="bg-gradient-to-r from-blue-500 to-blue-600"
                  unit="kg"
                />
                  ) : (
                    <div>
                      <ProgressBar
                        label="Βάρος"
                        current={60}
                        target={75}
                        color="text-blue-600"
                        bgColor="bg-gradient-to-r from-blue-300 to-blue-400"
                        unit="kg"
                      />
                    </div>
                  )}
                  {latest.body_fat_pct ? (
                <ProgressBar
                  label="Λίπος"
                      current={latest.body_fat_pct}
                      target={bodyFatGoal?.target_value || 15} // Use body fat goal or default
                      color="text-green-600"
                      bgColor="bg-gradient-to-r from-green-500 to-green-600"
                  unit="%"
                />
                  ) : (
                    <div>
                      <ProgressBar
                        label="Λίπος"
                        current={18}
                        target={12}
                        color="text-green-600"
                        bgColor="bg-gradient-to-r from-green-300 to-green-400"
                        unit="%"
                      />
            </div>
                  )}
          </div>
        </div>

              {/* Training & Activity Goals */}
          <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Στόχοι Προπόνησης & Δραστηριότητας
                </h3>
          <div className="space-y-4">
                  {latest.steps_per_day ? (
                    <ProgressBar
                      label="Βήματα"
                      current={latest.steps_per_day}
                      target={stepsGoal?.target_value || 10000}
                      color="text-emerald-600"
                      bgColor="bg-gradient-to-r from-emerald-500 to-emerald-600"
                      unit="steps"
                    />
                  ) : (
                    <div>
                      <ProgressBar
                        label="Βήματα"
                        current={7500}
                        target={10000}
                        color="text-emerald-600"
                        bgColor="bg-gradient-to-r from-emerald-300 to-emerald-400"
                        unit="steps"
                      />
          </div>
                  )}
                </div>
              </div>

              {/* Sleep & Wellness Goals */}
          <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Moon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Στόχοι Ύπνου & Ευεξίας
                </h3>
                <div className="space-y-4">
                  {latest.sleep_hours ? (
                    <ProgressBar
                      label="Ύπνος"
                      current={latest.sleep_hours}
                      target={sleepGoal?.target_value || 8}
                      color="text-indigo-600"
                      bgColor="bg-gradient-to-r from-indigo-500 to-indigo-600"
                      unit="ώρες"
                    />
                  ) : (
                      <div>
                      <ProgressBar
                        label="Ύπνος"
                        current={6}
                        target={8}
                        color="text-indigo-600"
                        bgColor="bg-gradient-to-r from-indigo-300 to-indigo-400"
                        unit="ώρες"
                      />
                  </div>
                  )}
                </div>
              </div>

          </div>
        </div>
      </div>

        {/* Modern Collapsible Sections */}
        <div 
          className="space-y-8"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.6s forwards',
            opacity: 0,
            transform: 'translateY(30px)'
          }}
        >

          {/* Nutrition Tips & Wellness - Moved from Progress Section */}
          <MobileCollapsibleSection title="Συμβουλές Διατροφής & Ευεξίας" icon={Heart} defaultOpen={false} index={2}>
            <div 
              className="space-y-6"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.2s forwards',
                opacity: 0
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Hydration Tip */}
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/30 rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-blue-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-blue-600">💧</div>
          </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1 text-sm md:text-base">Υδάτωση</h4>
                      <p className="text-xs md:text-sm text-gray-300">Πίνε 2-3 λίτρα νερό καθημερινά για βέλτιστη υγεία και ενέργεια</p>
                    </div>
                  </div>
                </div>

                {/* Protein Tip */}
                <div className="bg-gradient-to-br from-green-600/20 to-green-500/30 rounded-lg md:rounded-xl p-3 md:p-4 border border-green-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-green-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-green-600">🥩</div>
                  </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1 text-sm md:text-base">Πρωτεΐνη</h4>
                      <p className="text-xs md:text-sm text-gray-300">Καταναλώνε 1.6-2.2g πρωτεΐνης ανά kg σωματικού βάρους</p>
                  </div>
                </div>
              </div>

                {/* Sleep Tip */}
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/30 rounded-lg md:rounded-xl p-3 md:p-4 border border-purple-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-purple-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-purple-600">😴</div>
          </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1 text-sm md:text-base">Ύπνος</h4>
                      <p className="text-xs md:text-sm text-gray-300">7-9 ώρες ποιοτικού ύπνου για ανάκαμψη και ανάπτυξη</p>
        </div>
      </div>
                </div>

                {/* Exercise Tip */}
                <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/30 rounded-lg md:rounded-xl p-3 md:p-4 border border-orange-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-orange-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-orange-600">🏃</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1 text-sm md:text-base">Άσκηση</h4>
                      <p className="text-xs md:text-sm text-gray-300">150 λεπτά μέτριας έντασης άσκησης εβδομαδιαίως</p>
                    </div>
                  </div>
                </div>

                {/* Nutrition Tip */}
                <div className="bg-gradient-to-br from-red-600/20 to-red-500/30 rounded-lg md:rounded-xl p-3 md:p-4 border border-red-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-red-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-red-600">🥗</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1 text-sm md:text-base">Διατροφή</h4>
                      <p className="text-xs md:text-sm text-gray-300">Φρέσκα φρούτα και λαχανικά σε κάθε γεύμα</p>
                    </div>
                  </div>
                </div>

                {/* Recovery Tip */}
                <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-500/30 rounded-lg md:rounded-xl p-3 md:p-4 border border-indigo-600/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-indigo-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-indigo-600">🧘</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1 text-sm md:text-base">Ανάκαμψη</h4>
                      <p className="text-xs md:text-sm text-gray-300">Διαλείμματα ανάμεσα στις προπονήσεις για αποτελεσματικότητα</p>
                    </div>
                  </div>
                </div>
              </div>
    </div>
          </MobileCollapsibleSection>
        </div>
      </div>

      {/* Popup Modals */}
      <PopupModal 
        isOpen={popupStates.weight} 
        onClose={() => closePopup('weight')} 
        title="Βάρος"
      >
        <WeightPopup 
          userId={user?.id || ''} 
          onSaved={refreshData} 
          onShowToast={showToast}
          goals={goals}
        />
      </PopupModal>

      <PopupModal 
        isOpen={popupStates.height} 
        onClose={() => closePopup('height')} 
        title="Ύψος"
      >
        <HeightPopup 
          userId={user?.id || ''} 
          onSaved={refreshData} 
          onShowToast={showToast}
        />
      </PopupModal>

      <PopupModal 
        isOpen={popupStates.bodyFat} 
        onClose={() => closePopup('bodyFat')} 
        title="Λίπος"
      >
        <BodyFatPopup 
          userId={user?.id || ''} 
          onSaved={refreshData} 
          onShowToast={showToast}
          goals={goals}
        />
      </PopupModal>

      <PopupModal 
        isOpen={popupStates.sleep} 
        onClose={() => closePopup('sleep')} 
        title="Ύπνος"
      >
        <SleepPopup 
          userId={user?.id || ''} 
          onSaved={refreshData} 
          onShowToast={showToast}
          goals={goals}
        />
      </PopupModal>

      <PopupModal 
        isOpen={popupStates.steps} 
        onClose={() => closePopup('steps')} 
        title="Βήματα"
      >
        <StepsPopup 
          userId={user?.id || ''} 
          onSaved={refreshData} 
          onShowToast={showToast}
          goals={goals}
        />
      </PopupModal>

      <PopupModal 
        isOpen={popupStates.workout} 
        onClose={() => closePopup('workout')} 
        title="Προπόνηση"
      >
        <WorkoutPopup 
          userId={user?.id || ''} 
          onSaved={refreshData} 
          onShowToast={showToast}
          goals={goals}
        />
      </PopupModal>
    </div>
    </>
  );
});

export default Dashboard;