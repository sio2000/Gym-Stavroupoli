import React, { useState } from 'react';
import { 
  QrCode, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Copy,
  Download
} from 'lucide-react';

interface DemoData {
  qrCode: string;
  arMarker: string;
  description: string;
  instructions: string;
}

const DemoInfo: React.FC = () => {
  const [demoData, setDemoData] = useState<DemoData>({
    qrCode: '',
    arMarker: '',
    description: '',
    instructions: ''
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const [showARMarker, setShowARMarker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDemoData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'qrCode' | 'arMarker') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setDemoData(prev => ({
          ...prev,
          [type]: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!demoData.qrCode && !demoData.arMarker) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate demo data submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitStatus('success');
      
      // In a real implementation, this would save to backend
      console.log('Demo data submitted:', demoData);
      
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const downloadDemoData = () => {
    const dataStr = JSON.stringify(demoData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'demo-info.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Demo Information</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Εισάγετε τις πληροφορίες demo για την εφαρμογή. Αυτό είναι απαραίτητο για την έγκριση του App Store.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Πληροφορίες για το App Store Review</h3>
              <p className="text-blue-800 text-sm mb-2">
                Το Apple App Store απαιτεί demo πληροφορίες για να μπορέσει να αξιολογήσει πλήρως τις λειτουργίες της εφαρμογής.
              </p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• QR Code: Για λειτουργίες που απαιτούν QR code scanning</li>
                <li>• AR Marker: Για Augmented Reality λειτουργίες</li>
                <li>• Περιγραφή: Σύντομη εξήγηση των demo features</li>
                <li>• Οδηγίες: Πώς να χρησιμοποιήσει το review team τις demo πληροφορίες</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* QR Code Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                <QrCode className="h-6 w-6 text-purple-600" />
                <span>QR Code Demo</span>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code URL ή Text
                  </label>
                  <input
                    type="text"
                    name="qrCode"
                    value={demoData.qrCode}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε URL ή κείμενο για QR code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ανεβάστε QR Code Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'qrCode')}
                      className="hidden"
                      id="qrCodeUpload"
                    />
                    <label
                      htmlFor="qrCodeUpload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Κάντε κλικ για να ανεβάσετε QR Code</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {demoData.qrCode && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Preview:</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowQRCode(!showQRCode)}
                        className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        {showQRCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{showQRCode ? 'Hide' : 'Show'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(demoData.qrCode)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                  {showQRCode && (
                    <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                      {demoData.qrCode.length > 100 
                        ? `${demoData.qrCode.substring(0, 100)}...` 
                        : demoData.qrCode
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AR Marker Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                <Camera className="h-6 w-6 text-blue-600" />
                <span>AR Marker Demo</span>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AR Marker URL ή Description
                  </label>
                  <input
                    type="text"
                    name="arMarker"
                    value={demoData.arMarker}
                    onChange={handleInputChange}
                    placeholder="Εισάγετε AR marker πληροφορίες"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ανεβάστε AR Marker Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'arMarker')}
                      className="hidden"
                      id="arMarkerUpload"
                    />
                    <label
                      htmlFor="arMarkerUpload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Κάντε κλικ για να ανεβάσετε AR Marker</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {demoData.arMarker && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Preview:</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowARMarker(!showARMarker)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        {showARMarker ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{showARMarker ? 'Hide' : 'Show'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(demoData.arMarker)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                  {showARMarker && (
                    <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                      {demoData.arMarker.length > 100 
                        ? `${demoData.arMarker.substring(0, 100)}...` 
                        : demoData.arMarker
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description Section */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Περιγραφή Demo Features
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={demoData.description}
                onChange={handleInputChange}
                placeholder="Περιγράψτε τι μπορεί να κάνει το review team με αυτές τις demo πληροφορίες..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Instructions Section */}
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                Οδηγίες Χρήσης για Review Team
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={4}
                value={demoData.instructions}
                onChange={handleInputChange}
                placeholder="Παρέχετε οδηγίες για το πώς το review team θα χρησιμοποιήσει τις demo πληροφορίες..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800">
                  Οι demo πληροφορίες αποθηκεύτηκαν επιτυχώς! Μπορείτε τώρα να τις υποβάλετε στο App Store Connect.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">
                  Παρακαλώ συμπληρώστε τουλάχιστον ένα QR Code ή AR Marker πριν την υποβολή.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <button
                type="button"
                onClick={downloadDemoData}
                disabled={!demoData.qrCode && !demoData.arMarker}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5" />
                <span>Download Demo Data</span>
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || (!demoData.qrCode && !demoData.arMarker)}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Save Demo Information</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Πώς να υποβάλετε στο App Store Connect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Βήμα 1: Είσοδος στο App Store Connect</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Πηγαίνετε στο App Store Connect</li>
                <li>• Επιλέξτε την εφαρμογή σας</li>
                <li>• Κάντε κλικ στην έκδοση που θέλετε να υποβάλετε</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Βήμα 2: App Review Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Κάντε κλικ στο "App Review Information"</li>
                <li>• Στο πεδίο "Notes" εισάγετε τις demo πληροφορίες</li>
                <li>• Ανέβασε QR code ή AR marker images αν χρειάζεται</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoInfo;
