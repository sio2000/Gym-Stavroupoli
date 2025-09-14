import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { Lesson, LessonCategory, Room, Trainer } from '@/types';
import toast from 'react-hot-toast';

interface LessonManagementProps {
  onClose: () => void;
}

interface LessonFormData {
  name: string;
  description: string;
  category_id: string;
  trainer_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  is_active: boolean;
}

const LessonManagement: React.FC<LessonManagementProps> = ({ onClose }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState<LessonFormData>({
    name: '',
    description: '',
    category_id: '',
    trainer_id: '',
    room_id: '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    capacity: 10,
    difficulty: 'beginner',
    price: 0,
    is_active: true
  });

  const dayNames = [
    'Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'
  ];

  const difficultyNames = {
    beginner: 'Αρχάριος',
    intermediate: 'Μέσος',
    advanced: 'Προχωρημένος'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLessons(),
        loadCategories(),
        loadRooms(),
        loadTrainers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('lessons')
        .select(`
          *,
          lesson_categories(name, color),
          rooms(name, capacity),
          trainers(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('lesson_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  };

  const loadRooms = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      throw error;
    }
  };

  const loadTrainers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('trainers')
        .select(`
          *,
          user_profiles(first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      setTrainers(data || []);
    } catch (error) {
      console.error('Error loading trainers:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || !formData.trainer_id || !formData.room_id) {
      toast.error('Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    try {
      if (editingLesson) {
        // Update existing lesson
        const { error } = await supabaseAdmin
          .from('lessons')
          .update(formData)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast.success('Το μάθημα ενημερώθηκε επιτυχώς');
      } else {
        // Create new lesson
        const { error } = await supabaseAdmin
          .from('lessons')
          .insert([formData]);

        if (error) throw error;
        toast.success('Το μάθημα δημιουργήθηκε επιτυχώς');
      }

      await loadLessons();
      resetForm();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του μαθήματος');
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      name: lesson.name,
      description: lesson.description || '',
      category_id: lesson.category_id || '',
      trainer_id: lesson.trainer_id || '',
      room_id: lesson.room_id || '',
      day_of_week: lesson.day_of_week || 1,
      start_time: lesson.start_time || '09:00',
      end_time: lesson.end_time || '10:00',
      capacity: lesson.capacity || 10,
      difficulty: lesson.difficulty || 'beginner',
      price: lesson.price || 0,
      is_active: lesson.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το μάθημα;')) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      toast.success('Το μάθημα διαγράφηκε επιτυχώς');
      await loadLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Σφάλμα κατά τη διαγραφή του μαθήματος');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      trainer_id: '',
      room_id: '',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '10:00',
      capacity: 10,
      difficulty: 'beginner',
      price: 0,
      is_active: true
    });
    setEditingLesson(null);
    setShowForm(false);
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || lesson.category_id === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || lesson.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && lesson.is_active) ||
                         (statusFilter === 'inactive' && !lesson.is_active);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span>Φόρτωση...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Μαθημάτων</h2>
            <p className="text-gray-600">Δημιουργήστε και διαχειριστείτε τα μαθήματα του γυμναστηρίου</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Νέο Μάθημα</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Αναζήτηση μαθημάτων..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Όλες οι κατηγορίες</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Όλα τα επίπεδα</option>
              <option value="beginner">Αρχάριος</option>
              <option value="intermediate">Μέσος</option>
              <option value="advanced">Προχωρημένος</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Όλα τα μαθήματα</option>
              <option value="active">Ενεργά</option>
              <option value="inactive">Ανενεργά</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {showForm ? (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingLesson ? 'Επεξεργασία Μαθήματος' : 'Νέο Μάθημα'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Όνομα Μαθήματος *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Κατηγορία *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Επιλέξτε κατηγορία</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Εκπαιδευτής *
                      </label>
                      <select
                        value={formData.trainer_id}
                        onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Επιλέξτε εκπαιδευτή</option>
                        {trainers.map(trainer => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.user_profiles?.first_name} {trainer.user_profiles?.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Αίθουσα *
                      </label>
                      <select
                        value={formData.room_id}
                        onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Επιλέξτε αίθουσα</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} (Χωρητικότητα: {room.capacity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ημέρα Εβδομάδας *
                      </label>
                      <select
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        {dayNames.map((day, index) => (
                          <option key={index} value={index}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ώρα Έναρξης *
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ώρα Λήξης *
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Χωρητικότητα *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Επίπεδο Δυσκολίας *
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="beginner">Αρχάριος</option>
                        <option value="intermediate">Μέσος</option>
                        <option value="advanced">Προχωρημένος</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Τιμή (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ενεργό μάθημα</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Περιγραφή
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Περιγράψτε το μάθημα..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Ακύρωση
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingLesson ? 'Ενημέρωση' : 'Δημιουργία'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Μάθημα
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Κατηγορία
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ημέρα/Ώρα
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Αίθουσα
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Χωρητικότητα
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Επίπεδο
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Τιμή
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Κατάσταση
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ενέργειες
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lesson.name}
                            </div>
                            {lesson.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {lesson.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lesson.lesson_categories?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dayNames[lesson.day_of_week]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lesson.start_time} - {lesson.end_time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lesson.rooms?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lesson.capacity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {difficultyNames[lesson.difficulty]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{lesson.price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lesson.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {lesson.is_active ? 'Ενεργό' : 'Ανενεργό'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(lesson)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(lesson.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredLessons.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      {searchTerm || categoryFilter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all' 
                        ? 'Δεν βρέθηκαν μαθήματα με τα φίλτρα που επιλέξατε'
                        : 'Δεν υπάρχουν μαθήματα ακόμα'
                      }
                    </div>
                    {!searchTerm && categoryFilter === 'all' && difficultyFilter === 'all' && statusFilter === 'all' && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Δημιουργήστε το πρώτο μάθημα
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonManagement;
