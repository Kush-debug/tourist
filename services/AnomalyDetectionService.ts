import { locationService } from './LocationService';
import { emergencyService } from './EmergencyService';

export interface AnomalyPattern {
  id: string;
  type: 'movement' | 'location' | 'time' | 'behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  timestamp: number;
  location?: { lat: number; lng: number };
}

export interface MovementData {
  timestamp: number;
  lat: number;
  lng: number;
  speed?: number;
  accuracy?: number;
}

export interface UserBehaviorProfile {
  averageSpeed: number;
  commonLocations: Array<{ lat: number; lng: number; frequency: number }>;
  typicalHours: number[];
  movementPatterns: string[];
}

class AnomalyDetectionService {
  private movementHistory: MovementData[] = [];
  private behaviorProfile: UserBehaviorProfile | null = null;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private onAnomalyDetected?: (anomaly: AnomalyPattern) => void;
  private onEmergencyTriggered?: () => void;

  // Initialize anomaly detection
  async initialize(): Promise<void> {
    // Load movement history from localStorage
    const savedHistory = localStorage.getItem('movement_history');
    if (savedHistory) {
      this.movementHistory = JSON.parse(savedHistory);
    }

    // Load behavior profile
    const savedProfile = localStorage.getItem('behavior_profile');
    if (savedProfile) {
      this.behaviorProfile = JSON.parse(savedProfile);
    }

    // Generate initial behavior profile if none exists
    if (!this.behaviorProfile && this.movementHistory.length > 0) {
      this.generateBehaviorProfile();
    }
  }

  // Start monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.analyzeCurrentMovement();
    }, 30000);

    console.log('Anomaly detection monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Anomaly detection monitoring stopped');
  }

  // Add movement data point
  addMovementData(data: MovementData): void {
    this.movementHistory.push(data);
    
    // Keep only last 1000 data points
    if (this.movementHistory.length > 1000) {
      this.movementHistory = this.movementHistory.slice(-1000);
    }

    // Save to localStorage
    localStorage.setItem('movement_history', JSON.stringify(this.movementHistory));

    // Update behavior profile periodically
    if (this.movementHistory.length % 50 === 0) {
      this.generateBehaviorProfile();
    }
  }

  // Analyze current movement
  private async analyzeCurrentMovement(): Promise<void> {
    const currentLocation = locationService.getLastLocation();
    if (!currentLocation) return;

    const currentMovement: MovementData = {
      timestamp: Date.now(),
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      accuracy: currentLocation.accuracy
    };

    // Calculate speed if we have previous location
    if (this.movementHistory.length > 0) {
      const lastMovement = this.movementHistory[this.movementHistory.length - 1];
      const distance = this.calculateDistance(
        lastMovement.lat,
        lastMovement.lng,
        currentMovement.lat,
        currentMovement.lng
      );
      const timeDiff = (currentMovement.timestamp - lastMovement.timestamp) / 1000; // seconds
      currentMovement.speed = timeDiff > 0 ? distance / timeDiff : 0; // m/s
    }

    this.addMovementData(currentMovement);

    // Detect anomalies
    const anomalies = await this.detectAnomalies(currentMovement);
    
    for (const anomaly of anomalies) {
      this.onAnomalyDetected?.(anomaly);
      
      // Trigger emergency for critical anomalies
      if (anomaly.severity === 'critical') {
        await this.handleCriticalAnomaly(anomaly);
      }
    }
  }

  // Detect anomalies in movement data
  private async detectAnomalies(currentMovement: MovementData): Promise<AnomalyPattern[]> {
    const anomalies: AnomalyPattern[] = [];

    if (!this.behaviorProfile) {
      return anomalies;
    }

    // Speed anomaly detection
    if (currentMovement.speed !== undefined) {
      const speedAnomaly = this.detectSpeedAnomaly(currentMovement.speed);
      if (speedAnomaly) {
        anomalies.push(speedAnomaly);
      }
    }

    // Location anomaly detection
    const locationAnomaly = this.detectLocationAnomaly(currentMovement);
    if (locationAnomaly) {
      anomalies.push(locationAnomaly);
    }

    // Time-based anomaly detection
    const timeAnomaly = this.detectTimeAnomaly(currentMovement);
    if (timeAnomaly) {
      anomalies.push(timeAnomaly);
    }

    // Movement pattern anomaly detection
    const patternAnomaly = this.detectPatternAnomaly(currentMovement);
    if (patternAnomaly) {
      anomalies.push(patternAnomaly);
    }

    return anomalies;
  }

  // Detect speed anomalies
  private detectSpeedAnomaly(speed: number): AnomalyPattern | null {
    if (!this.behaviorProfile) return null;

    const speedKmh = speed * 3.6; // Convert m/s to km/h
    const averageSpeedKmh = this.behaviorProfile.averageSpeed * 3.6;

    // Check for unusually high speed (possible abduction or emergency)
    if (speedKmh > averageSpeedKmh * 3 && speedKmh > 50) {
      return {
        id: `speed_anomaly_${Date.now()}`,
        type: 'movement',
        severity: 'critical',
        description: `Unusually high speed detected: ${speedKmh.toFixed(1)} km/h (normal: ${averageSpeedKmh.toFixed(1)} km/h)`,
        confidence: 0.9,
        timestamp: Date.now()
      };
    }

    // Check for unusually low speed (possible injury or distress)
    if (speedKmh < averageSpeedKmh * 0.1 && speedKmh < 1) {
      return {
        id: `speed_anomaly_${Date.now()}`,
        type: 'movement',
        severity: 'medium',
        description: `Unusually low speed detected: ${speedKmh.toFixed(1)} km/h (normal: ${averageSpeedKmh.toFixed(1)} km/h)`,
        confidence: 0.7,
        timestamp: Date.now()
      };
    }

    return null;
  }

  // Detect location anomalies
  private detectLocationAnomaly(currentMovement: MovementData): AnomalyPattern | null {
    if (!this.behaviorProfile) return null;

    // Check if current location is far from common locations
    const isNearCommonLocation = this.behaviorProfile.commonLocations.some(loc => {
      const distance = this.calculateDistance(
        currentMovement.lat,
        currentMovement.lng,
        loc.lat,
        loc.lng
      );
      return distance < 1000; // Within 1km of a common location
    });

    if (!isNearCommonLocation) {
      // Check if this is a completely new area
      const recentLocations = this.movementHistory.slice(-10);
      const isRecentLocation = recentLocations.some(movement => {
        const distance = this.calculateDistance(
          currentMovement.lat,
          currentMovement.lng,
          movement.lat,
          movement.lng
        );
        return distance < 500; // Within 500m of recent location
      });

      if (!isRecentLocation) {
        return {
          id: `location_anomaly_${Date.now()}`,
          type: 'location',
          severity: 'medium',
          description: 'User has moved to an unfamiliar location',
          confidence: 0.8,
          timestamp: Date.now(),
          location: { lat: currentMovement.lat, lng: currentMovement.lng }
        };
      }
    }

    return null;
  }

  // Detect time-based anomalies
  private detectTimeAnomaly(currentMovement: MovementData): AnomalyPattern | null {
    if (!this.behaviorProfile) return null;

    const currentHour = new Date(currentMovement.timestamp).getHours();
    const isTypicalHour = this.behaviorProfile.typicalHours.includes(currentHour);

    if (!isTypicalHour) {
      // Check if it's late night or early morning (higher risk)
      if (currentHour < 6 || currentHour > 23) {
        return {
          id: `time_anomaly_${Date.now()}`,
          type: 'time',
          severity: 'high',
          description: `Unusual activity time detected: ${currentHour}:00 (outside typical hours)`,
          confidence: 0.9,
          timestamp: Date.now()
        };
      } else {
        return {
          id: `time_anomaly_${Date.now()}`,
          type: 'time',
          severity: 'low',
          description: `Unusual activity time detected: ${currentHour}:00`,
          confidence: 0.6,
          timestamp: Date.now()
        };
      }
    }

    return null;
  }

  // Detect movement pattern anomalies
  private detectPatternAnomaly(currentMovement: MovementData): AnomalyPattern | null {
    if (this.movementHistory.length < 10) return null;

    // Check for erratic movement patterns
    const recentMovements = this.movementHistory.slice(-10);
    const directionChanges = this.calculateDirectionChanges(recentMovements);

    if (directionChanges > 5) {
      return {
        id: `pattern_anomaly_${Date.now()}`,
        type: 'behavior',
        severity: 'medium',
        description: 'Erratic movement pattern detected (multiple direction changes)',
        confidence: 0.7,
        timestamp: Date.now()
      };
    }

    // Check for circular or repetitive movement
    const isCircular = this.detectCircularMovement(recentMovements);
    if (isCircular) {
      return {
        id: `pattern_anomaly_${Date.now()}`,
        type: 'behavior',
        severity: 'low',
        description: 'Circular or repetitive movement pattern detected',
        confidence: 0.6,
        timestamp: Date.now()
      };
    }

    return null;
  }

  // Calculate direction changes
  private calculateDirectionChanges(movements: MovementData[]): number {
    let changes = 0;
    
    for (let i = 2; i < movements.length; i++) {
      const prev = movements[i - 2];
      const curr = movements[i - 1];
      const next = movements[i];

      const angle1 = Math.atan2(curr.lng - prev.lng, curr.lat - prev.lat);
      const angle2 = Math.atan2(next.lng - curr.lng, next.lat - curr.lat);
      
      const angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI / 4) { // 45 degrees
        changes++;
      }
    }

    return changes;
  }

  // Detect circular movement
  private detectCircularMovement(movements: MovementData[]): boolean {
    if (movements.length < 5) return false;

    // Calculate center point
    const centerLat = movements.reduce((sum, m) => sum + m.lat, 0) / movements.length;
    const centerLng = movements.reduce((sum, m) => sum + m.lng, 0) / movements.length;

    // Check if movements are roughly circular around center
    const distances = movements.map(m => 
      this.calculateDistance(m.lat, m.lng, centerLat, centerLng)
    );

    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const coefficient = Math.sqrt(variance) / avgDistance;

    return coefficient < 0.3; // Low variance indicates circular movement
  }

  // Handle critical anomaly
  private async handleCriticalAnomaly(anomaly: AnomalyPattern): Promise<void> {
    console.log('Critical anomaly detected:', anomaly);
    
    try {
      await emergencyService.triggerManualAlert(
        'anomaly',
        'critical',
        `AI detected critical anomaly: ${anomaly.description}`
      );
      
      this.onEmergencyTriggered?.();
    } catch (error) {
      console.error('Failed to trigger emergency for critical anomaly:', error);
    }
  }

  // Generate behavior profile
  private generateBehaviorProfile(): void {
    if (this.movementHistory.length < 10) return;

    // Calculate average speed
    const speeds = this.movementHistory
      .filter(m => m.speed !== undefined)
      .map(m => m.speed!);
    const averageSpeed = speeds.length > 0 ? 
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;

    // Find common locations (clustering)
    const commonLocations = this.findCommonLocations();

    // Find typical hours
    const typicalHours = this.findTypicalHours();

    // Identify movement patterns
    const movementPatterns = this.identifyMovementPatterns();

    this.behaviorProfile = {
      averageSpeed,
      commonLocations,
      typicalHours,
      movementPatterns
    };

    // Save to localStorage
    localStorage.setItem('behavior_profile', JSON.stringify(this.behaviorProfile));
  }

  // Find common locations using simple clustering
  private findCommonLocations(): Array<{ lat: number; lng: number; frequency: number }> {
    const clusters: Array<{ lat: number; lng: number; count: number }> = [];
    const clusterRadius = 200; // 200 meters

    for (const movement of this.movementHistory) {
      let foundCluster = false;
      
      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          movement.lat,
          movement.lng,
          cluster.lat,
          cluster.lng
        );
        
        if (distance < clusterRadius) {
          cluster.count++;
          foundCluster = true;
          break;
        }
      }
      
      if (!foundCluster) {
        clusters.push({
          lat: movement.lat,
          lng: movement.lng,
          count: 1
        });
      }
    }

    // Return top 5 most frequent locations
    return clusters
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(cluster => ({
        lat: cluster.lat,
        lng: cluster.lng,
        frequency: cluster.count / this.movementHistory.length
      }));
  }

  // Find typical hours of activity
  private findTypicalHours(): number[] {
    const hourCounts = new Array(24).fill(0);
    
    for (const movement of this.movementHistory) {
      const hour = new Date(movement.timestamp).getHours();
      hourCounts[hour]++;
    }

    // Return hours with above-average activity
    const average = this.movementHistory.length / 24;
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > average * 0.5)
      .map(item => item.hour);
  }

  // Identify movement patterns
  private identifyMovementPatterns(): string[] {
    const patterns: string[] = [];
    
    // Check for regular commuting patterns
    const hasRegularPattern = this.detectRegularPattern();
    if (hasRegularPattern) {
      patterns.push('regular_commuter');
    }

    // Check for tourist-like movement
    const hasTouristPattern = this.detectTouristPattern();
    if (hasTouristPattern) {
      patterns.push('tourist_explorer');
    }

    // Check for stationary periods
    const hasStationaryPattern = this.detectStationaryPattern();
    if (hasStationaryPattern) {
      patterns.push('stationary_periods');
    }

    return patterns;
  }

  // Detect regular commuting pattern
  private detectRegularPattern(): boolean {
    // Simple heuristic: if user visits same locations regularly
    const commonLocations = this.findCommonLocations();
    return commonLocations.length >= 2 && commonLocations[0].frequency > 0.3;
  }

  // Detect tourist-like movement
  private detectTouristPattern(): boolean {
    // Tourist pattern: many different locations, low repeat visits
    const commonLocations = this.findCommonLocations();
    return commonLocations.length > 5 && commonLocations[0].frequency < 0.2;
  }

  // Detect stationary periods
  private detectStationaryPattern(): boolean {
    // Check for periods of very low movement
    const stationaryPeriods = this.movementHistory.filter(m => 
      m.speed !== undefined && m.speed < 0.1
    );
    return stationaryPeriods.length > this.movementHistory.length * 0.3;
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

  // Set callbacks
  setCallbacks(
    onAnomalyDetected?: (anomaly: AnomalyPattern) => void,
    onEmergencyTriggered?: () => void
  ): void {
    this.onAnomalyDetected = onAnomalyDetected;
    this.onEmergencyTriggered = onEmergencyTriggered;
  }

  // Get behavior profile
  getBehaviorProfile(): UserBehaviorProfile | null {
    return this.behaviorProfile;
  }

  // Get movement history
  getMovementHistory(): MovementData[] {
    return [...this.movementHistory];
  }

  // Check if monitoring
  isAnomalyMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  // Get anomaly detection status
  getAnomalyDetectionStatus(): {
    monitoring: boolean;
    dataPoints: number;
    profileGenerated: boolean;
  } {
    return {
      monitoring: this.isMonitoring,
      dataPoints: this.movementHistory.length,
      profileGenerated: !!this.behaviorProfile
    };
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
export default anomalyDetectionService;
