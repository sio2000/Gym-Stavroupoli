/**
 * USER PROFILE MONITORING SERVICE
 * Monitoring και alerting για user profile creation failures
 */

import { supabase } from '../lib/supabase';
import { ProfileStats } from './UserProfileService';

export interface AlertConfig {
  failureThreshold: number; // Number of failures to trigger alert
  timeWindowMinutes: number; // Time window to check for failures
  successRateThreshold: number; // Minimum success rate percentage
}

export interface Alert {
  type: 'failure_rate' | 'success_rate' | 'missing_profiles';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
}

class UserProfileMonitoring {
  private readonly DEFAULT_ALERT_CONFIG: AlertConfig = {
    failureThreshold: 5,
    timeWindowMinutes: 60,
    successRateThreshold: 95
  };

  /**
   * Check for profile creation failures and generate alerts
   */
  async checkForAlerts(config: AlertConfig = this.DEFAULT_ALERT_CONFIG): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Check recent failures
      const recentFailures = await this.getRecentFailures(config.timeWindowMinutes);
      
      if (recentFailures.length >= config.failureThreshold) {
        alerts.push({
          type: 'failure_rate',
          severity: this.getSeverityLevel(recentFailures.length),
          message: `High profile creation failure rate: ${recentFailures.length} failures in last ${config.timeWindowMinutes} minutes`,
          data: {
            failureCount: recentFailures.length,
            timeWindow: config.timeWindowMinutes,
            failures: recentFailures
          },
          timestamp: new Date()
        });
      }

      // Check success rate
      const stats = await this.getProfileStats();
      if (stats && stats.successRate < config.successRateThreshold) {
        alerts.push({
          type: 'success_rate',
          severity: stats.successRate < 90 ? 'critical' : 'high',
          message: `Low profile creation success rate: ${stats.successRate}% (threshold: ${config.successRateThreshold}%)`,
          data: {
            successRate: stats.successRate,
            threshold: config.successRateThreshold,
            totalAuthUsers: stats.totalAuthUsers,
            totalProfiles: stats.totalProfiles
          },
          timestamp: new Date()
        });
      }

      // Check for missing profiles
      if (stats && stats.missingProfiles > 0) {
        const severity = stats.missingProfiles > 50 ? 'critical' : 
                        stats.missingProfiles > 20 ? 'high' : 'medium';
        
        alerts.push({
          type: 'missing_profiles',
          severity,
          message: `${stats.missingProfiles} users missing profiles (${stats.totalAuthUsers} total users)`,
          data: {
            missingProfiles: stats.missingProfiles,
            totalAuthUsers: stats.totalAuthUsers,
            percentage: Math.round((stats.missingProfiles / stats.totalAuthUsers) * 100)
          },
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('[UserProfileMonitoring] Error checking alerts:', error);
      
      alerts.push({
        type: 'failure_rate',
        severity: 'critical',
        message: `Monitoring system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Get recent profile creation failures
   */
  async getRecentFailures(timeWindowMinutes: number = 60): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_profile_audit_logs')
        .select('*')
        .eq('action', 'failed')
        .gte('created_at', new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[UserProfileMonitoring] Error getting recent failures:', error);
      return [];
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(): Promise<ProfileStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile_stats');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[UserProfileMonitoring] Error getting profile stats:', error);
      return null;
    }
  }

  /**
   * Get detailed failure analysis
   */
  async getFailureAnalysis(timeWindowHours: number = 24): Promise<any> {
    try {
      const timeWindowMs = timeWindowHours * 60 * 60 * 1000;
      const startTime = new Date(Date.now() - timeWindowMs).toISOString();

      // Get all audit logs in time window
      const { data: logs, error } = await supabase
        .from('user_profile_audit_logs')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Analyze the data
      const analysis = {
        timeWindow: `${timeWindowHours} hours`,
        totalAttempts: logs?.length || 0,
        successes: logs?.filter(log => log.action === 'created').length || 0,
        failures: logs?.filter(log => log.action === 'failed').length || 0,
        skipped: logs?.filter(log => log.action === 'skipped').length || 0,
        successRate: 0,
        failureReasons: {} as Record<string, number>,
        origins: {} as Record<string, number>,
        hourlyBreakdown: {} as Record<string, any>
      };

      if (analysis.totalAttempts > 0) {
        analysis.successRate = Math.round((analysis.successes / analysis.totalAttempts) * 100);
      }

      // Count failure reasons
      logs?.filter(log => log.action === 'failed').forEach(log => {
        const reason = log.error_message || 'Unknown';
        analysis.failureReasons[reason] = (analysis.failureReasons[reason] || 0) + 1;
      });

      // Count origins
      logs?.forEach(log => {
        const origin = log.origin || 'unknown';
        analysis.origins[origin] = (analysis.origins[origin] || 0) + 1;
      });

      // Hourly breakdown
      logs?.forEach(log => {
        const hour = new Date(log.created_at).getHours();
        const hourKey = `${hour}:00`;
        
        if (!analysis.hourlyBreakdown[hourKey]) {
          analysis.hourlyBreakdown[hourKey] = { attempts: 0, successes: 0, failures: 0 };
        }
        
        analysis.hourlyBreakdown[hourKey].attempts++;
        if (log.action === 'created') analysis.hourlyBreakdown[hourKey].successes++;
        if (log.action === 'failed') analysis.hourlyBreakdown[hourKey].failures++;
      });

      return analysis;

    } catch (error) {
      console.error('[UserProfileMonitoring] Error getting failure analysis:', error);
      return null;
    }
  }

  /**
   * Send alert (placeholder - implement actual alerting system)
   */
  async sendAlert(alert: Alert): Promise<void> {
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}] ${alert.type.toUpperCase()}: ${alert.message}`);
    console.log('Alert data:', alert.data);
    
    // TODO: Implement actual alerting
    // - Send to Slack/Discord webhook
    // - Send email notification
    // - Send SMS for critical alerts
    // - Log to external monitoring service (DataDog, New Relic, etc.)
    
    // For now, just log to console
    this.logAlert(alert);
  }

  /**
   * Log alert to console with formatting
   */
  private logAlert(alert: Alert): void {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };

    const emoji = severityEmoji[alert.severity];
    const timestamp = alert.timestamp.toISOString();
    
    console.log(`\n${emoji} USER PROFILE ALERT ${emoji}`);
    console.log(`Type: ${alert.type}`);
    console.log(`Severity: ${alert.severity.toUpperCase()}`);
    console.log(`Time: ${timestamp}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Data:`, JSON.stringify(alert.data, null, 2));
    console.log(`${'='.repeat(50)}\n`);
  }

  /**
   * Get severity level based on failure count
   */
  private getSeverityLevel(failureCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (failureCount >= 20) return 'critical';
    if (failureCount >= 10) return 'high';
    if (failureCount >= 5) return 'medium';
    return 'low';
  }

  /**
   * Run monitoring check and send alerts
   */
  async runMonitoringCheck(config?: AlertConfig): Promise<void> {
    console.log('[UserProfileMonitoring] Running monitoring check...');
    
    const alerts = await this.checkForAlerts(config);
    
    if (alerts.length === 0) {
      console.log('[UserProfileMonitoring] ✅ No alerts to send');
      return;
    }

    console.log(`[UserProfileMonitoring] 🚨 Found ${alerts.length} alerts`);
    
    // Send all alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(): Promise<any> {
    try {
      const [stats, recentFailures, analysis] = await Promise.all([
        this.getProfileStats(),
        this.getRecentFailures(60), // Last hour
        this.getFailureAnalysis(24) // Last 24 hours
      ]);

      return {
        stats,
        recentFailures: recentFailures.length,
        analysis,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[UserProfileMonitoring] Error getting dashboard data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userProfileMonitoring = new UserProfileMonitoring();
export default userProfileMonitoring;
