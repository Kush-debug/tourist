import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, MapPin, Clock, Users, AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { db } from '@/config/firebase';

interface SafetyFactors {
  timeOfDay: number;
  locationRisk: number;
  crowdDensity: number;
  incidentHistory: number;
  routeDeviation: number;
  weatherConditions: number;
}

interface CrimeZone {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  riskLevel: 'low' | 'medium' | 'high';
  incidentCount: number;
  lastIncident: Date;
}

export const EnhancedSafetyScore: React.FC<{ userId?: string; location?: any }> = ({ 
  userId = 'tourist_123',
  location 
}) => {
  const [safetyScore, setSafetyScore] = useState(75);
  const [safetyFactors, setSafetyFactors] = useState<SafetyFactors>({
    timeOfDay: 85,
    locationRisk: 70,
    crowdDensity: 80,
    incidentHistory: 90,
    routeDeviation: 95,
    weatherConditions: 85
  });
  const [crimeZones, setCrimeZones] = useState<CrimeZone[]>([]);
  const [isInCrimeZone, setIsInCrimeZone] = useState(false);
  const [nearbyIncidents, setNearbyIncidents] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Crime zones data (geo-fenced areas)
  const initializeCrimeZones = () => {
    const zones: CrimeZone[] = [
      {
        id: 'zone_001',
        name: 'Railway Station Area',
        coordinates: { lat: 26.1888, lng: 91.7469 },
        radius: 500, // meters
        riskLevel: 'high',
        incidentCount: 15,
        lastIncident: new Date('2024-08-30')
      },
      {
        id: 'zone_002', 
        name: 'Late Night Market Zone',
        coordinates: { lat: 26.1532, lng: 91.7554 },
        radius: 300,
        riskLevel: 'medium',
        incidentCount: 8,
        lastIncident: new Date('2024-08-28')
      },
      {
        id: 'zone_003',
        name: 'Isolated Bridge Area',
        coordinates: { lat: 26.1234, lng: 91.7123 },
        radius: 200,
        riskLevel: 'high',
        incidentCount: 12,
        lastIncident: new Date('2024-08-29')
      }
    ];
    setCrimeZones(zones);
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Check if in crime zone (geo-fencing)
  const checkCrimeZones = (currentLat: number, currentLng: number) => {
    let inZone = false;
    let incidents = 0;

    crimeZones.forEach(zone => {
      const distance = calculateDistance(currentLat, currentLng, zone.coordinates.lat, zone.coordinates.lng);
      if (distance <= zone.radius) {
        inZone = true;
        incidents += zone.incidentCount;
      }
    });

    setIsInCrimeZone(inZone);
    setNearbyIncidents(incidents);
  };

  // Calculate enhanced safety score
  const calculateSafetyScore = () => {
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour > 22;
    const isLateNight = currentHour >= 23 || currentHour <= 4;
    
    // Time factor (more granular)
    let timeScore = 90;
    if (isLateNight) timeScore = 40;
    else if (isNight) timeScore = 60;
    else if (currentHour >= 18 && currentHour <= 22) timeScore = 75; // Evening
    
    // Location risk with geo-fencing
    let locationScore = 90;
    if (isInCrimeZone) {
      locationScore = 30; // Very risky if in crime zone
    }
    
    // Crowd density (simulated based on time and location)
    let crowdScore = 80;
    if (isNight) crowdScore -= 20;
    if (isInCrimeZone) crowdScore -= 15;
    
    // Incident history (nearby incidents)
    const incidentScore = Math.max(20, 100 - (nearbyIncidents * 8));
    
    // Route deviation (simulated)
    const routeScore = safetyFactors.routeDeviation;
    
    // Weather conditions
    const weatherScore = safetyFactors.weatherConditions;
    
    // Calculate weighted score
    const calculatedScore = Math.round(
      (timeScore * 0.25) +
      (locationScore * 0.30) + // Higher weight for location
      (crowdScore * 0.20) +
      (incidentScore * 0.15) +
      (routeScore * 0.05) +
      (weatherScore * 0.05)
    );
    
    return Math.max(0, Math.min(100, calculatedScore));
  };

  // Generate AI recommendations
  const generateRecommendations = (score: number) => {
    const recs: string[] = [];
    const currentHour = new Date().getHours();
    
    if (score < 50) {
      recs.push("🚨 CRITICAL: Move to nearest safe zone immediately");
    }
    if (isInCrimeZone) {
      recs.push("⚠️ You're in a high-crime area - avoid staying here");
    }
    if (nearbyIncidents > 5) {
      recs.push("📊 Multiple recent incidents nearby - extra caution advised");
    }
    if (currentHour >= 22 || currentHour <= 5) {
      recs.push("🌙 Late night travel - consider returning to accommodation");
    }
    if (score >= 80) {
      recs.push("✅ Safe area - continue with normal precautions");
    }
    if (score < 70 && score >= 50) {
      recs.push("🔔 Moderate risk - stay alert and avoid isolated areas");
    }
    
    return recs;
  };

  // Real-time updates
  useEffect(() => {
    initializeCrimeZones();
    
    const interval = setInterval(() => {
      // Simulate location updates
      const currentLat = location?.lat || 26.1445 + (Math.random() - 0.5) * 0.01;
      const currentLng = location?.lng || 91.7362 + (Math.random() - 0.5) * 0.01;
      
      checkCrimeZones(currentLat, currentLng);
      
      const newScore = calculateSafetyScore();
      setSafetyScore(newScore);
      setRecommendations(generateRecommendations(newScore));
      setLastUpdate(new Date());
      
      // Save to Firebase
      db.ref(`safety_scores/${userId}`).set({
        score: newScore,
        factors: safetyFactors,
        inCrimeZone: isInCrimeZone,
        nearbyIncidents,
        timestamp: new Date().toISOString()
      });
      
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(interval);
  }, [location, isInCrimeZone, nearbyIncidents]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { text: 'Safe', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'Caution', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'High Risk', color: 'bg-red-100 text-red-800' };
  };

  const { text: statusText, color: statusColor } = getScoreStatus(safetyScore);

  return (
    <div className="space-y-6">
      {/* Main Safety Score */}
      <Card className={`${safetyScore < 60 ? 'border-red-300 bg-red-50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tourist Safety Score
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Zap className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(safetyScore)}`}>
                {safetyScore}
              </div>
              <Badge className={statusColor}>
                {statusText}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time safety calculation with geo-fencing and crime data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk Indicators */}
          {isInCrimeZone && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Crime Zone Alert</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                You are currently in a high-crime area with {nearbyIncidents} recent incidents
              </p>
            </div>
          )}

          {/* Safety Factors Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Time Risk</span>
                <span>{new Date().getHours() >= 22 || new Date().getHours() <= 5 ? 'High' : 'Low'}</span>
              </div>
              <Progress value={safetyFactors.timeOfDay} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Location Risk</span>
                <span>{isInCrimeZone ? 'High' : 'Low'}</span>
              </div>
              <Progress value={isInCrimeZone ? 30 : 90} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Crowd Density</span>
                <span>Moderate</span>
              </div>
              <Progress value={safetyFactors.crowdDensity} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Recent Incidents</span>
                <span>{nearbyIncidents}</span>
              </div>
              <Progress value={Math.max(20, 100 - (nearbyIncidents * 10))} className="h-2" />
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">AI Safety Recommendations</h4>
              {recommendations.map((rec, index) => (
                <div key={index} className="text-xs p-2 rounded bg-muted/50 border-l-2 border-primary">
                  {rec}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <span>Geo-fencing: {crimeZones.length} zones monitored</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
