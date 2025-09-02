import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  Users,
  Shield,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Siren,
  Eye,
  List,
  Search,
  Filter
} from 'lucide-react';

// Import Leaflet components directly
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import services
import { apiService } from '@/services/ApiService';
import { emergencyService } from '@/services/EmergencyService';

// Fix for Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Tourist {
  id: string;
  name: string;
  location: string | { lat: number; lng: number; address: string };
  status: 'safe' | 'caution' | 'emergency';
  safetyScore: number;
  lastUpdate: Date;
  phoneNumber?: string;
  nationality?: string;
}

interface EmergencyAlert {
  id: string;
  touristId: string;
  touristName: string;
  type: 'panic' | 'anomaly' | 'geofence' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  timestamp: Date;
  status: 'active' | 'responding' | 'resolved';
  description: string;
  responseTime?: number;
}

export const PoliceDashboard: React.FC = () => {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [mapView, setMapView] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0); // Force re-render
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading dashboard data...');
        
        // Load tourists from backend
        const touristsData = await apiService.getAllTourists();
        console.log('Tourists data from API:', touristsData);
        
        const formattedTourists: Tourist[] = touristsData.map((tourist: any) => ({
          id: tourist.id.toString(),
          name: tourist.name,
          nationality: tourist.nationality,
          location: tourist.current_location_lat && tourist.current_location_lng ? 
            { 
              lat: tourist.current_location_lat, 
              lng: tourist.current_location_lng, 
              address: tourist.current_location_address 
            } : 'Location not available',
          safetyScore: tourist.safety_score,
          status: tourist.status,
          lastUpdate: new Date(tourist.updated_at),
          phoneNumber: tourist.phone_number
        }));

        // Load emergency alerts from backend
        const alertsData = await apiService.getEmergencyAlerts('active');
        console.log('Emergency alerts from API:', alertsData);
        
        const formattedAlerts: EmergencyAlert[] = alertsData.map((alert: any) => ({
          id: alert.id.toString(),
          touristId: alert.tourist_id.toString(),
          touristName: alert.tourist_name,
          type: alert.alert_type,
          severity: alert.severity,
          location: alert.location_address,
          timestamp: new Date(alert.created_at),
          status: alert.status,
          description: alert.description
        }));

        console.log('Formatted data:', { formattedTourists, formattedAlerts });

        setTourists(formattedTourists);
        setEmergencyAlerts(formattedAlerts);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load dashboard data');
        
        // Use fallback mock data
        console.log('Using fallback mock data...');
        setTourists([
          {
            id: '1',
            name: 'John Smith',
            location: { lat: 26.1445, lng: 91.7362, address: 'Pan Bazaar, Guwahati' },
            status: 'safe',
            safetyScore: 85,
            lastUpdate: new Date(),
            phoneNumber: '+91-98765-43210',
            nationality: 'USA'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            location: { lat: 26.1500, lng: 91.7400, address: 'Fancy Bazaar, Guwahati' },
            status: 'caution',
            safetyScore: 65,
            lastUpdate: new Date(),
            phoneNumber: '+91-98765-43211',
            nationality: 'UK'
          }
        ]);
        setEmergencyAlerts([]);
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time updates
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Force map re-render when map view is toggled
  useEffect(() => {
    if (mapView) {
      console.log('Map view toggled, initializing map...');
      setMapLoading(true);
      setMapKey(prev => prev + 1);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const mapContainer = document.querySelector('.leaflet-container');
        console.log('Map container found:', mapContainer);
        if (mapContainer && (mapContainer as any)._leaflet_map) {
          console.log('Invalidating map size...');
          (mapContainer as any)._leaflet_map.invalidateSize();
        }
        setMapLoading(false);
        console.log('Map loading completed');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mapView]);

  // Handle map errors
  useEffect(() => {
    const handleMapError = () => {
      setMapError('Map failed to load. Please check your internet connection.');
    };

    window.addEventListener('error', handleMapError);
    return () => window.removeEventListener('error', handleMapError);
  }, []);

  const getFilteredTourists = () => {
    let filtered = tourists;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tourist => tourist.status === filterStatus);
    }
    if (searchQuery) {
      filtered = filtered.filter(tourist => 
        tourist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tourist.nationality && tourist.nationality.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return filtered;
  };

  // Type guard to check if location is an object with lat/lng
  const isLocationObject = (location: string | { lat: number; lng: number; address: string }): location is { lat: number; lng: number; address: string } => {
    return typeof location === 'object' && location !== null && 'lat' in location && 'lng' in location;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'caution': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredTourists = getFilteredTourists();
  const activeEmergencies = emergencyAlerts.filter(alert => alert.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading Police Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={() => setError(null)}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6" />
            Police Emergency Dashboard
          </CardTitle>
          <CardDescription className="text-blue-100">
            Real-time tourist monitoring and emergency response system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{tourists.length}</div>
              <div className="text-sm text-blue-100">Active Tourists</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-300">{activeEmergencies.length}</div>
              <div className="text-sm text-blue-100">Active Emergencies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">
                {tourists.filter(t => t.status === 'caution').length}
              </div>
              <div className="text-sm text-blue-100">Caution Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-300">
                {tourists.filter(t => t.status === 'safe').length}
              </div>
              <div className="text-sm text-blue-100">Safe Tourists</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Emergencies */}
      {activeEmergencies.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Siren className="h-5 w-5 animate-pulse" />
              ACTIVE EMERGENCIES ({activeEmergencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeEmergencies.map((alert) => (
                <div key={alert.id} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">{alert.touristName}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {alert.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp.toLocaleString()}
                        </div>
                        <p className="text-xs mt-1">{alert.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => window.open(`tel:${tourists.find(t => t.id === alert.touristId)?.phoneNumber}`)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-3 w-3" />
                        Call Tourist
                      </Button>
                      <Button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.location)}`)}
                        size="sm"
                        variant="outline"
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
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search tourists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="caution">Caution</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={() => setMapView(true)}
                variant={mapView ? "default" : "outline"}
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Map View
              </Button>
              <Button
                onClick={() => setMapView(false)}
                variant={!mapView ? "default" : "outline"}
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                List View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Map View */}
      {mapView && (
        <Card>
          <CardHeader>
            <CardTitle>Live Tourist Tracking Map</CardTitle>
            <CardDescription>
              Real-time locations of all registered tourists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[500px] rounded-lg overflow-hidden border">
              {mapError ? (
                <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 mb-2">Map failed to load</p>
                    <Button onClick={() => { setMapError(null); setMapKey(prev => prev + 1); }}>
                      Retry Map
                    </Button>
                  </div>
                </div>
              ) : mapLoading ? (
                <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {(() => {
                    console.log('Rendering map with key:', mapKey, 'tourists:', tourists.length);
                    return null;
                  })()}
                  <MapContainer
                    key={mapKey}
                    center={[26.1445, 91.7362]}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: '500px', width: '100%' }}
                    className="z-10"
                    whenReady={() => {
                      console.log('Map is ready');
                      setMapError(null);
                    }}
                  >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Tourist Markers */}
                {filteredTourists.map((tourist) => (
                  isLocationObject(tourist.location) && (
                    <Marker
                      key={tourist.id}
                      position={[tourist.location.lat, tourist.location.lng]}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-medium">{tourist.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tourist.location.address}
                          </p>
                          <p className="text-xs">
                            Safety Score:{" "}
                            <span
                              className={`font-medium ${
                                tourist.safetyScore >= 80
                                  ? "text-green-600"
                                  : tourist.safetyScore >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {tourist.safetyScore}%
                            </span>
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-6"
                              onClick={() =>
                                window.open(`tel:${tourist.phoneNumber}`, "_self")
                              }
                            >
                              📞 Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-6"
                              onClick={() => {
                                if (isLocationObject(tourist.location)) {
                                  window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${tourist.location.lat},${tourist.location.lng}`,
                                    "_blank"
                                  );
                                }
                              }}
                            >
                              🧭 Track
                            </Button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}

                {/* Police Stations */}
                {[
                  { id: "ps1", name: "Central Police Station", lat: 26.1445, lng: 91.7362 },
                  { id: "ps2", name: "Railway Police Station", lat: 26.1234, lng: 91.7123 },
                  { id: "ps3", name: "Airport Police Station", lat: 26.1567, lng: 91.7456 },
                ].map((station) => (
                  <Marker key={station.id} position={[station.lat, station.lng]}>
                    <Popup>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs">Police Station</p>
                    </Popup>
                  </Marker>
                ))}

                {/* Hospitals */}
                {[
                  { id: "h1", name: "GMCH Hospital", lat: 26.1395, lng: 91.7298 },
                  { id: "h2", name: "Nemcare Hospital", lat: 26.1523, lng: 91.7401 },
                ].map((hospital) => (
                  <Marker key={hospital.id} position={[hospital.lat, hospital.lng]}>
                    <Popup>
                      <p className="font-medium">{hospital.name}</p>
                      <p className="text-xs">Hospital</p>
                    </Popup>
                  </Marker>
                ))}

                {/* Threat Zones */}
                {[
                  { id: "t1", name: "Railway Station Area", lat: 26.1234, lng: 91.7123, risk: "high" },
                  { id: "t2", name: "Construction Zone", lat: 26.1500, lng: 91.7350, risk: "medium" },
                ].map((threat) => (
                  <Circle
                    key={threat.id}
                    center={[threat.lat, threat.lng]}
                    radius={300}
                    pathOptions={{
                      color: threat.risk === "high" ? "red" : "orange",
                      fillOpacity: 0.3,
                    }}
                  >
                    <Popup>
                      <p className="font-medium">{threat.name}</p>
                      <p className="text-xs">{threat.risk.toUpperCase()} RISK</p>
                    </Popup>
                  </Circle>
                ))}
                </MapContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tourist List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Tourists ({filteredTourists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTourists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tourists found matching your criteria</p>
              </div>
            ) : (
              filteredTourists.map((tourist) => (
                <div key={tourist.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{tourist.name}</h3>
                        <Badge className={getStatusColor(tourist.status)}>
                          {tourist.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {tourist.nationality}
                        </Badge>
                      </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{isLocationObject(tourist.location) ? tourist.location.address : tourist.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        <span>Safety Score: {tourist.safetyScore}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Last Update: {tourist.lastUpdate.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => window.open(`tel:${tourist.phoneNumber}`)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                    <Button
                      onClick={() => {
                        if (isLocationObject(tourist.location)) {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${tourist.location.lat},${tourist.location.lng}`);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Navigation className="h-3 w-3" />
                      Track
                    </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Response Info */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Siren className="h-5 w-5 text-red-600 mt-1" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">Emergency Response Protocol</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• <strong>Auto-Detection:</strong> AI triggers alerts without tourist action</li>
                <li>• <strong>Live Tracking:</strong> Real-time GPS location updates</li>
                <li>• <strong>Instant Communication:</strong> Direct calling to tourists</li>
                <li>• <strong>Navigation Support:</strong> GPS directions to incident location</li>
                <li>• <strong>Multi-channel Alerts:</strong> SOS button, voice commands, anomaly detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
