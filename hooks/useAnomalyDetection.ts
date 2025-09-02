import { useState, useEffect, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

interface RestrictedZone {
  lat: number;
  lng: number;
  radius: number;
  name: string;
}

interface Tourist {
  id: string;
  name: string;
  plannedRoute?: Location[];
  currentLocation: Location;
  safetyScore: number;
  lastActivity: number;
}

interface Anomaly {
  id: string;
  touristId: string;
  type: 'inactivity' | 'route_deviation' | 'restricted_zone';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  resolved: boolean;
}

const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes
const ROUTE_DEVIATION_THRESHOLD = 0.01; // ~1km in degrees
const RESTRICTED_ZONES: RestrictedZone[] = [
  { lat: 26.0900, lng: 91.8000, radius: 0.01, name: 'Remote Forest Area' }
];

export const useAnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [tourists, setTourists] = useState<Tourist[]>([
    {
      id: 'T1',
      name: 'John Doe',
      currentLocation: { lat: 26.1445, lng: 91.7362, timestamp: Date.now() },
      safetyScore: 85,
      lastActivity: Date.now(),
      plannedRoute: [
        { lat: 26.1445, lng: 91.7362, timestamp: Date.now() },
        { lat: 26.1669, lng: 91.7070, timestamp: Date.now() + 3600000 }
      ]
    },
    {
      id: 'T2',
      name: 'Jane Smith',
      currentLocation: { lat: 26.1669, lng: 91.7070, timestamp: Date.now() },
      safetyScore: 92,
      lastActivity: Date.now() - 1800000, // 30 minutes ago
    },
    {
      id: 'T3',
      name: 'Mike Johnson',
      currentLocation: { lat: 26.0900, lng: 91.8000, timestamp: Date.now() },
      safetyScore: 45,
      lastActivity: Date.now(),
    }
  ]);

  const calculateDistance = (loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number => {
    const lat1 = loc1.lat * Math.PI / 180;
    const lon1 = loc1.lng * Math.PI / 180;
    const lat2 = loc2.lat * Math.PI / 180;
    const lon2 = loc2.lng * Math.PI / 180;
    
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + 
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dlon/2) * Math.sin(dlon/2);
    
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const calculateSafetyScore = useCallback((tourist: Tourist): number => {
    let score = 50; // Base score

    // Check if in safe area (add +20)
    const isInSafeZone = tourist.currentLocation.lat > 26.14 && 
                        tourist.currentLocation.lat < 26.17 &&
                        tourist.currentLocation.lng > 91.73 &&
                        tourist.currentLocation.lng < 91.80;
    
    if (isInSafeZone) {
      score += 20;
    }

    // Check restricted zones (subtract -30)
    const inRestrictedZone = RESTRICTED_ZONES.some(zone => 
      calculateDistance(tourist.currentLocation, zone) < zone.radius
    );
    
    if (inRestrictedZone) {
      score -= 30;
    }

    // Check inactivity (subtract -50)
    const timeSinceLastActivity = Date.now() - tourist.lastActivity;
    if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
      score -= 50;
    }

    // Time of day factor
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      score -= 15; // Night time penalty
    }

    return Math.max(0, Math.min(100, score));
  }, []);

  const detectAnomalies = useCallback(() => {
    const newAnomalies: Anomaly[] = [];
    const now = Date.now();

    tourists.forEach(tourist => {
      // Check inactivity
      const timeSinceLastActivity = now - tourist.lastActivity;
      if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
        newAnomalies.push({
          id: `anomaly-${tourist.id}-${now}`,
          touristId: tourist.id,
          type: 'inactivity',
          severity: 'high',
          message: `${tourist.name} has been inactive for ${Math.round(timeSinceLastActivity / 60000)} minutes`,
          timestamp: now,
          resolved: false
        });
      }

      // Check restricted zones
      const inRestrictedZone = RESTRICTED_ZONES.find(zone => 
        calculateDistance(tourist.currentLocation, zone) < zone.radius
      );
      
      if (inRestrictedZone) {
        newAnomalies.push({
          id: `anomaly-${tourist.id}-restricted-${now}`,
          touristId: tourist.id,
          type: 'restricted_zone',
          severity: 'high',
          message: `${tourist.name} entered restricted area: ${inRestrictedZone.name}`,
          timestamp: now,
          resolved: false
        });
      }

      // Check route deviation
      if (tourist.plannedRoute && tourist.plannedRoute.length > 1) {
        const expectedLocation = tourist.plannedRoute[1];
        const deviation = calculateDistance(tourist.currentLocation, expectedLocation);
        
        if (deviation > ROUTE_DEVIATION_THRESHOLD) {
          newAnomalies.push({
            id: `anomaly-${tourist.id}-deviation-${now}`,
            touristId: tourist.id,
            type: 'route_deviation',
            severity: 'medium',
            message: `${tourist.name} deviated from planned route by ${(deviation * 111).toFixed(1)}km`,
            timestamp: now,
            resolved: false
          });
        }
      }

      // Update safety score
      const newScore = calculateSafetyScore(tourist);
      if (newScore !== tourist.safetyScore) {
        setTourists(prev => prev.map(t => 
          t.id === tourist.id ? { ...t, safetyScore: newScore } : t
        ));
      }
    });

    if (newAnomalies.length > 0) {
      setAnomalies(prev => [...prev, ...newAnomalies]);
    }
  }, [tourists, calculateSafetyScore]);

  const resolveAnomaly = useCallback((anomalyId: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, resolved: true } : a
    ));
  }, []);

  const updateTouristLocation = useCallback((touristId: string, location: Location) => {
    setTourists(prev => prev.map(t => 
      t.id === touristId 
        ? { ...t, currentLocation: location, lastActivity: Date.now() }
        : t
    ));
  }, []);

  // Demo mode - simulate tourist movement
  useEffect(() => {
    const interval = setInterval(() => {
      setTourists(prev => prev.map(tourist => {
        // Simulate movement for demo
        const movement = (Math.random() - 0.5) * 0.001; // Small random movement
        return {
          ...tourist,
          currentLocation: {
            ...tourist.currentLocation,
            lat: tourist.currentLocation.lat + movement,
            lng: tourist.currentLocation.lng + movement,
            timestamp: Date.now()
          }
        };
      }));
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(interval);
  }, []);

  // Run anomaly detection every minute
  useEffect(() => {
    const interval = setInterval(detectAnomalies, 60000);
    detectAnomalies(); // Run immediately
    return () => clearInterval(interval);
  }, [detectAnomalies]);

  return {
    anomalies: anomalies.filter(a => !a.resolved),
    resolvedAnomalies: anomalies.filter(a => a.resolved),
    tourists,
    resolveAnomaly,
    updateTouristLocation
  };
};