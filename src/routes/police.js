import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server.js';
import { logger } from '../utils/logger.js';
import { auditLog } from '../utils/audit.js';
import { io } from '../websocket/socket.js';

const router = express.Router();

// Middleware to ensure user is police
const ensurePolice = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { policeProfile: true }
    });

    if (!user || user.role !== 'POLICE' || !user.policeProfile) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only police officers can access this endpoint'
      });
    }

    req.policeProfile = user.policeProfile;
    next();
  } catch (error) {
    logger.error('Police authorization error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify police authorization'
    });
  }
};

// Apply police middleware to all routes
router.use(ensurePolice);

// Get active emergency alerts
router.get('/emergency-alerts', async (req, res) => {
  try {
    const { status = 'ACTIVE', page = 1, limit = 20, severity } = req.query;

    const where = {
      status: status === 'ALL' ? undefined : status,
      ...(severity && { severity })
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
                phone: true,
                email: true,
                nationality: true
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
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
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
router.get('/emergency-alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
      include: {
        tourist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                nationality: true,
                passportNumber: true
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
          },
          orderBy: { createdAt: 'desc' }
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

// Respond to emergency alert
router.post('/emergency-alerts/:alertId/respond', [
  body('status').isIn(['EN_ROUTE', 'ON_SCENE', 'TRANSPORTING', 'COMPLETED', 'CANCELLED']),
  body('estimatedArrival').optional().isISO8601(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { alertId } = req.params;
    const { status, estimatedArrival, notes } = req.body;
    const policeId = req.policeProfile.id;

    // Check if already responding
    const existingResponse = await prisma.emergencyResponse.findFirst({
      where: {
        alertId,
        policeId,
        status: { not: 'COMPLETED' }
      }
    });

    if (existingResponse) {
      return res.status(409).json({
        error: 'Already responding',
        message: 'You are already responding to this emergency'
      });
    }

    // Create response
    const response = await prisma.emergencyResponse.create({
      data: {
        alertId,
        policeId,
        status,
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
        notes
      },
      include: {
        alert: {
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
            }
          }
        },
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
    });

    // Update alert status
    await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: { status: 'RESPONDING' }
    });

    // Send real-time update
    io.emit('emergency_response_created', {
      alertId,
      response: {
        id: response.id,
        status: response.status,
        policeName: `${response.police.user.firstName} ${response.police.user.lastName}`,
        estimatedArrival: response.estimatedArrival,
        createdAt: response.createdAt
      }
    });

    // Create audit log
    await auditLog({
      userId: req.user.userId,
      action: 'EMERGENCY_RESPONSE_CREATED',
      resource: 'EmergencyResponse',
      resourceId: response.id,
      details: { alertId, status, estimatedArrival }
    });

    res.status(201).json({
      message: 'Emergency response created successfully',
      response
    });

  } catch (error) {
    logger.error('Create emergency response error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create emergency response'
    });
  }
});

// Update response status
router.patch('/emergency-responses/:responseId', [
  body('status').isIn(['EN_ROUTE', 'ON_SCENE', 'TRANSPORTING', 'COMPLETED', 'CANCELLED']),
  body('actualArrival').optional().isISO8601(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { responseId } = req.params;
    const { status, actualArrival, notes } = req.body;
    const policeId = req.policeProfile.id;

    // Verify ownership
    const response = await prisma.emergencyResponse.findFirst({
      where: {
        id: responseId,
        policeId
      },
      include: {
        alert: true
      }
    });

    if (!response) {
      return res.status(404).json({
        error: 'Emergency response not found'
      });
    }

    // Update response
    const updatedResponse = await prisma.emergencyResponse.update({
      where: { id: responseId },
      data: {
        status,
        actualArrival: actualArrival ? new Date(actualArrival) : null,
        notes: notes ? `${response.notes || ''}\n${new Date().toISOString()}: ${notes}` : response.notes
      }
    });

    // Update alert status if response is completed
    if (status === 'COMPLETED') {
      await prisma.emergencyAlert.update({
        where: { id: response.alertId },
        data: { 
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });
    }

    // Send real-time update
    io.emit('emergency_response_updated', {
      responseId,
      status,
      actualArrival: updatedResponse.actualArrival,
      updatedAt: updatedResponse.updatedAt
    });

    // Create audit log
    await auditLog({
      userId: req.user.userId,
      action: 'EMERGENCY_RESPONSE_UPDATED',
      resource: 'EmergencyResponse',
      resourceId: responseId,
      details: { status, actualArrival }
    });

    res.json({
      message: 'Emergency response updated successfully',
      response: updatedResponse
    });

  } catch (error) {
    logger.error('Update emergency response error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update emergency response'
    });
  }
});

// Get all tourists with their current status
router.get('/tourists', async (req, res) => {
  try {
    const { status, nationality, page = 1, limit = 50 } = req.query;

    const where = {
      role: 'TOURIST',
      isActive: true,
      ...(status && { touristProfile: { emergencyAlerts: { some: { status } } } }),
      ...(nationality && { nationality })
    };

    const tourists = await prisma.user.findMany({
      where,
      include: {
        touristProfile: {
          include: {
            locations: {
              orderBy: { timestamp: 'desc' },
              take: 1
            },
            emergencyAlerts: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' }
            },
            safetyScores: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.user.count({ where });

    // Calculate safety status for each tourist
    const touristsWithStatus = tourists.map(tourist => {
      const latestLocation = tourist.touristProfile?.locations[0];
      const latestSafetyScore = tourist.touristProfile?.safetyScores[0];
      const activeAlerts = tourist.touristProfile?.emergencyAlerts || [];

      let safetyStatus = 'SAFE';
      if (activeAlerts.length > 0) {
        safetyStatus = 'EMERGENCY';
      } else if (latestSafetyScore && latestSafetyScore.score < 60) {
        safetyStatus = 'CAUTION';
      }

      return {
        id: tourist.id,
        firstName: tourist.firstName,
        lastName: tourist.lastName,
        nationality: tourist.nationality,
        phone: tourist.phone,
        safetyStatus,
        currentLocation: latestLocation ? {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          address: latestLocation.address,
          timestamp: latestLocation.timestamp
        } : null,
        safetyScore: latestSafetyScore?.score || 0,
        activeAlerts: activeAlerts.length,
        lastUpdate: latestLocation?.timestamp || tourist.updatedAt
      };
    });

    res.json({
      tourists: touristsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get tourists error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get tourists'
    });
  }
});

// Get tourist details
router.get('/tourists/:touristId', async (req, res) => {
  try {
    const { touristId } = req.params;

    const tourist = await prisma.user.findFirst({
      where: {
        id: touristId,
        role: 'TOURIST'
      },
      include: {
        touristProfile: {
          include: {
            locations: {
              orderBy: { timestamp: 'desc' },
              take: 10
            },
            emergencyAlerts: {
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            safetyScores: {
              orderBy: { timestamp: 'desc' },
              take: 10
            },
            voiceCommands: {
              orderBy: { processedAt: 'desc' },
              take: 10
            },
            anomalyDetections: {
              orderBy: { detectedAt: 'desc' },
              take: 10
            }
          }
        },
        blockchainIdentity: true
      }
    });

    if (!tourist) {
      return res.status(404).json({
        error: 'Tourist not found'
      });
    }

    res.json({ tourist });

  } catch (error) {
    logger.error('Get tourist details error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get tourist details'
    });
  }
});

// Get police dashboard statistics
router.get('/statistics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    const startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    // Get emergency alerts statistics
    const alerts = await prisma.emergencyAlert.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Get response statistics
    const responses = await prisma.emergencyResponse.findMany({
      where: {
        createdAt: { gte: startDate },
        policeId: req.policeProfile.id
      }
    });

    // Get tourist statistics
    const totalTourists = await prisma.user.count({
      where: {
        role: 'TOURIST',
        isActive: true
      }
    });

    const activeTourists = await prisma.user.count({
      where: {
        role: 'TOURIST',
        isActive: true,
        touristProfile: {
          locations: {
            some: {
              timestamp: { gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
            }
          }
        }
      }
    });

    const statistics = {
      period,
      emergencyAlerts: {
        total: alerts.length,
        byType: {},
        bySeverity: {},
        byStatus: {},
        averageResponseTime: 0
      },
      responses: {
        total: responses.length,
        byStatus: {},
        averageResponseTime: 0
      },
      tourists: {
        total: totalTourists,
        active: activeTourists,
        withActiveAlerts: alerts.filter(a => a.status === 'ACTIVE').length
      }
    };

    // Calculate alert statistics
    alerts.forEach(alert => {
      statistics.emergencyAlerts.byType[alert.type] = 
        (statistics.emergencyAlerts.byType[alert.type] || 0) + 1;
      statistics.emergencyAlerts.bySeverity[alert.severity] = 
        (statistics.emergencyAlerts.bySeverity[alert.severity] || 0) + 1;
      statistics.emergencyAlerts.byStatus[alert.status] = 
        (statistics.emergencyAlerts.byStatus[alert.status] || 0) + 1;
    });

    // Calculate response statistics
    responses.forEach(response => {
      statistics.responses.byStatus[response.status] = 
        (statistics.responses.byStatus[response.status] || 0) + 1;
    });

    // Calculate average response times
    const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED' && a.responseTime);
    if (resolvedAlerts.length > 0) {
      const totalResponseTime = resolvedAlerts.reduce((sum, alert) => sum + alert.responseTime, 0);
      statistics.emergencyAlerts.averageResponseTime = Math.round(totalResponseTime / resolvedAlerts.length);
    }

    const completedResponses = responses.filter(r => r.status === 'COMPLETED' && r.actualArrival);
    if (completedResponses.length > 0) {
      const totalResponseTime = completedResponses.reduce((sum, response) => {
        return sum + (response.actualArrival - response.createdAt) / 1000;
      }, 0);
      statistics.responses.averageResponseTime = Math.round(totalResponseTime / completedResponses.length);
    }

    res.json({ statistics });

  } catch (error) {
    logger.error('Get police statistics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get police statistics'
    });
  }
});

// Update police duty status
router.patch('/duty-status', [
  body('isOnDuty').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { isOnDuty } = req.body;

    const updatedProfile = await prisma.policeProfile.update({
      where: { id: req.policeProfile.id },
      data: { isOnDuty }
    });

    // Send real-time update
    io.emit('police_duty_status_updated', {
      policeId: req.policeProfile.id,
      isOnDuty,
      updatedAt: updatedProfile.updatedAt
    });

    // Create audit log
    await auditLog({
      userId: req.user.userId,
      action: 'POLICE_DUTY_STATUS_UPDATED',
      resource: 'PoliceProfile',
      resourceId: req.policeProfile.id,
      details: { isOnDuty }
    });

    res.json({
      message: 'Duty status updated successfully',
      isOnDuty: updatedProfile.isOnDuty
    });

  } catch (error) {
    logger.error('Update duty status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update duty status'
    });
  }
});

export default router;
