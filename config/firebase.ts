// Firebase Configuration for Travel Safe Shield
// Simulating Firebase for hackathon demo - replace with real Firebase config

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Mock Firebase configuration (replace with real config)
const firebaseConfig: FirebaseConfig = {
  apiKey: "demo-api-key-travel-safe-shield",
  authDomain: "travel-safe-shield.firebaseapp.com",
  projectId: "travel-safe-shield",
  storageBucket: "travel-safe-shield.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Simulated Firebase Database for hackathon
class MockFirebaseDB {
  private data: { [key: string]: any } = {};
  private listeners: { [key: string]: Function[] } = {};

  // Simulate real-time database
  ref(path: string) {
    return {
      set: (value: any) => {
        this.data[path] = value;
        this.notifyListeners(path, value);
        return Promise.resolve();
      },
      get: () => {
        return Promise.resolve({
          val: () => this.data[path],
          exists: () => !!this.data[path]
        });
      },
      on: (event: string, callback: Function) => {
        if (!this.listeners[path]) this.listeners[path] = [];
        this.listeners[path].push(callback);
      },
      off: (event: string, callback: Function) => {
        if (this.listeners[path]) {
          this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
        }
      },
      push: (value: any) => {
        const key = `${path}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.data[key] = value;
        this.notifyListeners(path, value);
        return Promise.resolve({ key });
      }
    };
  }

  private notifyListeners(path: string, value: any) {
    if (this.listeners[path]) {
      this.listeners[path].forEach(callback => {
        setTimeout(() => callback({ val: () => value }), 100);
      });
    }
  }
}

// Export mock Firebase instance
export const db = new MockFirebaseDB();

// Blockchain-lite hashing utilities
export const createHash = (data: string): string => {
  // Simple hash function for demo (use crypto.subtle in production)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

export const createMerkleRoot = (hashes: string[]): string => {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];
  
  const newLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    newLevel.push(createHash(left + right));
  }
  
  return createMerkleRoot(newLevel);
};

export { firebaseConfig };
