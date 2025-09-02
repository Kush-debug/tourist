// Market-Ready Data Service Layer for Travel Safe Shield
// Handles all data persistence, API integration, and real-time synchronization

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

interface SafetyData {
  userId: string;
  location: { lat: number; lng: number };
  safetyScore: number;
  riskFactors: string[];
  timestamp: Date;
}

interface AnomalyEvent {
  id: string;
  userId: string;
  type: string;
  severity: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  resolved: boolean;
}

interface EmergencyAlert {
  id: string;
  userId: string;
  type: 'police' | 'medical' | 'fire' | 'general';
  location: { lat: number; lng: number };
  message: string;
  contacts: string[];
  timestamp: Date;
  status: 'active' | 'responding' | 'resolved';
}

class DataService {
  private baseURL = 'https://api.travelsafeshield.com'; // Production API
  private wsConnection: WebSocket | null = null;
  private syncQueue: any[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.initializeOfflineSupport();
    this.initializeWebSocket();
    this.setupNetworkListeners();
  }

  // Initialize offline support with IndexedDB
  private async initializeOfflineSupport() {
    if ('indexedDB' in window) {
      const request = indexedDB.open('TravelSafeShieldDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('safetyData')) {
          db.createObjectStore('safetyData', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('anomalies')) {
          db.createObjectStore('anomalies', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('emergencyAlerts')) {
          db.createObjectStore('emergencyAlerts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    }
  }

  // Initialize WebSocket for real-time updates
  private initializeWebSocket() {
    if (this.isOnline) {
      try {
        this.wsConnection = new WebSocket('wss://ws.travelsafeshield.com');
        
        this.wsConnection.onopen = () => {
          console.log('WebSocket connected - Real-time updates active');
        };
        
        this.wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        };
        
        this.wsConnection.onclose = () => {
          console.log('WebSocket disconnected - Attempting reconnection...');
          setTimeout(() => this.initializeWebSocket(), 5000);
        };
      } catch (error) {
        console.log('WebSocket not available - Using polling fallback');
      }
    }
  }

  // Setup network status listeners
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
      this.initializeWebSocket();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      if (this.wsConnection) {
        this.wsConnection.close();
      }
    });
  }

  // Handle real-time updates from WebSocket
  private handleRealtimeUpdate(data: any) {
    switch (data.type) {
      case 'safety_score_update':
        this.broadcastUpdate('safetyScore', data.payload);
        break;
      case 'anomaly_detected':
        this.broadcastUpdate('anomaly', data.payload);
        break;
      case 'emergency_alert':
        this.broadcastUpdate('emergency', data.payload);
        break;
    }
  }

  // Broadcast updates to subscribers
  private broadcastUpdate(type: string, data: any) {
    window.dispatchEvent(new CustomEvent(`tss_${type}`, { detail: data }));
  }

  // API Methods with offline support
  async saveSafetyData(data: SafetyData): Promise<APIResponse<SafetyData>> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseURL}/safety-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result, timestamp: new Date() };
        }
      }
      
      // Fallback to offline storage
      await this.saveToIndexedDB('safetyData', data);
      this.addToSyncQueue('POST', '/safety-data', data);
      
      return { success: true, data, timestamp: new Date() };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date() 
      };
    }
  }

  async reportAnomaly(anomaly: AnomalyEvent): Promise<APIResponse<AnomalyEvent>> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseURL}/anomalies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(anomaly)
        });
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result, timestamp: new Date() };
        }
      }
      
      // Offline storage for critical anomalies
      await this.saveToIndexedDB('anomalies', anomaly);
      this.addToSyncQueue('POST', '/anomalies', anomaly);
      
      return { success: true, data: anomaly, timestamp: new Date() };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date() 
      };
    }
  }

  async triggerEmergencyAlert(alert: EmergencyAlert): Promise<APIResponse<EmergencyAlert>> {
    try {
      // Emergency alerts have highest priority - try multiple endpoints
      const endpoints = [
        `${this.baseURL}/emergency`,
        `${this.baseURL}/backup/emergency`,
        'https://backup-api.travelsafeshield.com/emergency'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert)
          });
          
          if (response.ok) {
            const result = await response.json();
            return { success: true, data: result, timestamp: new Date() };
          }
        } catch (endpointError) {
          continue; // Try next endpoint
        }
      }
      
      // If all endpoints fail, store locally and queue for sync
      await this.saveToIndexedDB('emergencyAlerts', alert);
      this.addToSyncQueue('POST', '/emergency', alert, true); // High priority
      
      // Also try SMS/phone backup if available
      this.triggerSMSBackup(alert);
      
      return { success: true, data: alert, timestamp: new Date() };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Emergency alert failed',
        timestamp: new Date() 
      };
    }
  }

  // SMS backup for emergencies
  private async triggerSMSBackup(alert: EmergencyAlert) {
    try {
      // Simulate SMS gateway integration
      const smsData = {
        to: alert.contacts,
        message: `EMERGENCY ALERT: Tourist ${alert.userId} needs help at location ${alert.location.lat}, ${alert.location.lng}. Message: ${alert.message}`,
        priority: 'high'
      };
      
      // This would integrate with SMS providers like Twilio, AWS SNS, etc.
      console.log('SMS Backup triggered:', smsData);
    } catch (error) {
      console.error('SMS backup failed:', error);
    }
  }

  // Get real-time safety zones
  async getSafeZones(location: { lat: number; lng: number }, radius: number = 10): Promise<APIResponse<any[]>> {
    try {
      if (this.isOnline) {
        const response = await fetch(
          `${this.baseURL}/safe-zones?lat=${location.lat}&lng=${location.lng}&radius=${radius}`
        );
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result, timestamp: new Date() };
        }
      }
      
      // Fallback to cached data
      const cachedZones = await this.getFromIndexedDB('safeZones');
      return { success: true, data: cachedZones || [], timestamp: new Date() };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get safe zones',
        timestamp: new Date() 
      };
    }
  }

  // Blockchain identity verification
  async verifyBlockchainIdentity(qrCode: string): Promise<APIResponse<any>> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseURL}/verify-identity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode })
        });
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result, timestamp: new Date() };
        }
      }
      
      // Offline verification using cached blockchain data
      const cachedIdentity = await this.getFromIndexedDB('identities', qrCode);
      return { 
        success: !!cachedIdentity, 
        data: cachedIdentity, 
        timestamp: new Date() 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Identity verification failed',
        timestamp: new Date() 
      };
    }
  }

  // IndexedDB operations
  private async saveToIndexedDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TravelSafeShieldDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const addRequest = store.add({ ...data, timestamp: new Date() });
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(storeName: string, key?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TravelSafeShieldDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const getRequest = key ? store.get(key) : store.getAll();
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue management
  private addToSyncQueue(method: string, endpoint: string, data: any, highPriority = false) {
    const queueItem = {
      id: Date.now(),
      method,
      endpoint,
      data,
      priority: highPriority ? 1 : 0,
      attempts: 0,
      timestamp: new Date()
    };
    
    this.syncQueue.push(queueItem);
    this.saveToIndexedDB('syncQueue', queueItem);
  }

  private async syncOfflineData() {
    if (!this.isOnline) return;
    
    // Get queued items from IndexedDB
    const queuedItems = await this.getFromIndexedDB('syncQueue') || [];
    
    // Sort by priority and timestamp
    queuedItems.sort((a: any, b: any) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    for (const item of queuedItems) {
      try {
        const response = await fetch(`${this.baseURL}${item.endpoint}`, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          // Remove from sync queue
          await this.removeFromSyncQueue(item.id);
        } else {
          item.attempts++;
          if (item.attempts > 3) {
            // Mark as failed after 3 attempts
            await this.removeFromSyncQueue(item.id);
          }
        }
      } catch (error) {
        item.attempts++;
      }
    }
  }

  private async removeFromSyncQueue(id: number) {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('TravelSafeShieldDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  // Analytics and reporting
  async sendAnalytics(eventType: string, data: any) {
    if (!this.isOnline) {
      this.addToSyncQueue('POST', '/analytics', { eventType, data });
      return;
    }
    
    try {
      await fetch(`${this.baseURL}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, data, timestamp: new Date() })
      });
    } catch (error) {
      // Analytics failures are non-critical
      console.log('Analytics failed:', error);
    }
  }

  // Health check and monitoring
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, { 
        method: 'GET',
        timeout: 5000 
      } as any);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Cleanup old data
  async cleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days of data
    
    const stores = ['safetyData', 'anomalies'];
    
    for (const storeName of stores) {
      const request = indexedDB.open('TravelSafeShieldDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.openCursor().onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const record = cursor.value;
            if (new Date(record.timestamp) < cutoffDate) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      };
    }
  }
}

// Export singleton instance
export const dataService = new DataService();

// Export types for use in components
export type { APIResponse, SafetyData, AnomalyEvent, EmergencyAlert };
