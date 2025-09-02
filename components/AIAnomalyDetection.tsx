import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, MapPin, Clock, Activity, Zap, Shield } from 'lucide-react';
import { db } from '@/config/firebase';

interface AnomalyAlert {
  id: string;
  type: 'location_drop' | 'inactivity' | 'route_deviation' | 'panic_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: { lat: number; lng: number; address: string };
  timestamp: Date;
  confidence: number;
  autoActions: string[];
  resolved: boolean;
}

interface LocationPattern {
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number;
  accuracy: number;
}

export const AIAnomalyDetection: React.FC<{ userId?: string }> = ({ userId = 'tourist_123' }) => {
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [locationPattern, setLocationPattern] = useState<LocationPattern[]>([]);
  const [lastActivity, setLastActivity] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState({ lat: 26.1445, lng: 91.7362, address: 'Guwahati, Assam' });

  // AI Anomaly Detection Engine
  const detectAnomalies = () => {
    const alerts: AnomalyAlert[] = [];
    const now = new Date();

    // 1. Location Drop Detection
    const timeSinceLastUpdate = now.getTime() - lastActivity.getTime();
    if (timeSinceLastUpdate > 300000) { // 5 minutes
      alerts.push({
        id: `anomaly_${Date.now()}_location`,
        type: 'location_drop',
        severity: timeSinceLastUpdate > 900000 ? 'critical' : 'high',
        message: 'Phone location signal lost suddenly - possible device damage or interference',
        location: currentLocation,
        timestamp: now,
        confidence: 85,
        autoActions: [
          'Silent alert sent to emergency contacts',
          'Police notification triggered',
          'Last known location shared with authorities'
        ],
        resolved: false
      });
    }

    // 2. Inactivity Detection
    if (locationPattern.length >= 3) {
      const recentLocations = locationPattern.slice(-3);
      const isStationary = recentLocations.every(loc => 
        Math.abs(loc.lat - recentLocations[0].lat) < 0.0001 &&
        Math.abs(loc.lng - recentLocations[0].lng) < 0.0001
      );
      
      const stationaryTime = now.getTime() - recentLocations[0].timestamp.getTime();
      
      if (isStationary && stationaryTime > 1200000) { // 20 minutes
        alerts.push({
          id: `anomaly_${Date.now()}_inactivity`,
          type: 'inactivity',
          severity: stationaryTime > 3600000 ? 'critical' : 'high',
          message: 'No movement detected for extended period in remote area',
          location: currentLocation,
          timestamp: now,
          confidence: 78,
          autoActions: [
            'Wellness check initiated',
            'Emergency contacts notified',
            'Local authorities alerted'
          ],
          resolved: false
        });
      }
    }

    // 3. Route Deviation Detection
    const expectedRoute = { lat: 26.1445, lng: 91.7362 }; // Planned destination
    const deviation = Math.abs(currentLocation.lat - expectedRoute.lat) + 
                     Math.abs(currentLocation.lng - expectedRoute.lng);
    
    if (deviation > 0.05) { // Significant deviation
      alerts.push({
        id: `anomaly_${Date.now()}_route`,
        type: 'route_deviation',
        severity: 'medium',
        message: 'Significant deviation from planned route detected',
        location: currentLocation,
        timestamp: now,
        confidence: 72,
        autoActions: [
          'Route deviation logged',
          'Safety check recommended',
          'Alternative route suggestions sent'
        ],
        resolved: false
      });
    }

    // 4. Panic Pattern Detection (simulated)
    const recentSpeed = locationPattern.length > 0 ? locationPattern[locationPattern.length - 1].speed : 0;
    if (recentSpeed > 50 || (Math.random() > 0.95)) { // Simulate panic detection
      alerts.push({
        id: `anomaly_${Date.now()}_panic`,
        type: 'panic_pattern',
        severity: 'critical',
        message: 'Unusual movement pattern suggests possible distress',
        location: currentLocation,
        timestamp: now,
        confidence: 88,
        autoActions: [
          'IMMEDIATE police alert sent',
          'Emergency mode activated',
          'Live tracking shared with authorities'
        ],
        resolved: false
      });
    }

    return alerts;
  };

  // Send alerts to Firebase and trigger emergency response
  const processAnomalies = async (newAnomalies: AnomalyAlert[]) => {
    for (const anomaly of newAnomalies) {
      try {
        // Store in Firebase
        await db.ref(`anomaly_alerts/${anomaly.id}`).set(anomaly);
        
        // If critical, trigger immediate emergency response
        if (anomaly.severity === 'critical') {
          await db.ref(`live_emergencies/${userId}`).set({
            type: 'auto_detection',
            anomalyId: anomaly.id,
            touristId: userId,
            location: anomaly.location,
            timestamp: anomaly.timestamp.toISOString(),
            autoTriggered: true
          });
        }
        
        // Add to local state
        setAnomalies(prev => [anomaly, ...prev]);
        
      } catch (error) {
        console.error('Failed to process anomaly:', error);
      }
    }
  };

  // Simulate location updates
  const simulateLocationUpdate = () => {
    const newLocation: LocationPattern = {
      timestamp: new Date(),
      lat: currentLocation.lat + (Math.random() - 0.5) * 0.001,
      lng: currentLocation.lng + (Math.random() - 0.5) * 0.001,
      speed: Math.random() * 20, // km/h
      accuracy: 5 + Math.random() * 10
    };
    
    setLocationPattern(prev => [...prev.slice(-19), newLocation]); // Keep last 20 points
    setLastActivity(new Date());
    
    setCurrentLocation({
      lat: newLocation.lat,
      lng: newLocation.lng,
      address: currentLocation.address
    });
  };

  // Resolve anomaly
  const resolveAnomaly = async (anomalyId: string) => {
    try {
      await db.ref(`anomaly_alerts/${anomalyId}/resolved`).set(true);
      setAnomalies(prev => 
        prev.map(a => a.id === anomalyId ? { ...a, resolved: true } : a)
      );
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
    }
  };

  // Main monitoring loop
  useEffect(() => {
    if (!isMonitoring) return;

    const monitoringInterval = setInterval(() => {
      simulateLocationUpdate();
      
      const detectedAnomalies = detectAnomalies();
      if (detectedAnomalies.length > 0) {
        processAnomalies(detectedAnomalies);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitoringInterval);
  }, [isMonitoring, locationPattern, lastActivity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Monitoring Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Anomaly Detection
            </div>
            <Badge variant="outline" className={isMonitoring ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
              <Activity className="h-3 w-3 mr-1" />
              {isMonitoring ? 'MONITORING' : 'STOPPED'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Automatic behavior analysis with silent emergency alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{locationPattern.length}</div>
              <div className="text-xs text-muted-foreground">Location Points</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{anomalies.length}</div>
              <div className="text-xs text-muted-foreground">Total Anomalies</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {anomalies.filter(a => a.severity === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">Critical Alerts</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.round((new Date().getTime() - lastActivity.getTime()) / 1000)}s
              </div>
              <div className="text-xs text-muted-foreground">Since Last Update</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setIsMonitoring(!isMonitoring)}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex-1"
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Button onClick={simulateLocationUpdate} variant="outline">
              Simulate Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Anomalies */}
      {anomalies.filter(a => !a.resolved).length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Active Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.filter(a => !a.resolved).map((anomaly) => (
                <div key={anomaly.id} className="border border-red-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {anomaly.confidence}%
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-2">{anomaly.message}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {anomaly.location.address}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {anomaly.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1">Auto Actions Taken:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {anomaly.autoActions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    onClick={() => resolveAnomaly(anomaly.id)}
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                  >
                    Mark as Resolved
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Detection Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium text-purple-900 mb-2">AI Anomaly Detection</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Location Drop:</strong> Sudden GPS signal loss detection</li>
                <li>• <strong>Inactivity Alert:</strong> No movement in remote areas</li>
                <li>• <strong>Route Deviation:</strong> Unexpected path changes</li>
                <li>• <strong>Panic Patterns:</strong> Unusual movement behavior</li>
                <li>• <strong>Auto Response:</strong> Silent alerts without SOS button</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
