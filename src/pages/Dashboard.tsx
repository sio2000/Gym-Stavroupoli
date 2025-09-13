import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target,
  Clock,
  Activity,
  Weight,
  Ruler,
  Heart,
  ChevronDown,
  User,
  Plus,
  Moon,
  Dumbbell,
  Save,
  Edit3,
  Sparkles
} from 'lucide-react';
import { mockLessons } from '@/data/mockData';
import { getLessonCategoryName, getLessonDifficultyName } from '@/utils';
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
    className="group relative overflow-hidden bg-white rounded-xl sm:rounded-3xl shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 hover:scale-105 mobile-gpu-accelerated mobile-smooth-transitions"
    style={{ 
      animationDelay: `${index * 100}ms`,
      animation: 'fadeInUp 0.6s ease-out forwards',
      opacity: 0
    }}
  >
    <div 
      className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
    />
    <div className="relative p-3 sm:p-6">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div 
          className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${bgColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
        >
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${color}`} />
        </div>
        {trend && (
          <span 
            className={`text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 ${trendColor} shadow-sm group-hover:scale-105 transition-transform duration-300`}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 tracking-wide">{name}</p>
        <p className="text-xl sm:text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
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
      className="space-y-2 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 mobile-card mobile-smooth-transitions"
      style={{
        animation: 'fadeInScale 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs sm:text-sm font-bold text-gray-800 tracking-wide">{label}</span>
        <span 
          className="text-xs sm:text-sm font-semibold text-gray-600 bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm"
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
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-4 overflow-hidden shadow-inner">
          <div 
            className={`h-2 sm:h-4 rounded-full ${bgColor} shadow-lg transition-all duration-1000 ease-out`}
            style={{ 
              width: `${percentage}%`,
              ['--progress-width' as any]: `${percentage}%`,
              animation: 'progressFill 1.2s ease-out 0.3s forwards'
            }}
          />
        </div>
        {showPercentage && (
          <div 
            className="flex justify-between text-xs font-semibold text-gray-600 mt-2 sm:mt-3"
            style={{
              animation: 'fadeInUp 0.6s ease-out 0.5s forwards',
              opacity: 0,
              transform: 'translateY(10px)'
            }}
          >
            <span className="bg-gray-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">Στόχος: {target} {unit}</span>
            <span 
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${color} bg-opacity-10 animate-pulse text-xs`}
            >
              {percentage.toFixed(1)}% προόδου
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const LessonCard: React.FC<{
  lesson: any;
  onClick?: () => void;
  index?: number;
}> = ({ lesson, onClick, index = 0 }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardio': return { bg: 'bg-gradient-to-br from-red-100 to-red-200', text: 'text-red-600', border: 'border-red-200', shadow: 'shadow-red-100' };
      case 'strength': return { bg: 'bg-gradient-to-br from-blue-100 to-blue-200', text: 'text-blue-600', border: 'border-blue-200', shadow: 'shadow-blue-100' };
      case 'yoga': return { bg: 'bg-gradient-to-br from-green-100 to-green-200', text: 'text-green-600', border: 'border-green-200', shadow: 'shadow-green-100' };
      default: return { bg: 'bg-gradient-to-br from-purple-100 to-purple-200', text: 'text-purple-600', border: 'border-purple-200', shadow: 'shadow-purple-100' };
    }
  };

  const colors = getCategoryColor(lesson.category);

  return (
    <div 
      className={`group relative overflow-hidden bg-white rounded-2xl border-2 ${colors.border} hover:shadow-xl transition-all duration-500 cursor-pointer ${colors.shadow} hover:-translate-y-2 hover:scale-105`}
      onClick={onClick}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
      />
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
            >
              <Activity className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div>
              <p 
                className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors text-lg"
                style={{
                  animationDelay: `${100 + index * 100}ms`,
                  animation: 'slideInLeft 0.6s ease-out forwards',
                  opacity: 0,
                  transform: 'translateX(-20px)'
                }}
              >
                {lesson.name}
              </p>
              <p 
                className="text-sm text-gray-600 font-medium mt-1"
                style={{
                  animationDelay: `${200 + index * 100}ms`,
                  animation: 'slideInLeft 0.6s ease-out forwards',
                  opacity: 0,
                  transform: 'translateX(-20px)'
                }}
              >
                {getLessonCategoryName(lesson.category)} • {getLessonDifficultyName(lesson.difficulty)}
              </p>
            </div>
          </div>
          <div 
            className="text-right"
            style={{
              animationDelay: `${300 + index * 100}ms`,
              animation: 'slideInRight 0.6s ease-out forwards',
              opacity: 0,
              transform: 'translateX(20px)'
            }}
          >
            <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{lesson.credits} πιστώση</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{lesson.duration} λεπτά</p>
          </div>
        </div>
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
      className="bg-white rounded-3xl shadow-xl border border-blue-100 mb-6 overflow-hidden hover:shadow-2xl transition-all duration-500"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-105 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-4">
          <div 
            className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg"
          >
            <Icon className="h-6 w-6 text-blue-600" />
        </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{title}</h3>
        </div>
        <div
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <ChevronDown className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
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
          <div className="px-6 pb-6 pt-4">
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
      className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 hover:shadow-2xl transition-all duration-500"
      style={{
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <div 
        className="flex items-center gap-4 mb-8"
        style={{
          animation: 'slideInLeft 0.6s ease-out 0.2s forwards',
          opacity: 0,
          transform: 'translateX(-20px)'
        }}
      >
        <div 
          className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-lg hover:rotate-3 hover:scale-110 transition-all duration-300"
        >
          <Edit3 className="h-6 w-6 text-blue-600" />
      </div>
        <h3 className="text-2xl font-bold text-gray-900">Καταχώριση Μετρήσεων</h3>
      </div>
      
      <div className="space-y-6">
        {/* Personal Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Προσωπικά Στοιχεία</h4>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Βάρος (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={bodyFat} 
                onChange={e=>setBodyFat(e.target.value)} 
                placeholder="π.χ. 15.2" 
              />
  </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Φύλο</label>
              <select 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Ύπνος & Ευεξία</h4>
      </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ώρες ύπνου</label>
              <input 
                type="number" 
                step="0.5" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={sleepHours} 
                onChange={e=>setSleepHours(e.target.value)} 
                placeholder="π.χ. 7.5" 
              />
    </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ποιότητα ύπνου</label>
              <select 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={water} 
                onChange={e=>setWater(e.target.value)} 
                placeholder="π.χ. 2.5" 
              />
            </div>
          </div>
        </div>

        {/* Activity & Training */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Δραστηριότητα & Προπόνηση</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Βήματα/ημέρα</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={steps} 
                onChange={e=>setSteps(e.target.value)} 
                placeholder="π.χ. 8500" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Είδος προπόνησης</label>
              <select 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
          className="w-full py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            animation: 'fadeInUp 0.6s ease-out 0.4s forwards',
            opacity: 0,
            transform: 'translateY(20px)'
          }}
        >
          <div
            className={saving ? 'animate-spin' : ''}
          >
            <Save className="h-6 w-6" />
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
      className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 hover:shadow-2xl transition-all duration-500"
      style={{
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      <div 
        className="flex items-center gap-4 mb-8"
        style={{
          animation: 'slideInLeft 0.6s ease-out 0.2s forwards',
          opacity: 0,
          transform: 'translateX(-20px)'
        }}
      >
        <div 
          className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-lg hover:rotate-3 hover:scale-110 transition-all duration-300"
        >
          <Target className="h-6 w-6 text-blue-600" />
          </div>
        <h3 className="text-2xl font-bold text-gray-900">Ορισμός Στόχων</h3>
        </div>
      
      <div className="space-y-6">
        {/* Weight & Body Fat Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Weight className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Στόχοι Βάρους & Λίπους</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder="Στόχος βάρους (kg)" 
                value={targetWeight} 
                onChange={e=>setTargetWeight(e.target.value)} 
              />
        </div>
            <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
              {currentW ? `Είσαι ${currentW} kg, στόχος ${goalW} kg — διαφορά ${diffW} kg. Πάμε δυνατά! 💪` : 'Καταχώρισε πρώτα βάρος για να δούμε πρόοδο.'}
        </div>
    </div>
        </div>

        {/* Training & Activity Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Στόχοι Προπόνησης & Δραστηριότητας</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder="Στόχος βημάτων (π.χ. 10000)" 
                value={targetSteps} 
                onChange={e=>setTargetSteps(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder="Ημέρες προπόνησης/εβδ. (π.χ. 3)" 
                value={targetWorkoutDays} 
                onChange={e=>setTargetWorkoutDays(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Sleep & Wellness Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Στόχοι Ύπνου & Ευεξίας</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder="Ώρες ύπνου (π.χ. 8)" 
                value={targetSleep} 
                onChange={e=>setTargetSleep(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Central Save Button */}
        <div 
          className="pt-8 border-t border-gray-200"
          style={{
            animation: 'fadeInUp 0.6s ease-out 0.6s forwards',
            opacity: 0,
            transform: 'translateY(20px)'
          }}
        >
          <button 
            onClick={saveAllGoals}
            disabled={saving}
            className="w-full py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className={saving ? 'animate-spin' : ''}
            >
              <Save className="h-6 w-6" />
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

  const recentLessons = mockLessons.slice(0, 4);
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
        icon: Activity,
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
      {/* CSS Animations */}
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
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 mobile-smooth-scroll"
        style={{
          animation: 'fadeInUp 0.8s ease-out forwards',
          opacity: 0
        }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Modern Header - Mobile Optimized */}
        <div 
          className="mb-6 sm:mb-12"
          style={{
            animation: 'fadeInUp 0.8s ease-out forwards',
            opacity: 0
          }}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-100 p-4 sm:p-8 mb-4 sm:mb-6 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div
                className="w-full sm:w-auto"
                style={{
                  animation: 'slideInLeft 0.8s ease-out 0.3s forwards',
                  opacity: 0,
                  transform: 'translateX(-30px)'
                }}
              >
                <h1 
                  className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3"
                  style={{
                    animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
                    opacity: 0,
                    transform: 'translateY(20px)'
                  }}
                >
                  Καλώς ήρθες, {user?.firstName || user?.email?.split('@')[0] || 'Χρήστη'}! 
                  <span
                    className="ml-2 sm:ml-3 animate-bounce"
                    style={{
                      animation: 'bounce 2s infinite 3s'
                    }}
                  >
                    👋
                  </span>
                </h1>
                <p 
                  className="text-sm sm:text-xl text-gray-600 font-medium"
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
                className="mt-4 sm:mt-0 sm:block"
                style={{
                  animation: 'slideInRight 0.8s ease-out 0.6s forwards',
                  opacity: 0,
                  transform: 'translateX(30px)'
                }}
              >
                <div 
                  className="p-4 sm:p-6 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl text-white text-center shadow-xl hover:scale-105 hover:rotate-1 transition-all duration-300"
                >
                  <div
                    className="animate-pulse"
                    style={{
                      animation: 'bounce 2s infinite'
                    }}
                  >
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                  </div>
                  <p className="text-lg sm:text-xl font-bold">Έτοιμος για μια νέα μέρα προπόνησης!</p>
                  <p 
                    className="text-xs sm:text-sm opacity-90 mt-2 font-medium animate-pulse"
                  >
                    Καλή πρόοδος! 💪
                  </p>
                </div>
              </div>
            </div>
          </div>


        {/* Personal Stats Grid - Mobile Optimized */}
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-12"
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

        {/* Progress Towards Goals - Enhanced Mobile */}
        <div 
          className="mb-6 sm:mb-12"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            opacity: 0,
            transform: 'translateY(30px)'
          }}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-100 p-4 sm:p-8 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500"
          >
            <div 
              className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-10"
              style={{
                animation: 'slideInLeft 0.8s ease-out 0.6s forwards',
                opacity: 0,
                transform: 'translateX(-20px)'
              }}
            >
              <div 
                className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl sm:rounded-2xl shadow-lg hover:rotate-3 hover:scale-110 transition-all duration-300"
              >
                <Target className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Πρόοδος προς τους Στόχους</h2>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {/* Weight & Body Fat Goals */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Weight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
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
                    <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-3">
                      Καταχώρισε βάρος για να δεις πρόοδο
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
                    <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-3">
                      Καταχώρισε λίπος για να δεις πρόοδο
            </div>
                  )}
          </div>
        </div>

              {/* Training & Activity Goals */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
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
                    <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-3">
                      Καταχώρισε βήματα για να δεις πρόοδο
          </div>
                  )}
                </div>
              </div>

              {/* Sleep & Wellness Goals */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
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
                    <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-3">
                      Καταχώρισε ύπνο για να δεις πρόοδο
                      </div>
                  )}
                  </div>
                  </div>

              {/* Nutrition Tips & Wellness */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Συμβουλές Διατροφής & Ευεξίας
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Hydration Tip */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 hover:shadow-lg transition-all duration-300 mobile-card mobile-hover-scale mobile-smooth-transitions">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-200 rounded-lg mobile-stat-icon">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600">💧</div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 mobile-card-title">Υδάτωση</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mobile-card-content">Πίνε 2-3 λίτρα νερό καθημερινά για βέλτιστη υγεία και ενέργεια</p>
                      </div>
                    </div>
                  </div>

                  {/* Protein Tip */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 hover:shadow-lg transition-all duration-300 mobile-card mobile-hover-scale mobile-smooth-transitions">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-200 rounded-lg mobile-stat-icon">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 text-green-600">🥩</div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 mobile-card-title">Πρωτεΐνη</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mobile-card-content">Καταναλώνε 1.6-2.2g πρωτεΐνης ανά kg σωματικού βάρους</p>
                      </div>
                    </div>
                  </div>

                  {/* Sleep Tip */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200 hover:shadow-lg transition-all duration-300 mobile-card mobile-hover-scale mobile-smooth-transitions">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-purple-200 rounded-lg mobile-stat-icon">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600">😴</div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 mobile-card-title">Ύπνος</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mobile-card-content">7-9 ώρες ποιοτικού ύπνου για ανάκαμψη και ανάπτυξη</p>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Tip */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200 hover:shadow-lg transition-all duration-300 mobile-card mobile-hover-scale mobile-smooth-transitions">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-orange-200 rounded-lg mobile-stat-icon">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600">🏃</div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 mobile-card-title">Άσκηση</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mobile-card-content">150 λεπτά μέτριας έντασης άσκησης εβδομαδιαίως</p>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Tip */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 hover:shadow-lg transition-all duration-300 mobile-card mobile-hover-scale mobile-smooth-transitions">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-red-200 rounded-lg mobile-stat-icon">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 text-red-600">🥗</div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 mobile-card-title">Διατροφή</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mobile-card-content">Φρέσκα φρούτα και λαχανικά σε κάθε γεύμα</p>
                      </div>
                    </div>
                  </div>

                  {/* Recovery Tip */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-200 hover:shadow-lg transition-all duration-300 mobile-card mobile-hover-scale mobile-smooth-transitions">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-indigo-200 rounded-lg mobile-stat-icon">
                        <div className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600">🧘</div>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 mobile-card-title">Ανάκαμψη</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mobile-card-content">Διαλείμματα ανάμεσα στις προπονήσεις για αποτελεσματικότητα</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

        {/* Modern Collapsible Sections - Mobile Optimized */}
        <div 
          className="space-y-4 sm:space-y-8"
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

          {/* Available Lessons */}
          <MobileCollapsibleSection title="Διαθέσιμα Μαθήματα" icon={Activity} defaultOpen={false} index={2}>
            <div 
              className="space-y-6"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.2s forwards',
                opacity: 0
              }}
            >
              {recentLessons.map((lesson, index) => (
                <LessonCard key={lesson.id} lesson={lesson} index={index} />
              ))}
              <button 
                className="w-full py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
                style={{
                  animation: 'fadeInUp 0.6s ease-out 0.4s forwards',
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                <div
                  className="animate-bounce"
                  style={{
                    animation: 'bounce 2s infinite'
                  }}
                >
                  <Plus className="h-6 w-6" />
                </div>
                Προβολή Όλων των Μαθημάτων
              </button>
            </div>
          </MobileCollapsibleSection>
        </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
