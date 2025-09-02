import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Navigation, 
  Activity,
  Phone,
  Users,
  Route,
  Zap
} from 'lucide-react';

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy: number;
}

interface AnomalyAlert {
  id: string;
  type: 'location_drop' | 'inactivity' | 'route_deviation' | 'panic_pattern' | 'geo_fence_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  location?: LocationPoint;
  confidence: number;
  autoActions: string[];
}

interface UserBehaviorPattern {
  avgMovementSpeed: number;
  typicalActiveHours: { start: number; end: number };
  frequentLocations: LocationPoint[];
  communicationFrequency: number;
  routePreferences: string[];
}

interface AnomalyDetectionProps {
  userId: string;
  realTimeMode?: boolean;
  onAnomalyDetected?: (alert: AnomalyAlert) => void;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  userId,
  realTimeMode = true,
  onAnomalyDetected
}) => {
  const [isMonitoring, setIsMonitoring] = useState(realTimeMode);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint>({
    lat: 26.1445,
    lng: 91.7362,
    timestamp: new Date(),
    accuracy: 10
  });
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [userPattern, setUserPattern] = useState<UserBehaviorPattern>({
    avgMovementSpeed: 5.2, // km/h
    typicalActiveHours: { start: 7, end: 22 },
    frequentLocations: [],
    communicationFrequency: 15, // messages per hour
    routePreferences: ['main_roads', 'populated_areas']
  });
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'weak'>('online');
  const [isProcessing, setIsProcessing] = useState(false);

  // AI Anomaly Detection Algorithms
  const detectLocationAnomalies = () => {
    const alerts: AnomalyAlert[] = [];
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - currentLocation.timestamp.getTime();
    
    // 1. Sudden location drop detection
    if (timeSinceLastUpdate > 300000) { // 5 minutes
      alerts.push({
        id: `loc_drop_${Date.now()}`,
        type: 'location_drop',
        severity: timeSinceLastUpdate > 900000 ? 'critical' : 'high', // 15 minutes = critical
        message: 'Phone location signal lost suddenly - possible device damage or interference',
        timestamp: now,
        location: currentLocation,
        confidence: 85,
        autoActions: [
          'Silent alert sent to emergency contacts',
          'Police notification triggered',
          'Last known location shared with authorities'
        ]
      });
    }

    // 2. Unusual movement patterns
    if (locationHistory.length >= 3) {
      const recentMovements = locationHistory.slice(-3);
      const speeds = recentMovements.map((loc, index) => {
        if (index === 0) return 0;
        const prev = recentMovements[index - 1];
        const distance = calculateDistance(prev, loc);
        const timeDiff = (loc.timestamp.getTime() - prev.timestamp.getTime()) / 1000 / 3600; // hours
        return distance / timeDiff; // km/h
      }).filter(speed => speed > 0);

      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      
      // Detect abnormally high speed (possible abduction)
      if (avgSpeed > 80) { // 80 km/h suggests vehicle movement
        alerts.push({
          id: `speed_anomaly_${Date.now()}`,
          type: 'route_deviation',
          severity: 'critical',
          message: `Unusual high-speed movement detected (${avgSpeed.toFixed(1)} km/h) - possible forced transportation`,
          timestamp: now,
          location: currentLocation,
          confidence: 92,
          autoActions: [
            'IMMEDIATE police alert sent',
            'Emergency contacts notified',
            'Real-time location tracking activated'
          ]
        });
      }
    }

    return alerts;
  };

  const detectInactivityAnomalies = () => {
    const alerts: AnomalyAlert[] = [];
    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const currentHour = now.getHours();
    
    // Check if user is inactive during typical active hours
    if (currentHour >= userPattern.typicalActiveHours.start && 
        currentHour <= userPattern.typicalActiveHours.end) {
      
      // 1. Extended inactivity in remote area
      if (timeSinceActivity > 7200000) { // 2 hours
        const isRemoteArea = !isInPopulatedArea(currentLocation);
        
        if (isRemoteArea) {
          alerts.push({
            id: `inactivity_remote_${Date.now()}`,
            type: 'inactivity',
            severity: 'high',
            message: 'Tourist inactive for 2+ hours in remote area - possible distress or medical emergency',
            timestamp: now,
            location: currentLocation,
            confidence: 78,
            autoActions: [
              'Wellness check initiated',
              'Local authorities notified',
              'Emergency contacts alerted'
            ]
          });
        }
      }
    }

    return alerts;
  };

  const detectRouteAnomalies = () => {
    const alerts: AnomalyAlert[] = [];
    
    // Simulate planned itinerary deviation
    const plannedRoute = [
      { lat: 26.1445, lng: 91.7362, name: 'Guwahati City Center' },
      { lat: 26.1669, lng: 91.7070, name: 'Kamakhya Temple' },
      { lat: 26.1408, lng: 91.7378, name: 'Brahmaputra River' }
    ];

    const currentDistance = Math.min(...plannedRoute.map(point => 
      calculateDistance(currentLocation, point)
    ));

    // If more than 5km from planned route
    if (currentDistance > 5) {
      alerts.push({
        id: `route_deviation_${Date.now()}`,
        type: 'route_deviation',
        severity: 'medium',
        message: `Significant deviation from planned itinerary (${currentDistance.toFixed(1)}km off-route)`,
        timestamp: new Date(),
        location: currentLocation,
        confidence: 70,
        autoActions: [
          'Route guidance offered',
          'Safety check message sent',
          'Alternative safe routes suggested'
        ]
      });
    }

    return alerts;
  };

  const detectPanicPatterns = () => {
    const alerts: AnomalyAlert[] = [];
    
    // Simulate panic behavior detection (rapid movement, erratic patterns)
    const isErraticMovement = Math.random() < 0.1; // 10% chance for demo
    
    if (isErraticMovement) {
      alerts.push({
        id: `panic_pattern_${Date.now()}`,
        type: 'panic_pattern',
        severity: 'critical',
        message: 'Erratic movement pattern detected - possible panic or chase situation',
        timestamp: new Date(),
        location: currentLocation,
        confidence: 88,
        autoActions: [
          'IMMEDIATE emergency response activated',
          'Police dispatched to location',
          'Live audio/video recording started'
        ]
      });
    }

    return alerts;
  };

  // Helper functions
  const calculateDistance = (point1: LocationPoint, point2: LocationPoint): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isInPopulatedArea = (location: LocationPoint): boolean => {
    // Simulate populated area detection
    return Math.random() > 0.3; // 70% chance of being in populated area
  };

  const runAnomalyDetection = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const locationAnomalies = detectLocationAnomalies();
      const inactivityAnomalies = detectInactivityAnomalies();
      const routeAnomalies = detectRouteAnomalies();
      const panicAnomalies = detectPanicPatterns();
      
      const allAnomalies = [
        ...locationAnomalies,
        ...inactivityAnomalies,
        ...routeAnomalies,
        ...panicAnomalies
      ];

      if (allAnomalies.length > 0) {
        setAnomalies(prev => [...prev, ...allAnomalies]);
        allAnomalies.forEach(anomaly => {
          if (onAnomalyDetected) {
            onAnomalyDetected(anomaly);
          }
        });
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  // Simulate location updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Simulate location updates
      const newLocation: LocationPoint = {
        lat: currentLocation.lat + (Math.random() - 0.5) * 0.01,
        lng: currentLocation.lng + (Math.random() - 0.5) * 0.01,
        timestamp: new Date(),
        accuracy: Math.random() * 20 + 5
      };
      
      setCurrentLocation(newLocation);
      setLocationHistory(prev => [...prev.slice(-10), newLocation]); // Keep last 10 locations
      
      // Simulate activity updates
      if (Math.random() > 0.7) { // 30% chance of activity
        setLastActivity(new Date());
      }
      
      // Simulate connection status changes
      const connectionRandom = Math.random();
      if (connectionRandom > 0.95) {
        setConnectionStatus('offline');
      } else if (connectionRandom > 0.85) {
        setConnectionStatus('weak');
      } else {
        setConnectionStatus('online');
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, currentLocation]);

  // Run anomaly detection periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      runAnomalyDetection();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, currentLocation, lastActivity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'safety-low';
      case 'high': return 'safety-medium';
      case 'medium': return 'safety-medium';
      case 'low': return 'safety-high';
      default: return 'muted';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'online': return <Wifi className="h-4 w-4 text-safety-high" />;
      case 'weak': return <Wifi className="h-4 w-4 text-safety-medium" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-safety-low" />;
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            AI Anomaly Detection
            {isMonitoring && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary animate-pulse">
                MONITORING
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <Button
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="text-xs"
            >
              {isMonitoring ? "Stop" : "Start"} Monitoring
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Last Activity</div>
            <div className="text-sm font-medium">
              {Math.floor((Date.now() - lastActivity.getTime()) / 60000)}m ago
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm font-medium">
              {currentLocation.accuracy.toFixed(0)}m accuracy
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Route className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Route Status</div>
            <div className="text-sm font-medium">On Track</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">AI Confidence</div>
            <div className="text-sm font-medium">94%</div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <Alert>
            <Brain className="h-4 w-4 animate-spin" />
            <AlertDescription>
              AI analyzing behavior patterns and location data...
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Anomalies */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recent Anomaly Alerts ({anomalies.length})
          </h4>
          
          {anomalies.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No anomalies detected. AI monitoring active.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {anomalies.slice(-5).reverse().map((anomaly) => (
                <Alert key={anomaly.id} className={`border-${getSeverityColor(anomaly.severity)}/20`}>
                  <AlertTriangle className={`h-4 w-4 text-${getSeverityColor(anomaly.severity)}`} />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{anomaly.message}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Confidence: {anomaly.confidence}% • {anomaly.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="space-y-1">
                          {anomaly.autoActions.map((action, index) => (
                            <div key={index} className="text-xs bg-muted/50 rounded px-2 py-1">
                              ✓ {action}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Badge 
                        className={`bg-${getSeverityColor(anomaly.severity)}/10 text-${getSeverityColor(anomaly.severity)} border-${getSeverityColor(anomaly.severity)}/20 text-xs ml-2`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>

        {/* AI Detection Capabilities */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <h5 className="font-medium mb-2 text-sm">AI Detection Capabilities</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span>Sudden location drops</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Inactivity in remote areas</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3" />
              <span>Route deviations</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>Panic behavior patterns</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Silent alerts automatically sent to police and emergency contacts without requiring SOS button.
          </div>
        </div>

        {/* Manual Test Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runAnomalyDetection}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Run Manual Anomaly Check"}
        </Button>
      </CardContent>
    </Card>
  );
};
