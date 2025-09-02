const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Authentication
  async register(userData: {
    email: string;
    password: string;
    name: string;
    nationality?: string;
    phone_number?: string;
  }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // User Profile
  async getUserProfile() {
    return this.request('/user/profile');
  }

  // Tourist Location
  async updateLocation(location: {
    lat: number;
    lng: number;
    address: string;
  }) {
    return this.request('/tourist/location', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  // Emergency Alerts
  async createEmergencyAlert(alert: {
    alert_type: 'panic' | 'anomaly' | 'geofence' | 'manual';
    severity: 'low' | 'medium' | 'high' | 'critical';
    lat: number;
    lng: number;
    address: string;
    description: string;
  }) {
    return this.request('/emergency/alert', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async getEmergencyAlerts(status?: string) {
    const endpoint = status ? `/emergency/alerts?status=${status}` : '/emergency/alerts';
    return this.request(endpoint);
  }

  async updateEmergencyAlertStatus(alertId: number, status: string, responseTime?: number) {
    return this.request(`/emergency/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, response_time: responseTime }),
    });
  }

  // Tourists (for police dashboard)
  async getAllTourists() {
    return this.request('/tourists');
  }

  // Police Stations and Hospitals
  async getPoliceStations() {
    return this.request('/police-stations');
  }

  async getHospitals() {
    return this.request('/hospitals');
  }

  // Trust Network
  async addTrustRelationship(trustedUserId: number, trustScore: number) {
    return this.request('/trust/add', {
      method: 'POST',
      body: JSON.stringify({ trusted_user_id: trustedUserId, trust_score: trustScore }),
    });
  }

  async getTrustNetwork() {
    return this.request('/trust/network');
  }

  // WebSocket connection for real-time updates
  connectWebSocket(userId: number) {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId }));
    };

    return ws;
  }
}

export const apiService = new ApiService();
export default apiService;
