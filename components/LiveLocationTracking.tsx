import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Phone, Hospital, Clock, Wifi, WifiOff, Users } from 'lucide-react';
import { db } from '@/config/firebase';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
  address: string;
}

interface SafeZone {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'hotel' | 'restaurant';
  lat: number;
  lng: number;
  phone: string;
  distance: number;
}

interface ThreatZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface Tourist {
  id: string;
  name: string;
  location: LocationData;
  safetyScore: number;
  status: 'safe' | 'caution' | 'danger';
  lastUpdate: Date;
  phone?: string;
}

export const LiveLocationTracking: React.FC<{ userId?: string }> = ({ userId = 'tourist_123' }) => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapView, setMapView] = useState<'all' | 'safe' | 'threats'>('all');
  const [nearbyTourists, setNearbyTourists] = useState<Tourist[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Mock data
  const safeZones: SafeZone[] = [
    { id: 'police_001', name: 'Guwahati Police Station', type: 'police', lat: 26.1445, lng: 91.7362, phone: '100', distance: 0.5 },
    { id: 'hospital_001', name: 'GMCH Hospital', type: 'hospital', lat: 26.1395, lng: 91.7298, phone: '102', distance: 1.2 },
    { id: 'hotel_001', name: 'Hotel Dynasty', type: 'hotel', lat: 26.1523, lng: 91.7401, phone: '+91-361-2540021', distance: 0.8 },
    { id: 'restaurant_001', name: 'Paradise Restaurant', type: 'restaurant', lat: 26.1467, lng: 91.7345, phone: '+91-361-2540123', distance: 0.3 }
  ];

  const threatZones: ThreatZone[] = [
    { id: 'threat_001', name: 'Railway Station Area', lat: 26.1234, lng: 91.7123, risk: 'high', description: 'High crime area - avoid after dark' },
    { id: 'threat_002', name: 'Construction Zone', lat: 26.1567, lng: 91.7456, risk: 'medium', description: 'Active construction zone' }
  ];

  // Helper functions
  const getMapPosition = (lat: number, lng: number) => {
    if (!userLocation) return { x: 50, y: 50 };
    const latDiff = (lat - userLocation.lat) * 100000;
    const lngDiff = (lng - userLocation.lng) * 100000;
    return {
      x: Math.max(10, Math.min(90, 50 + lngDiff * 2)),
      y: Math.max(10, Math.min(90, 50 - latDiff * 2))
    };
  };

  const callEmergency = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const navigateToLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  };

  // Load nearby tourists
  const loadNearbyTourists = async (location: LocationData) => {
    try {
      const mockTourists: Tourist[] = [
        {
          id: 'tourist_456',
          name: 'Sarah J.',
          location: {
            lat: location.lat + 0.001,
            lng: location.lng + 0.002,
            accuracy: 10,
            timestamp: new Date(),
            address: 'Fancy Bazaar, Guwahati'
          },
          safetyScore: 85,
          status: 'safe',
          lastUpdate: new Date(),
          phone: '+91-9876543210'
        },
        {
          id: 'tourist_789',
          name: 'Mike R.',
          location: {
            lat: location.lat - 0.002,
            lng: location.lng - 0.001,
            accuracy: 15,
            timestamp: new Date(),
            address: 'Pan Bazaar, Guwahati'
          },
          safetyScore: 72,
          status: 'caution',
          lastUpdate: new Date(),
          phone: '+91-9876543211'
        }
      ];
      
      setNearbyTourists(mockTourists);
      await db.ref(`nearby_tourists/${userId}`).set(mockTourists);
    } catch (error) {
      console.error('Failed to load nearby tourists:', error);
    }
  };

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          address: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
        };
        
        setUserLocation(locationData);
        setLocationHistory(prev => [...prev, locationData]);
        loadNearbyTourists(locationData);
        
        // Start watching position
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLocation: LocationData = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: new Date(),
              address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`
            };
            setUserLocation(newLocation);
            setLocationHistory(prev => [...prev.slice(-9), newLocation]);
            
            // Save to Firebase
            db.ref(`locations/${userId}`).set(newLocation);
            loadNearbyTourists(newLocation);
          },
          (error) => {
            console.error('Location tracking error:', error);
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      },
      (error) => {
        console.error('Failed to get initial location:', error);
        setIsTracking(false);
        
        // Use mock location for demo
        const mockLocation: LocationData = {
          lat: 26.1445,
          lng: 91.7362,
          accuracy: 10,
          timestamp: new Date(),
          address: 'Guwahati, Assam (Demo Location)'
        };
        setUserLocation(mockLocation);
        loadNearbyTourists(mockLocation);
      }
    );
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  };

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh nearby tourists
  useEffect(() => {
    if (userLocation) {
      const interval = setInterval(() => {
        loadNearbyTourists(userLocation);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userLocation]);

  // Initialize map (simplified for demo)
  const initializeMap = () => {
    if (!mapRef.current || !userLocation) return;

    const mapHtml = `
      <div style="width: 100%; height: 300px; background: linear-gradient(45deg, #e3f2fd, #f3e5f5); border-radius: 8px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 10px; left: 10px; background: white; padding: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <strong>Live Map View</strong><br/>
          <small>Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}</small>
        </div>
        
        <!-- Current User Marker -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>
        
        <!-- Nearby Tourists -->
        ${nearbyTourists.map((tourist, index) => `
          <div style="position: absolute; top: ${45 + index * 10}%; left: ${45 + index * 15}%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: ${tourist.status === 'safe' ? '#22c55e' : tourist.status === 'caution' ? '#f59e0b' : '#ef4444'}; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>
        `).join('')}
        
        <!-- Safe Zones -->
        <div style="position: absolute; top: 30%; left: 70%; width: 40px; height: 40px; background: rgba(34, 197, 94, 0.2); border: 2px solid #22c55e; border-radius: 50%;"></div>
        <div style="position: absolute; top: 70%; left: 30%; width: 35px; height: 35px; background: rgba(34, 197, 94, 0.2); border: 2px solid #22c55e; border-radius: 50%;"></div>
        
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        </style>
      </div>
    `;

    mapRef.current.innerHTML = mapHtml;
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize tracking and load nearby tourists
  useEffect(() => {
    const mockLocation: LocationData = {
      lat: 26.1445,
      lng: 91.7362,
      accuracy: 10,
      timestamp: new Date(),
      address: 'Guwahati, Assam (Demo Location)'
    };
    setUserLocation(mockLocation);
    loadNearbyTourists(mockLocation);

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // Update map when location or tourists change
  useEffect(() => {
    if (userLocation) {
      initializeMap();
    }
  }, [userLocation, nearbyTourists]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50';
      case 'caution': return 'text-yellow-600 bg-yellow-50';
      case 'emergency': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location Tracking
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {isTracking && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Navigation className="h-3 w-3 mr-1" />
                  Tracking
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Real-time GPS tracking with Firebase synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLocation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Location</Label>
                  <p className="font-medium">{currentLocation.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Latitude</Label>
                    <p className="font-mono">{currentLocation.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Longitude</Label>
                    <p className="font-mono">{currentLocation.lng.toFixed(6)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Accuracy</Label>
                    <p>{currentLocation.accuracy.toFixed(0)}m</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Update</Label>
                    <p>{currentLocation.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={isTracking ? stopTracking : startTracking}
                  variant={isTracking ? "destructive" : "default"}
                  className="w-full"
                >
                  {isTracking ? "Stop Tracking" : "Start Tracking"}
                </Button>
                <Button onClick={loadNearbyTourists} variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Refresh Nearby Tourists
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Location tracking not started</p>
              <Button onClick={startTracking}>
                <Navigation className="h-4 w-4 mr-2" />
                Start Location Tracking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Map View */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Map View
            </CardTitle>
            <CardDescription>
              Real-time location with nearby tourists and safe zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={mapRef} className="w-full h-[300px] rounded-lg border">
              {/* Map will be rendered here */}
            </div>
            
            {/* Map Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                <span>You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                <span>Safe Tourists</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full border border-white"></div>
                <span>Caution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-200 rounded-full border-2 border-green-500 opacity-50"></div>
                <span>Safe Zones</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Tourists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nearby Tourists ({nearbyTourists.length})
          </CardTitle>
          <CardDescription>
            Other tourists in your area with live status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nearbyTourists.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No other tourists detected in your area
            </p>
          ) : (
            <div className="space-y-3">
              {nearbyTourists.map((tourist) => (
                <div key={tourist.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      tourist.status === 'safe' ? 'bg-green-500' :
                      tourist.status === 'caution' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{tourist.name}</p>
                      <p className="text-sm text-muted-foreground">{tourist.location.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(tourist.status)}>
                      {tourist.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score: {tourist.safetyScore}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Location History
            </CardTitle>
            <CardDescription>
              Recent location updates (stored in Firebase)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {locationHistory.slice(0, 10).map((location, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="font-mono">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                  <span className="text-muted-foreground">
                    {location.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Live Tracking Benefits</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Family Peace of Mind:</strong> Real-time location sharing</li>
                <li>• <strong>Emergency Response:</strong> Instant location for rescue teams</li>
                <li>• <strong>Tourist Network:</strong> Connect with nearby travelers</li>
                <li>• <strong>Safe Zone Navigation:</strong> Find verified safe locations</li>
                <li>• <strong>Offline Support:</strong> Location cached when connectivity is poor</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
