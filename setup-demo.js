#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Travel Safe Shield - Demo Setup');
console.log('=====================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`📦 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function setupDemo() {
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      log('❌ Please run this script from the project root directory', 'red');
      process.exit(1);
    }

    log('🎯 Setting up Travel Safe Shield Demo Environment', 'bright');
    log('This will install dependencies, set up the database, and create demo data.\n', 'yellow');

    // Step 1: Install frontend dependencies
    log('📋 Step 1: Installing Frontend Dependencies', 'cyan');
    runCommand('npm install --legacy-peer-deps', 'Installing frontend dependencies');

    // Step 2: Install backend dependencies
    log('\n📋 Step 2: Installing Backend Dependencies', 'cyan');
    if (!fs.existsSync('backend/node_modules')) {
      runCommand('cd backend && npm install', 'Installing backend dependencies');
    } else {
      log('✅ Backend dependencies already installed', 'green');
    }

    // Step 3: Create demo data
    log('\n📋 Step 3: Creating Demo Data', 'cyan');
    runCommand('cd backend && node demo-data.js', 'Generating demo users and data');

    // Step 4: Create startup scripts
    log('\n📋 Step 4: Creating Startup Scripts', 'cyan');
    createStartupScripts();

    // Step 5: Create demo instructions
    log('\n📋 Step 5: Creating Demo Instructions', 'cyan');
    createDemoInstructions();

    // Success message
    log('\n🎉 Demo Setup Complete!', 'green');
    log('=====================================', 'green');
    log('\n📱 Demo Login Credentials:', 'bright');
    log('Email: john.smith@example.com | Password: password123', 'yellow');
    log('Email: sarah.johnson@example.com | Password: password123', 'yellow');
    log('Email: raj.patel@example.com | Password: password123', 'yellow');
    log('Email: maria.garcia@example.com | Password: password123', 'yellow');
    log('Email: yuki.tanaka@example.com | Password: password123', 'yellow');
    log('Email: alex.muller@example.com | Password: password123', 'yellow');

    log('\n🚀 To start the demo:', 'bright');
    log('1. Run: npm run demo', 'cyan');
    log('2. Open: http://localhost:5173', 'cyan');
    log('3. Login with any demo account', 'cyan');
    log('4. Explore all features!', 'cyan');

    log('\n📊 Demo Features Available:', 'bright');
    log('• User Registration & Blockchain Identity', 'green');
    log('• Real-time GPS Tracking', 'green');
    log('• AI Safety Scoring', 'green');
    log('• Emergency Alert System', 'green');
    log('• Police Dashboard', 'green');
    log('• Voice Assistant (3 Languages)', 'green');
    log('• AI Anomaly Detection', 'green');
    log('• Trust Network System', 'green');
    log('• Interactive Maps', 'green');

    log('\n🎯 Demo Scenarios:', 'bright');
    log('1. Register as a new tourist', 'yellow');
    log('2. Enable location tracking', 'yellow');
    log('3. Trigger emergency alerts', 'yellow');
    log('4. View police dashboard', 'yellow');
    log('5. Test voice commands', 'yellow');
    log('6. Explore blockchain features', 'yellow');

  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function createStartupScripts() {
  // Create demo start script
  const demoScript = `#!/bin/bash
echo "🚀 Starting Travel Safe Shield Demo..."
echo "====================================="

# Start backend server
echo "📡 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Demo servers started!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "WebSocket: ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait $FRONTEND_PID $BACKEND_PID
`;

  fs.writeFileSync('start-demo.sh', demoScript);
  fs.chmodSync('start-demo.sh', '755');

  // Create Windows batch file
  const demoBatch = `@echo off
echo 🚀 Starting Travel Safe Shield Demo...
echo =====================================

echo 📡 Starting backend server...
start /B cmd /c "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo 🌐 Starting frontend server...
start /B cmd /c "npm run dev"

echo ✅ Demo servers started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo WebSocket: ws://localhost:8080
echo.
echo Press any key to stop servers
pause > nul

taskkill /F /IM node.exe
`;

  fs.writeFileSync('start-demo.bat', demoBatch);

  // Update package.json with demo script
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.demo = 'concurrently "cd backend && npm start" "npm run dev"';
  
  // Add concurrently if not present
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  if (!packageJson.devDependencies.concurrently) {
    packageJson.devDependencies.concurrently = '^8.2.2';
  }

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

function createDemoInstructions() {
  const instructions = `# Travel Safe Shield - Demo Instructions

## 🚀 Quick Start

1. **Start the Demo:**
   \`\`\`bash
   npm run demo
   \`\`\`

2. **Open the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - WebSocket: ws://localhost:8080

## 👤 Demo Accounts

| Email | Password | Nationality | Role |
|-------|----------|-------------|------|
| john.smith@example.com | password123 | USA | Tourist |
| sarah.johnson@example.com | password123 | UK | Tourist |
| raj.patel@example.com | password123 | India | Tourist |
| maria.garcia@example.com | password123 | Spain | Tourist |
| yuki.tanaka@example.com | password123 | Japan | Tourist |
| alex.muller@example.com | password123 | Germany | Tourist |

## 🎯 Demo Scenarios

### 1. User Registration & Blockchain Identity
- Click "Register" tab
- Fill in user details
- System automatically generates blockchain wallet
- View wallet address and QR code

### 2. Real-time GPS Tracking
- Login with any demo account
- Enable location services
- Watch real-time location updates
- View safety score calculations

### 3. Emergency Alert System
- Click the red SOS button
- Test voice-activated emergency ("Emergency" or "Help")
- View alerts in police dashboard
- Test different alert types and severities

### 4. Police Dashboard
- Switch to "Police" tab
- View all registered tourists
- Monitor real-time locations on map
- Respond to emergency alerts
- View safety statistics

### 5. Voice Assistant
- Click microphone button
- Try commands in English, Hindi, or Assamese:
  - "Emergency" - Triggers emergency alert
  - "Where am I" - Shows current location
  - "Safety score" - Reports safety status
  - "Emergency contacts" - Lists contacts

### 6. AI Anomaly Detection
- Move to different locations
- System detects unusual patterns
- View anomaly alerts
- Test automatic emergency triggers

### 7. Trust Network
- Add other users to trust network
- View trust scores and interactions
- Test blockchain-based trust transactions

### 8. Interactive Maps
- View tourist locations
- See police stations and hospitals
- Identify threat zones
- Track emergency responses

## 🔧 Technical Features

### Backend APIs
- **Authentication:** JWT-based user auth
- **Real-time:** WebSocket connections
- **Database:** SQLite with full schema
- **Blockchain:** Wallet generation and transactions
- **AI:** Safety scoring and anomaly detection

### Frontend Features
- **React + TypeScript:** Modern UI framework
- **Leaflet Maps:** Interactive mapping
- **Voice Recognition:** Multi-language support
- **Real-time Updates:** WebSocket integration
- **Responsive Design:** Mobile-friendly interface

### AI & Blockchain
- **Safety Scoring:** Location-based risk assessment
- **Anomaly Detection:** Movement pattern analysis
- **Blockchain Identity:** Secure wallet system
- **Trust Network:** Reputation-based system
- **Emergency Response:** Automated alert system

## 📱 Mobile Testing

1. **Enable Location Services** in browser
2. **Allow Microphone Access** for voice features
3. **Test on Different Devices** for responsiveness
4. **Simulate Movement** by changing location

## 🎪 Presentation Tips

### For Investors
- Emphasize **market readiness**
- Show **real-time capabilities**
- Demonstrate **AI integration**
- Highlight **blockchain security**

### For Government Officials
- Focus on **public safety**
- Show **police dashboard**
- Demonstrate **emergency response**
- Highlight **data privacy**

### For Tourists
- Show **ease of use**
- Demonstrate **safety features**
- Test **voice commands**
- Show **multi-language support**

## 🐛 Troubleshooting

### Common Issues
1. **Location not working:** Enable location services
2. **Voice not working:** Allow microphone access
3. **Map not loading:** Check internet connection
4. **Backend errors:** Restart backend server

### Reset Demo Data
\`\`\`bash
cd backend
node demo-data.js
\`\`\`

## 📞 Support

For technical support or questions:
- Check console logs for errors
- Verify all services are running
- Ensure all dependencies are installed
- Check network connectivity

---

**Travel Safe Shield** - AI-Powered Tourist Safety Platform
Market Ready • Government Grade • Blockchain Secured
`;

  fs.writeFileSync('DEMO_INSTRUCTIONS.md', instructions);
}

// Run the setup
setupDemo();
