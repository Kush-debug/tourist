# Travel Safe Shield - Demo Instructions

## 🚀 Quick Start

1. **Start the Demo:**
   ```bash
   npm run demo
   ```

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
```bash
cd backend
node demo-data.js
```

## 📞 Support

For technical support or questions:
- Check console logs for errors
- Verify all services are running
- Ensure all dependencies are installed
- Check network connectivity

---

**Travel Safe Shield** - AI-Powered Tourist Safety Platform
Market Ready • Government Grade • Blockchain Secured
