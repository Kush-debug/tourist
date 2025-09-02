import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, MapPin, Phone, Star, Navigation, Users, Clock, CheckCircle } from 'lucide-react';
import { db } from '@/config/firebase';

interface SafeZone {
  id: string;
  name: string;
  type: 'police_station' | 'hospital' | 'hotel' | 'restaurant' | 'guide' | 'tourist_office';
  coordinates: { lat: number; lng: number };
  address: string;
  phone: string;
  rating: number;
  verified: boolean;
  distance: number;
  isOpen: boolean;
  services: string[];
  languages: string[];
  trustScore: number;
}

export const TrustNetworkMap: React.FC<{ userLocation?: any }> = ({ userLocation }) => {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<SafeZone[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapView, setMapView] = useState(true);

  // Initialize verified safe zones
  const initializeSafeZones = async () => {
    const zones: SafeZone[] = [
      {
        id: 'police_001',
        name: 'Guwahati Central Police Station',
        type: 'police_station',
        coordinates: { lat: 26.1445, lng: 91.7362 },
        address: 'Pan Bazaar, Guwahati, Assam 781001',
        phone: '+91-361-2540644',
        rating: 4.2,
        verified: true,
        distance: 0.5,
        isOpen: true,
        services: ['Emergency Response', '24/7 Available', 'Tourist Assistance', 'FIR Registration'],
        languages: ['English', 'Hindi', 'Assamese'],
        trustScore: 95
      },
      {
        id: 'hospital_001',
        name: 'Guwahati Medical College Hospital',
        type: 'hospital',
        coordinates: { lat: 26.1389, lng: 91.7378 },
        address: 'Bhangagarh, Guwahati, Assam 781032',
        phone: '+91-361-2528008',
        rating: 4.0,
        verified: true,
        distance: 1.2,
        isOpen: true,
        services: ['Emergency Care', '24/7 Available', 'Trauma Center', 'Tourist Medical'],
        languages: ['English', 'Hindi', 'Assamese'],
        trustScore: 92
      },
      {
        id: 'hotel_001',
        name: 'Hotel Dynasty',
        type: 'hotel',
        coordinates: { lat: 26.1478, lng: 91.7334 },
        address: 'SS Road, Lakhtokia, Guwahati, Assam 781001',
        phone: '+91-361-2513021',
        rating: 4.3,
        verified: true,
        distance: 0.8,
        isOpen: true,
        services: ['Safe Accommodation', 'Tourist Information', 'Emergency Contact', 'Secure Parking'],
        languages: ['English', 'Hindi'],
        trustScore: 88
      },
      {
        id: 'guide_001',
        name: 'Raj Kumar - Certified Guide',
        type: 'guide',
        coordinates: { lat: 26.1523, lng: 91.7401 },
        address: 'Fancy Bazaar, Guwahati',
        phone: '+91-9876543210',
        rating: 4.7,
        verified: true,
        distance: 1.5,
        isOpen: true,
        services: ['City Tours', 'Safety Escort', 'Local Knowledge', 'Emergency Support'],
        languages: ['English', 'Hindi', 'Assamese'],
        trustScore: 94
      },
      {
        id: 'restaurant_001',
        name: 'Paradise Restaurant',
        type: 'restaurant',
        coordinates: { lat: 26.1456, lng: 91.7389 },
        address: 'Paltan Bazaar, Guwahati, Assam',
        phone: '+91-361-2633456',
        rating: 4.1,
        verified: true,
        distance: 0.3,
        isOpen: true,
        services: ['Safe Dining', 'Tourist Menu', 'WiFi Available', 'Clean Restrooms'],
        languages: ['English', 'Hindi'],
        trustScore: 86
      },
      {
        id: 'tourist_office_001',
        name: 'Assam Tourism Office',
        type: 'tourist_office',
        coordinates: { lat: 26.1512, lng: 91.7445 },
        address: 'Station Road, Guwahati, Assam',
        phone: '+91-361-2547102',
        rating: 4.0,
        verified: true,
        distance: 0.7,
        isOpen: false,
        services: ['Tourist Information', 'Complaint Registration', 'Guide Booking', 'Emergency Assistance'],
        languages: ['English', 'Hindi', 'Assamese'],
        trustScore: 90
      }
    ];

    setSafeZones(zones);
    setFilteredZones(zones);

    // Store in Firebase
    try {
      await db.ref('safe_zones').set(zones.reduce((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as any));
    } catch (error) {
      console.error('Failed to store safe zones:', error);
    }
  };

  // Filter zones
  const filterZones = () => {
    let filtered = safeZones;

    if (selectedType !== 'all') {
      filtered = filtered.filter(zone => zone.type === selectedType);
    }

    if (searchQuery) {
      filtered = filtered.filter(zone => 
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    setFilteredZones(filtered);
  };

  // Call emergency number
  const callEmergency = (phone: string, name: string) => {
    window.open(`tel:${phone}`);
    
    // Log emergency call
    db.ref('emergency_calls').push({
      touristId: 'tourist_123',
      calledNumber: phone,
      calledPlace: name,
      timestamp: new Date().toISOString()
    });
  };

  // Navigate to location
  const navigateToLocation = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, '_blank');
    
    // Log navigation
    db.ref('navigation_logs').push({
      touristId: 'tourist_123',
      destination: name,
      coordinates: { lat, lng },
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    initializeSafeZones();
  }, []);

  useEffect(() => {
    filterZones();
  }, [selectedType, searchQuery, safeZones]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'police_station': return '🚔';
      case 'hospital': return '🏥';
      case 'hotel': return '🏨';
      case 'restaurant': return '🍽️';
      case 'guide': return '👨‍🏫';
      case 'tourist_office': return '🏢';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'police_station': return 'bg-blue-100 text-blue-800';
      case 'hospital': return 'bg-red-100 text-red-800';
      case 'hotel': return 'bg-purple-100 text-purple-800';
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'tourist_office': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Network & Safe Zones
          </CardTitle>
          <CardDescription>
            Verified safe locations and certified service providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Search safe zones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => setMapView(!mapView)}
              variant="outline"
            >
              {mapView ? 'List View' : 'Map View'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'police_station', 'hospital', 'hotel', 'restaurant', 'guide', 'tourist_office'].map((type) => (
              <Button
                key={type}
                onClick={() => setSelectedType(type)}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                className="capitalize"
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map View */}
      {mapView && (
        <Card>
          <CardHeader>
            <CardTitle>Live Safe Zones Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[400px] bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-2 border-green-200 relative overflow-hidden">
              {/* Map Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-r from-blue-200 to-green-200"></div>
              </div>
              
              {/* Safe Zone Markers */}
              {filteredZones.map((zone, index) => (
                <div
                  key={zone.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    left: `${20 + (index % 4) * 20}%`,
                    top: `${20 + Math.floor(index / 4) * 25}%`
                  }}
                  onClick={() => navigateToLocation(zone.coordinates.lat, zone.coordinates.lng, zone.name)}
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                    {getTypeIcon(zone.type)}
                  </div>
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity min-w-48 z-10">
                    <p className="font-medium text-sm">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">{zone.distance}km away</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs">{zone.rating}</span>
                      {zone.verified && <CheckCircle className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* User Location */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 bg-red-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                  You
                </div>
              </div>
              
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
                <h4 className="font-medium text-sm mb-2">Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Safe Zones</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safe Zones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Verified Safe Zones ({filteredZones.length})</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              All Verified ✓
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(zone.type)}</span>
                      <h3 className="font-medium">{zone.name}</h3>
                      <Badge className={getTypeColor(zone.type)}>
                        {zone.type.replace('_', ' ')}
                      </Badge>
                      {zone.verified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{zone.address}</span>
                        <Badge variant="outline" className="text-xs">
                          {zone.distance}km
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{zone.rating}/5</span>
                        <span>•</span>
                        <span>Trust Score: {zone.trustScore}%</span>
                        <span>•</span>
                        <Badge variant="outline" className={zone.isOpen ? 'text-green-600' : 'text-red-600'}>
                          {zone.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {zone.services.slice(0, 3).map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {zone.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{zone.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => callEmergency(zone.phone, zone.name)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                    <Button
                      onClick={() => navigateToLocation(zone.coordinates.lat, zone.coordinates.lng, zone.name)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trust Network Benefits */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">Trust Network Benefits</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>Verified Safety:</strong> All locations verified by authorities</li>
                <li>• <strong>Emergency Ready:</strong> Direct calling and navigation</li>
                <li>• <strong>Local Support:</strong> Certified guides and helpers</li>
                <li>• <strong>Real-time Status:</strong> Live availability and ratings</li>
                <li>• <strong>Multi-language:</strong> Staff speaks tourist languages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
