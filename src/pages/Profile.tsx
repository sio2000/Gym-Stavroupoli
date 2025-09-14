import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3,
  Save,
  X,
  Camera,
  Key,
  Shield,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Star,
  Clock,
  UserCheck
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatDate, calculateAge, uploadProfilePhoto } from '@/utils/profileUtils';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    address: user?.address || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
    profile_photo: user?.profile_photo || '',
    profile_photo_locked: user?.profile_photo_locked || false,
    dob_locked: user?.dob_locked || false,
    language: (user?.language as 'el' | 'en') || 'el'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });


  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [capturedPhotoFile, setCapturedPhotoFile] = useState<File | null>(null);
  const [capturedPhotoPreview, setCapturedPhotoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraStream, setShowCameraStream] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update formData when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob || '',
        address: user.address || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        profile_photo: user.profile_photo || '',
        profile_photo_locked: user.profile_photo_locked || false,
        dob_locked: user.dob_locked || false,
        language: (user.language as 'el' | 'en') || 'el'
      });
      
      if (user.profile_photo) {
        setProfilePhotoPreview(user.profile_photo);
      }
    }
  }, [user]);

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };


  // Handle file selection (for edit mode)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (formData.profile_photo_locked) {
        toast.error('Η φωτογραφία προφίλ δεν μπορεί να αλλάξει');
        return;
      }
      
      setProfilePhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Open camera - different approach for mobile vs desktop
  const handleOpenCamera = async () => {
    try {
      if (formData.profile_photo_locked) {
        toast.error('Η φωτογραφία προφίλ δεν μπορεί να αλλάξει');
        return;
      }

      console.log('[Profile] Opening camera...');
      
      // For mobile devices, use the file input with capture
      if (isMobileDevice()) {
        console.log('[Profile] Mobile device detected, using file input with capture');
        cameraInputRef.current?.click();
        return;
      }

      // For desktop, use getUserMedia
      console.log('[Profile] Desktop detected, using getUserMedia');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Η κάμερα δεν υποστηρίζεται σε αυτόν τον browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      setShowCameraStream(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

    } catch (err) {
      console.error('[Profile] Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          toast.error('Δεν δόθηκε άδεια για πρόσβαση στην κάμερα');
        } else if (err.name === 'NotFoundError') {
          toast.error('Δεν βρέθηκε κάμερα');
        } else {
          toast.error('Σφάλμα κατά το άνοιγμα της κάμερας');
        }
      } else {
        toast.error('Σφάλμα κατά το άνοιγμα της κάμερας');
      }
    }
  };

  // Handle camera capture
  const handleCameraCaptureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // Permission denied or user canceled - don't show error for user cancel
      console.warn('[Profile] Camera capture canceled or permission denied');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Παρακαλώ επιλέξτε ένα αρχείο εικόνας');
      return;
    }
    if (formData.profile_photo_locked) {
      toast.error('Η φωτογραφία προφίλ δεν μπορεί να αλλάξει');
      return;
    }
    console.log('[Profile] Photo captured from camera:', file.name, file.size, file.type);
    setCapturedPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedPhotoPreview(e.target?.result as string);
      setShowCameraPreview(true);
    };
    reader.onerror = () => {
      console.error('[Profile] Error reading file');
      toast.error('Σφάλμα κατά την ανάγνωση της εικόνας');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCapturedUpload = async () => {
    if (!capturedPhotoFile) return;
    try {
      setIsUploading(true);
      console.log('[Profile] ===== CAMERA PHOTO UPLOAD STARTED =====');
      console.log('[Profile] File details:', {
        name: capturedPhotoFile.name,
        size: capturedPhotoFile.size,
        type: capturedPhotoFile.type,
        userId: user?.id
      });
      
      const publicUrl = await uploadProfilePhoto(capturedPhotoFile, user?.id || '');
      console.log('[Profile] Camera upload successful, public URL:', publicUrl);
      
      const updatedFormData = {
        ...formData,
        profile_photo: publicUrl,
        profile_photo_locked: true
      };
      setFormData(updatedFormData);
      setProfilePhotoPreview(publicUrl);
      await updateProfile(updatedFormData);
      toast.success('Η φωτογραφία προφίλ αποθηκεύθηκε επιτυχώς!');
      setShowCameraPreview(false);
      setCapturedPhotoFile(null);
      setCapturedPhotoPreview('');
    } catch (error) {
      console.error('[Profile] Camera upload failed:', error);
      let errorMessage = 'Σφάλμα κατά την αποθήκευση της φωτογραφίας';
      
      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          errorMessage = 'Σφάλμα αποθήκευσης. Παρακαλώ δοκιμάστε ξανά.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.';
        } else if (error.message.includes('size') || error.message.includes('large')) {
          errorMessage = 'Η εικόνα είναι πολύ μεγάλη. Επιλέξτε μικρότερη εικόνα.';
        } else if (error.message.includes('type') || error.message.includes('format')) {
          errorMessage = 'Μη υποστηριζόμενος τύπος αρχείου. Επιλέξτε JPG ή PNG.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Capture photo from video stream (desktop)
  const handleCaptureFromStream = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
      setCapturedPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedPhotoPreview(e.target?.result as string);
        setShowCameraPreview(true);
        setShowCameraStream(false);
        
        // Stop the camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      reader.readAsDataURL(file);
    }, 'image/jpeg', 0.8);
  };

  // Close camera stream
  const handleCloseCameraStream = () => {
    setShowCameraStream(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCancelCaptured = () => {
    setShowCameraPreview(false);
    setCapturedPhotoFile(null);
    setCapturedPhotoPreview('');
  };

  // Handle direct photo upload (from "Ανεβάστε φωτογραφία" button)
  const handleDirectPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (formData.profile_photo_locked) {
        toast.error('Η φωτογραφία προφίλ δεν μπορεί να αλλάξει');
        return;
      }
      
      try {
        console.log('[Profile] ===== DIRECT PHOTO UPLOAD STARTED =====');
        console.log('[Profile] Uploading profile photo directly...');
        
        // Upload the photo immediately
        const publicUrl = await uploadProfilePhoto(file, user?.id || '');
        console.log('[Profile] Direct upload successful, public URL:', publicUrl);
        
        // Update form data with the uploaded photo URL and lock it
        const updatedFormData = {
          ...formData,
          profile_photo: publicUrl,
          profile_photo_locked: true
        };
        
        // Update the state
        setFormData(updatedFormData);
        setProfilePhotoPreview(publicUrl);
        
        // Update the profile in the database
        await updateProfile(updatedFormData);
        
        console.log('[Profile] ===== DIRECT PHOTO UPLOAD COMPLETED =====');
        toast.success('Η φωτογραφία προφίλ αποθηκεύθηκε επιτυχώς!');
        
      } catch (error) {
        console.error('[Profile] ===== DIRECT PHOTO UPLOAD FAILED =====');
        console.error('[Profile] Error details:', error);
        toast.error('Σφάλμα κατά την αποθήκευση της φωτογραφίας');
      }
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('[Profile] ===== FORM SUBMISSION STARTED =====');
      console.log('[Profile] Form data:', JSON.stringify(formData, null, 2));
      console.log('[Profile] Profile photo file:', profilePhotoFile);
      
      let finalFormData = { ...formData };
      
      // If profile photo is selected, upload it first
      if (profilePhotoFile) {
        console.log('[Profile] Uploading profile photo...');
        const publicUrl = await uploadProfilePhoto(profilePhotoFile, user?.id || '');
        console.log('[Profile] Upload successful, public URL:', publicUrl);
        
        // Update formData with the uploaded photo URL
        finalFormData = {
          ...formData,
          profile_photo: publicUrl,
          profile_photo_locked: true
        };
        
        console.log('[Profile] Final form data after photo upload:', JSON.stringify(finalFormData, null, 2));
        
        // Clear the file selection
        setProfilePhotoFile(null);
        setProfilePhotoPreview(publicUrl);
        
        // Also update the state immediately
        setFormData(finalFormData);
      }
      
      // Update profile data with locking logic
      const updatedData = {
        ...finalFormData,
        dob_locked: finalFormData.dob ? true : finalFormData.dob_locked
      };
      
      console.log('[Profile] Updated data to send:', JSON.stringify(updatedData, null, 2));
      console.log('[Profile] Calling updateProfile...');
      
      await updateProfile(updatedData);
      setIsEditing(false);
      console.log('[Profile] ===== FORM SUBMISSION COMPLETED =====');
      toast.success('Το προφίλ ενημερώθηκε επιτυχώς!');
    } catch (error) {
      console.error('[Profile] ===== FORM SUBMISSION FAILED =====');
      console.error('[Profile] Error details:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του προφίλ');
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Οι κωδικοί δεν ταιριάζουν');
      return;
    }
    
    // In real app, make API call to change password
    toast.success('Ο κωδικός πρόσβασης άλλαξε επιτυχώς!');
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Προφίλ Χρήστη
                </h1>
                <p className="text-sm text-gray-600 font-medium">Διαχειριστείτε τις πληροφορίες του λογαριασμού σας</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Edit3 className="h-5 w-5" />
                  <span className="hidden sm:inline">Επεξεργασία</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 bg-white/80 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                    <span className="hidden sm:inline">Ακύρωση</span>
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Save className="h-5 w-5" />
                    <span className="hidden sm:inline">Αποθήκευση</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Modern Avatar Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
                <div className="relative group">
                  {profilePhotoPreview || formData.profile_photo ? (
                    <img
                      src={profilePhotoPreview || formData.profile_photo}
                      alt="Profile"
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-2xl"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center border-4 border-white shadow-2xl">
                      <User className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {!formData.profile_photo_locked && isEditing && (
                    <label className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105">
                      <Camera className="h-5 w-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 font-medium capitalize">{user?.role}</span>
                  </div>
                  <p className="text-gray-500 mb-4">
                    Μέλος από {formatDate(user?.createdAt || '')}
                  </p>
                  
                  {formData.profile_photo_locked ? (
                    <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-green-800 text-sm font-medium">Φωτογραφία κλειδωμένη</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2 cursor-pointer hover:bg-blue-100 transition-all duration-200 hover:shadow-md">
                        <Upload className="h-4 w-4 text-blue-600" />
                        <p className="text-blue-800 text-sm font-medium">Ανεβάστε φωτογραφία</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDirectPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenCamera}
                        className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-2 hover:bg-indigo-100 transition-all duration-200 hover:shadow-md"
                      >
                        <Camera className="h-4 w-4 text-indigo-600" />
                        <span className="text-indigo-800 text-sm font-medium">Λήψη φωτογραφίας</span>
                      </button>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCaptureChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Form */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <UserCheck className="h-6 w-6 mr-3 text-blue-600" />
                Πληροφορίες Προφίλ
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Όνομα</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Επώνυμο</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Τηλέφωνο</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="+30 69XXXXXXXX"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Date of Birth and Language */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700">Ημερομηνία Γέννησης</label>
                      {formData.dob_locked && (
                        <span className="inline-flex items-center space-x-1 text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          <Check className="h-3 w-3" />
                          <span>Κλειδωμένο</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        disabled={!isEditing || formData.dob_locked}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      />
                    </div>
                    {formData.dob && (
                      <p className="text-sm text-gray-500 mt-1">
                        Ηλικία: {calculateAge(formData.dob)} ετών
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Γλώσσα</label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                    >
                      <option value="el">Ελληνικά</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Διεύθυνση</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Οδός, Αριθμός, Πόλη, ΤΚ"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                    Επείγουσα Επικοινωνία
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Όνομα</label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Όνομα επείγουσας επικοινωνίας"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Τηλέφωνο</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="+30 69XXXXXXXX"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Modern Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Account Status Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-green-600" />
                Κατάσταση Λογαριασμού
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ρόλος</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Κωδικός Παραπομπής</p>
                      <p className="text-lg font-bold text-gray-900 font-mono">{user?.referralCode || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Εγγραφή</p>
                      <p className="text-lg font-bold text-gray-900">{formatDate(user?.createdAt || '')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Τελευταία Ενημέρωση</p>
                      <p className="text-lg font-bold text-gray-900">{formatDate(user?.updatedAt || '')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Key className="h-6 w-6 mr-3 text-blue-600" />
                Γρήγορες Ενέργειες
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Key className="h-5 w-5" />
                  <span>Αλλαγή Κωδικού</span>
                </button>
              </div>
            </div>

            {/* Account Actions Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <AlertCircle className="h-6 w-6 mr-3 text-red-600" />
                Ενέργειες Λογαριασμού
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-medium hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Διαγραφή Λογαριασμού</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Αλλαγή Κωδικού</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Τρέχων Κωδικός</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Νέος Κωδικός</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Επιβεβαίωση Νέου Κωδικού</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Αλλαγή Κωδικού
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Διαγραφή Λογαριασμού</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Προσοχή!</h4>
                    <p className="text-sm text-red-800">
                      Η διαγραφή του λογαριασμού είναι μη αναστρέψιμη. Όλα τα δεδομένα σας θα διαγραφούν οριστικά.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Διαγραφή
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Stream Modal (Desktop) */}
      {showCameraStream && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Λήψη φωτογραφίας</h3>
              </div>
              <button
                onClick={handleCloseCameraStream}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 rounded-2xl object-cover border border-gray-200 bg-gray-100"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={handleCloseCameraStream}
                className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleCaptureFromStream}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" />
                Λήψη φωτογραφίας
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Preview Modal */}
      {showCameraPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Προεπισκόπηση φωτογραφίας</h3>
              </div>
              <button
                onClick={handleCancelCaptured}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {capturedPhotoPreview ? (
              <img
                src={capturedPhotoPreview}
                alt="Captured preview"
                className="w-full rounded-2xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-full h-48 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
                Καμία εικόνα
              </div>
            )}

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={handleCancelCaptured}
                disabled={isUploading}
                className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-60"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleConfirmCapturedUpload}
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                {isUploading ? 'Γίνεται αποθήκευση...' : 'Αποθήκευση'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
