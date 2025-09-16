import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Filter,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { User as UserType, MembershipPackage, MembershipPackageDuration } from '@/types';
import toast from 'react-hot-toast';

interface MemberRegistrationProps {
  onClose: () => void;
}

interface MemberFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  language: 'el' | 'en';
  role: 'user' | 'trainer' | 'admin' | 'secretary';
}

interface RegistrationRequest {
  id: string;
  user_id: string;
  package_id: string;
  duration_type: string;
  requested_price: number;
  classes_count?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: UserType;
  package?: MembershipPackage;
  duration?: MembershipPackageDuration;
}

const MemberRegistration: React.FC<MemberRegistrationProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'packages'>('members');
  const [members, setMembers] = useState<UserType[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [packageDurations, setPackageDurations] = useState<MembershipPackageDuration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [memberFormData, setMemberFormData] = useState<MemberFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    language: 'el',
    role: 'user'
  });

  const roleNames = {
    user: 'Μέλος',
    trainer: 'Εκπαιδευτής',
    admin: 'Διαχειριστής',
    secretary: 'Γραμματεία'
  };

  const statusNames = {
    pending: 'Σε Αναμονή',
    approved: 'Εγκεκριμένο',
    rejected: 'Απορριφθέν'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMembers(),
        loadRegistrationRequests(),
        loadPackages()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      throw error;
    }
  };

  const loadRegistrationRequests = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('membership_requests')
        .select(`
          *,
          user_profiles(first_name, last_name, email, profile_photo),
          membership_packages(name),
          membership_package_durations(duration_type, price, classes_count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrationRequests(data || []);
    } catch (error) {
      console.error('Error loading registration requests:', error);
      throw error;
    }
  };

  const loadPackages = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('membership_packages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      throw error;
    }
  };

  const loadPackageDurations = async (packageId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('membership_package_durations')
        .select('*')
        .eq('package_id', packageId)
        .eq('is_active', true)
        .order('duration_days');

      if (error) throw error;
      setPackageDurations(data || []);
    } catch (error) {
      console.error('Error loading package durations:', error);
      throw error;
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberFormData.email || !memberFormData.first_name || !memberFormData.last_name) {
      toast.error('Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    try {
      if (editingMember) {
        // Update existing member
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({
            first_name: memberFormData.first_name,
            last_name: memberFormData.last_name,
            phone: memberFormData.phone,
            date_of_birth: memberFormData.date_of_birth || null,
            address: memberFormData.address,
            emergency_contact_name: memberFormData.emergency_contact_name,
            emergency_contact_phone: memberFormData.emergency_contact_phone,
            language: memberFormData.language,
            role: memberFormData.role
          })
          .eq('id', editingMember.id);

        if (error) throw error;
        toast.success('Το μέλος ενημερώθηκε επιτυχώς');
      } else {
        // Create new member - this would typically involve creating auth user first
        toast.error('Η δημιουργία νέου μέλους απαιτεί ειδική διαδικασία εγγραφής');
        return;
      }

      await loadMembers();
      resetMemberForm();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του μέλους');
    }
  };

  const handleEditMember = (member: UserType) => {
    setEditingMember(member);
    setMemberFormData({
      email: member.email || '',
      password: '',
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
      address: member.address || '',
      emergency_contact_name: member.emergency_contact_name || '',
      emergency_contact_phone: member.emergency_contact_phone || '',
      language: member.language || 'el',
      role: member.role || 'user'
    });
    setShowMemberForm(true);
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const request = registrationRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status
      const { error: updateError } = await supabaseAdmin
        .from('membership_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create membership
      const { error: membershipError } = await supabaseAdmin
        .from('memberships')
        .insert([{
          user_id: request.user_id,
          package_id: request.package_id,
          duration_type: request.duration_type,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + (request.duration?.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          approved_at: new Date().toISOString()
        }]);

      if (membershipError) throw membershipError;

      toast.success('Το αίτημα εγκρίθηκε επιτυχώς');
      await loadRegistrationRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Σφάλμα κατά την έγκριση του αιτήματος');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να απορρίψετε αυτό το αίτημα;')) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('membership_requests')
        .update({ 
          status: 'rejected',
          rejected_reason: 'Απορρίφθηκε από τον διαχειριστή'
        })
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Το αίτημα απορρίφθηκε');
      await loadRegistrationRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Σφάλμα κατά την απόρριψη του αιτήματος');
    }
  };

  const resetMemberForm = () => {
    setMemberFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      date_of_birth: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      language: 'el',
      role: 'user'
    });
    setEditingMember(null);
    setShowMemberForm(false);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const filteredRequests = registrationRequests.filter(request => {
    const matchesSearch = 
      request.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
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
            <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Μελών</h2>
            <p className="text-gray-600">Διαχειριστείτε τα μέλη και τις εγγραφές του γυμναστηρίου</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'members', label: 'Μέλη', count: members.length },
              { id: 'requests', label: 'Αιτήματα', count: registrationRequests.length },
              { id: 'packages', label: 'Πακέτα', count: packages.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Αναζήτηση..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === 'members' && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Όλοι οι ρόλοι</option>
                <option value="user">Μέλη</option>
                <option value="trainer">Εκπαιδευτές</option>
                <option value="admin">Διαχειριστές</option>
                <option value="secretary">Γραμματεία</option>
              </select>
            )}

            {activeTab === 'requests' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Όλες οι καταστάσεις</option>
                <option value="pending">Σε Αναμονή</option>
                <option value="approved">Εγκεκριμένα</option>
                <option value="rejected">Απορριφθέντα</option>
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'members' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Λίστα Μελών</h3>
                <button
                  onClick={() => setShowMemberForm(true)}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Νέο Μέλος</span>
                </button>
              </div>

              {showMemberForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {editingMember ? 'Επεξεργασία Μέλους' : 'Νέο Μέλος'}
                    </h4>
                    <button
                      onClick={resetMemberForm}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleMemberSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Όνομα *
                        </label>
                        <input
                          type="text"
                          value={memberFormData.first_name}
                          onChange={(e) => setMemberFormData({ ...memberFormData, first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Επώνυμο *
                        </label>
                        <input
                          type="text"
                          value={memberFormData.last_name}
                          onChange={(e) => setMemberFormData({ ...memberFormData, last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={memberFormData.email}
                          onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Τηλέφωνο
                        </label>
                        <input
                          type="tel"
                          value={memberFormData.phone}
                          onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ημερομηνία Γέννησης
                        </label>
                        <input
                          type="date"
                          value={memberFormData.date_of_birth}
                          onChange={(e) => setMemberFormData({ ...memberFormData, date_of_birth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ρόλος
                        </label>
                        <select
                          value={memberFormData.role}
                          onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="user">Μέλος</option>
                          <option value="trainer">Εκπαιδευτής</option>
                          <option value="admin">Διαχειριστής</option>
                          <option value="secretary">Γραμματεία</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetMemberForm}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Ακύρωση
                      </button>
                      <button
                        type="submit"
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>{editingMember ? 'Ενημέρωση' : 'Δημιουργία'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Μέλος
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Τηλέφωνο
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ρόλος
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ημερομηνία Εγγραφής
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ενέργειες
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.first_name} {member.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {roleNames[member.role as keyof typeof roleNames]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(member.created_at).toLocaleDateString('el-GR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditMember(member)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredMembers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      {searchTerm || roleFilter !== 'all' 
                        ? 'Δεν βρέθηκαν μέλη με τα φίλτρα που επιλέξατε'
                        : 'Δεν υπάρχουν μέλη ακόμα'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Αιτήματα Εγγραφής</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Μέλος
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Πακέτο
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Διάρκεια
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Τιμή
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Κατάσταση
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ημερομηνία
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ενέργειες
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.user?.first_name} {request.user?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.package?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.duration?.duration_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{request.requested_price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {statusNames[request.status as keyof typeof statusNames]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.created_at).toLocaleDateString('el-GR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="Έγκριση"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Απόρριψη"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Δεν βρέθηκαν αιτήματα με τα φίλτρα που επιλέξατε'
                        : 'Δεν υπάρχουν αιτήματα ακόμα'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Διαθέσιμα Πακέτα</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{pkg.name}</h4>
                      <span className="text-2xl font-bold text-primary-600">
                        €{pkg.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{pkg.description}</p>
                    <div className="text-sm text-gray-500">
                      Διάρκεια: {pkg.duration_days} ημέρες
                    </div>
                  </div>
                ))}
              </div>

              {packages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500">Δεν υπάρχουν πακέτα ακόμα</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberRegistration;
