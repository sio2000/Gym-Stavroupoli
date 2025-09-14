import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Star, 
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Heart,
  Zap
} from 'lucide-react';
import { getAvailableLessons, getLessonCategories, searchLessons } from '@/utils/lessonApi';
import { LessonCategory } from '@/types';
import toast from 'react-hot-toast';

interface Lesson {
  lesson_id: string;
  lesson_name: string;
  lesson_description: string;
  category_name: string;
  category_color: string;
  trainer_name: string;
  room_name: string;
  start_time: string;
  end_time: string;
  capacity: number;
  available_spots: number;
  difficulty: string;
  price: number;
}

const PublicLessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const difficultyNames = {
    beginner: 'Αρχάριος',
    intermediate: 'Μέσος',
    advanced: 'Προχωρημένος'
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLessons(),
        loadCategories()
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
      const data = await getAvailableLessons(selectedDate);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
      throw error;
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getLessonCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadLessons();
      return;
    }

    setLoading(true);
    try {
      const data = await searchLessons(searchTerm, {
        isActive: true
      });
      setLessons(data);
    } catch (error) {
      console.error('Error searching lessons:', error);
      toast.error('Σφάλμα κατά την αναζήτηση');
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesCategory = selectedCategory === 'all' || lesson.category_name === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return days[date.getDay()];
  };

  const getTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getAvailabilityStatus = (availableSpots: number, capacity: number) => {
    const percentage = (availableSpots / capacity) * 100;
    if (percentage === 0) return { text: 'Πλήρες', color: 'text-red-600' };
    if (percentage <= 25) return { text: 'Σχεδόν Πλήρες', color: 'text-orange-600' };
    if (percentage <= 50) return { text: 'Λίγες Θέσεις', color: 'text-yellow-600' };
    return { text: 'Διαθέσιμο', color: 'text-green-600' };
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'pilates':
        return '🧘';
      case 'personal training':
        return '💪';
      case 'kick boxing':
        return '🥊';
      case 'free gym':
        return '🏋️';
      case 'yoga':
        return '🧘‍♀️';
      case 'cardio':
        return '❤️';
      default:
        return '🏃';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Διαθέσιμα Μαθήματα</h1>
          <p className="text-xl text-gray-600">Επιλέξτε το μάθημα που σας ενδιαφέρει και ξεκινήστε την προπόνησή σας</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Αναζήτηση μαθημάτων..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Picker */}
            <div className="lg:w-48">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Φίλτρα</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Αναζήτηση
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Κατηγορία
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Όλες οι κατηγορίες</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Επίπεδο Δυσκολίας
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Όλα τα επίπεδα</option>
                    <option value="beginner">Αρχάριος</option>
                    <option value="intermediate">Μέσος</option>
                    <option value="advanced">Προχωρημένος</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {getDayName(selectedDate)}
                </h2>
                <p className="text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('el-GR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {filteredLessons.length}
              </div>
              <div className="text-sm text-gray-600">
                {filteredLessons.length === 1 ? 'Μάθημα' : 'Μαθήματα'}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Φόρτωση μαθημάτων...</span>
          </div>
        ) : filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => {
              const availability = getAvailabilityStatus(lesson.available_spots, lesson.capacity);
              const isExpanded = expandedLesson === lesson.lesson_id;

              return (
                <div
                  key={lesson.lesson_id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Lesson Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">
                          {getCategoryIcon(lesson.category_name)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {lesson.lesson_name}
                          </h3>
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: lesson.category_color + '20', color: lesson.category_color }}
                          >
                            {lesson.category_name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedLesson(isExpanded ? null : lesson.lesson_id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Lesson Details */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{getTimeRange(lesson.start_time, lesson.end_time)}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{lesson.room_name}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {lesson.available_spots} από {lesson.capacity} θέσεις
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors[lesson.difficulty as keyof typeof difficultyColors]}`}>
                          {difficultyNames[lesson.difficulty as keyof typeof difficultyNames]}
                        </span>
                        <span className={`text-sm font-medium ${availability.color}`}>
                          {availability.text}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="text-2xl font-bold text-primary-600">
                          €{lesson.price?.toFixed(2) || '0.00'}
                        </div>
                        <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                          <BookOpen className="h-4 w-4" />
                          <span>Κράτηση</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
                      <div className="pt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Περιγραφή</h4>
                        <p className="text-gray-600 text-sm mb-4">
                          {lesson.lesson_description || 'Δεν υπάρχει περιγραφή για αυτό το μάθημα.'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Εκπαιδευτής:</span>
                            <p className="text-gray-600">{lesson.trainer_name}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Διάρκεια:</span>
                            <p className="text-gray-600">
                              {Math.round((new Date(`2000-01-01T${lesson.end_time}`).getTime() - new Date(`2000-01-01T${lesson.start_time}`).getTime()) / (1000 * 60))} λεπτά
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Δεν βρέθηκαν μαθήματα</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                ? 'Δεν υπάρχουν μαθήματα που να ταιριάζουν με τα φίλτρα που επιλέξατε.'
                : 'Δεν υπάρχουν διαθέσιμα μαθήματα για την επιλεγμένη ημερομηνία.'
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                loadLessons();
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Επαναφορά Φίλτρων
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicLessons;
