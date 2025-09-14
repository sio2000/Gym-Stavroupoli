// QR Membership Test Component
// This component helps test the membership integration

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableQRCategories, getUserActiveMembershipsForQR } from '@/utils/activeMemberships';

const QRMembershipTest: React.FC = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTestData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [membershipData, categoryData] = await Promise.all([
        getUserActiveMembershipsForQR(user.id),
        getAvailableQRCategories(user.id)
      ]);
      
      setMemberships(membershipData);
      setCategories(categoryData);
    } catch (error) {
      console.error('Test data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestData();
  }, [user?.id]);

  if (!user) {
    return <div>Please log in to test</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">QR Membership Integration Test</h2>
      
      <button
        onClick={loadTestData}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Refresh Test Data'}
      </button>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Active Memberships ({memberships.length})</h3>
          {memberships.length > 0 ? (
            <div className="space-y-2">
              {memberships.map((membership, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div><strong>Package:</strong> {membership.packageName}</div>
                  <div><strong>Type:</strong> {membership.packageType}</div>
                  <div><strong>Status:</strong> {membership.status}</div>
                  <div><strong>End Date:</strong> {membership.endDate}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active memberships found</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Available QR Categories ({categories.length})</h3>
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div key={index} className="p-3 bg-green-50 rounded border">
                  <div><strong>Key:</strong> {category.key}</div>
                  <div><strong>Label:</strong> {category.label}</div>
                  <div><strong>Icon:</strong> {category.icon}</div>
                  <div><strong>Package Type:</strong> {category.packageType}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No QR categories available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRMembershipTest;
