import React, { useState, useEffect } from 'react';
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
  Activity
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
              />
            ))}
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
}> = ({ program, allExercises, onAddExercise, onUpdateExercise, onDeleteExercise, onDeleteProgram }) => {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  
  const programTypeLabels = {
    'upper-body': 'Άνω μέρος σώματος',
    'lower-body': 'Κάτω μέρος σώματος',
    'full-body': 'Πλήρες σώμα',
    'free-weights': 'Ελεύθερα βάρη'
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{program.name || programTypeLabels[program.program_type]}</h3>
            {program.description && <p className="text-sm text-gray-500">{program.description}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDeleteProgram}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Διαγραφή συνδυαστικού προγράμματος"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAddExercise(!showAddExercise)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Προσθήκη Άσκησης</span>
            </button>
          </div>
        </div>
        
        {showAddExercise && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-2"
            >
              <option value="">Επίλεξε άσκηση</option>
              {allExercises
                .filter(ex => !program.exercises?.some(pe => pe.exercise_id === ex.id))
                .map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.category?.icon} {ex.name}
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                if (selectedExerciseId) {
                  onAddExercise(selectedExerciseId);
                  setSelectedExerciseId('');
                  setShowAddExercise(false);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Προσθήκη
            </button>
          </div>
        )}
        
        <div className="space-y-3">
          {program.exercises && program.exercises.length > 0 ? (
            program.exercises.map((progExercise) => (
              <div key={progExercise.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{progExercise.exercise?.name}</h4>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <span>{progExercise.sets} sets</span>
                      {progExercise.reps_text && <span>{progExercise.reps_text}</span>}
                      {(progExercise.reps_min || progExercise.reps_max) && (
                        <span>{progExercise.reps_min}-{progExercise.reps_max} reps</span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{progExercise.rest_seconds}s rest</span>
                      </span>
                    </div>
                    {progExercise.notes && <p className="text-sm text-gray-500 mt-1">{progExercise.notes}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const newSets = prompt('Νέο αριθμό sets:', progExercise.sets.toString());
                        if (newSets) {
                          onUpdateExercise(progExercise.id, { sets: parseInt(newSets) });
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      Edit Sets
                    </button>
                    <button
                      onClick={() => {
                        const newRest = prompt('Νέο rest (δευτερόλεπτα):', progExercise.rest_seconds.toString());
                        if (newRest) {
                          onUpdateExercise(progExercise.id, { rest_seconds: parseInt(newRest) });
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      Edit Rest
                    </button>
                    <button
                      onClick={() => onDeleteExercise(progExercise.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Δεν υπάρχουν ασκήσεις στο πρόγραμμα</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutProgramsManager;

