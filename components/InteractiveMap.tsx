import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Users, Shield, AlertTriangle, Phone, Hospital } from 'lucide-react';
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
  location: LocationData;
  phone: string;
  distance: number;
}

interface ThreatZone {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  location: LocationData;
  description: string;
}

export const InteractiveMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [safeZones] = useState<SafeZone[]>([
    {
      id: 'police_001',
      name: 'Guwahati Police Station',
      type: 'police',
      location: { lat: 26.1445, lng: 91.7362, accuracy: 10, timestamp: new Date(), address: 'Pan Bazaar' },
      phone: '100',
      distance: 0.5
    },
    {
      id: 'hospital_001',
      name: 'GMCH Hospital',
      type: 'hospital',
      location: { lat: 26.1395, lng: 91.7298, accuracy: 10, timestamp: new Date(), address: 'Bhangagarh' },
      phone: '102',
      distance: 1.2
    },
    {
      id: 'hotel_001',
      name: 'Hotel Dynasty',
      type: 'hotel',
      location: { lat: 26.1523, lng: 91.7401, accuracy: 10, timestamp: new Date(), address: 'Fancy Bazaar' },
      phone: '+91-361-2540021',
      distance: 0.8
    }
  ]);
  
  const [threatZones] = useState<ThreatZone[]>([
    {
      id: 'threat_001',
      name: 'Railway Station Area',
      riskLevel: 'high',
      location: { lat: 26.1234, lng: 91.7123, accuracy: 50, timestamp: new Date(), address: 'Railway Station' },
      description: 'High crime area - avoid after dark'
    },
    {
      id: 'threat_002',
      name: 'Construction Zone',
      riskLevel: 'medium',
      location: { lat: 26.1567, lng: 91.7456, accuracy: 30, timestamp: new Date(), address: 'GS Road' },
      description: 'Active construction zone'
    }
  ]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        };
        setUserLocation(location);
        db.ref(`locations/user`).set(location);
      },
      () => {
        // Demo location for testing
        const demoLocation: LocationData = {
          lat: 26.1445,
          lng: 91.7362,
          accuracy: 10,
          timestamp: new Date(),
          address: 'Guwahati, Assam (Demo)'
        };
        setUserLocation(demoLocation);
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const callEmergency = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const navigateToLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const getMapPosition = (lat: number, lng: number) => {
    if (!userLocation) return { x: 50, y: 50 };
    const latDiff = (lat - userLocation.lat) * 100000;
    const lngDiff = (lng - userLocation.lng) * 100000;
    return {
      x: Math.max(10, Math.min(90, 50 + lngDiff * 2)),
      y: Math.max(10, Math.min(90, 50 - latDiff * 2))
    };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Safety Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "destructive" : "default"}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
            <Button onClick={() => callEmergency('100')} variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Emergency: 100
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full h-[500px] bg-gradient-to-br from-blue-100 to-green-100 relative border rounded-lg overflow-hidden">
            {/* User Location */}
            {userLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: '50%', top: '50%' }}
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg text-xs">
                  <p className="font-medium">You</p>
                  <p className="text-muted-foreground">{userLocation.address}</p>
                </div>
              </div>
            )}

            {/* Safe Zones */}
            {safeZones.map((zone) => {
              const pos = getMapPosition(zone.location.lat, zone.location.lng);
              return (
                <div
                  key={zone.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white group-hover:scale-125 transition-transform">
                    {zone.type === 'police' ? '🚔' : zone.type === 'hospital' ? '🏥' : zone.type === 'hotel' ? '🏨' : '🍽️'}
                  </div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity min-w-32 text-xs">
                    <p className="font-medium">{zone.name}</p>
                    <p className="text-muted-foreground">{zone.distance}km</p>
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" onClick={() => callEmergency(zone.phone)} className="text-xs h-6">
                        Call
                      </Button>
                      <Button size="sm" onClick={() => navigateToLocation(zone.location.lat, zone.location.lng)} variant="outline" className="text-xs h-6">
                        Go
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Threat Zones */}
            {threatZones.map((zone) => {
              const pos = getMapPosition(zone.location.lat, zone.location.lng);
              return (
                <div
                  key={zone.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className={`w-12 h-12 rounded-full opacity-40 ${
                    zone.riskLevel === 'critical' ? 'bg-red-600' :
                    zone.riskLevel === 'high' ? 'bg-red-500' :
                    zone.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-orange-400'
                  }`}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">
                    ⚠️
                  </div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity min-w-32 text-xs">
                    <p className="font-medium text-red-700">{zone.name}</p>
                    <Badge className={`text-xs ${zone.riskLevel === 'critical' ? 'bg-red-600' : zone.riskLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
                      {zone.riskLevel.toUpperCase()}
                    </Badge>
                    <p className="text-muted-foreground mt-1">{zone.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
              <h4 className="font-medium text-sm mb-2">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>Your Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Safe Zones ({safeZones.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Threat Zones ({threatZones.length})</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
