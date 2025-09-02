const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'travel-safe-shield-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite Database
const db = new sqlite3.Database('./travel_safe_shield.db');

// Create tables
const initializeDatabase = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      nationality TEXT,
      phone_number TEXT,
      blockchain_wallet TEXT UNIQUE,
      blockchain_private_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tourists table
  db.run(`
    CREATE TABLE IF NOT EXISTS tourists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      nationality TEXT,
      phone_number TEXT,
      current_location_lat REAL,
      current_location_lng REAL,
      current_location_address TEXT,
      safety_score INTEGER DEFAULT 100,
      status TEXT DEFAULT 'safe',
      emergency_contacts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Emergency alerts table
  db.run(`
    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tourist_id INTEGER,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      response_time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (tourist_id) REFERENCES tourists (id)
    )
  `);

  // Trust network table
  db.run(`
    CREATE TABLE IF NOT EXISTS trust_network (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      trusted_user_id INTEGER,
      trust_score INTEGER DEFAULT 50,
      interaction_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (trusted_user_id) REFERENCES users (id)
    )
  `);

  // Safety incidents table
  db.run(`
    CREATE TABLE IF NOT EXISTS safety_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tourist_id INTEGER,
      incident_type TEXT NOT NULL,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      description TEXT,
      severity TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tourist_id) REFERENCES tourists (id)
    )
  `);

  // Police stations table
  db.run(`
    CREATE TABLE IF NOT EXISTS police_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location_lat REAL NOT NULL,
      location_lng REAL NOT NULL,
      address TEXT,
      phone_number TEXT,
      emergency_number TEXT,
      active BOOLEAN DEFAULT TRUE
    )
  `);

  // Hospitals table
  db.run(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location_lat REAL NOT NULL,
      location_lng REAL NOT NULL,
      address TEXT,
      phone_number TEXT,
      emergency_number TEXT,
      active BOOLEAN DEFAULT TRUE
    )
  `);

  console.log('Database tables initialized successfully');
};

// Initialize database
initializeDatabase();

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

// Store active connections
const connections = new Map();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth') {
        connections.set(data.userId, ws);
        ws.userId = data.userId;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      connections.delete(ws.userId);
    }
  });
});

// Utility functions
const generateBlockchainWallet = () => {
  const privateKey = crypto.randomBytes(32).toString('hex');
  const wallet = crypto.createHash('sha256').update(privateKey).digest('hex').substring(0, 40);
  return { wallet, privateKey };
};

const calculateSafetyScore = (tourist) => {
  let score = 100;
  
  // Reduce score based on location risk
  if (tourist.current_location_address) {
    const riskyAreas = ['railway station', 'construction', 'isolated', 'night'];
    riskyAreas.forEach(area => {
      if (tourist.current_location_address.toLowerCase().includes(area)) {
        score -= 15;
      }
    });
  }
  
  // Reduce score based on time (night time is riskier)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    score -= 10;
  }
  
  // Reduce score if no recent location update
  const lastUpdate = new Date(tourist.updated_at);
  const now = new Date();
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
  if (hoursSinceUpdate > 2) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
};

const broadcastToConnections = (data) => {
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Travel Safe Shield Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth/*',
      tourists: '/api/tourists/*',
      emergencies: '/api/emergencies/*',
      police: '/api/police-stations',
      hospitals: '/api/hospitals',
      trust: '/api/trust/*'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, nationality, phone_number } = req.body;
    
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Generate blockchain wallet
      const { wallet, privateKey } = generateBlockchainWallet();
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert user
      db.run(
        'INSERT INTO users (email, password_hash, name, nationality, phone_number, blockchain_wallet, blockchain_private_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, passwordHash, name, nationality, phone_number, wallet, privateKey],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          // Create tourist profile
          db.run(
            'INSERT INTO tourists (user_id, name, nationality, phone_number) VALUES (?, ?, ?, ?)',
            [this.lastID, name, nationality, phone_number],
            function(err) {
              if (err) {
                console.error('Failed to create tourist profile:', err);
              }
            }
          );
          
          res.status(201).json({
            message: 'User created successfully',
            user: {
              id: this.lastID,
              email,
              name,
              nationality,
              phone_number,
              blockchain_wallet: wallet
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nationality: user.nationality,
        phone_number: user.phone_number,
        blockchain_wallet: user.blockchain_wallet
      }
    });
  });
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      nationality: user.nationality,
      phone_number: user.phone_number,
      blockchain_wallet: user.blockchain_wallet,
      created_at: user.created_at
    });
  });
});

// Update tourist location
app.post('/api/tourist/location', authenticateToken, (req, res) => {
  const { lat, lng, address } = req.body;
  
  db.run(
    'UPDATE tourists SET current_location_lat = ?, current_location_lng = ?, current_location_address = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [lat, lng, address, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update location' });
      }
      
      // Recalculate safety score
      db.get('SELECT * FROM tourists WHERE user_id = ?', [req.user.userId], (err, tourist) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        const newSafetyScore = calculateSafetyScore(tourist);
        const status = newSafetyScore >= 80 ? 'safe' : newSafetyScore >= 60 ? 'caution' : 'emergency';
        
        db.run(
          'UPDATE tourists SET safety_score = ?, status = ? WHERE user_id = ?',
          [newSafetyScore, status, req.user.userId],
          (err) => {
            if (err) {
              console.error('Failed to update safety score:', err);
            }
            
            // Broadcast location update
            broadcastToConnections({
              type: 'location_update',
              tourist_id: req.user.userId,
              location: { lat, lng, address },
              safety_score: newSafetyScore,
              status
            });
            
            res.json({
              message: 'Location updated successfully',
              safety_score: newSafetyScore,
              status
            });
          }
        );
      });
    }
  );
});

// Create emergency alert
app.post('/api/emergency/alert', authenticateToken, (req, res) => {
  const { alert_type, severity, lat, lng, address, description } = req.body;
  
  db.get('SELECT * FROM tourists WHERE user_id = ?', [req.user.userId], (err, tourist) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!tourist) {
      return res.status(404).json({ error: 'Tourist profile not found' });
    }
    
    db.run(
      'INSERT INTO emergency_alerts (tourist_id, alert_type, severity, location_lat, location_lng, location_address, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tourist.id, alert_type, severity, lat, lng, address, description],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create emergency alert' });
        }
        
        // Update tourist status to emergency
        db.run(
          'UPDATE tourists SET status = ?, safety_score = 0 WHERE user_id = ?',
          ['emergency', req.user.userId],
          (err) => {
            if (err) {
              console.error('Failed to update tourist status:', err);
            }
          }
        );
        
        // Broadcast emergency alert
        broadcastToConnections({
          type: 'emergency_alert',
          alert_id: this.lastID,
          tourist_id: tourist.id,
          tourist_name: tourist.name,
          alert_type,
          severity,
          location: { lat, lng, address },
          description,
          timestamp: new Date().toISOString()
        });
        
        res.status(201).json({
          message: 'Emergency alert created successfully',
          alert_id: this.lastID
        });
      }
    );
  });
});

// Get all tourists (for police dashboard)
app.get('/api/tourists', authenticateToken, (req, res) => {
  db.all('SELECT * FROM tourists ORDER BY updated_at DESC', (err, tourists) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(tourists);
  });
});

// Get emergency alerts
app.get('/api/emergency/alerts', authenticateToken, (req, res) => {
  const { status = 'active' } = req.query;
  
  db.all(`
    SELECT ea.*, t.name as tourist_name, t.phone_number, t.nationality
    FROM emergency_alerts ea
    JOIN tourists t ON ea.tourist_id = t.id
    WHERE ea.status = ?
    ORDER BY ea.created_at DESC
  `, [status], (err, alerts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(alerts);
  });
});

// Update emergency alert status
app.put('/api/emergency/alerts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, response_time } = req.body;
  
  db.run(
    'UPDATE emergency_alerts SET status = ?, response_time = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, response_time, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update alert status' });
      }
      
      res.json({ message: 'Alert status updated successfully' });
    }
  );
});

// Get police stations
app.get('/api/police-stations', (req, res) => {
  db.all('SELECT * FROM police_stations WHERE active = 1', (err, stations) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(stations);
  });
});

// Get hospitals
app.get('/api/hospitals', (req, res) => {
  db.all('SELECT * FROM hospitals WHERE active = 1', (err, hospitals) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(hospitals);
  });
});

// Trust network - add trust relationship
app.post('/api/trust/add', authenticateToken, (req, res) => {
  const { trusted_user_id, trust_score } = req.body;
  
  db.run(
    'INSERT OR REPLACE INTO trust_network (user_id, trusted_user_id, trust_score, interaction_count, updated_at) VALUES (?, ?, ?, COALESCE((SELECT interaction_count FROM trust_network WHERE user_id = ? AND trusted_user_id = ?), 0) + 1, CURRENT_TIMESTAMP)',
    [req.user.userId, trusted_user_id, trust_score, req.user.userId, trusted_user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add trust relationship' });
      }
      
      res.json({ message: 'Trust relationship added successfully' });
    }
  );
});

// Get trust network
app.get('/api/trust/network', authenticateToken, (req, res) => {
  db.all(`
    SELECT tn.*, u.name as trusted_user_name, u.nationality, u.blockchain_wallet
    FROM trust_network tn
    JOIN users u ON tn.trusted_user_id = u.id
    WHERE tn.user_id = ?
    ORDER BY tn.trust_score DESC
  `, [req.user.userId], (err, network) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(network);
  });
});

// Initialize demo data
const initializeDemoData = () => {
  // Insert police stations
  const policeStations = [
    { name: 'Central Police Station', lat: 26.1445, lng: 91.7362, address: 'Pan Bazaar, Guwahati', phone: '+91-361-254-0123' },
    { name: 'Railway Police Station', lat: 26.1234, lng: 91.7123, address: 'Guwahati Railway Station', phone: '+91-361-254-0456' },
    { name: 'Airport Police Station', lat: 26.1567, lng: 91.7456, address: 'Lokpriya Gopinath Bordoloi International Airport', phone: '+91-361-254-0789' }
  ];
  
  policeStations.forEach(station => {
    db.run(
      'INSERT OR IGNORE INTO police_stations (name, location_lat, location_lng, address, phone_number) VALUES (?, ?, ?, ?, ?)',
      [station.name, station.lat, station.lng, station.address, station.phone]
    );
  });
  
  // Insert hospitals
  const hospitals = [
    { name: 'GMCH Hospital', lat: 26.1395, lng: 91.7298, address: 'Bhangagarh, Guwahati', phone: '+91-361-252-0000' },
    { name: 'Nemcare Hospital', lat: 26.1523, lng: 91.7401, address: 'Six Mile, Guwahati', phone: '+91-361-255-0000' }
  ];
  
  hospitals.forEach(hospital => {
    db.run(
      'INSERT OR IGNORE INTO hospitals (name, location_lat, location_lng, address, phone_number) VALUES (?, ?, ?, ?, ?)',
      [hospital.name, hospital.lat, hospital.lng, hospital.address, hospital.phone]
    );
  });
  
  console.log('Demo data initialized');
};

// Initialize demo data
setTimeout(initializeDemoData, 1000);

// Start server
app.listen(PORT, () => {
  console.log(`Travel Safe Shield Backend Server running on port ${PORT}`);
  console.log(`WebSocket server running on port 8080`);
});

module.exports = app;
