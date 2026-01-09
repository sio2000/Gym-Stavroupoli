import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Clock,
  Activity,
  MoreVertical,
  Search,
  Settings,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  WorkoutCategory,
  WorkoutExercise,
  ExerciseSetConfig,
  CombinedWorkoutProgram,
  CombinedProgramExercise,
  getWorkoutCategories,
  createWorkoutCategory,
  updateWorkoutCategory,
  deleteWorkoutCategory,
  getWorkoutExercises,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise,
  getExerciseSetConfig,
  upsertExerciseSetConfig,
  getCombinedWorkoutPrograms,
  updateCombinedWorkoutProgram,
  deleteCombinedWorkoutProgram,
  addExerciseToCombinedProgram,
  updateCombinedProgramExercise,
  deleteCombinedProgramExercise,
  reorderCombinedProgramExercises
} from '@/utils/workoutProgramsApi';

const WorkoutProgramsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'exercises' | 'combined'>('categories');
  const [loading, setLoading] = useState(false);
  
  // Categories
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<WorkoutCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', description: '' });
  
  // Exercises
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({ 
    name: '', 
    description: '', 
    youtube_url: '', 
    category_id: '' 
  });
  const [exerciseSetForm, setExerciseSetForm] = useState({
    sets: 3,
    reps_min: '',
    reps_max: '',
    reps_text: '',
    rest_seconds: 60,
    weight_notes: ''
  });
  
  // Combined Programs
  const [combinedPrograms, setCombinedPrograms] = useState<CombinedWorkoutProgram[]>([]);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingExerciseForLevel, setEditingExerciseForLevel] = useState<{ id: string; currentLevel?: string } | null>(null);
  
  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const cats = await getWorkoutCategories();
        setCategories(cats);
      } else if (activeTab === 'exercises') {
        const exs = await getWorkoutExercises();
        setExercises(exs);
        const cats = await getWorkoutCategories();
        setCategories(cats);
      } else if (activeTab === 'combined') {
        const progs = await getCombinedWorkoutPrograms();
        setCombinedPrograms(progs);
        const exs = await getWorkoutExercises();
        setExercises(exs);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  };
  
  // Category handlers
  const handleCreateCategory = async () => {
    try {
      await createWorkoutCategory({
        ...categoryForm,
        display_order: categories.length
      });
      toast.success('Η κατηγορία δημιουργήθηκε');
      setCategoryForm({ name: '', icon: '', description: '' });
      await loadData();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Σφάλμα δημιουργίας κατηγορίας');
    }
  };
  
  const handleUpdateCategory = async (id: string) => {
    try {
      await updateWorkoutCategory(id, categoryForm);
      toast.success('Η κατηγορία ενημερώθηκε');
      setEditingCategory(null);
      setCategoryForm({ name: '', icon: '', description: '' });
      await loadData();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Σφάλμα ενημέρωσης κατηγορίας');
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Να διαγραφεί η κατηγορία;')) return;
    try {
      await deleteWorkoutCategory(id);
      toast.success('Η κατηγορία διαγράφηκε');
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Σφάλμα διαγραφής κατηγορίας');
    }
  };
  
  // Exercise handlers
  const handleCreateExercise = async () => {
    if (!exerciseForm.category_id) {
      toast.error('Επίλεξε κατηγορία');
      return;
    }
    try {
      await createWorkoutExercise({
        ...exerciseForm,
        display_order: exercises.filter(e => e.category_id === exerciseForm.category_id).length
      });
      toast.success('Η άσκηση δημιουργήθηκε');
      setExerciseForm({ name: '', description: '', youtube_url: '', category_id: '' });
      setExerciseSetForm({ sets: 3, reps_min: '', reps_max: '', reps_text: '', rest_seconds: 60, weight_notes: '' });
      await loadData();
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast.error('Σφάλμα δημιουργίας άσκησης');
    }
  };
  
  const handleEditExerciseSetConfig = async (exerciseId: string) => {
    try {
      await upsertExerciseSetConfig({
        exercise_id: exerciseId,
        ...exerciseSetForm,
        sets: parseInt(exerciseSetForm.sets.toString()) || 3,
        reps_min: exerciseSetForm.reps_min ? parseInt(exerciseSetForm.reps_min) : undefined,
        reps_max: exerciseSetForm.reps_max ? parseInt(exerciseSetForm.reps_max) : undefined,
        rest_seconds: parseInt(exerciseSetForm.rest_seconds.toString()) || 60
      });
      toast.success('Οι επαναλήψεις ενημερώθηκαν');
      await loadData();
    } catch (error) {
      console.error('Error updating exercise set config:', error);
      toast.error('Σφάλμα ενημέρωσης επαναλήψεων');
    }
  };
  
  const handleUpdateExercise = async () => {
    if (!editingExercise || !exerciseForm.category_id) {
      toast.error('Επίλεξε κατηγορία');
      return;
    }
    try {
      await updateWorkoutExercise(editingExercise.id, {
        name: exerciseForm.name,
        description: exerciseForm.description,
        youtube_url: exerciseForm.youtube_url,
        category_id: exerciseForm.category_id
      });
      toast.success('Η άσκηση ενημερώθηκε');
      setEditingExercise(null);
      setExerciseForm({ name: '', description: '', youtube_url: '', category_id: '' });
      await loadData();
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast.error('Σφάλμα ενημέρωσης άσκησης');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Να διαγραφεί η άσκηση;')) return;
    try {
      await deleteWorkoutExercise(id);
      toast.success('Η άσκηση διαγράφηκε');
      await loadData();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Σφάλμα διαγραφής άσκησης');
    }
  };
  
  // Combined Program handlers
  
  const handleAddExerciseToCombinedProgram = async (programId: string, exerciseId: string) => {
    const program = combinedPrograms.find(p => p.id === programId);
    const exercise = exercises.find(e => e.id === exerciseId);
    
    if (!program || !exercise) return;
    
    const existingExercises = program.exercises || [];
    const displayOrder = existingExercises.length;
    
    try {
      // Get default set config if available
      const setConfig = exercise.set_config;
      
      await addExerciseToCombinedProgram({
        combined_program_id: programId,
        exercise_id: exerciseId,
        display_order: displayOrder,
        sets: setConfig?.sets || 3,
        reps_min: setConfig?.reps_min,
        reps_max: setConfig?.reps_max,
        reps_text: setConfig?.reps_text,
        rest_seconds: setConfig?.rest_seconds || 60,
        weight_notes: setConfig?.weight_notes
      });
      toast.success('Η άσκηση προστέθηκε');
      await loadData();
    } catch (error) {
      console.error('Error adding exercise to program:', error);
      toast.error('Σφάλμα προσθήκης άσκησης');
    }
  };
  
  const handleUpdateCombinedProgramExercise = async (id: string, updates: Partial<CombinedProgramExercise>) => {
    try {
      await updateCombinedProgramExercise(id, updates);
      toast.success('Η άσκηση ενημερώθηκε');
      await loadData();
    } catch (error) {
      console.error('Error updating combined program exercise:', error);
      toast.error('Σφάλμα ενημέρωσης άσκησης');
    }
  };
  
  const handleDeleteCombinedProgramExercise = async (id: string) => {
    if (!confirm('Να αφαιρεθεί η άσκηση από το πρόγραμμα;')) return;
    try {
      await deleteCombinedProgramExercise(id);
      toast.success('Η άσκηση αφαιρέθηκε');
      await loadData();
    } catch (error) {
      console.error('Error deleting combined program exercise:', error);
      toast.error('Σφάλμα αφαίρεσης άσκησης');
    }
  };

  const handleDeleteCombinedProgram = async (id: string) => {
    if (!confirm('Να διαγραφεί το συνδυαστικό πρόγραμμα; Θα διαγραφούν όλες οι ασκήσεις του.')) return;
    try {
      await deleteCombinedWorkoutProgram(id);
      toast.success('Το συνδυαστικό πρόγραμμα διαγράφηκε');
      await loadData();
    } catch (error) {
      console.error('Error deleting combined program:', error);
      toast.error('Σφάλμα διαγραφής προγράμματος');
    }
  };
  
  if (loading && categories.length === 0 && exercises.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'categories', label: 'Κατηγορίες', icon: Activity },
            { id: 'exercises', label: 'Ασκήσεις', icon: Activity },
            { id: 'combined', label: 'Συνδυαστικά Προγράμματα', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Create Category Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Επεξεργασία Κατηγορίας' : 'Νέα Κατηγορία'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Όνομα"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Περιγραφή"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => editingCategory ? handleUpdateCategory(editingCategory.id) : handleCreateCategory()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategory ? 'Ενημέρωση' : 'Δημιουργία'}</span>
              </button>
              {editingCategory && (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', icon: '', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Ακύρωση
                </button>
              )}
            </div>
          </div>
          
          {/* Categories List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Κατηγορίες</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({ name: cat.name, icon: cat.icon || '', description: cat.description || '' });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          {/* Create/Edit Exercise Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingExercise ? 'Επεξεργασία Άσκησης' : 'Νέα Άσκηση'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={exerciseForm.category_id}
                onChange={(e) => setExerciseForm({ ...exerciseForm, category_id: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Επίλεξε κατηγορία</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Όνομα άσκησης"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Περιγραφή"
                value={exerciseForm.description}
                onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="url"
                placeholder="YouTube URL"
                value={exerciseForm.youtube_url}
                onChange={(e) => setExerciseForm({ ...exerciseForm, youtube_url: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={editingExercise ? handleUpdateExercise : handleCreateExercise}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingExercise ? 'Ενημέρωση' : 'Δημιουργία'}</span>
              </button>
              {editingExercise && (
                <button
                  onClick={() => {
                    setEditingExercise(null);
                    setExerciseForm({ name: '', description: '', youtube_url: '', category_id: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Ακύρωση
                </button>
              )}
            </div>
          </div>
          
          {/* Exercises List by Category */}
          <div className="space-y-6">
            {categories.map((cat) => {
              const categoryExercises = exercises.filter(e => e.category_id === cat.id);
              if (categoryExercises.length === 0) return null;
              
              return (
                <div key={cat.id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-2xl">{cat.icon}</span>
                      <h3 className="text-lg font-semibold">{cat.name}</h3>
                    </div>
                    <div className="space-y-4">
                      {categoryExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          setConfig={exercise.set_config}
                          onEdit={() => {
                            setEditingExercise(exercise);
                            setExerciseForm({
                              name: exercise.name,
                              description: exercise.description || '',
                              youtube_url: exercise.youtube_url || '',
                              category_id: exercise.category_id
                            });
                          }}
                          onEditSetConfig={(config) => {
                            setExerciseSetForm(config);
                            setSelectedExercise(exercise);
                          }}
                          onSaveSetConfig={() => handleEditExerciseSetConfig(exercise.id)}
                          onDelete={() => handleDeleteExercise(exercise.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Combined Programs Tab */}
      {activeTab === 'combined' && (
        <div className="space-y-4">
          {/* Combined Programs List */}
          <div className="space-y-6">
            {combinedPrograms.map((program) => (
              <CombinedProgramCard
                key={program.id}
                program={program}
                allExercises={exercises}
                onAddExercise={(exerciseId) => handleAddExerciseToCombinedProgram(program.id, exerciseId)}
                onUpdateExercise={handleUpdateCombinedProgramExercise}
                onDeleteExercise={handleDeleteCombinedProgramExercise}
                onDeleteProgram={() => handleDeleteCombinedProgram(program.id)}
                onEditLevel={(exerciseId, currentLevel) => {
                  setEditingExerciseForLevel({ id: exerciseId, currentLevel });
                  setShowLevelModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Level Selection Modal */}
      {showLevelModal && editingExerciseForLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Επίλεξε Level</h3>
              <button 
                onClick={() => {
                  setShowLevelModal(false);
                  setEditingExerciseForLevel(null);
                }} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              {['Αρχάριος', 'Προχωρημένος', 'Επαγγελματίας'].map((level) => (
                <button
                  key={level}
                  onClick={async () => {
                    try {
                      await handleUpdateCombinedProgramExercise(editingExerciseForLevel.id, { level: level });
                      setShowLevelModal(false);
                      setEditingExerciseForLevel(null);
                    } catch (error) {
                      console.error('Error updating level:', error);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    editingExerciseForLevel.currentLevel === level
                      ? (level === 'Αρχάριος'
                          ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                          : level === 'Προχωρημένος'
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-800 font-semibold'
                          : 'border-green-500 bg-green-50 text-green-700 font-semibold')
                      : (level === 'Αρχάριος'
                          ? 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700'
                          : level === 'Προχωρημένος'
                          ? 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 text-gray-700'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700')
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{level}</span>
                    {editingExerciseForLevel.currentLevel === level && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        level === 'Αρχάριος' ? 'bg-red-500' : level === 'Προχωρημένος' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={async () => {
                  try {
                    await handleUpdateCombinedProgramExercise(editingExerciseForLevel.id, { level: undefined });
                    setShowLevelModal(false);
                    setEditingExerciseForLevel(null);
                  } catch (error) {
                    console.error('Error clearing level:', error);
                  }
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  !editingExerciseForLevel.currentLevel
                    ? 'border-gray-400 bg-gray-100 text-gray-600 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className="text-lg">Καθαρισμός (Αφαίρεση Level)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Exercise Set Config Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Επεξεργασία Επαναλήψεων: {selectedExercise.name}</h3>
              <button onClick={() => setSelectedExercise(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sets</label>
                <input
                  type="number"
                  value={exerciseSetForm.sets}
                  onChange={(e) => setExerciseSetForm({ ...exerciseSetForm, sets: parseInt(e.target.value) || 3 })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reps Min</label>
                  <input
                    type="number"
                    value={exerciseSetForm.reps_min}
                    onChange={(e) => setExerciseSetForm({ ...exerciseSetForm, reps_min: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reps Max</label>
                  <input
                    type="number"
                    value={exerciseSetForm.reps_max}
                    onChange={(e) => setExerciseSetForm({ ...exerciseSetForm, reps_max: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reps Text (π.χ. "10-15" ή "30-60 δευτερόλεπτα")</label>
                <input
                  type="text"
                  value={exerciseSetForm.reps_text}
                  onChange={(e) => setExerciseSetForm({ ...exerciseSetForm, reps_text: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="3 x 10-15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rest (δευτερόλεπτα)</label>
                <input
                  type="number"
                  value={exerciseSetForm.rest_seconds}
                  onChange={(e) => setExerciseSetForm({ ...exerciseSetForm, rest_seconds: parseInt(e.target.value) || 60 })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Σημειώσεις Βάρους</label>
                <input
                  type="text"
                  value={exerciseSetForm.weight_notes}
                  onChange={(e) => setExerciseSetForm({ ...exerciseSetForm, weight_notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={() => {
                  handleEditExerciseSetConfig(selectedExercise.id);
                  setSelectedExercise(null);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Αποθήκευση</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exercise Card Component
const ExerciseCard: React.FC<{
  exercise: WorkoutExercise;
  setConfig?: ExerciseSetConfig | null;
  onEdit?: () => void;
  onEditSetConfig: (config: any) => void;
  onSaveSetConfig: () => void;
  onDelete: () => void;
}> = ({ exercise, setConfig, onEdit, onEditSetConfig, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{exercise.name}</h4>
          {exercise.description && <p className="text-sm text-gray-500 mt-1">{exercise.description}</p>}
          {setConfig && (
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Activity className="h-4 w-4" />
                <span>{setConfig.sets} sets</span>
              </span>
              {setConfig.reps_text && <span>{setConfig.reps_text}</span>}
              {(setConfig.reps_min || setConfig.reps_max) && (
                <span>{setConfig.reps_min}-{setConfig.reps_max} reps</span>
              )}
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{setConfig.rest_seconds}s rest</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Επεξεργασία άσκησης"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => {
              setExpanded(!expanded);
              if (!expanded && setConfig) {
                onEditSetConfig({
                  sets: setConfig.sets,
                  reps_min: setConfig.reps_min?.toString() || '',
                  reps_max: setConfig.reps_max?.toString() || '',
                  reps_text: setConfig.reps_text || '',
                  rest_seconds: setConfig.rest_seconds,
                  weight_notes: setConfig.weight_notes || ''
                });
              }
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Επεξεργασία επαναλήψεων"
          >
            <Activity className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Διαγραφή άσκησης"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {exercise.youtube_url && (
        <a
          href={exercise.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
        >
          Δες το βίντεο →
        </a>
      )}
    </div>
  );
};

// Combined Program Card Component
const CombinedProgramCard: React.FC<{
  program: CombinedWorkoutProgram;
  allExercises: WorkoutExercise[];
  onAddExercise: (exerciseId: string) => void;
  onUpdateExercise: (id: string, updates: Partial<CombinedProgramExercise>) => void;
  onDeleteExercise: (id: string) => void;
  onDeleteProgram: () => void;
  onEditLevel: (exerciseId: string, currentLevel?: string) => void;
}> = ({ program, allExercises, onAddExercise, onUpdateExercise, onDeleteExercise, onDeleteProgram, onEditLevel }) => {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [showMenuForId, setShowMenuForId] = useState<string | null>(null);
  
  const programTypeLabels = {
    'upper-body': 'Άνω μέρος σώματος',
    'lower-body': 'Κάτω μέρος σώματος',
    'full-body': 'Πλήρες σώμα',
    'free-weights': 'Ελεύθερα βάρη',
    'pyramidal': 'Pyramidal (Πυραμιδική)',
    'warm-up': 'Warm up program',
    'cool-down': 'Cool down program'
  };
  
  const [exerciseSearch, setExerciseSearch] = useState('');
  const normalizedSearch = exerciseSearch.trim().toLowerCase();

  // Helper function to handle edit field
  const handleEditField = (progExercise: CombinedProgramExercise, fieldName: string, promptText: string, parseValue: (value: string) => any) => {
    const currentValue = (progExercise as any)[fieldName];
    const displayValue = currentValue !== null && currentValue !== undefined && !isNaN(Number(currentValue)) 
      ? (fieldName === 'time_seconds' && Number(currentValue) > 0
          ? `${Math.floor(Number(currentValue) / 60)}:${String(Number(currentValue) % 60).padStart(2, '0')}`
          : String(currentValue))
      : '-';
    const newValue = prompt(promptText, displayValue);
    if (newValue !== null) {
      const parsed = parseValue(newValue.trim());
      onUpdateExercise(progExercise.id, { [fieldName]: parsed });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">{program.name || programTypeLabels[program.program_type]}</h3>
            {program.description && <p className="text-sm text-gray-600 mt-1 truncate">{program.description}</p>}
            <p className="text-xs text-gray-500 mt-1">
              {program.exercises?.length || 0} {program.exercises?.length === 1 ? 'άσκηση' : 'ασκήσεις'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Αναζήτηση άσκησης..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddExercise(!showAddExercise)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Προσθήκη Άσκησης</span>
              <span className="sm:hidden">Προσθήκη</span>
            </button>
            <button
              onClick={onDeleteProgram}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              title="Διαγραφή συνδυαστικού προγράμματος"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {showAddExercise && (
          <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" />
              Επίλεξε άσκηση για προσθήκη
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="">-- Επίλεξε άσκηση --</option>
                {allExercises
                  .filter(ex => !program.exercises?.some(pe => pe.exercise_id === ex.id))
                  .map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.category?.icon} {ex.name}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedExerciseId) {
                      onAddExercise(selectedExerciseId);
                      setSelectedExerciseId('');
                      setShowAddExercise(false);
                    }
                  }}
                  disabled={!selectedExerciseId}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Προσθήκη
                </button>
                <button
                  onClick={() => {
                    setShowAddExercise(false);
                    setSelectedExerciseId('');
                  }}
                  className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {program.exercises && program.exercises.length > 0 ? (
            program.exercises
              .filter((pe) => {
                if (!normalizedSearch) return true;
                const name = pe.exercise?.name?.toLowerCase() || '';
                const desc = pe.exercise?.description?.toLowerCase() || '';
                const notes = pe.notes?.toLowerCase() || '';
                return name.includes(normalizedSearch) || desc.includes(normalizedSearch) || notes.includes(normalizedSearch);
              })
              .map((progExercise) => {
                const isMenuOpen = showMenuForId === progExercise.id;
                return (
                <div key={progExercise.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 relative">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-lg font-bold text-gray-900 flex-1 min-w-0">{progExercise.exercise?.name || 'Άγνωστη άσκηση'}</h4>
                        {/* Actions Menu - Always visible for all exercises */}
                        <div className="relative flex-shrink-0 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowMenuForId(isMenuOpen ? null : progExercise.id);
                            }}
                            className="p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all border-2 border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-md"
                            title="Επιλογές επεξεργασίας (Edit Sets, Rest, Kg, RM, RPE, Time, Method, Level, Tempo, Program, Διαγραφή)"
                            type="button"
                            aria-label="Επιλογές επεξεργασίας"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {isMenuOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[45] bg-transparent" 
                                onClick={(e) => {
                                  // Only close if clicking outside the menu, not when scrolling
                                  const target = e.target as HTMLElement;
                                  if (target.classList.contains('bg-transparent')) {
                                    setShowMenuForId(null);
                                  }
                                }}
                                onWheel={(e) => {
                                  // Don't close on scroll
                                  e.stopPropagation();
                                }}
                                onTouchMove={(e) => {
                                  // Don't close on touch scroll
                                  e.stopPropagation();
                                }}
                              />
                              <div 
                                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-300 z-[60] flex flex-col"
                                style={{
                                  maxHeight: 'calc(100vh - 200px)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Menu Header - Fixed at top */}
                                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 rounded-t-lg flex-shrink-0">
                                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-2">
                                    <Settings className="h-3.5 w-3.5" />
                                    ΕΠΕΞΕΡΓΑΣΙΑ ΆΣΚΗΣΗΣ
                                  </div>
                                </div>
                                {/* Scrollable Menu Items */}
                                <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin', scrollbarColor: '#93c5fd #f3f4f6', maxHeight: 'calc(85vh - 70px)' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = (progExercise.sets !== null && progExercise.sets !== undefined && !isNaN(Number(progExercise.sets))) 
                                        ? progExercise.sets.toString() 
                                        : '-';
                                      const newSets = prompt('Νέο αριθμό sets (βάλε "-" για αφαίρεση):', currentValue);
                                      if (newSets !== null) {
                                        const trimmed = newSets.trim();
                                        const setsValue = (trimmed === '' || trimmed === '-') ? undefined : parseInt(trimmed);
                                        onUpdateExercise(progExercise.id, { sets: (setsValue !== undefined && isNaN(setsValue)) ? undefined : setsValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="font-medium">Edit Sets</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = (progExercise.rest_seconds !== null && progExercise.rest_seconds !== undefined && !isNaN(Number(progExercise.rest_seconds))) 
                                        ? progExercise.rest_seconds.toString() 
                                        : '-';
                                      const newRest = prompt('Νέο rest (δευτερόλεπτα) (βάλε "-" για αφαίρεση):', currentValue);
                                      if (newRest !== null) {
                                        const trimmed = newRest.trim();
                                        const restValue = (trimmed === '' || trimmed === '-') ? undefined : parseInt(trimmed);
                                        onUpdateExercise(progExercise.id, { rest_seconds: (restValue !== undefined && isNaN(restValue)) ? undefined : restValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="font-medium">Edit Rest</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = (progExercise.weight_kg !== null && progExercise.weight_kg !== undefined && !isNaN(Number(progExercise.weight_kg))) 
                                        ? progExercise.weight_kg.toString() 
                                        : '-';
                                      const newWeight = prompt('Κιλά (Kg) (βάλε "-" για αφαίρεση):', currentValue);
                                      if (newWeight !== null) {
                                        const trimmed = newWeight.trim();
                                        const weightValue = (trimmed === '' || trimmed === '-') ? undefined : parseFloat(trimmed);
                                        onUpdateExercise(progExercise.id, { weight_kg: (weightValue !== undefined && isNaN(weightValue)) ? undefined : weightValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <span className="font-bold text-green-600 w-8 flex-shrink-0">Kg</span>
                                    <span className="font-medium">Edit Kg</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = (progExercise.rm_percentage !== null && progExercise.rm_percentage !== undefined && !isNaN(Number(progExercise.rm_percentage))) 
                                        ? progExercise.rm_percentage.toString() 
                                        : '-';
                                      const newRM = prompt('RM Ποσοστό (π.χ. 60 για 60%) (βάλε "-" για αφαίρεση):', currentValue);
                                      if (newRM !== null) {
                                        const trimmed = newRM.trim();
                                        const rmValue = (trimmed === '' || trimmed === '-') ? undefined : parseFloat(trimmed);
                                        onUpdateExercise(progExercise.id, { rm_percentage: (rmValue !== undefined && isNaN(rmValue)) ? undefined : rmValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <span className="font-bold text-purple-600 w-8 flex-shrink-0">RM</span>
                                    <span className="font-medium">Edit RM %</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = (progExercise.rpe !== null && progExercise.rpe !== undefined && !isNaN(Number(progExercise.rpe))) 
                                        ? progExercise.rpe.toString() 
                                        : '-';
                                      const newRPE = prompt('RPE (Rate of Perceived Exertion, π.χ. 8.5) (βάλε "-" για αφαίρεση):', currentValue);
                                      if (newRPE !== null) {
                                        const trimmed = newRPE.trim();
                                        const rpeValue = (trimmed === '' || trimmed === '-') ? undefined : parseFloat(trimmed);
                                        onUpdateExercise(progExercise.id, { rpe: (rpeValue !== undefined && isNaN(rpeValue)) ? undefined : rpeValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <span className="font-bold text-orange-600 w-8 flex-shrink-0">RPE</span>
                                    <span className="font-medium">Edit RPE</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentSeconds = progExercise.time_seconds || 0;
                                      const currentMinutes = Math.floor(currentSeconds / 60);
                                      const currentSecs = currentSeconds % 60;
                                      const currentDisplay = (progExercise.time_seconds !== null && progExercise.time_seconds !== undefined && !isNaN(Number(progExercise.time_seconds)) && Number(progExercise.time_seconds) > 0)
                                        ? `${currentMinutes}:${String(currentSecs).padStart(2, '0')}`
                                        : '-';
                                      const newTime = prompt('Χρόνος (π.χ. "5:30" για 5 λεπτά 30 δευτερόλεπτα ή "180" για 180 δευτερόλεπτα) (βάλε "-" για αφαίρεση):', currentDisplay);
                                      if (newTime !== null) {
                                        let timeValue: number | undefined;
                                        const trimmed = newTime.trim();
                                        if (trimmed === '' || trimmed === '-') {
                                          timeValue = undefined;
                                        } else {
                                          if (trimmed.includes(':')) {
                                            const parts = trimmed.split(':');
                                            const minutes = parseInt(parts[0]) || 0;
                                            const seconds = parseInt(parts[1]) || 0;
                                            timeValue = minutes * 60 + seconds;
                                          } else {
                                            const parsed = parseInt(trimmed);
                                            timeValue = isNaN(parsed) ? undefined : parsed;
                                          }
                                        }
                                        onUpdateExercise(progExercise.id, { time_seconds: timeValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <Clock className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                    <span className="font-medium">Edit Time</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = progExercise.method || '';
                                      const newMethod = prompt('Method (μέθοδος):', currentValue);
                                      if (newMethod !== null) {
                                        const methodValue = newMethod.trim() === '' || newMethod.trim() === '-' ? undefined : newMethod.trim();
                                        onUpdateExercise(progExercise.id, { method: methodValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <Settings className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                    <span className="font-medium">Edit Method</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      onEditLevel(progExercise.id, progExercise.level);
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <span className="font-bold text-teal-600 w-12 flex-shrink-0">Level</span>
                                    <span className="font-medium">Edit Level</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue = progExercise.tempo || '';
                                      const newTempo = prompt('Tempo (τέμπο):', currentValue);
                                      if (newTempo !== null) {
                                        const tempoValue = newTempo.trim() === '' || newTempo.trim() === '-' ? undefined : newTempo.trim();
                                        onUpdateExercise(progExercise.id, { tempo: tempoValue });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-900 flex items-center gap-2 border-b border-gray-100 transition-colors"
                                  >
                                    <span className="font-bold text-pink-600 w-12 flex-shrink-0">Tempo</span>
                                    <span className="font-medium">Edit Tempo</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      const currentValue =
                                        typeof (progExercise as any).program_number === 'number'
                                          ? String((progExercise as any).program_number)
                                          : '';
                                      const newVal = prompt('Program number (1..20) - βάλε "-" για αφαίρεση:', currentValue);
                                      if (newVal !== null) {
                                        const t = newVal.trim();
                                        const num = t === '' || t === '-' ? undefined : parseInt(t);
                                        onUpdateExercise(progExercise.id, {
                                          program_number: num !== undefined && isNaN(num as number) ? undefined : (num as any),
                                        });
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 border-b border-gray-200 transition-colors"
                                  >
                                    <span className="font-bold text-gray-600 w-8 flex-shrink-0">#</span>
                                    <span className="font-medium">Edit Program #</span>
                                  </button>
                                  <div className="border-t-2 border-red-300 my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      if (confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτή την άσκηση;')) {
                                        onDeleteExercise(progExercise.id);
                                      }
                                      setShowMenuForId(null);
                                    }}
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 font-semibold transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 flex-shrink-0" />
                                    <span>Διαγραφή Άσκησης</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <div className="text-xs font-semibold text-blue-700 mb-0.5">Sets</div>
                          <div className="text-sm font-bold text-blue-900">
                            {(progExercise.sets !== null && progExercise.sets !== undefined && !isNaN(Number(progExercise.sets))) 
                              ? progExercise.sets 
                              : '-'}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                          <div className="text-xs font-semibold text-green-700 mb-0.5">Kg</div>
                          <div className="text-sm font-bold text-green-900">
                            {(progExercise.weight_kg !== null && progExercise.weight_kg !== undefined && !isNaN(Number(progExercise.weight_kg))) 
                              ? progExercise.weight_kg 
                              : '-'}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                          <div className="text-xs font-semibold text-purple-700 mb-0.5">RM %</div>
                          <div className="text-sm font-bold text-purple-900">
                            {(progExercise.rm_percentage !== null && progExercise.rm_percentage !== undefined && !isNaN(Number(progExercise.rm_percentage))) 
                              ? `${progExercise.rm_percentage}%` 
                              : '-'}
                          </div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                          <div className="text-xs font-semibold text-orange-700 mb-0.5">RPE</div>
                          <div className="text-sm font-bold text-orange-900">
                            {(progExercise.rpe !== null && progExercise.rpe !== undefined && !isNaN(Number(progExercise.rpe))) 
                              ? progExercise.rpe 
                              : '-'}
                          </div>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                          <div className="text-xs font-semibold text-cyan-700 mb-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Rest
                          </div>
                          <div className="text-sm font-bold text-cyan-900">
                            {(progExercise.rest_seconds !== null && progExercise.rest_seconds !== undefined && !isNaN(Number(progExercise.rest_seconds))) 
                              ? `${progExercise.rest_seconds}s` 
                              : '-'}
                          </div>
                        </div>
                        <div className="bg-teal-50 rounded-lg p-2 border border-teal-200">
                          <div className="text-xs font-semibold text-teal-700 mb-0.5">Time</div>
                          <div className="text-sm font-bold text-teal-900">
                            {(progExercise.time_seconds !== null && progExercise.time_seconds !== undefined && !isNaN(Number(progExercise.time_seconds))) 
                              ? (Number(progExercise.time_seconds) >= 60 
                                ? `${Math.floor(Number(progExercise.time_seconds) / 60)}:${String(Number(progExercise.time_seconds) % 60).padStart(2, '0')}`
                                : `${progExercise.time_seconds}s`)
                              : '-'}
                          </div>
                        </div>
                        {progExercise.method && (
                          <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200">
                            <div className="text-xs font-semibold text-indigo-700 mb-0.5">Method</div>
                            <div className="text-sm font-bold text-indigo-900 truncate">{progExercise.method}</div>
                          </div>
                        )}
                        {progExercise.level && (
                          <div
                            className={`rounded-lg p-2 border ${
                              progExercise.level.toLowerCase().includes('αρχ')
                                ? 'bg-red-50 border-red-200'
                                : progExercise.level.toLowerCase().includes('προχω') || progExercise.level.toLowerCase().includes('μετρ')
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className={`text-xs font-semibold mb-0.5 ${
                              progExercise.level.toLowerCase().includes('αρχ')
                                ? 'text-red-700'
                                : progExercise.level.toLowerCase().includes('προχω') || progExercise.level.toLowerCase().includes('μετρ')
                                ? 'text-yellow-800'
                                : 'text-green-700'
                            }`}>
                              Level
                            </div>
                            <div className={`text-sm font-bold ${
                              progExercise.level.toLowerCase().includes('αρχ')
                                ? 'text-red-900'
                                : progExercise.level.toLowerCase().includes('προχω') || progExercise.level.toLowerCase().includes('μετρ')
                                ? 'text-yellow-900'
                                : 'text-green-900'
                            }`}>
                              {progExercise.level}
                            </div>
                          </div>
                        )}
                        {progExercise.tempo && (
                          <div className="bg-pink-50 rounded-lg p-2 border border-pink-200">
                            <div className="text-xs font-semibold text-pink-700 mb-0.5">Tempo</div>
                            <div className="text-sm font-bold text-pink-900">{progExercise.tempo}</div>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <div className="text-xs font-semibold text-gray-700 mb-0.5">Program</div>
                          <div className="text-sm font-bold text-gray-900">
                            {typeof progExercise.program_number === 'number' ? progExercise.program_number : '-'}
                          </div>
                        </div>
                      </div>
                      
                      {(progExercise.reps_text || progExercise.reps_min || progExercise.reps_max) && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-600">Reps: </span>
                          {progExercise.reps_text && <span className="text-sm text-gray-700">{progExercise.reps_text}</span>}
                          {(progExercise.reps_min || progExercise.reps_max) && (
                            <span className="text-sm text-gray-700">{progExercise.reps_min}-{progExercise.reps_max}</span>
                          )}
                        </div>
                      )}
                      
                      {progExercise.notes && (
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-200">
                          {progExercise.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )})
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Δεν υπάρχουν ασκήσεις στο πρόγραμμα</p>
              <p className="text-sm text-gray-400 mt-1">Πάτησε "Προσθήκη Άσκησης" για να προσθέσεις</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutProgramsManager;

