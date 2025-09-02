import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle, 
  Route,
  CloudRain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
  BarChart3,
  Navigation2
} from 'lucide-react';
import { dataService } from '@/services/DataService';

interface SafetyScoreProps {
  score?: number;
  location?: string;
  lastUpdate?: string;
  riskFactors?: string[];
  userId?: string;
  realTimeMode?: boolean;
}

interface SafetyFactors {
  timeOfDay: number; // 0-100
  locationRisk: number; // 0-100
  crowdDensity: number; // 0-100
  incidentHistory: number; // 0-100
  routeDeviation: number; // 0-100
  weatherConditions: number; // 0-100
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  riskLevel: 'low' | 'medium' | 'high';
  crowdLevel: 'isolated' | 'moderate' | 'crowded';
  recentIncidents: number;
}

export const SafetyScore: React.FC<SafetyScoreProps> = ({
  score: initialScore,
  location = "Current Location",
  lastUpdate = "Just now",
  riskFactors = [],
  userId = "user_123",
  realTimeMode = true
}) => {
  const [currentScore, setCurrentScore] = useState(initialScore || 75);
  const [safetyFactors, setSafetyFactors] = useState<SafetyFactors>({
    timeOfDay: 85,
    locationRisk: 70,
    crowdDensity: 80,
    incidentHistory: 90,
    routeDeviation: 95,
    weatherConditions: 85
  });
  const [locationData, setLocationData] = useState<LocationData>({
    lat: 26.1445,
    lng: 91.7362,
    address: "Guwahati, Assam",
    riskLevel: 'medium',
    crowdLevel: 'moderate',
    recentIncidents: 2
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Real-time safety score calculation
  const calculateSafetyScore = () => {
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour > 22;
    
    // Time of day factor (night = higher risk)
    const timeScore = isNight ? 60 : 90;
    
    // Location risk based on crime data and geo-fencing
    const locationScore = locationData.riskLevel === 'high' ? 40 : 
                         locationData.riskLevel === 'medium' ? 70 : 90;
    
    // Crowd density (isolated = higher risk)
    const crowdScore = locationData.crowdLevel === 'isolated' ? 50 :
                      locationData.crowdLevel === 'moderate' ? 75 : 90;
    
    // Recent incidents in area
    const incidentScore = Math.max(20, 100 - (locationData.recentIncidents * 15));
    
    // Route deviation (staying on planned route = safer)
    const routeScore = safetyFactors.routeDeviation;
    
    // Weather conditions
    const weatherScore = safetyFactors.weatherConditions;
    
    // Weighted calculation
    const calculatedScore = Math.round(
      (timeScore * 0.2) +
      (locationScore * 0.25) +
      (crowdScore * 0.2) +
      (incidentScore * 0.15) +
      (routeScore * 0.1) +
      (weatherScore * 0.1)
    );
    
    return Math.max(0, Math.min(100, calculatedScore));
  };

  // Generate safety recommendations
  const generateRecommendations = (score: number) => {
    const recs: string[] = [];
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour > 22;
    
    if (score < 60) {
      recs.push("🚨 High risk detected - consider returning to safe zone");
    }
    if (isNight && score < 80) {
      recs.push("🌙 Avoid traveling alone after 8 PM in this area");
    }
    if (locationData.riskLevel === 'high') {
      recs.push("⚠️ You're in a high-risk area - stay alert and avoid isolated spots");
    }
    if (locationData.crowdLevel === 'isolated') {
      recs.push("👥 Move to a more crowded area for better safety");
    }
    if (locationData.recentIncidents > 3) {
      recs.push("📊 Multiple recent incidents reported in this area");
    }
    if (score >= 80) {
      recs.push("✅ You're in a relatively safe area - continue with normal precautions");
    }
    
    return recs;
  };

  // Update safety data with DataService integration
  const updateSafetyData = async () => {
    // Simulate location updates
    const newLocationData = {
      ...locationData,
      recentIncidents: Math.floor(Math.random() * 5),
      riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low' as 'low' | 'medium' | 'high'
    };
    
    setLocationData(newLocationData);
    
    const newScore = calculateSafetyScore();
    setCurrentScore(newScore);
    setRecommendations(generateRecommendations(newScore));
    
    // Save to DataService
    try {
      await dataService.saveSafetyData({
        userId,
        location: { lat: newLocationData.lat, lng: newLocationData.lng },
        safetyScore: newScore,
        riskFactors: recommendations,
        timestamp: new Date()
      });
    } catch (error) {
      console.log('Failed to save safety data:', error);
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    // Initial calculation
    const initialCalcScore = calculateSafetyScore();
    setCurrentScore(initialCalcScore);
    setRecommendations(generateRecommendations(initialCalcScore));

    if (realTimeMode) {
      const interval = setInterval(() => {
        updateSafetyData();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }

    // Listen for real-time updates from DataService
    const handleSafetyUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      if (updatedData.userId === userId) {
        setCurrentScore(updatedData.score);
        setSafetyFactors(prev => ({ ...prev, ...updatedData.factors }));
        setLocationData(prev => ({ ...prev, ...updatedData.location }));
      }
    };

    window.addEventListener('tss_safetyScore', handleSafetyUpdate as EventListener);
    return () => {
      window.removeEventListener('tss_safetyScore', handleSafetyUpdate as EventListener);
    };
  }, [realTimeMode, userId, locationData, safetyFactors]);

  const recalculateScore = async () => {
    setIsCalculating(true);
    setTimeout(async () => {
      const newScore = calculateSafetyScore();
      setCurrentScore(newScore);
      setRecommendations(generateRecommendations(newScore));
      
      // Save to DataService
      try {
        await dataService.saveSafetyData({
          userId,
          location: { lat: locationData.lat, lng: locationData.lng },
          safetyScore: newScore,
          riskFactors: generateRecommendations(newScore),
          timestamp: new Date()
        });
      } catch (error) {
        console.log('Failed to save safety data:', error);
      }
      
      setIsCalculating(false);
    }, 2000);
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { status: 'high', color: 'safety-high', text: 'Safe', icon: Shield };
    if (score >= 60) return { status: 'medium', color: 'safety-medium', text: 'Caution', icon: AlertTriangle };
    return { status: 'low', color: 'safety-low', text: 'High Risk', icon: AlertTriangle };
  };

  const { status, color, text, icon: StatusIcon } = getScoreStatus(currentScore);
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour > 22;

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 text-${color}`} />
            Tourist Safety Score
            {realTimeMode && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                LIVE
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={recalculateScore}
            disabled={isCalculating}
            className="text-xs"
          >
            {isCalculating ? "Calculating..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-bold text-${color} ${isCalculating ? 'animate-pulse' : ''}`}>
                {currentScore}
              </span>
              <span className="text-muted-foreground text-lg">/100</span>
              <div className="flex items-center gap-1 ml-2">
                {currentScore > (initialScore || 75) ? (
                  <TrendingUp className="h-4 w-4 text-safety-high" />
                ) : currentScore < (initialScore || 75) ? (
                  <TrendingDown className="h-4 w-4 text-safety-low" />
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className={`bg-${color}/10 text-${color} border-${color}/20`}
              >
                {text}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {isNight ? <Moon className="h-3 w-3 mr-1" /> : <Sun className="h-3 w-3 mr-1" />}
                {isNight ? 'Night Mode' : 'Day Mode'}
              </Badge>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" />
              {locationData.address}
            </div>
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3 w-3" />
              {locationData.crowdLevel}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Safety Factor Breakdown */}
        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Safety Factor Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Time Risk</span>
                <span>{isNight ? 'High' : 'Low'}</span>
              </div>
              <Progress value={isNight ? 30 : 90} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Location Risk</span>
                <span className="capitalize">{locationData.riskLevel}</span>
              </div>
              <Progress 
                value={locationData.riskLevel === 'high' ? 30 : locationData.riskLevel === 'medium' ? 70 : 90} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Crowd Density</span>
                <span className="capitalize">{locationData.crowdLevel}</span>
              </div>
              <Progress 
                value={locationData.crowdLevel === 'isolated' ? 40 : locationData.crowdLevel === 'moderate' ? 70 : 90} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Route Status</span>
                <span>On Track</span>
              </div>
              <Progress value={safetyFactors.routeDeviation} className="h-2" />
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <Navigation2 className="h-4 w-4" />
              AI Safety Recommendations
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="text-xs p-2 rounded-lg bg-muted/50 border-l-2 border-primary">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Current Risk Factors
            </div>
            <div className="flex flex-wrap gap-2">
              {riskFactors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 text-sm border border-primary/20">
          <p className="text-muted-foreground">
            <strong>Smart Safety Score:</strong> Real-time calculation based on location risk, time of day, 
            crowd density, incident history, route adherence, and weather conditions. Updates every 30 seconds.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};