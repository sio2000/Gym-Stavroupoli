import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  QrCode, 
  Download, 
  Share2, 
  Clock, 
  Calendar,
  User,
  Users,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Receipt
} from 'lucide-react';
import { formatDate } from '@/utils';
import { getUserQRCodes, generateQRCode, getCurrentGymOccupancy } from '@/utils/qrSystem';
import { getAvailableQRCategories, QRCodeCategory } from '@/utils/activeMemberships';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';
import NoActiveMembershipMessage from '@/components/NoActiveMembershipMessage';
import { checkOverdueInstallment } from '@/services/api/installmentApi';

// QR Code Canvas Component
const QRCodeCanvas: React.FC<{ qrData: string; category: string }> = ({ qrData, category }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrData) {
      QRCodeLib.toCanvas(canvasRef.current, qrData, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [qrData]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'free_gym': return 'Open Gym';
      case 'pilates': return 'Pilates';
      case 'personal': return 'Personal Training';
      default: return cat;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
      <div className="mt-2 text-xs text-gray-600 font-medium">
        {getCategoryLabel(category)}
      </div>
    </div>
  );
};

// Zoomable QR Code Modal Component
const ZoomableQRModal: React.FC<{ 
  qrData: string; 
  category: string; 
  isOpen: boolean; 
  onClose: () => void; 
}> = ({ qrData, category, isOpen, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrData && isOpen) {
      QRCodeLib.toCanvas(canvasRef.current, qrData, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [qrData, isOpen]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'free_gym': return 'Open Gym';
      case 'pilates': return 'Pilates';
      case 'personal': return 'Personal Training';
      default: return cat;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch
      e.preventDefault();
      return;
    }
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (distance > 0) {
        const newScale = Math.max(0.5, Math.min(3, distance / 150));
        setScale(newScale);
      }
    } else if (e.touches.length === 1 && isDragging) {
      // Single finger drag
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-full max-h-full overflow-hidden mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border-b border-gray-200 gap-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 text-center sm:text-left">
            {getCategoryLabel(category)} - QR Code
          </h3>
          <div className="flex items-center justify-center space-x-1 md:space-x-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.2))}
              className="p-1.5 md:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <span className="text-xs md:text-sm text-gray-600 min-w-[2.5rem] md:min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(3, scale + 0.2))}
              className="p-1.5 md:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 md:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>

        {/* QR Code Container */}
        <div 
          ref={containerRef}
          className="relative overflow-hidden bg-gray-50 mx-auto"
          style={{ width: 'min(400px, 90vw)', height: 'min(400px, 90vw)' }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) scale(${scale})`
            }}
          >
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 text-center">
            Χρησιμοποιήστε τα δάχτυλά σας για να κάνετε zoom ή σύρετε για να μετακινήσετε
          </p>
        </div>

        {/* Close Button */}
        <div className="p-3 md:p-4 text-center">
          <button 
            onClick={onClose}
            className="px-4 md:px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors text-sm md:text-base w-full sm:w-auto"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};

const QRCodes: React.FC = () => {
  const { user } = useAuth();
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Πάντα εμφανίζουμε τη σελίδα, χωρίς flag απενεργοποίησης
  const [generating, setGenerating] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<QRCodeCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState<{ qrData: string; category: string } | null>(null);
  const [hasOverdueInstallment, setHasOverdueInstallment] = useState(false);
  const [checkingOverdue, setCheckingOverdue] = useState(true);
  const [occupancy, setOccupancy] = useState<number>(0);
  const [occupancyLoading, setOccupancyLoading] = useState(false);

  // Load user's QR codes and available categories
  useEffect(() => {
    loadQRCodes();
    loadAvailableCategories();
    checkOverdueStatus();
    loadOccupancy();
    
    // Refresh occupancy every 30 seconds for real-time updates
    const occupancyInterval = setInterval(() => {
      loadOccupancy();
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(occupancyInterval);
    };
  }, [user?.id]);

  const loadOccupancy = async () => {
    try {
      setOccupancyLoading(true);
      const count = await getCurrentGymOccupancy();
      setOccupancy(count);
    } catch (error) {
      console.error('[QRCodes] Error loading occupancy:', error);
      setOccupancy(0);
    } finally {
      setOccupancyLoading(false);
    }
  };

  const checkOverdueStatus = async () => {
    if (!user?.id) return;
    
    try {
      setCheckingOverdue(true);
      const hasOverdue = await checkOverdueInstallment();
      setHasOverdueInstallment(hasOverdue);
    } catch (error) {
      console.error('Error checking overdue installment:', error);
      setHasOverdueInstallment(false);
    } finally {
      setCheckingOverdue(false);
    }
  };

  const loadQRCodes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const codes = await getUserQRCodes(user.id);
      const codesWithData = codes.map(code => ({
        ...code,
        qrData: code.qr_token
      }));
      setQrCodes(codesWithData);
    } catch (error) {
      console.error('Error loading QR codes:', error);
      if (error instanceof Error && error.message && !error.message.includes('No rows found')) {
        toast.error('Σφάλμα φόρτωσης QR codes');
      }
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  };
  // Open QR in zoomable modal
  const handlePreviewQR = (qrData: string, category: string) => {
    setSelectedQRData({ qrData, category });
    setZoomModalOpen(true);
  };


  const loadAvailableCategories = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingCategories(true);
      const categories = await getAvailableQRCategories(user.id);
      console.log('Loaded available QR categories:', categories);
      // Ενιαίο QR εισόδου: προβάλλουμε μόνο μία επιλογή όταν υπάρχει οποιαδήποτε ενεργή συνδρομή
      if (categories.length > 0) {
        setAvailableCategories([{
          key: 'free_gym',
          label: 'QR Εισόδου Γυμναστηρίου',
          icon: '🎟️',
          packageType: 'free_gym'
        }]);
      } else {
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error('Error loading available categories:', error);
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Generate new QR code
  const handleGenerateQR = async () => {
    if (!user?.id) return;
    
    try {
      setGenerating(true);
      console.log('[QR-Generator] payload before encoding:', { userId: user.id, category: 'free_gym' });
      const { qrCode, qrData } = await generateQRCode(user.id, 'free_gym');
      console.log('[QR-Generator] generated', { tokenLen: qrData.length, sample: qrData.slice(0, 60) });
      
      // Add qrData to the qrCode object for display
      const qrCodeWithData = { ...qrCode, qrData };
      
      setQrCodes(prev => [qrCodeWithData, ...prev]);
      toast.success('QR εισόδου δημιουργήθηκε επιτυχώς');
      
      // Refresh available categories in case membership status changed
      await loadAvailableCategories();
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      // Show more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα δημιουργίας QR code';
      
      if (errorMessage.includes("don't have an active membership")) {
        toast.error('Δεν έχετε ενεργή συνδρομή για αυτή την κατηγορία. Παρακαλώ ελέγξτε ότι το αίτημά σας έχει εγκριθεί.');
      } else if (errorMessage.includes("not authenticated")) {
        toast.error('Παρακαλώ συνδεθείτε ξανά.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Handle QR code download
  const handleDownloadQR = async (qrData: string, category: string) => {
    try {
      // Create QR code image
      const canvas = document.createElement('canvas');
      await QRCodeLib.toCanvas(canvas, qrData, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Add category label
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, 30);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        
        const categoryLabels = {
          'free_gym': 'Open Gym',
          'pilates': 'Pilates',
          'personal': 'Personal Training'
        };
        
        ctx.fillText(categoryLabels[category as keyof typeof categoryLabels] || category, canvas.width / 2, 20);
      }
      
      const link = document.createElement('a');
      link.download = `qr-code-${category}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success(`QR Code για ${category} κατέβηκε επιτυχώς`);
    } catch (error) {
      console.error('Error generating QR code for download:', error);
      toast.error('Σφάλμα δημιουργίας QR code');
    }
  };

  // Handle QR code sharing
  const handleShareQR = async (qrData: string, category: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${category}`,
          text: `QR Code για ${category}`,
          url: qrData
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(qrData);
      toast.success('QR Code αντιγράφηκε στο clipboard');
    }
  };

  // Check if QR code is expired
  const isQRExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Check if QR code is active
  const isQRActive = (status: string, expiresAt?: string) => {
    if (status !== 'active') return false;
    if (isQRExpired(expiresAt)) return false;
    return true;
  };

  // Get status color
  const getStatusColor = (status: string, expiresAt?: string) => {
    if (status === 'revoked') return 'text-red-600 bg-red-100';
    if (status === 'inactive') return 'text-gray-600 bg-gray-100';
    if (isQRExpired(expiresAt)) return 'text-orange-600 bg-orange-100';
    if (status === 'active') return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Get status text
  const getStatusText = (status: string, expiresAt?: string) => {
    if (status === 'revoked') return 'Ανακλημένο';
    if (status === 'inactive') return 'Ανενεργό';
    if (isQRExpired(expiresAt)) return 'Ληγμένο';
    if (status === 'active') return 'Ενεργό';
    return 'Άγνωστο';
  };

  // Αφαιρούμε το μήνυμα απενεργοποίησης: εμφανίζουμε πάντα τη σελίδα

  return (
    <div className="space-y-4 md:space-y-6 mobile-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">QR Codes</h1>
          <p className="text-sm md:text-base text-gray-100">Διαχειριστείτε τα QR codes για τα μαθήματά σας</p>
        </div>
        <button
          onClick={() => {
            loadQRCodes();
            loadAvailableCategories();
          }}
          disabled={loading || loadingCategories}
          className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${(loading || loadingCategories) ? 'animate-spin' : ''}`} />
          <span>Ανανέωση</span>
        </button>
      </div>

      {/* Open Gym occupancy moved from Membership */}
      {availableCategories.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute left-6 bottom-6 h-28 w-28 rounded-full bg-cyan-300/30 blur-3xl" />

          <div className="relative p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-white/15 backdrop-blur shadow-sm border border-white/20">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">Πληρότητα Open Gym (τώρα)</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/90 text-blue-700 font-semibold shadow-sm">
                      live
                    </span>
                  </div>
                  <p className="text-sm text-white/80">Με βάση τα τελευταία QR check-in/checkout</p>
                </div>
              </div>
              <button
                onClick={loadOccupancy}
                disabled={occupancyLoading}
                className="inline-flex items-center px-3 py-2 rounded-xl border border-white/60 text-white bg-white/10 hover:bg-white/20 shadow-sm text-sm disabled:opacity-60 transition"
              >
                Ανανέωση
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4 sm:gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-blue-800 flex items-center justify-center text-4xl sm:text-5xl font-extrabold shadow-2xl border border-white/60">
                    {occupancyLoading ? '…' : Number.isFinite(occupancy) ? occupancy : 0}
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-14 h-14 rounded-xl bg-white/90 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shadow-md">
                    τώρα
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-white">
                  <div className="text-sm sm:text-base font-semibold">Άτομα μέσα στο γυμναστήριο αυτή τη στιγμή</div>
                  <div className="text-xs text-white/80">Ενημέρωση με βάση σημερινές σαρώσεις</div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold w-fit">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-time</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:justify-end text-xs sm:text-sm text-white/90">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/15 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Live μέτρηση</span>
                </div>
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/15 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-sky-200" />
                  <span>QR check-in/out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate QR Code */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Δημιουργία Νέου QR Code</h2>
        
        {loadingCategories ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500">Φόρτωση διαθέσιμων πακέτων...</p>
          </div>
        ) : availableCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {availableCategories.map((category) => (
              <button
                key={category.key}
                onClick={() => handleGenerateQR()}
                disabled={generating}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow disabled:opacity-50 hover:border-blue-300 hover:bg-blue-50 min-h-[120px] flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-xl md:text-2xl mb-2">{category.icon}</div>
                  <div className="font-medium text-gray-900 text-sm md:text-base">{category.label}</div>
                  <div className="text-xs md:text-sm text-gray-500">Δημιουργία QR Code</div>
                </div>
              </button>
            ))}
          </div>
        ) : hasOverdueInstallment ? (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  QR Codes Δεν Διαθέσιμα
                </h3>
                <p className="text-red-700 mb-4">
                  Δεν μπορείτε να αποκτήσετε πρόσβαση στα QR Codes επειδή έχετε εκπρόθεσμη δόση στο πλάνο δόσεων σας.
                </p>
                <p className="text-sm text-red-600 mb-4">
                  Παρακαλώ πληρώστε την εκπρόθεσμη δόση για να αποκτήσετε ξανά πρόσβαση στα QR Codes.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => window.location.href = '/installment-plan'}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Προβολή Πλάνου Δόσεων
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NoActiveMembershipMessage showQRMessage={true} />
        )}
      </div>

      {/* Active QR Codes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ενεργά QR Codes</h2>
        
        {loading || checkingOverdue ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500">
              {checkingOverdue ? 'Έλεγχος κατάστασης δόσεων...' : 'Φόρτωση QR codes...'}
            </p>
          </div>
        ) : (
          (() => {
            const primaryQR = qrCodes.find(qr => isQRActive(qr.status, qr.expires_at)) || qrCodes[0];
            if (!primaryQR) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Δεν έχετε ενεργό QR εισόδου</p>
                  <p className="text-sm">Δημιουργήστε ένα νέο QR εισόδου παραπάνω</p>
                </div>
              );
            }

            return (
              <div className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="text-center mb-4">
                  <div 
                    className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => handlePreviewQR(primaryQR.qrData || primaryQR.qr_token, 'free_gym')}
                    title="Προβολή και zoom QR Code"
                  >
                    {primaryQR.qrData ? (
                      <QRCodeCanvas qrData={primaryQR.qrData} category="free_gym" />
                    ) : (
                      <QrCode className="h-24 w-24 text-gray-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    QR Εισόδου Open Gym
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-center">
                  <h3 className="font-medium text-gray-900">Είσοδος Open Gym</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Εκδόθηκε: {formatDate(primaryQR.issued_at)}
                    </div>
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Τελευταία σάρωση: {primaryQR.last_scanned_at ? formatDate(primaryQR.last_scanned_at) : 'Ποτέ'}
                    </div>
                    <div className="flex items-center justify-center">
                      <User className="h-4 w-4 mr-2" />
                      {primaryQR.scan_count} σαρώσεις
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(primaryQR.status, primaryQR.expires_at)}`}>
                    {getStatusText(primaryQR.status, primaryQR.expires_at)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleDownloadQR(primaryQR.qrData || primaryQR.qr_token, 'free_gym')}
                    className="btn-secondary flex-1 flex items-center justify-center text-xs md:text-sm py-2 px-3"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Λήψη
                  </button>
                  <button
                    onClick={() => handleShareQR(primaryQR.qrData || primaryQR.qr_token, 'free_gym')}
                    className="btn-primary flex-1 flex items-center justify-center text-xs md:text-sm py-2 px-3"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Κοινοποίηση
                  </button>
                </div>

                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono break-all hidden sm:block">
                  {primaryQR.qr_token.substring(0, 50)}...
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Zoomable QR Modal */}
      {selectedQRData && (
        <ZoomableQRModal
          qrData={selectedQRData.qrData}
          category={selectedQRData.category}
          isOpen={zoomModalOpen}
          onClose={() => {
            setZoomModalOpen(false);
            setSelectedQRData(null);
          }}
        />
      )}

      {/* QR Fullscreen Preview Modal (Legacy) */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-lg p-4 shadow-xl max-w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="QR Preview" className="max-h-[80vh] max-w-[80vw] object-contain" />
            <div className="mt-4 text-center">
              <button onClick={() => setPreviewImage(null)} className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700">Κλείσιμο</button>
            </div>
          </div>
        </div>
      )}


      {/* QR Code Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-3">Πώς να χρησιμοποιήσετε τα QR Codes</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold mt-0.5 flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-xs md:text-sm">Κλείστε ένα μάθημα</p>
              <p className="text-xs md:text-sm">Το QR code δημιουργείται αυτόματα μετά την κράτηση</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold mt-0.5 flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-xs md:text-sm">Παρουσιάστε το QR code</p>
              <p className="text-xs md:text-sm">Στο γυμναστήριο για check-in/check-out</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold mt-0.5 flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-xs md:text-sm">Κερδίστε πιστώσεις</p>
              <p className="text-xs md:text-sm">Μετά την ολοκλήρωση του μαθήματος</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Details</h3>
              
              <div className="p-4 bg-gray-100 rounded-lg mb-4">
                <QrCode className="h-32 w-32 text-gray-600 mx-auto" />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Σκανάρετε αυτό το QR code στο γυμναστήριο για check-in
              </p>
              
              <button
                onClick={() => setSelectedQR(null)}
                className="btn-primary w-full"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodes;
