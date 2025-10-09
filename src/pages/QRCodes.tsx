import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  QrCode, 
  Download, 
  Share2, 
  Clock, 
  Calendar,
  User,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { formatDate } from '@/utils';
import { getUserQRCodes, generateQRCode, isQRSystemEnabled } from '@/utils/qrSystem';
import { getAvailableQRCategories, QRCodeCategory } from '@/utils/activeMemberships';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';
import NoActiveMembershipMessage from '@/components/NoActiveMembershipMessage';

// QR Code Canvas Component
const QRCodeCanvas: React.FC<{ qrData: string; category: string }> = ({ qrData, category }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrData) {
      QRCodeLib.toCanvas(canvasRef.current, qrData, {
        width: 320, // μεγαλύτερα modules στην οθόνη
        margin: 16, // ευρύ quiet-zone σύμφωνα με spec
        errorCorrectionLevel: 'L', // ακόμα πιο αραιό pattern
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [qrData]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'free_gym': return 'Ελεύθερο Gym';
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
        width: 480,
        margin: 24,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [qrData, isOpen]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'free_gym': return 'Ελεύθερο Gym';
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
  const [isSystemEnabled, setIsSystemEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<QRCodeCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState<{ qrData: string; category: string } | null>(null);

  // Load user's QR codes and available categories
  useEffect(() => {
    loadQRCodes();
    loadAvailableCategories();
  }, [user?.id]);

  const loadQRCodes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const isEnabled = await isQRSystemEnabled();
      setIsSystemEnabled(isEnabled);
      
      if (isEnabled) {
        const codes = await getUserQRCodes(user.id);
        console.log('Loaded QR codes:', codes);
        setQrCodes(codes);
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      // Don't show error toast for empty results, just log it
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
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Error loading available categories:', error);
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Generate new QR code
  const handleGenerateQR = async (category: 'free_gym' | 'pilates' | 'personal') => {
    if (!user?.id) return;
    
    try {
      setGenerating(true);
      console.log('[QR-Generator] payload before encoding:', { userId: user.id, category });
      const { qrCode, qrData } = await generateQRCode(user.id, category);
      console.log('[QR-Generator] generated', { tokenLen: qrData.length, sample: qrData.slice(0, 60) });
      
      // Add qrData to the qrCode object for display
      const qrCodeWithData = { ...qrCode, qrData };
      
      setQrCodes(prev => [qrCodeWithData, ...prev]);
      toast.success('QR Code δημιουργήθηκε επιτυχώς');
      
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
        width: 480,
        margin: 24,
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
          'free_gym': 'Ελεύθερο Gym',
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

  // Show system disabled message
  if (!isSystemEnabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
            <p className="text-gray-600">Διαχειριστείτε τα QR codes για τα μαθήματά σας</p>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Σύστημα QR Codes Απενεργοποιημένο</h3>
              <p className="text-yellow-700">Το σύστημα QR codes δεν είναι ενεργό αυτή τη στιγμή.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 mobile-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">QR Codes</h1>
          <p className="text-sm md:text-base text-gray-600">Διαχειριστείτε τα QR codes για τα μαθήματά σας</p>
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
                onClick={() => handleGenerateQR(category.key)}
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
        ) : (
          <NoActiveMembershipMessage showQRMessage={true} />
        )}
      </div>

      {/* Active QR Codes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ενεργά QR Codes</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500">Φόρτωση QR codes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {qrCodes
              .filter(qr => isQRActive(qr.status, qr.expires_at))
              .map((qr, index) => {
                return (
                  <div key={`${qr.id}-${index}`} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                    {/* QR Code Display */}
                    <div className="text-center mb-3 md:mb-4">
                      <div 
                        className="inline-block p-2 md:p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                        onClick={() => handlePreviewQR(qr.qrData || qr.qr_token, qr.category)}
                        title="Προβολή και zoom QR Code"
                      >
                        {qr.qrData ? (
                          <QRCodeCanvas qrData={qr.qrData} category={qr.category} />
                        ) : (
                          <QrCode className="h-16 md:h-24 w-16 md:w-24 text-gray-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {qr.qrData ? 'Ενεργό QR Code' : 'QR Code Preview'}
                      </p>
                    </div>

                    {/* QR Info */}
                    <div className="space-y-2 mb-4">
                      <h3 className="font-medium text-gray-900 text-center">
                        {qr.category === 'free_gym' && 'Ελεύθερο Gym'}
                        {qr.category === 'pilates' && 'Pilates'}
                        {qr.category === 'personal' && 'Personal Training'}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(qr.issued_at)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {qr.last_scanned_at ? formatDate(qr.last_scanned_at) : 'Ποτέ'}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {qr.scan_count} σαρώσεις
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(qr.status, qr.expires_at)}`}>
                        {getStatusText(qr.status, qr.expires_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleDownloadQR(qr.qrData || qr.qr_token, qr.category)}
                        className="btn-secondary flex-1 flex items-center justify-center text-xs md:text-sm py-2 px-3"
                      >
                        <Download className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => handleShareQR(qr.qrData || qr.qr_token, qr.category)}
                        className="btn-primary flex-1 flex items-center justify-center text-xs md:text-sm py-2 px-3"
                      >
                        <Share2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Share
                      </button>
                    </div>

                    {/* QR Code Data */}
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono break-all hidden sm:block">
                      {qr.qr_token.substring(0, 50)}...
                    </div>
                  </div>
                );
              })}
            
            {qrCodes.filter(qr => isQRActive(qr.status, qr.expires_at)).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Δεν έχετε ενεργά QR codes</p>
                <p className="text-sm">Δημιουργήστε ένα νέο QR code παραπάνω</p>
              </div>
            )}
          </div>
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

      {/* Inactive/Expired QR Codes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ιστορικό QR Codes</h2>
        
        <div className="space-y-3">
          {qrCodes
            .filter(qr => !isQRActive(qr.status, qr.expires_at))
            .map((qr, index) => {
              return (
                <div key={`${qr.id}-history-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <QrCode className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {qr.category === 'free_gym' && 'Ελεύθερο Gym'}
                        {qr.category === 'pilates' && 'Pilates'}
                        {qr.category === 'personal' && 'Personal Training'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(qr.issued_at)} • {qr.scan_count} σαρώσεις
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(qr.status, qr.expires_at)}`}>
                      {getStatusText(qr.status, qr.expires_at)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(qr.updated_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          
          {qrCodes.filter(qr => !isQRActive(qr.status, qr.expires_at)).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Δεν έχετε ληγμένα QR codes</p>
            </div>
          )}
        </div>
      </div>

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
