import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Play, 
  Settings, 
  History, 
  Users, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  processWeeklyRefills,
  getWeeklyRefillStats,
  getAllRefillRecords,
  toggleWeeklyRefillFeature,
  WeeklyRefillStatus,
  RefillResult,
  ManualRefillResult
} from '@/utils/weeklyRefillApi';

interface WeeklyRefillRecord {
  id: string;
  user_id: string;
  package_name: string;
  activation_date: string;
  refill_date: string;
  refill_week_number: number;
  target_deposit_amount: number;
  previous_deposit_amount: number;
  new_deposit_amount: number;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const WeeklyRefillManager: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [refillRecords, setRefillRecords] = useState<WeeklyRefillRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, recordsData] = await Promise.all([
        getWeeklyRefillStats(),
        getAllRefillRecords(100)
      ]);
      
      setStats(statsData);
      setRefillRecords(recordsData);
      setFeatureEnabled(statsData?.feature_enabled || false);
    } catch (error) {
      console.error('Error loading weekly refill data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRefills = async () => {
    setIsProcessing(true);
    try {
      const result = await processWeeklyRefills();
      if (result) {
        // Reload data to show updated stats
        await loadData();
      }
    } catch (error) {
      console.error('Error processing refills:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFeature = async (enabled: boolean) => {
    try {
      const success = await toggleWeeklyRefillFeature(enabled);
      if (success) {
        setFeatureEnabled(enabled);
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatGreekDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Φόρτωση δεδομένων...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Pilates Refill Manager</h2>
          <p className="text-gray-600">Διαχείριση εβδομαδιαίων ανανεώσεων Pilates deposits</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Feature Enabled:</span>
            <Switch
              checked={featureEnabled}
              onCheckedChange={handleToggleFeature}
              disabled={isProcessing}
            />
          </div>
          <Button
            onClick={handleProcessRefills}
            disabled={isProcessing || !featureEnabled}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Επεξεργασία...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Επεξεργασία Refills
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Σήμερα</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.today_refills || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Αυτή την εβδομάδα</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.week_refills || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Συνολικές εγγραφές</p>
                <p className="text-2xl font-bold text-gray-900">
                  {refillRecords.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Κατάσταση</p>
                <Badge variant={featureEnabled ? "default" : "secondary"}>
                  {featureEnabled ? 'Ενεργό' : 'Ανενεργό'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Ιστορικό Ανανεώσεων</TabsTrigger>
          <TabsTrigger value="info">Πληροφορίες Συστήματος</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Πρόσφατες Ανανεώσεις
              </CardTitle>
            </CardHeader>
            <CardContent>
              {refillRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Δεν υπάρχουν εγγραφές ανανεώσεων</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Χρήστης
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Εβδομάδα
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deposits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ημερομηνία
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {refillRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.user_profiles.first_name} {record.user_profiles.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.user_profiles.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={record.package_name === 'Ultimate' ? 'default' : 'secondary'}>
                              {record.package_name}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{record.refill_week_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {record.previous_deposit_amount} → {record.new_deposit_amount}
                            </div>
                            <div className="text-sm text-gray-500">
                              Target: {record.target_deposit_amount}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(record.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Πληροφορίες Συστήματος</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ultimate Package (500€)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Εβδομαδιαία ανανέωση: 3 Pilates lessons</li>
                    <li>• Top-up logic: max(current, 3)</li>
                    <li>• Διάρκεια: 365 ημέρες</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ultimate Medium Package (400€)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Εβδομαδιαία ανανέωση: 1 Pilates lesson</li>
                    <li>• Top-up logic: max(current, 1)</li>
                    <li>• Διάρκεια: 365 ημέρες</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Λειτουργία Συστήματος</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Το σύστημα τρέχει ημερησίως και ελέγχει για ανανεώσεις</li>
                  <li>• Ανανεώσεις γίνονται κάθε 7 ημέρες από την activation date</li>
                  <li>• Το σύστημα είναι idempotent (ασφαλές για πολλαπλές εκτελέσεις)</li>
                  <li>• Όλες οι λειτουργίες είναι atomic και με transaction safety</li>
                  <li>• Υπάρχει feature flag για enable/disable χωρίς code rollback</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WeeklyRefillManager;
