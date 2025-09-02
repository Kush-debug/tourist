const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Initialize database connection
const db = new sqlite3.Database('./travel_safe_shield.db');

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
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
    `, (err) => {
      if (err) reject(err);
    });

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
    `, (err) => {
      if (err) reject(err);
    });

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
    `, (err) => {
      if (err) reject(err);
    });

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
    `, (err) => {
      if (err) reject(err);
    });

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
    `, (err) => {
      if (err) reject(err);
    });

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
    `, (err) => {
      if (err) reject(err);
    });

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
    `, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database tables initialized successfully');
        resolve();
      }
    });
  });
};

// Demo users data
const demoUsers = [
  {
    email: 'john.smith@example.com',
    password: 'password123',
    name: 'John Smith',
    nationality: 'USA',
    phone_number: '+1-555-0123'
  },
  {
    email: 'sarah.johnson@example.com',
    password: 'password123',
    name: 'Sarah Johnson',
    nationality: 'UK',
    phone_number: '+44-20-7946-0958'
  },
  {
    email: 'raj.patel@example.com',
    password: 'password123',
    name: 'Raj Patel',
    nationality: 'India',
    phone_number: '+91-98765-43210'
  },
  {
    email: 'maria.garcia@example.com',
    password: 'password123',
    name: 'Maria Garcia',
    nationality: 'Spain',
    phone_number: '+34-91-123-4567'
  },
  {
    email: 'yuki.tanaka@example.com',
    password: 'password123',
    name: 'Yuki Tanaka',
    nationality: 'Japan',
    phone_number: '+81-3-1234-5678'
  },
  {
    email: 'alex.muller@example.com',
    password: 'password123',
    name: 'Alex Muller',
    nationality: 'Germany',
    phone_number: '+49-30-12345678'
  }
];

// Demo locations in Guwahati
const demoLocations = [
  { lat: 26.1445, lng: 91.7362, address: 'Pan Bazaar, Guwahati' },
  { lat: 26.1567, lng: 91.7456, address: 'Fancy Bazaar, Guwahati' },
  { lat: 26.1234, lng: 91.7123, address: 'Guwahati Railway Station' },
  { lat: 26.1395, lng: 91.7298, address: 'GMCH Hospital, Guwahati' },
  { lat: 26.1523, lng: 91.7401, address: 'Six Mile, Guwahati' },
  { lat: 26.1689, lng: 91.7589, address: 'Airport Road, Guwahati' },
  { lat: 26.1123, lng: 91.6987, address: 'Maligaon, Guwahati' },
  { lat: 26.1789, lng: 91.7890, address: 'Dispur, Guwahati' }
];

// Generate blockchain wallet
const generateBlockchainWallet = () => {
  const privateKey = crypto.randomBytes(32).toString('hex');
  const wallet = crypto.createHash('sha256').update(privateKey).digest('hex').substring(0, 40);
  return { wallet, privateKey };
};

// Calculate safety score
const calculateSafetyScore = (location, timeOffset = 0) => {
  let score = 100;
  
  // Reduce score based on location risk
  const riskyAreas = ['railway station', 'construction', 'isolated', 'night'];
  riskyAreas.forEach(area => {
    if (location.address.toLowerCase().includes(area)) {
      score -= 15;
    }
  });
  
  // Reduce score based on time (night time is riskier)
  const hour = new Date(Date.now() + timeOffset).getHours();
  if (hour < 6 || hour > 22) {
    score -= 10;
  }
  
  // Add some randomness
  score += Math.floor(Math.random() * 20) - 10;
  
  return Math.max(0, Math.min(100, score));
};

// Get status based on safety score
const getStatusFromScore = (score) => {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'caution';
  return 'emergency';
};

// Create demo users and tourists
const createDemoUsers = async () => {
  console.log('Creating demo users...');
  
  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = ?', [userData.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Generate blockchain wallet
      const { wallet, privateKey } = generateBlockchainWallet();
      
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      // Insert user
      const userId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (email, password_hash, name, nationality, phone_number, blockchain_wallet, blockchain_private_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userData.email, passwordHash, userData.name, userData.nationality, userData.phone_number, wallet, privateKey],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Create tourist profile
      const randomLocation = demoLocations[Math.floor(Math.random() * demoLocations.length)];
      const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // Random time within last 24 hours
      const safetyScore = calculateSafetyScore(randomLocation, timeOffset);
      const status = getStatusFromScore(safetyScore);

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tourists (user_id, name, nationality, phone_number, current_location_lat, current_location_lng, current_location_address, safety_score, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " seconds"), datetime("now", "-" || ? || " seconds"))',
          [
            userId, 
            userData.name, 
            userData.nationality, 
            userData.phone_number,
            randomLocation.lat,
            randomLocation.lng,
            randomLocation.address,
            safetyScore,
            status,
            Math.floor(timeOffset / 1000),
            Math.floor(timeOffset / 1000)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`Created user: ${userData.name} (${userData.email})`);
    } catch (error) {
      console.error(`Failed to create user ${userData.email}:`, error);
    }
  }
};

// Create demo emergency alerts
const createDemoEmergencyAlerts = async () => {
  console.log('Creating demo emergency alerts...');
  
  try {
    // Get tourists
    const tourists = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM tourists', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Create some emergency alerts
    const alertTypes = ['panic', 'anomaly', 'geofence', 'manual'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const descriptions = [
      'Emergency SOS button activated',
      'Unusual movement pattern detected',
      'Entered restricted area',
      'Manual emergency report',
      'Lost contact with tourist',
      'Suspicious activity reported'
    ];

    for (let i = 0; i < 3; i++) {
      const tourist = tourists[Math.floor(Math.random() * tourists.length)];
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const location = demoLocations[Math.floor(Math.random() * demoLocations.length)];
      const timeOffset = Math.floor(Math.random() * 2 * 60 * 60 * 1000); // Within last 2 hours

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO emergency_alerts (tourist_id, alert_type, severity, location_lat, location_lng, location_address, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " seconds"))',
          [
            tourist.id,
            alertType,
            severity,
            location.lat,
            location.lng,
            location.address,
            description,
            'active',
            Math.floor(timeOffset / 1000)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`Created emergency alert for ${tourist.name}`);
    }
  } catch (error) {
    console.error('Failed to create emergency alerts:', error);
  }
};

// Create demo trust network
const createDemoTrustNetwork = async () => {
  console.log('Creating demo trust network...');
  
  try {
    // Get users
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Create trust relationships
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const user1 = users[i];
        const user2 = users[j];
        const trustScore = Math.floor(Math.random() * 40) + 30; // 30-70
        const interactionCount = Math.floor(Math.random() * 10) + 1;

        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO trust_network (user_id, trusted_user_id, trust_score, interaction_count) VALUES (?, ?, ?, ?)',
            [user1.id, user2.id, trustScore, interactionCount],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        // Create reverse relationship
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO trust_network (user_id, trusted_user_id, trust_score, interaction_count) VALUES (?, ?, ?, ?)',
            [user2.id, user1.id, trustScore, interactionCount],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }
    }

    console.log('Created trust network relationships');
  } catch (error) {
    console.error('Failed to create trust network:', error);
  }
};

// Create demo safety incidents
const createDemoSafetyIncidents = async () => {
  console.log('Creating demo safety incidents...');
  
  try {
    // Get tourists
    const tourists = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM tourists', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const incidentTypes = ['theft', 'harassment', 'lost', 'medical', 'transportation'];
    const severities = ['low', 'medium', 'high'];
    const descriptions = [
      'Wallet stolen at market',
      'Verbal harassment reported',
      'Lost in unfamiliar area',
      'Minor medical emergency',
      'Transportation issue'
    ];

    for (let i = 0; i < 5; i++) {
      const tourist = tourists[Math.floor(Math.random() * tourists.length)];
      const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const location = demoLocations[Math.floor(Math.random() * demoLocations.length)];
      const timeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last week

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO safety_incidents (tourist_id, incident_type, location_lat, location_lng, location_address, description, severity, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " seconds"))',
          [
            tourist.id,
            incidentType,
            location.lat,
            location.lng,
            location.address,
            description,
            severity,
            Math.random() > 0.3, // 70% resolved
            Math.floor(timeOffset / 1000)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`Created safety incident for ${tourist.name}`);
    }
  } catch (error) {
    console.error('Failed to create safety incidents:', error);
  }
};

// Main function to create all demo data
const createAllDemoData = async () => {
  console.log('Starting demo data creation...');
  
  try {
    // Initialize database tables first
    await initializeDatabase();
    
    await createDemoUsers();
    await createDemoEmergencyAlerts();
    await createDemoTrustNetwork();
    await createDemoSafetyIncidents();
    
    console.log('Demo data creation completed successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('Email: john.smith@example.com | Password: password123');
    console.log('Email: sarah.johnson@example.com | Password: password123');
    console.log('Email: raj.patel@example.com | Password: password123');
    console.log('Email: maria.garcia@example.com | Password: password123');
    console.log('Email: yuki.tanaka@example.com | Password: password123');
    console.log('Email: alex.muller@example.com | Password: password123');
  } catch (error) {
    console.error('Failed to create demo data:', error);
  } finally {
    db.close();
  }
};

// Run the demo data creation
createAllDemoData();
