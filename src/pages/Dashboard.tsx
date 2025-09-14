import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target,
  Clock,
  Weight,
  Ruler,
  Heart,
  ChevronDown,
  User,
  Moon,
  Dumbbell,
  Save,
  Edit3,
  Sparkles
} from 'lucide-react';
import { getAvailableQRCategories } from '@/utils/activeMemberships';
import { addUserMetric, getUserMetrics, getUserGoals, upsertUserGoal } from '@/utils/profileUtils';
import { getUserVisitStats, trackPageVisit } from '@/utils/appVisits';
import Toast from '@/components/Toast';

const StatCard: React.FC<{
  name: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend?: string;
  trendColor?: string;
  index?: number;
}> = ({ name, value, icon: Icon, color, bgColor, trend, trendColor = 'text-green-600', index = 0 }) => (
  <div
    className="group relative overflow-hidden bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 hover:scale-105 mobile-card-hover mobile-touch-feedback"
    style={{ 
      animationDelay: `${index * 100}ms`,
      animation: 'fadeInUp 0.6s ease-out forwards',
      opacity: 0
    }}
  >
    <div 
      className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
    />
    <div className="relative p-3 md:p-6">
      <div className="flex flex-col md:flex-row items-center md:justify-between mb-2 md:mb-4">
        <div 
          className={`p-2 md:p-4 rounded-xl md:rounded-2xl ${bgColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg mb-2 md:mb-0`}
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
        <p className="text-xs md:text-sm font-semibold text-gray-600 mb-1 md:mb-2 tracking-wide">{name}</p>
        <p className="text-lg md:text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const ProgressBar: React.FC<{
  label: string;
  current: number;
  target: number;
  color: string;
  bgColor: string;
  unit: string;
  showPercentage?: boolean;
}> = ({ label, current, target, color, bgColor, unit, showPercentage = true }) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div 
      className="space-y-3 md:space-y-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300"
      style={{
        animation: 'fadeInScale 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
        <span className="text-sm md:text-sm font-bold text-gray-800 tracking-wide">{label}</span>
        <span 
          className="text-xs md:text-sm font-semibold text-gray-600 bg-white px-2 md:px-3 py-1 rounded-full shadow-sm"
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
        <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
          <div 
            className={`h-3 md:h-4 rounded-full ${bgColor} shadow-lg transition-all duration-1000 ease-out`}
            style={{ 
              width: `${percentage}%`,
              ['--progress-width' as any]: `${percentage}%`,
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
            <span className="bg-gray-100 px-2 py-1 rounded-full text-center md:text-left">Στόχος: {target} {unit}</span>
            <span 
              className={`px-2 md:px-3 py-1 rounded-full ${color} bg-opacity-10 animate-pulse text-center md:text-right`}
            >
              {percentage.toFixed(1)}% προόδου
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


// Mobile-Specific Components
const MobileCollapsibleSection: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  index?: number;
}> = ({ title, icon: Icon, children, defaultOpen = false, index = 0 }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div 
      className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-blue-100 mb-4 md:mb-6 overflow-hidden hover:shadow-2xl transition-all duration-500"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-105 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3 md:space-x-4">
          <div 
            className="p-3 md:p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl md:rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg"
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
        </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{title}</h3>
        </div>
        <div
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
      </div>
      </button>
      {isOpen && (
        <div 
          className="border-t border-gray-100 overflow-hidden transition-all duration-400 ease-in-out"
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
};

// Modern Metrics Form Component
const MetricsForm: React.FC<{ 
  userId: string; 
  onSaved: () => Promise<void> | void; 
  saving?: boolean; 
  setSaving?: (v: boolean) => void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
}> = ({ userId, onSaved, saving, setSaving, onShowToast }) => {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [water, setWater] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [steps, setSteps] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<string>('');
  const [date] = useState<string>(new Date().toISOString().slice(0,10));

  const handleSave = async () => {
    if (!userId) return;
    
    console.log('[MetricsForm] ===== SAVING METRICS =====');
    console.log('[MetricsForm] User ID:', userId);
    console.log('[MetricsForm] Form values:', {
      weight, height, bodyFat, water, age, gender, 
      sleepHours, sleepQuality, steps, workoutType
    });
    
    // Check if at least one field has a value
    const hasAnyValue = weight || height || bodyFat || water || age || gender || 
                       sleepHours || sleepQuality || steps || workoutType;
    
    if (!hasAnyValue) {
      console.log('[MetricsForm] No values to save');
      return;
    }
    
    setSaving?.(true);
    try {
      const payload: any = {
        metric_date: date
      };
      
      // Only include fields that have values
      if (weight) {
        payload.weight_kg = parseFloat(weight);
        console.log('[MetricsForm] Adding weight:', payload.weight_kg);
      }
      if (height) {
        payload.height_cm = parseFloat(height);
        console.log('[MetricsForm] Adding height:', payload.height_cm);
      }
      if (bodyFat) {
        payload.body_fat_pct = parseFloat(bodyFat);
        console.log('[MetricsForm] Adding body fat:', payload.body_fat_pct);
      }
      if (water) {
        payload.water_liters = parseFloat(water);
        console.log('[MetricsForm] Adding water:', payload.water_liters);
      }
      if (age) {
        payload.age_years = parseInt(age);
        console.log('[MetricsForm] Adding age:', payload.age_years);
      }
      if (gender) {
        payload.gender = gender;
        console.log('[MetricsForm] Adding gender:', payload.gender);
      }
      if (sleepHours) {
        payload.sleep_hours = parseFloat(sleepHours);
        console.log('[MetricsForm] Adding sleep hours:', payload.sleep_hours);
      }
      if (sleepQuality) {
        payload.sleep_quality = sleepQuality;
        console.log('[MetricsForm] Adding sleep quality:', payload.sleep_quality);
      }
      if (steps) {
        payload.steps_per_day = parseInt(steps);
        console.log('[MetricsForm] Adding steps:', payload.steps_per_day);
      }
      if (workoutType) {
        payload.workout_type = workoutType;
        console.log('[MetricsForm] Adding workout type:', payload.workout_type);
      }
      
      console.log('[MetricsForm] Final payload:', payload);
      
      const result = await addUserMetric(userId, payload);
      console.log('[MetricsForm] Save result:', result);
      
      // Clear form
      setWeight(''); setHeight(''); setBodyFat(''); setWater('');
      setAge(''); setGender(''); setSleepHours(''); setSleepQuality(''); setSteps(''); setWorkoutType('');
      
      // Refresh data
      console.log('[MetricsForm] Refreshing data...');
      await onSaved();
      
      console.log('[MetricsForm] ===== DATA SAVED AND REFRESHED SUCCESSFULLY =====');
      
      // Show success toast
      onShowToast('success', 'Οι μετρήσεις αποθηκεύτηκαν επιτυχώς!');
      
    } catch (error) {
      console.error('[MetricsForm] Error saving metrics:', error);
      
      // Show error toast
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των μετρήσεων. Παρακαλώ δοκιμάστε ξανά.');
      
    } finally {
      setSaving?.(false);
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-blue-100 p-4 md:p-8 hover:shadow-2xl transition-all duration-500"
      style={{
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <div 
        className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8"
        style={{
          animation: 'slideInLeft 0.6s ease-out 0.2s forwards',
          opacity: 0,
          transform: 'translateX(-20px)'
        }}
      >
        <div 
          className="p-3 md:p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl md:rounded-2xl shadow-lg hover:rotate-3 hover:scale-110 transition-all duration-300"
        >
          <Edit3 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
      </div>
        <h3 className="text-lg md:text-2xl font-bold text-gray-900">Καταχώριση Μετρήσεων</h3>
      </div>
      
      <div className="space-y-4 md:space-y-6">
        {/* Personal Stats */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <User className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm md:text-base">Προσωπικά Στοιχεία</h4>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Βάρος (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={weight} 
                onChange={e=>setWeight(e.target.value)} 
                placeholder="π.χ. 75.5" 
              />
      </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ύψος (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={height} 
                onChange={e=>setHeight(e.target.value)} 
                placeholder="π.χ. 175.0" 
              />
    </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Λίπος (%)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={bodyFat} 
                onChange={e=>setBodyFat(e.target.value)} 
                placeholder="π.χ. 15.2" 
              />
  </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Φύλο</label>
              <select 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={gender} 
                onChange={e=>setGender(e.target.value)}
              >
                <option value="">Επιλέξτε...</option>
                <option value="male">Άνδρας</option>
                <option value="female">Γυναίκα</option>
                <option value="other">Άλλο</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wellness & Sleep */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Moon className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm md:text-base">Ύπνος & Ευεξία</h4>
      </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ώρες ύπνου</label>
              <input 
                type="number" 
                step="0.5" 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={sleepHours} 
                onChange={e=>setSleepHours(e.target.value)} 
                placeholder="π.χ. 7.5" 
              />
    </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ποιότητα ύπνου</label>
              <select 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={sleepQuality} 
                onChange={e=>setSleepQuality(e.target.value)}
              >
                <option value="">Επιλέξτε...</option>
                <option value="excellent">Εξαιρετική</option>
                <option value="good">Καλή</option>
                <option value="average">Μέτρια</option>
                <option value="poor">Κακή</option>
              </select>
  </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Νερό (λίτρα)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={water} 
                onChange={e=>setWater(e.target.value)} 
                placeholder="π.χ. 2.5" 
              />
            </div>
          </div>
        </div>

        {/* Activity & Training */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm md:text-base">Δραστηριότητα & Προπόνηση</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Βήματα/ημέρα</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={steps} 
                onChange={e=>setSteps(e.target.value)} 
                placeholder="π.χ. 8500" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Είδος προπόνησης</label>
              <select 
                className="w-full border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                value={workoutType} 
                onChange={e=>setWorkoutType(e.target.value)}
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
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full py-4 md:py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-feedback"
          style={{
            animation: 'fadeInUp 0.6s ease-out 0.4s forwards',
            opacity: 0,
            transform: 'translateY(20px)'
          }}
        >
          <div
            className={saving ? 'animate-spin' : ''}
          >
            <Save className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση Μετρήσεων'}
        </button>
    </div>
  </div>
);
};

const GoalsSection: React.FC<{ 
  userId: string; 
  latestMetric: any; 
  goals: any[]; 
  onChanged: () => Promise<void> | void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
}> = ({ userId, latestMetric, goals, onChanged, onShowToast }) => {
  const weightGoal = goals.find(g=>g.goal_type==='weight');
  const stepsGoal = goals.find(g=>g.goal_type==='steps');
  const sleepGoal = goals.find(g=>g.goal_type==='sleep');
  const workoutDaysGoal = goals.find(g=>g.goal_type==='workout_days');

  const [targetWeight, setTargetWeight] = useState<string>(weightGoal?.target_value?.toString()||'');
  const [targetSteps, setTargetSteps] = useState<string>(stepsGoal?.target_value?.toString()||'10000');
  const [targetSleep, setTargetSleep] = useState<string>(sleepGoal?.target_value?.toString()||'8');
  const [targetWorkoutDays, setTargetWorkoutDays] = useState<string>(workoutDaysGoal?.target_value?.toString()||'3');
  const [saving, setSaving] = useState<boolean>(false);

  const saveAllGoals = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      console.log('[GoalsSection] ===== SAVING ALL GOALS =====');
      
      const goalsToSave = [
        { type: 'weight' as const, value: targetWeight, unit: 'kg', title: 'Στόχος Βάρους' },
        { type: 'steps' as const, value: targetSteps, unit: 'steps', title: 'Στόχος Βημάτων' },
        { type: 'sleep' as const, value: targetSleep, unit: 'hours', title: 'Στόχος Ύπνου' },
        { type: 'workout_days' as const, value: targetWorkoutDays, unit: 'days/week', title: 'Στόχος Προπόνησης' }
      ];

      for (const goal of goalsToSave) {
        const numValue = parseFloat(goal.value);
        if (!isNaN(numValue) && numValue > 0) {
          console.log('[GoalsSection] Saving goal:', goal.type, numValue);
          await upsertUserGoal(userId, { 
            goal_type: goal.type, 
            target_value: numValue, 
            unit: goal.unit, 
            title: goal.title 
          });
        }
      }
      
      await onChanged();
      onShowToast('success', 'Όλοι οι στόχοι αποθηκεύτηκαν επιτυχώς!');
      console.log('[GoalsSection] ===== ALL GOALS SAVED SUCCESSFULLY =====');
      
    } catch (error) {
      console.error('[GoalsSection] Error saving goals:', error);
      onShowToast('error', 'Σφάλμα κατά την αποθήκευση των στόχων. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSaving(false);
    }
  };

  const currentW = latestMetric?.weight_kg || 0;
  const goalW = weightGoal?.target_value ?? (targetWeight ? parseFloat(targetWeight) : currentW);
  const diffW = currentW && goalW ? (currentW - goalW).toFixed(1) : '0';
  
  return (
    <div 
      className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-blue-100 p-4 md:p-8 hover:shadow-2xl transition-all duration-500"
      style={{
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <div 
        className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8"
        style={{
          animation: 'slideInLeft 0.6s ease-out 0.2s forwards',
          opacity: 0,
          transform: 'translateX(-20px)'
        }}
      >
        <div 
          className="p-3 md:p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl md:rounded-2xl shadow-lg hover:rotate-3 hover:scale-110 transition-all duration-300"
        >
          <Target className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          </div>
        <h3 className="text-lg md:text-2xl font-bold text-gray-900">Ορισμός Στόχων</h3>
        </div>
      
      <div className="space-y-4 md:space-y-6">
        {/* Weight & Body Fat Goals */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Weight className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm md:text-base">Στόχοι Βάρους & Λίπους</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                placeholder="Στόχος βάρους (kg)" 
                value={targetWeight} 
                onChange={e=>setTargetWeight(e.target.value)} 
              />
        </div>
            <div className="text-xs md:text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
              {currentW ? (() => {
                // Ειδικά μηνύματα όταν έχει φτάσει τον στόχο (διαφορά 0.0)
                if (parseFloat(diffW) === 0) {
                  const goalAchievedMessages = [
                    `🎉 ΣΥΓΧΑΡΗΤΗΡΙΑ! Έφτασες τον στόχο σου! ${currentW} kg - Τέλεια! 🏆`,
                    `🌟 ΕΚΠΛΗΚΤΙΚΟ! Είσαι ακριβώς στα ${currentW} kg που θέλεις! Θαύμα! ✨`,
                    `🥇 ΠΕΡΙΕΡΓΟ! Στόχος επιτεύχθηκε! ${currentW} kg - Είσαι άψογος! 💎`,
                    `🎊 ΦΑΝΤΑΣΤΙΚΟ! Έφτασες ακριβώς τον στόχο σου! ${currentW} kg - Μπράβο! 🌈`,
                    `👑 ΥΠΕΡΟΧΟ! Στόχος ${currentW} kg επιτεύχθηκε! Είσαι ο καλύτερος! ⭐`,
                    `🎯 ΤΕΛΕΙΟ! Είσαι ακριβώς στα ${currentW} kg που θέλεις! Συγχαρητήρια! 🎪`,
                    `💫 ΑΠΙΣΤΕΥΤΟ! Στόχος επιτεύχθηκε! ${currentW} kg - Εντυπωσιακό! 🌺`,
                    `🏅 ΕΚΤΑΚΤΟ! Έφτασες τον στόχο σου! ${currentW} kg - Μπράβο σου! 🔥`,
                    `⭐ ΘΑΥΜΑΣΙΟ! Στόχος ${currentW} kg επιτεύχθηκε! Είσαι φοβερός! ⚡`,
                    `🌈 ΑΠΟΛΥΤΟ! Είσαι ακριβώς στα ${currentW} kg που θέλεις! Συγχαρητήρια! 💪`,
                    `🎊 ΕΚΠΛΗΚΤΙΚΟ! Στόχος επιτεύχθηκε! ${currentW} kg - Είσαι άξιος! 🌟`,
                    `🏆 ΥΠΕΡΟΧΟ! Έφτασες τον στόχο σου! ${currentW} kg - Μπράβο! 🦁`,
                    `✨ ΤΕΛΕΙΟ! Στόχος ${currentW} kg επιτεύχθηκε! Είσαι ο χρυσός! 👑`,
                    `🎯 ΦΑΝΤΑΣΤΙΚΟ! Είσαι ακριβώς στα ${currentW} kg που θέλεις! Συγχαρητήρια! 💎`,
                    `🌟 ΑΠΙΣΤΕΥΤΟ! Στόχος επιτεύχθηκε! ${currentW} kg - Εντυπωσιακό! 🎪`
                  ];
                  return goalAchievedMessages[Math.floor(Math.random() * goalAchievedMessages.length)];
                }
                
                // Κανονικά μηνύματα ενθάρρυνσης για όλες τις άλλες περιπτώσεις
                const encouragementMessages = [
                  `Είσαι ${currentW} kg, στόχος ${goalW} kg — διαφορά ${diffW} kg. Πάμε δυνατά! 💪`,
                  `Βάρος: ${currentW} kg → Στόχος: ${goalW} kg (${diffW} kg διαφορά). Είσαι στο σωστό δρόμο! 🚀`,
                  `Τρέχεις προς τους ${goalW} kg από τα ${currentW} kg! Μόνο ${diffW} kg ακόμα! ⚡`,
                  `Εντυπωσιακά! Από ${currentW} kg σε στόχος ${goalW} kg. Διαφορά: ${diffW} kg. Συνέχισε έτσι! 🌟`,
                  `Τα ${currentW} kg σου είναι βήμα προς τους ${goalW} kg! Διαφορά: ${diffW} kg. Θα τα καταφέρεις! 💫`,
                  `Βάρος ${currentW} kg → Στόχος ${goalW} kg. Μόνο ${diffW} kg μακριά! Είσαι φανταστικός! 🎯`,
                  `Είσαι στα ${currentW} kg και στοχεύεις στα ${goalW} kg! Διαφορά: ${diffW} kg. Πάλεψε! ⚔️`,
                  `Τρέχεις από ${currentW} kg προς ${goalW} kg! Μόλις ${diffW} kg ακόμα! Είσαι μάχη! 🔥`,
                  `Εντυπωσιακό! ${currentW} kg → ${goalW} kg στόχος! Διαφορά: ${diffW} kg. Θα τα πετύχεις! 🌈`,
                  `Βάρος ${currentW} kg, στόχος ${goalW} kg. Διαφορά: ${diffW} kg. Είσαι άξιος! 👑`,
                  `Τα ${currentW} kg σου σε φέρνουν πιο κοντά στους ${goalW} kg! Διαφορά: ${diffW} kg. Συνεχίζεις! 🏃‍♂️`,
                  `Είσαι στα ${currentW} kg και στοχεύεις στα ${goalW} kg! Μόνο ${diffW} kg ακόμα! Θα τα καταφέρεις! ⭐`,
                  `Βάρος ${currentW} kg → Στόχος ${goalW} kg. Διαφορά: ${diffW} kg. Είσαι ο χρυσός! 🥇`,
                  `Τρέχεις προς τους ${goalW} kg από τα ${currentW} kg! Διαφορά: ${diffW} kg. Είσαι υπέροχος! 🌺`,
                  `Εντυπωσιακά! Από ${currentW} kg σε στόχος ${goalW} kg. Μόλις ${diffW} kg ακόμα! Δυνατός! 💪`,
                  `Βάρος ${currentW} kg, στόχος ${goalW} kg! Διαφορά: ${diffW} kg. Είσαι φοβερός! 🦁`,
                  `Τα ${currentW} kg σου είναι βήμα προς τους ${goalW} kg! Διαφορά: ${diffW} kg. Θα τα πετύχεις! 🎪`,
                  `Είσαι στα ${currentW} kg και στοχεύεις στα ${goalW} kg! Μόνο ${diffW} kg ακόμα! Είσαι μάχη! ⚡`,
                  `Βάρος ${currentW} kg → Στόχος ${goalW} kg. Διαφορά: ${diffW} kg. Είσαι ο καλύτερος! 🏆`,
                  `Τρέχεις προς τους ${goalW} kg από τα ${currentW} kg! Διαφορά: ${diffW} kg. Είσαι άξιος! 🌟`
                ];
                return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
              })() : 'Καταχώρισε πρώτα βάρος για να δούμε πρόοδο.'}
        </div>
    </div>
        </div>

        {/* Training & Activity Goals */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm md:text-base">Στόχοι Προπόνησης & Δραστηριότητας</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                placeholder="Στόχος βημάτων (π.χ. 10000)" 
                value={targetSteps} 
                onChange={e=>setTargetSteps(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                placeholder="Ημέρες προπόνησης/εβδ. (π.χ. 3)" 
                value={targetWorkoutDays} 
                onChange={e=>setTargetWorkoutDays(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Sleep & Wellness Goals */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Moon className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800 text-sm md:text-base">Στόχοι Ύπνου & Ευεξίας</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base" 
                placeholder="Ώρες ύπνου (π.χ. 8)" 
                value={targetSleep} 
                onChange={e=>setTargetSleep(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Central Save Button */}
        <div 
          className="pt-6 md:pt-8 border-t border-gray-200"
          style={{
            animation: 'fadeInUp 0.6s ease-out 0.6s forwards',
            opacity: 0,
            transform: 'translateY(20px)'
          }}
        >
          <button 
            onClick={saveAllGoals}
            disabled={saving}
            className="w-full py-4 md:py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className={saving ? 'animate-spin' : ''}
            >
              <Save className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Όλων των Στόχων'}
      </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [visitStats, setVisitStats] = useState<any>(null);
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

  // Toast functions
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Function to refresh all data
  const refreshData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('[Dashboard] ===== REFRESHING DATA =====');
      console.log('[Dashboard] User ID:', user.id);
      
      const categories = await getAvailableQRCategories(user.id);
      console.log('[Dashboard] Available QR categories:', categories);
      
      console.log('[Dashboard] Fetching user metrics...');
      const m = await getUserMetrics(user.id, 90);
      console.log('[Dashboard] User metrics fetched:', m);
      
      console.log('[Dashboard] Fetching user goals...');
      const g = await getUserGoals(user.id);
      console.log('[Dashboard] User goals fetched:', g);
      
      console.log('[Dashboard] Fetching visit stats...');
      const v = await getUserVisitStats(user.id);
      console.log('[Dashboard] Visit stats fetched:', v);
      
      setMetrics(m);
      setGoals(g);
      setVisitStats(v);
      
      // Force re-render
      setRefreshKey(prev => prev + 1);
      
      console.log('[Dashboard] ===== DATA REFRESHED SUCCESSFULLY =====');
      console.log('[Dashboard] Metrics count:', m?.length || 0);
      console.log('[Dashboard] Goals count:', g?.length || 0);
      console.log('[Dashboard] Latest metric:', m?.[0] || 'None');
      console.log('[Dashboard] Refresh key updated:', refreshKey + 1);
    } catch (error) {
      console.error('[Dashboard] Error refreshing data:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      
      // Track this dashboard visit
      await trackPageVisit(user.id, 'Dashboard');
      
      await refreshData();
    };
    load();
  }, [user?.id]);

  const latest = metrics[0] || {} as any;
  const weightGoal = goals.find((g:any)=>g.goal_type==='weight');
  const bodyFatGoal = goals.find((g:any)=>g.goal_type==='body_fat');
  const stepsGoal = goals.find((g:any)=>g.goal_type==='steps');
  const sleepGoal = goals.find((g:any)=>g.goal_type==='sleep');
  const workoutDaysGoal = goals.find((g:any)=>g.goal_type==='workout_days');
  
  // Debug logs for latest metric
  console.log('[Dashboard] ===== LATEST METRIC DEBUG =====');
  console.log('[Dashboard] Metrics array:', metrics);
  console.log('[Dashboard] Metrics length:', metrics?.length || 0);
  
  // Debug logs for goals
  console.log('[Dashboard] ===== GOALS DEBUG =====');
  console.log('[Dashboard] Goals array:', goals);
  console.log('[Dashboard] Goals length:', goals?.length || 0);
  console.log('[Dashboard] Weight goal:', weightGoal);
  console.log('[Dashboard] Steps goal:', stepsGoal);
  console.log('[Dashboard] Sleep goal:', sleepGoal);
  console.log('[Dashboard] Workout days goal:', workoutDaysGoal);
  console.log('[Dashboard] ===== END GOALS DEBUG =====');
  console.log('[Dashboard] All metrics data:', metrics.map((m, i) => ({
    index: i,
    date: m.metric_date,
    weight: m.weight_kg,
    body_fat: m.body_fat_pct,
    height: m.height_cm
  })));
  console.log('[Dashboard] Latest metric (metrics[0]):', latest);
  console.log('[Dashboard] Latest weight:', latest?.weight_kg);
  console.log('[Dashboard] Latest body fat:', latest?.body_fat_pct);
  console.log('[Dashboard] Latest height:', latest?.height_cm);
  console.log('[Dashboard] ===== END LATEST METRIC DEBUG =====');

  // Function to get personal stats cards - recalculates every time
  const getPersonalStatsCards = () => {
    console.log('[Dashboard] ===== RECALCULATING PERSONAL STATS =====');
    console.log('[Dashboard] Latest metric for stats:', latest);
    console.log('[Dashboard] Visit stats for stats:', visitStats);
    
    return [
    {
      name: 'Βάρος',
        value: latest.weight_kg ? `${latest.weight_kg} kg` : '—',
      icon: Weight,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
        trend: ''
    },
    {
      name: 'Ύψος',
        value: latest.height_cm ? `${latest.height_cm} cm` : '—',
      icon: Ruler,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
        trend: ''
    },
    {
      name: 'Λίπος',
        value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : '—',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
        trend: ''
      },
      {
        name: 'Ύπνος',
        value: latest.sleep_hours ? `${latest.sleep_hours} ώρες` : '—',
        icon: Clock,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        trend: ''
      },
      {
        name: 'Βήματα/ημέρα',
        value: typeof latest.steps_per_day === 'number' ? latest.steps_per_day : '—',
        icon: Target,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        trend: ''
      },
      {
        name: 'Προπόνηση',
        value: latest.workout_type || '—',
        icon: Target,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        trend: ''
      }
    ];
  };
  
  const personalStatsCards = getPersonalStatsCards();

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
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 mobile-smooth-scroll mobile-optimized"
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
            className="bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-blue-100 p-4 md:p-8 mb-4 md:mb-6 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500"
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
                  className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3"
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
                  className="text-base md:text-xl text-gray-600 font-medium"
                  style={{
                    animation: 'fadeInUp 0.8s ease-out 0.5s forwards',
                    opacity: 0,
                    transform: 'translateY(20px)'
                  }}
                >
          Εδώ είναι η επισκόπηση της δραστηριότητάς σου στο FreeGym
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
                  className="p-6 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-3xl text-white text-center shadow-xl hover:scale-105 hover:rotate-1 transition-all duration-300"
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
            className="bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-blue-100 p-4 md:p-8 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500"
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
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">Πρόοδος προς τους Στόχους</h2>
                </div>

            {/* Global Notifications for Goals Section */}
            <div className="space-y-3 mb-6">
              <div className="text-purple-600 text-sm bg-purple-50 border border-purple-200 rounded-lg p-3 font-medium">
                🎯 Στο τμήμα "Ορισμός Στόχων" μπορείς να προσθέσεις τους στόχους σου!
              </div>
              <div className="text-blue-600 text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 font-medium">
                💡 Στο τμήμα "Καταχώρηση Μετρήσεων" μπορείς να καταχωρείς τις μετρήσεις σου για να βλέπεις την πρόοδό σου!
              </div>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              {/* Weight & Body Fat Goals */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
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
                        showPercentage={false}
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
                        showPercentage={false}
                      />
            </div>
                  )}
          </div>
        </div>

              {/* Training & Activity Goals */}
          <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
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
                        showPercentage={false}
                      />
          </div>
                  )}
                </div>
              </div>

              {/* Sleep & Wellness Goals */}
          <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2">
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
                        showPercentage={false}
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
          {/* Metrics Input Form */}
          <MobileCollapsibleSection title="Καταχώριση Μετρήσεων" icon={Edit3} defaultOpen={false} index={0}>
            <MetricsForm 
              userId={user?.id || ''} 
              onSaved={refreshData} 
              onShowToast={showToast}
            />
        </MobileCollapsibleSection>

          {/* Goals Section */}
          <MobileCollapsibleSection title="Ορισμός Στόχων" icon={Target} defaultOpen={false} index={1}>
            <GoalsSection 
              userId={user?.id || ''} 
              latestMetric={latest} 
              goals={goals} 
              onChanged={refreshData}
              onShowToast={showToast}
            />
          </MobileCollapsibleSection>

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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-blue-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-blue-600">💧</div>
          </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Υδάτωση</h4>
                      <p className="text-xs md:text-sm text-gray-600">Πίνε 2-3 λίτρα νερό καθημερινά για βέλτιστη υγεία και ενέργεια</p>
                    </div>
                  </div>
                </div>

                {/* Protein Tip */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg md:rounded-xl p-3 md:p-4 border border-green-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-green-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-green-600">🥩</div>
                  </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Πρωτεΐνη</h4>
                      <p className="text-xs md:text-sm text-gray-600">Καταναλώνε 1.6-2.2g πρωτεΐνης ανά kg σωματικού βάρους</p>
                  </div>
                </div>
              </div>

                {/* Sleep Tip */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg md:rounded-xl p-3 md:p-4 border border-purple-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-purple-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-purple-600">😴</div>
          </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Ύπνος</h4>
                      <p className="text-xs md:text-sm text-gray-600">7-9 ώρες ποιοτικού ύπνου για ανάκαμψη και ανάπτυξη</p>
        </div>
      </div>
                </div>

                {/* Exercise Tip */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg md:rounded-xl p-3 md:p-4 border border-orange-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-orange-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-orange-600">🏃</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Άσκηση</h4>
                      <p className="text-xs md:text-sm text-gray-600">150 λεπτά μέτριας έντασης άσκησης εβδομαδιαίως</p>
                    </div>
                  </div>
                </div>

                {/* Nutrition Tip */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg md:rounded-xl p-3 md:p-4 border border-red-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-red-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-red-600">🥗</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Διατροφή</h4>
                      <p className="text-xs md:text-sm text-gray-600">Φρέσκα φρούτα και λαχανικά σε κάθε γεύμα</p>
                    </div>
                  </div>
                </div>

                {/* Recovery Tip */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg md:rounded-xl p-3 md:p-4 border border-indigo-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-indigo-200 rounded-lg">
                      <div className="w-5 h-5 md:w-6 md:h-6 text-indigo-600">🧘</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">Ανάκαμψη</h4>
                      <p className="text-xs md:text-sm text-gray-600">Διαλείμματα ανάμεσα στις προπονήσεις για αποτελεσματικότητα</p>
                    </div>
                  </div>
                </div>
              </div>
    </div>
          </MobileCollapsibleSection>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;