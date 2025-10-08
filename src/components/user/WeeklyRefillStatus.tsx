import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Calendar, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  getUserWeeklyRefillStatus,
  manualTriggerWeeklyRefill,
  WeeklyRefillStatus,
  ManualRefillResult
} from '@/utils/weeklyRefillApi';

const WeeklyRefillStatus: React.FC = () => {
  const [refillStatus, setRefillStatus] = useState<WeeklyRefillStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    loadRefillStatus();
  }, []);

  const loadRefillStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getUserWeeklyRefillStatus();
      setRefillStatus(status);
    } catch (error) {
      console.error('Error loading refill status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTrigger = async () => {
    setIsTriggering(true);
    try {
      const result = await manualTriggerWeeklyRefill();
      if (result?.success) {
        // Reload status to show updated information
        await loadRefillStatus();
      }
    } catch (error) {
      console.error('Error triggering manual refill:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilNextRefill = (nextRefillDate: string) => {
    const today = new Date();
    const nextRefill = new Date(nextRefillDate);
    const diffTime = nextRefill.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: WeeklyRefillStatus) => {
    if (status.is_refill_due) {
      return 'text-orange-600 bg-orange-100';
    } else if (status.current_deposit_amount >= status.target_deposit_amount) {
      return 'text-green-600 bg-green-100';
    } else {
      return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: WeeklyRefillStatus) => {
    if (status.is_refill_due) {
      return <Clock className="h-4 w-4" />;
    } else if (status.current_deposit_amount >= status.target_deposit_amount) {
      return <CheckCircle className="h-4 w-4" />;
    } else {
      return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: WeeklyRefillStatus) => {
    if (status.is_refill_due) {
      return 'Ανανέωση Εκκρεμής';
    } else if (status.current_deposit_amount >= status.target_deposit_amount) {
      return 'Ενημερωμένο';
    } else {
      return 'Σε Αναμονή';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Φόρτωση κατάστασης ανανέωσης...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!refillStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-500">
            <Info className="h-5 w-5 mr-2" />
            Weekly Pilates Refill
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              Δεν έχετε ενεργή Ultimate συνδρομή για εβδομαδιαίες ανανεώσεις Pilates deposits.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysUntilNext = getDaysUntilNextRefill(refillStatus.next_refill_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Weekly Pilates Refill
          </div>
          <Badge className={`flex items-center space-x-1 ${getStatusColor(refillStatus)}`}>
            {getStatusIcon(refillStatus)}
            <span>{getStatusText(refillStatus)}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Package Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{refillStatus.package_name}</h4>
              <p className="text-sm text-gray-600">
                Ενεργοποιήθηκε: {formatDate(refillStatus.activation_date)}
              </p>
            </div>
            <Badge variant="outline">
              Εβδομάδα #{refillStatus.next_refill_week}
            </Badge>
          </div>
        </div>

        {/* Current Deposit Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-900">
              {refillStatus.current_deposit_amount}
            </div>
            <div className="text-sm text-blue-600">Τρέχον Deposits</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-900">
              {refillStatus.target_deposit_amount}
            </div>
            <div className="text-sm text-green-600">Target Deposits</div>
          </div>
        </div>

        {/* Next Refill Information */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
            <span className="font-semibold text-orange-900">Επόμενη Ανανέωση</span>
          </div>
          <div className="text-orange-800">
            <div className="text-lg font-semibold">
              {formatDate(refillStatus.next_refill_date)}
            </div>
            <div className="text-sm">
              {daysUntilNext > 0 ? (
                <>σε {daysUntilNext} {daysUntilNext === 1 ? 'ημέρα' : 'ημέρες'}</>
              ) : daysUntilNext === 0 ? (
                <>Σήμερα!</>
              ) : (
                <>Εκκρεμής</>
              )}
            </div>
          </div>
        </div>

        {/* Manual Trigger Button */}
        {refillStatus.is_refill_due && (
          <div className="text-center">
            <Button
              onClick={handleManualTrigger}
              disabled={isTriggering}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isTriggering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Επεξεργασία...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ενεργοποίηση Ανανέωσης
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Μπορείτε να ενεργοποιήσετε την ανανέωση χειροκίνητα αν είναι εκκρεμής
            </p>
          </div>
        )}

        {/* Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-2">Πληροφορίες Συστήματος</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Η ανανέωση γίνεται αυτόματα κάθε 7 ημέρες από την ενεργοποίηση</li>
            <li>• Το σύστημα κάνει "top-up" στα deposits (max(current, target))</li>
            <li>• Αν έχετε ήδη περισσότερα deposits από το target, δεν αλλάζει τίποτα</li>
            <li>• Η ανανέωση σταματάει όταν λήξει η συνδρομή σας (365 ημέρες)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyRefillStatus;
