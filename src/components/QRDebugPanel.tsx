import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserActiveMembershipsForQR } from '@/utils/activeMemberships';
import { generateQRCode } from '@/utils/qrSystem';

/**
 * QR Debug Panel - Development tool for testing QR categories
 * This component helps debug QR code generation for all categories
 */
const QRDebugPanel: React.FC = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const loadMemberships = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await getUserActiveMembershipsForQR(user.id);
      setMemberships(data);
      console.log('[QRDebug] Loaded memberships:', data);
    } catch (error) {
      console.error('[QRDebug] Error loading memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const testQRGeneration = async (category: 'free_gym' | 'pilates' | 'personal') => {
    if (!user?.id) return;
    
    const testMessage = `Testing QR generation for ${category}...`;
    setTestResults(prev => [...prev, testMessage]);
    
    try {
      const { qrCode, qrData } = await generateQRCode(user.id, category);
      const successMessage = `✅ ${category}: QR generated successfully (ID: ${qrCode.id})`;
      setTestResults(prev => [...prev, successMessage]);
      console.log(`[QRDebug] ${category} success:`, { qrCode, qrData });
    } catch (error) {
      const errorMessage = `❌ ${category}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setTestResults(prev => [...prev, errorMessage]);
      console.error(`[QRDebug] ${category} error:`, error);
    }
  };

  const testAllCategories = async () => {
    setTestResults([]);
    const categories: ('free_gym' | 'pilates' | 'personal')[] = ['free_gym', 'pilates', 'personal'];
    
    for (const category of categories) {
      await testQRGeneration(category);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    loadMemberships();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to use the QR Debug Panel</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">QR Debug Panel</h3>
      
      {/* User Info */}
      <div className="bg-white p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      {/* Active Memberships */}
      <div className="bg-white p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Active Memberships</h4>
          <button
            onClick={loadMemberships}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {memberships.length > 0 ? (
          <div className="space-y-2">
            {memberships.map((membership, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <p><strong>Package:</strong> {membership.packageName}</p>
                <p><strong>Type:</strong> {membership.packageType}</p>
                <p><strong>Status:</strong> {membership.status}</p>
                <p><strong>End Date:</strong> {membership.endDate}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active memberships found</p>
        )}
      </div>

      {/* QR Generation Tests */}
      <div className="bg-white p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">QR Generation Tests</h4>
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => testQRGeneration('free_gym')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Test Free Gym
          </button>
          <button
            onClick={() => testQRGeneration('pilates')}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            Test Pilates
          </button>
          <button
            onClick={() => testQRGeneration('personal')}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
          >
            Test Personal
          </button>
          <button
            onClick={testAllCategories}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Test All
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-50 p-3 rounded">
            <h5 className="font-medium text-gray-900 mb-2">Test Results:</h5>
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <p key={index} className="text-sm font-mono">
                  {result}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How to Use</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Refresh" to load current memberships</li>
          <li>• Click individual test buttons to test specific categories</li>
          <li>• Click "Test All" to test all categories sequentially</li>
          <li>• Check the results to see which categories work</li>
          <li>• Use browser console for detailed debugging information</li>
        </ul>
      </div>
    </div>
  );
};

export default QRDebugPanel;
