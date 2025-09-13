// @ts-nocheck
// QR System API Endpoints
// Feature Flag: FEATURE_QR_SYSTEM
// Handles QR code generation, validation, and management

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/config/supabase';
import { 
  generateQRCode, 
  validateQRCode, 
  getUserQRCodes, 
  getScanAuditLogs,
  revokeQRCode,
  isQRSystemEnabled 
} from '@/utils/qrSystem';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Helper to get client IP
function getClientIP(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    '127.0.0.1'
  );
}

// Helper to check authentication
async function checkAuth(req: NextApiRequest, allowedRoles: string[] = []): Promise<{ user: any; error?: string }> {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return { user: null, error: 'Unauthorized' };
    }

    // Get user profile with role
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error || !userProfile) {
      return { user: null, error: 'User profile not found' };
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
      return { user: null, error: 'Insufficient permissions' };
    }

    return { user: { ...session.user, role: userProfile.role } };
  } catch (error) {
    console.error('Auth check error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// POST /api/qr/generate - Generate QR code for user
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API/QR] Incoming request', {
    method: req.method,
    query: req.query,
    path: req.url,
  });
  if (req.method === 'POST') {
    return handleGenerateQR(req, res);
  } else if (req.method === 'GET' && req.query.action === 'validate') {
    return handleValidateQR(req, res);
  } else if (req.method === 'POST' && req.query.action === 'mark-exit') {
    return handleMarkExit(req, res);
  } else if (req.method === 'GET' && req.query.action === 'user-codes') {
    return handleGetUserQRCodes(req, res);
  } else if (req.method === 'GET' && req.query.action === 'audit-logs') {
    return handleGetAuditLogs(req, res);
  } else if (req.method === 'DELETE') {
    return handleRevokeQR(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Generate QR code
async function handleGenerateQR(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Check authentication (admin or trainer only)
    const { user, error: authError } = await checkAuth(req, ['admin', 'trainer']);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Check if QR system is enabled
    const isEnabled = await isQRSystemEnabled();
    if (!isEnabled) {
      return res.status(503).json({ error: 'QR system is not enabled' });
    }

    const { userId, category, expiresAt } = req.body;
    console.log('[API/QR] Generate input', { userId, category, expiresAt });

    if (!userId || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['free_gym', 'pilates', 'personal'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const { qrCode, qrData } = await generateQRCode(
      userId,
      category,
      expiresAt ? new Date(expiresAt) : undefined
    );
    console.log('[API/QR] Generate success', {
      qrId: qrCode?.id,
      category: qrCode?.category,
      tokenLen: (qrData || '').length,
      tokenSample: (qrData || '').slice(0, 32),
    });

    res.status(200).json({
      success: true,
      qrCode,
      qrData,
      qrImageUrl: `data:image/svg+xml;base64,${Buffer.from(generateQRImage(qrData)).toString('base64')}`,
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Validate QR code
async function handleValidateQR(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Check authentication (secretary only)
    const { user, error: authError } = await checkAuth(req, ['secretary']);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Check if QR system is enabled
    const isEnabled = await isQRSystemEnabled();
    if (!isEnabled) {
      return res.status(503).json({ error: 'QR system is not enabled' });
    }

    const { qrData, scanType } = req.query;
    console.log('[API/QR] Validate input', { scanType, qrDataLen: (qrData as string)?.length, sample: (qrData as string)?.slice?.(0, 50) });

    if (!qrData || !scanType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!['entrance', 'exit'].includes(scanType as string)) {
      return res.status(400).json({ error: 'Invalid scan type' });
    }

    const result = await validateQRCode(
      qrData as string,
      scanType as 'entrance' | 'exit',
      user.id,
      clientIP,
      req.headers['user-agent']
    );
    console.log('[API/QR] Validate result', result);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Validate QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Mark exit
async function handleMarkExit(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Check authentication (secretary only)
    const { user, error: authError } = await checkAuth(req, ['secretary']);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    const { qrId } = req.body;

    if (!qrId) {
      return res.status(400).json({ error: 'Missing QR ID' });
    }

    // Log exit scan
    await logScanAttempt({
      qr_id: qrId,
      user_id: req.body.userId,
      secretary_id: user.id,
      scan_type: 'exit',
      result: 'approved',
      reason: 'manual_exit',
      ip_address: clientIP,
      user_agent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark exit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user QR codes
async function handleGetUserQRCodes(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const { user, error: authError } = await checkAuth(req);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    const userId = req.query.userId as string || user.id;
    
    // Check if user can access these QR codes
    if (user.role !== 'admin' && user.role !== 'trainer' && user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const qrCodes = await getUserQRCodes(userId);

    res.status(200).json({
      success: true,
      qrCodes,
    });
  } catch (error) {
    console.error('Get user QR codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get audit logs
async function handleGetAuditLogs(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication (admin or secretary only)
    const { user, error: authError } = await checkAuth(req, ['admin', 'secretary']);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const auditLogs = await getScanAuditLogs(
      user.role === 'secretary' ? user.id : undefined,
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      auditLogs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Revoke QR code
async function handleRevokeQR(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication (admin or trainer only)
    const { user, error: authError } = await checkAuth(req, ['admin', 'trainer']);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    const { qrId } = req.body;

    if (!qrId) {
      return res.status(400).json({ error: 'Missing QR ID' });
    }

    await revokeQRCode(qrId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Revoke QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to generate QR image (SVG)
function generateQRImage(qrData: string): string {
  // Simple QR code generation - in production, use a proper QR library
  const size = 200;
  const modules = 25; // 25x25 grid
  
  // This is a simplified version - use qrcode library in production
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="white"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="10">
        QR: ${qrData.substring(0, 20)}...
      </text>
    </svg>
  `;
}

// Helper function to log scan attempt
async function logScanAttempt(logData: any): Promise<void> {
  try {
    await supabase
      .from('scan_audit_logs')
      .insert({
        ...logData,
        scanned_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error logging scan attempt:', error);
  }
}
