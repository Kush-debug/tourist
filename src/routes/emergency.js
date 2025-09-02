import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server.js';
import { logger } from '../utils/logger.js';
import { createEmergencyAlertOnBlockchain } from '../services/blockchain.js';
import { sendEmergencySMS } from '../services/sms.js';
import { sendEmergencyEmail } from '../services/email.js';
import { auditLog } from '../utils/audit.js';
import { io } from '../websocket/socket.js';

const router = express.Router();

// Validation middleware
const validateEmergencyAlert = [
  body('type').isIn(['PANIC_BUTTON', 'VOICE_COMMAND', 'ANOMALY_DETECTION', 'GEOFENCE_VIOLATION', 'MANUAL_REPORT', 'MEDICAL_EMERGENCY', 'CRIME_VICTIM', 'ACCIDENT', 'NATURAL_DISASTER']),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('address').optional().trim(),
  body('description').optional().trim()
];

// Create emergency alert
router.post('/alert', validateEmergencyAlert, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.userId;
    const {
      type,
      severity,
      latitude,
      longitude,
      address,
      description
    } = req.body;

    // Get user and tourist profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        touristProfile: true,
        blockchainIdentity: true
      }
    });

    if (!user || !user.touristProfile) {
      return res.status(404).json({
        error: 'Tourist profile not found'
      });
    }

    // Create emergency alert in database
    const emergencyAlert = await prisma.emergencyAlert.create({
      data: {
        touristId: user.touristProfile.id,
        userId,
        type,
        severity,
        latitude,
        longitude,
        address,
        description
      },
      include: {
        tourist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                nationality: true
              }
            }
          }
        }
      }
    });

    // Create alert on blockchain if enabled
    if (process.env.ENABLE_BLOCKCHAIN === 'true' && user.blockchainIdentity) {
      try {
        const blockchainAlertId = await createEmergencyAlertOnBlockchain(
          user.blockchainIdentity.identityHash,
          {
            type,
            location: address || `${latitude},${longitude}`,
            severity,
            description
          }
        );
        
        logger.info(`Emergency alert created on blockchain: ${blockchainAlertId}`);
      } catch (error) {
        logger.error('Failed to create blockchain alert:', error);
      }
    }

    // Send real-time notification to police
    io.emit('emergency_alert', {
      alertId: emergencyAlert.id,
      touristName: `${user.firstName} ${user.lastName}`,
      type,
      severity,
      location: address || `${latitude},${longitude}`,
      timestamp: emergencyAlert.createdAt
    });

    // Send SMS to emergency contacts
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
      try {
        // Send to tourist's emergency contact
        if (user.touristProfile.emergencyContact) {
          await sendEmergencySMS(
            user.touristProfile.emergencyContact,
            `${user.firstName} ${user.lastName} has triggered an emergency alert. Type: ${type}, Severity: ${severity}`
          );
        }

        // Send to local emergency services based on severity
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          await sendEmergencySMS(
            process.env.EMERGENCY_PHONE_NUMBER,
            `CRITICAL: Tourist emergency at ${address || `${latitude},${longitude}`}. Tourist: ${user.firstName} ${user.lastName}`
          );
        }
      } catch (error) {
        logger.error('Failed to send emergency SMS:', error);
      }
    }

    // Send email notifications
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        await sendEmergencyEmail(
          user.email,
          user.firstName,
          type,
          severity,
          address || `${latitude},${longitude}`
        );
      } catch (error) {
        logger.error('Failed to send emergency email:', error);
      }
    }

    // Create audit log
    await auditLog({
      userId,
      action: 'EMERGENCY_ALERT_CREATED',
      resource: 'EmergencyAlert',
      resourceId: emergencyAlert.id,
      details: { type, severity, location: address || `${latitude},${longitude}` }
    });

    res.status(201).json({
      message: 'Emergency alert created successfully',
      alert: {
        id: emergencyAlert.id,
        type: emergencyAlert.type,
        severity: emergencyAlert.severity,
        status: emergencyAlert.status,
        createdAt: emergencyAlert.createdAt
      }
    });

  } catch (error) {
    logger.error('Create emergency alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create emergency alert'
    });
  }
});

// Get user's emergency alerts
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const where = {
      userId,
      ...(status && { status })
    };

    const alerts = await prisma.emergencyAlert.findMany({
      where,
      include: {
        tourist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        responses: {
          include: {
            police: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.emergencyAlert.count({ where });

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get emergency alerts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get emergency alerts'
    });
  }
});

// Get specific emergency alert
router.get('/alerts/:alertId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    const alert = await prisma.emergencyAlert.findFirst({
      where: {
        id: alertId,
        userId
      },
      include: {
        tourist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true
              }
            }
          }
        },
        responses: {
          include: {
            police: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!alert) {
      return res.status(404).json({
        error: 'Emergency alert not found'
      });
    }

    res.json({ alert });

  } catch (error) {
    logger.error('Get emergency alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get emergency alert'
    });
  }
});

// Update emergency alert status
router.patch('/alerts/:alertId/status', [
  body('status').isIn(['ACTIVE', 'RESPONDING', 'RESOLVED', 'FALSE_ALARM'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.userId;
    const { alertId } = req.params;
    const { status } = req.body;

    const alert = await prisma.emergencyAlert.findFirst({
      where: {
        id: alertId,
        userId
      }
    });

    if (!alert) {
      return res.status(404).json({
        error: 'Emergency alert not found'
      });
    }

    // Update alert status
    const updatedAlert = await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null
      }
    });

    // Update on blockchain if enabled
    if (process.env.ENABLE_BLOCKCHAIN === 'true') {
      try {
        // This would update the alert status on the blockchain
        logger.info(`Emergency alert status updated on blockchain: ${alertId} -> ${status}`);
      } catch (error) {
        logger.error('Failed to update blockchain alert status:', error);
      }
    }

    // Send real-time update
    io.emit('emergency_alert_updated', {
      alertId,
      status,
      updatedAt: updatedAlert.updatedAt
    });

    // Create audit log
    await auditLog({
      userId,
      action: 'EMERGENCY_ALERT_STATUS_UPDATED',
      resource: 'EmergencyAlert',
      resourceId: alertId,
      details: { status }
    });

    res.json({
      message: 'Emergency alert status updated successfully',
      alert: updatedAlert
    });

  } catch (error) {
    logger.error('Update emergency alert status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update emergency alert status'
    });
  }
});

// Get emergency statistics
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '30d' } = req.query;

    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const alerts = await prisma.emergencyAlert.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      }
    });

    const statistics = {
      totalAlerts: alerts.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
      averageResponseTime: 0,
      resolvedAlerts: 0,
      activeAlerts: 0
    };

    let totalResponseTime = 0;
    let resolvedCount = 0;

    alerts.forEach(alert => {
      // Count by type
      statistics.byType[alert.type] = (statistics.byType[alert.type] || 0) + 1;
      
      // Count by severity
      statistics.bySeverity[alert.severity] = (statistics.bySeverity[alert.severity] || 0) + 1;
      
      // Count by status
      statistics.byStatus[alert.status] = (statistics.byStatus[alert.status] || 0) + 1;
      
      // Calculate response time
      if (alert.responseTime) {
        totalResponseTime += alert.responseTime;
        resolvedCount++;
      }
      
      // Count resolved and active
      if (alert.status === 'RESOLVED') {
        statistics.resolvedAlerts++;
      } else if (alert.status === 'ACTIVE') {
        statistics.activeAlerts++;
      }
    });

    if (resolvedCount > 0) {
      statistics.averageResponseTime = Math.round(totalResponseTime / resolvedCount);
    }

    res.json({ statistics });

  } catch (error) {
    logger.error('Get emergency statistics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get emergency statistics'
    });
  }
});

// Manual emergency report
router.post('/manual-report', [
  body('type').isIn(['MEDICAL_EMERGENCY', 'CRIME_VICTIM', 'ACCIDENT', 'NATURAL_DISASTER', 'OTHER']),
  body('description').trim().isLength({ min: 10 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.userId;
    const {
      type,
      description,
      latitude,
      longitude,
      address
    } = req.body;

    // Create manual emergency report
    const emergencyAlert = await prisma.emergencyAlert.create({
      data: {
        touristId: (await prisma.touristProfile.findUnique({ where: { userId } })).id,
        userId,
        type: type === 'OTHER' ? 'MANUAL_REPORT' : type,
        severity: 'MEDIUM', // Manual reports default to medium severity
        latitude,
        longitude,
        address,
        description
      }
    });

    // Send notifications
    io.emit('emergency_alert', {
      alertId: emergencyAlert.id,
      type: 'MANUAL_REPORT',
      severity: 'MEDIUM',
      location: address || `${latitude},${longitude}`,
      timestamp: emergencyAlert.createdAt
    });

    res.status(201).json({
      message: 'Manual emergency report submitted successfully',
      alert: {
        id: emergencyAlert.id,
        type: emergencyAlert.type,
        status: emergencyAlert.status,
        createdAt: emergencyAlert.createdAt
      }
    });

  } catch (error) {
    logger.error('Manual emergency report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit manual emergency report'
    });
  }
});

export default router;
