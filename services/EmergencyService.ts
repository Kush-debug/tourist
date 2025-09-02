import { apiService } from './ApiService';
import { locationService } from './LocationService';
import { blockchainService } from './BlockchainService';

export interface EmergencyAlert {
  id: number;
  tourist_id: number;
  alert_type: 'panic' | 'anomaly' | 'geofence' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location_lat: number;
  location_lng: number;
  location_address: string;
  description: string;
  status: 'active' | 'responding' | 'resolved';
  response_time?: number;
  created_at: string;
  resolved_at?: string;
  tourist_name?: string;
  phone_number?: string;
  nationality?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

class EmergencyService {
  private emergencyContacts: EmergencyContact[] = [];
  private isEmergencyMode = false;
  private emergencyTimeout: NodeJS.Timeout | null = null;
  private onEmergencyAlert?: (alert: EmergencyAlert) => void;
  private onEmergencyResolved?: (alertId: number) => void;

  // Initialize emergency service
  async initialize(): Promise<void> {
    // Load emergency contacts from localStorage
    const savedContacts = localStorage.getItem('emergency_contacts');
    if (savedContacts) {
      this.emergencyContacts = JSON.parse(savedContacts);
    }

    // Set up default emergency contacts if none exist
    if (this.emergencyContacts.length === 0) {
      this.emergencyContacts = [
        { name: 'Police', phone: '100', relationship: 'Emergency Services', priority: 1 },
        { name: 'Medical Emergency', phone: '102', relationship: 'Emergency Services', priority: 2 },
        { name: 'Tourist Helpline', phone: '1363', relationship: 'Tourist Services', priority: 3 }
      ];
      this.saveEmergencyContacts();
    }
  }

  // Trigger panic button emergency
  async triggerPanicAlert(description?: string): Promise<boolean> {
    try {
      const location = locationService.getLastLocation();
      if (!location) {
        throw new Error('Location not available');
      }

      const alert = await apiService.createEmergencyAlert({
        alert_type: 'panic',
        severity: 'critical',
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        description: description || 'Emergency panic button activated'
      });

      this.isEmergencyMode = true;
      this.onEmergencyAlert?.(alert);

      // Notify emergency contacts
      await this.notifyEmergencyContacts(alert);

      // Create blockchain transaction
      const userProfile = await apiService.getUserProfile();
      if (userProfile.blockchain_wallet) {
        const transaction = blockchainService.createEmergencyTransaction(
          {
            address: userProfile.blockchain_wallet,
            privateKey: '', // This would be stored securely
            publicKey: ''
          },
          'panic',
          { lat: location.lat, lng: location.lng },
          description || 'Emergency panic button activated'
        );
        console.log('Emergency blockchain transaction created:', transaction);
      }

      return true;
    } catch (error) {
      console.error('Failed to trigger panic alert:', error);
      return false;
    }
  }

  // Trigger manual emergency alert
  async triggerManualAlert(
    alertType: 'panic' | 'anomaly' | 'geofence' | 'manual',
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<boolean> {
    try {
      const location = locationService.getLastLocation();
      if (!location) {
        throw new Error('Location not available');
      }

      const alert = await apiService.createEmergencyAlert({
        alert_type: alertType,
        severity,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        description
      });

      this.onEmergencyAlert?.(alert);

      // Notify emergency contacts if severity is high or critical
      if (severity === 'high' || severity === 'critical') {
        await this.notifyEmergencyContacts(alert);
      }

      return true;
    } catch (error) {
      console.error('Failed to trigger manual alert:', error);
      return false;
    }
  }

  // Get all emergency alerts
  async getEmergencyAlerts(status?: string): Promise<EmergencyAlert[]> {
    try {
      return await apiService.getEmergencyAlerts(status);
    } catch (error) {
      console.error('Failed to get emergency alerts:', error);
      return [];
    }
  }

  // Update emergency alert status
  async updateAlertStatus(
    alertId: number,
    status: 'active' | 'responding' | 'resolved',
    responseTime?: number
  ): Promise<boolean> {
    try {
      await apiService.updateEmergencyAlertStatus(alertId, status, responseTime);
      
      if (status === 'resolved') {
        this.onEmergencyResolved?.(alertId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update alert status:', error);
      return false;
    }
  }

  // Add emergency contact
  addEmergencyContact(contact: EmergencyContact): void {
    this.emergencyContacts.push(contact);
    this.emergencyContacts.sort((a, b) => a.priority - b.priority);
    this.saveEmergencyContacts();
  }

  // Remove emergency contact
  removeEmergencyContact(index: number): void {
    this.emergencyContacts.splice(index, 1);
    this.saveEmergencyContacts();
  }

  // Update emergency contact
  updateEmergencyContact(index: number, contact: EmergencyContact): void {
    this.emergencyContacts[index] = contact;
    this.emergencyContacts.sort((a, b) => a.priority - b.priority);
    this.saveEmergencyContacts();
  }

  // Get emergency contacts
  getEmergencyContacts(): EmergencyContact[] {
    return [...this.emergencyContacts];
  }

  // Save emergency contacts to localStorage
  private saveEmergencyContacts(): void {
    localStorage.setItem('emergency_contacts', JSON.stringify(this.emergencyContacts));
  }

  // Notify emergency contacts
  private async notifyEmergencyContacts(alert: EmergencyAlert): Promise<void> {
    // In a real implementation, this would send SMS, email, or push notifications
    console.log('Notifying emergency contacts:', this.emergencyContacts);
    console.log('Emergency alert:', alert);

    // For demo purposes, we'll just log the notifications
    this.emergencyContacts.forEach(contact => {
      console.log(`Notifying ${contact.name} (${contact.phone}): Emergency alert at ${alert.location_address}`);
    });
  }

  // Set up emergency callbacks
  setEmergencyCallbacks(
    onEmergencyAlert?: (alert: EmergencyAlert) => void,
    onEmergencyResolved?: (alertId: number) => void
  ): void {
    this.onEmergencyAlert = onEmergencyAlert;
    this.onEmergencyResolved = onEmergencyResolved;
  }

  // Check if in emergency mode
  isInEmergencyMode(): boolean {
    return this.isEmergencyMode;
  }

  // Exit emergency mode
  exitEmergencyMode(): void {
    this.isEmergencyMode = false;
    if (this.emergencyTimeout) {
      clearTimeout(this.emergencyTimeout);
      this.emergencyTimeout = null;
    }
  }

  // Auto-trigger emergency based on location
  async checkLocationBasedEmergency(location: any): Promise<void> {
    const safetyZones = locationService.getSafetyZones();
    
    safetyZones.forEach(zone => {
      if (zone.type === 'danger') {
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          zone.center.lat,
          zone.center.lng
        );

        if (distance <= zone.radius) {
          // Auto-trigger emergency if in danger zone
          this.triggerManualAlert(
            'geofence',
            'high',
            `Entered danger zone: ${zone.name} - ${zone.description}`
          );
        }
      }
    });
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Get emergency statistics
  async getEmergencyStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    averageResponseTime: number;
  }> {
    try {
      const allAlerts = await this.getEmergencyAlerts();
      const activeAlerts = await this.getEmergencyAlerts('active');
      const resolvedAlerts = allAlerts.filter(alert => alert.status === 'resolved');
      
      const totalResponseTime = resolvedAlerts.reduce((sum, alert) => 
        sum + (alert.response_time || 0), 0);
      const averageResponseTime = resolvedAlerts.length > 0 ? 
        totalResponseTime / resolvedAlerts.length : 0;

      return {
        totalAlerts: allAlerts.length,
        activeAlerts: activeAlerts.length,
        resolvedAlerts: resolvedAlerts.length,
        averageResponseTime
      };
    } catch (error) {
      console.error('Failed to get emergency stats:', error);
      return {
        totalAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        averageResponseTime: 0
      };
    }
  }

  // Simulate emergency response (for demo purposes)
  async simulateEmergencyResponse(alertId: number): Promise<void> {
    // Simulate response time
    const responseTime = Math.floor(Math.random() * 300) + 60; // 1-6 minutes
    
    setTimeout(async () => {
      await this.updateAlertStatus(alertId, 'responding', responseTime);
      
      // Simulate resolution after another delay
      setTimeout(async () => {
        await this.updateAlertStatus(alertId, 'resolved', responseTime);
      }, Math.floor(Math.random() * 600) + 300); // 5-15 minutes
    }, 1000);
  }
}

export const emergencyService = new EmergencyService();
export default emergencyService;
