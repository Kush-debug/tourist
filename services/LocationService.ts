import { apiService } from './ApiService';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  accuracy?: number;
  timestamp: number;
}

export interface SafetyZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  type: 'safe' | 'caution' | 'danger';
  description: string;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastLocation: LocationData | null = null;
  private safetyZones: SafetyZone[] = [];
  private onLocationUpdate?: (location: LocationData) => void;
  private onSafetyZoneEnter?: (zone: SafetyZone) => void;
  private onSafetyZoneExit?: (zone: SafetyZone) => void;

  // Initialize location service
  async initialize(): Promise<boolean> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Load safety zones
      await this.loadSafetyZones();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      return false;
    }
  }

  // Start location tracking
  async startTracking(
    onLocationUpdate?: (location: LocationData) => void,
    onSafetyZoneEnter?: (zone: SafetyZone) => void,
    onSafetyZoneExit?: (zone: SafetyZone) => void
  ): Promise<boolean> {
    if (this.isTracking) {
      return true;
    }

    this.onLocationUpdate = onLocationUpdate;
    this.onSafetyZoneEnter = onSafetyZoneEnter;
    this.onSafetyZoneExit = onSafetyZoneExit;

    try {
      // Get initial location
      const initialLocation = await this.getCurrentLocation();
      if (initialLocation) {
        this.lastLocation = initialLocation;
        await this.updateLocationOnServer(initialLocation);
        this.onLocationUpdate?.(initialLocation);
        this.checkSafetyZones(initialLocation);
      }

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: await this.reverseGeocode(position.coords.latitude, position.coords.longitude),
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          this.lastLocation = location;
          await this.updateLocationOnServer(location);
          this.onLocationUpdate?.(location);
          this.checkSafetyZones(location);
        },
        (error) => {
          console.error('Location tracking error:', error);
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );

      // Set up periodic updates
      this.updateInterval = setInterval(async () => {
        if (this.lastLocation) {
          await this.updateLocationOnServer(this.lastLocation);
        }
      }, 30000); // Update every 30 seconds

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
  }

  // Get current location
  private getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: await this.reverseGeocode(position.coords.latitude, position.coords.longitude),
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          resolve(location);
        },
        (error) => {
          console.error('Failed to get current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Reverse geocoding to get address
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Use a free geocoding service (you can replace with Google Maps API)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.locality && data.principalSubdivision) {
        return `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
      }
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  // Update location on server
  private async updateLocationOnServer(location: LocationData): Promise<void> {
    try {
      await apiService.updateLocation({
        lat: location.lat,
        lng: location.lng,
        address: location.address
      });
    } catch (error) {
      console.error('Failed to update location on server:', error);
    }
  }

  // Check if location is in any safety zones
  private checkSafetyZones(location: LocationData): void {
    this.safetyZones.forEach(zone => {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        zone.center.lat,
        zone.center.lng
      );

      const isInZone = distance <= zone.radius;
      const wasInZone = this.lastLocation ? 
        this.calculateDistance(
          this.lastLocation.lat,
          this.lastLocation.lng,
          zone.center.lat,
          zone.center.lng
        ) <= zone.radius : false;

      if (isInZone && !wasInZone) {
        this.onSafetyZoneEnter?.(zone);
      } else if (!isInZone && wasInZone) {
        this.onSafetyZoneExit?.(zone);
      }
    });
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Load safety zones
  private async loadSafetyZones(): Promise<void> {
    // Define safety zones for Guwahati area
    this.safetyZones = [
      {
        id: 'safe_zone_1',
        name: 'City Center',
        center: { lat: 26.1445, lng: 91.7362 },
        radius: 1000,
        type: 'safe',
        description: 'Well-lit and monitored city center area'
      },
      {
        id: 'caution_zone_1',
        name: 'Railway Station Area',
        center: { lat: 26.1234, lng: 91.7123 },
        radius: 500,
        type: 'caution',
        description: 'High foot traffic area, be cautious of pickpockets'
      },
      {
        id: 'danger_zone_1',
        name: 'Isolated Construction Zone',
        center: { lat: 26.1500, lng: 91.7350 },
        radius: 300,
        type: 'danger',
        description: 'Under construction area, avoid after dark'
      }
    ];
  }

  // Handle location errors
  private handleLocationError(error: GeolocationPositionError): void {
    let message = 'Location tracking error: ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message += 'Location request timed out';
        break;
      default:
        message += 'Unknown error occurred';
        break;
    }
    
    console.error(message);
  }

  // Get last known location
  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }

  // Get safety zones
  getSafetyZones(): SafetyZone[] {
    return this.safetyZones;
  }

  // Check if tracking is active
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  // Get location permission status
  async getLocationPermissionStatus(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state;
    } catch (error) {
      return 'prompt';
    }
  }

  // Request location permission
  async requestLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
      );
    });
  }

  // Calculate safety score based on location
  calculateLocationSafetyScore(location: LocationData): number {
    let score = 100;

    // Check if in danger zone
    const inDangerZone = this.safetyZones.some(zone => {
      if (zone.type === 'danger') {
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          zone.center.lat,
          zone.center.lng
        );
        return distance <= zone.radius;
      }
      return false;
    });

    if (inDangerZone) {
      score -= 50;
    }

    // Check if in caution zone
    const inCautionZone = this.safetyZones.some(zone => {
      if (zone.type === 'caution') {
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          zone.center.lat,
          zone.center.lng
        );
        return distance <= zone.radius;
      }
      return false;
    });

    if (inCautionZone) {
      score -= 20;
    }

    // Check time of day
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score -= 15;
    }

    // Check location accuracy
    if (location.accuracy && location.accuracy > 100) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }
}

export const locationService = new LocationService();
export default locationService;
