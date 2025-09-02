import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, AlertTriangle, Users, Navigation } from 'lucide-react';

interface SafeZone {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'hotel' | 'tourist_spot';
  coordinates: { lat: number; lng: number };
  safetyLevel: 'high' | 'medium' | 'low';
}

interface Tourist {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  safetyScore: number;
  status: 'safe' | 'caution' | 'emergency';
}

export const SafetyMap: React.FC = () => {
  const [safeZones] = useState<SafeZone[]>([
    { id: '1', name: 'Guwahati Police Station', type: 'police', coordinates: { lat: 26.1445, lng: 91.7362 }, safetyLevel: 'high' },
    { id: '2', name: 'Kamakhya Temple', type: 'tourist_spot', coordinates: { lat: 26.1669, lng: 91.7070 }, safetyLevel: 'high' },
    { id: '3', name: 'City Hospital', type: 'hospital', coordinates: { lat: 26.1408, lng: 91.7378 }, safetyLevel: 'high' },
    { id: '4', name: 'Radisson Blu Hotel', type: 'hotel', coordinates: { lat: 26.1357, lng: 91.7928 }, safetyLevel: 'high' },
    { id: '5', name: 'Remote Forest Area', type: 'tourist_spot', coordinates: { lat: 26.0900, lng: 91.8000 }, safetyLevel: 'low' },
  ]);

  const [tourists] = useState<Tourist[]>([
    { id: 'T1', name: 'John Doe', coordinates: { lat: 26.1445, lng: 91.7362 }, safetyScore: 85, status: 'safe' },
    { id: 'T2', name: 'Jane Smith', coordinates: { lat: 26.1669, lng: 91.7070 }, safetyScore: 92, status: 'safe' },
    { id: 'T3', name: 'Mike Johnson', coordinates: { lat: 26.0900, lng: 91.8000 }, safetyScore: 45, status: 'caution' },
  ]);

  const [selectedLocation, setSelectedLocation] = useState<SafeZone | null>(null);
  const [currentView, setCurrentView] = useState<'zones' | 'tourists'>('zones');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'police': return '🚓';
      case 'hospital': return '🏥';
      case 'hotel': return '🏨';
      case 'tourist_spot': return '🗺️';
      default: return '📍';
    }
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'high': return 'safety-high';
      case 'medium': return 'safety-medium';
      case 'low': return 'safety-low';
      default: return 'muted';
    }
  };

  const getTouristStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'safety-high';
      case 'caution': return 'safety-medium';
      case 'emergency': return 'safety-low';
      default: return 'muted';
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Navigation className="h-5 w-5 text-primary" />
          Safety Map & Live Monitoring
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={currentView === 'zones' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('zones')}
            className="text-xs"
          >
            <Shield className="h-3 w-3 mr-1" />
            Safe Zones
          </Button>
          <Button
            variant={currentView === 'tourists' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('tourists')}
            className="text-xs"
          >
            <Users className="h-3 w-3 mr-1" />
            Live Tourists
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mock Map Area */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-80 mb-4 overflow-hidden border">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          
          {/* Map Title Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-sm font-medium">Northeast India Tourism Zone</div>
            <div className="text-xs text-muted-foreground">Live Safety Monitoring</div>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs">
            <div className="font-medium">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-safety-high"></div>
                <span>Safe Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-safety-medium"></div>
                <span>Caution Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-safety-low"></div>
                <span>High Risk Zone</span>
              </div>
            </div>
          </div>

          {/* Render locations based on current view */}
          {currentView === 'zones' && safeZones.map((zone, index) => (
            <div
              key={zone.id}
              className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2 animate-pulse border-2 border-white shadow-sm bg-${getSafetyColor(zone.safetyLevel)}`}
              style={{
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`
              }}
              onClick={() => setSelectedLocation(zone)}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-lg">
                {getTypeIcon(zone.type)}
              </div>
            </div>
          ))}

          {currentView === 'tourists' && tourists.map((tourist, index) => (
            <div
              key={tourist.id}
              className={`absolute w-5 h-5 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2 border-3 border-white shadow-md bg-${getTouristStatusColor(tourist.status)}`}
              style={{
                left: `${25 + (index * 20)}%`,
                top: `${40 + (index * 15)}%`
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">
                👤
              </div>
            </div>
          ))}
        </div>

        {/* Information Panel */}
        <div className="space-y-3">
          {currentView === 'zones' && (
            <>
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safe Zones & Risk Areas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {safeZones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                      selectedLocation?.id === zone.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedLocation(zone)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{zone.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {zone.type.replace('_', ' ')}
                        </div>
                      </div>
                      <Badge
                        className={`bg-${getSafetyColor(zone.safetyLevel)}/10 text-${getSafetyColor(zone.safetyLevel)} border-${getSafetyColor(zone.safetyLevel)}/20 text-xs`}
                      >
                        {zone.safetyLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentView === 'tourists' && (
            <>
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Tourists ({tourists.length})
              </h4>
              <div className="space-y-2">
                {tourists.map((tourist) => (
                  <div key={tourist.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-sm">{tourist.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {tourist.id}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">Score: {tourist.safetyScore}</div>
                        <Badge
                          className={`bg-${getTouristStatusColor(tourist.status)}/10 text-${getTouristStatusColor(tourist.status)} border-${getTouristStatusColor(tourist.status)}/20 text-xs`}
                        >
                          {tourist.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedLocation && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-2">{selectedLocation.name}</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="capitalize">{selectedLocation.type.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Safety Level:</span>
                <div className="capitalize">{selectedLocation.safetyLevel}</div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Coordinates:</span>
                <div>{selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};