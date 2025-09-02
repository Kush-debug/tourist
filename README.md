# Travel Safe Shield Backend API

A comprehensive backend system for the Travel Safe Shield tourist safety platform, featuring AI-powered emergency response, blockchain identity management, and real-time monitoring.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based auth with role-based access
- **Tourist Profile Management** - Complete tourist registration and profile management
- **Emergency Alert System** - Real-time emergency detection and response
- **Police Dashboard** - Comprehensive police interface for emergency management
- **Blockchain Integration** - Ethereum-based identity and emergency data storage
- **Real-time Communication** - WebSocket-based live updates and notifications
- **AI/ML Services** - Anomaly detection and safety scoring
- **Payment Processing** - Stripe integration for premium features
- **File Storage** - AWS S3 integration for document and image storage
- **Email & SMS Services** - Twilio and SendGrid integration
- **Analytics & Reporting** - Comprehensive analytics and reporting system

### Security Features
- **Rate Limiting** - API rate limiting and DDoS protection
- **Input Validation** - Comprehensive request validation
- **Audit Logging** - Complete audit trail for all actions
- **Data Encryption** - Sensitive data encryption at rest and in transit
- **CORS Protection** - Cross-origin resource sharing protection

## 🏗️ Architecture

```
├── src/
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── middleware/       # Express middleware
│   ├── utils/           # Utility functions
│   ├── websocket/       # WebSocket handlers
│   ├── queue/           # Job queue management
│   └── server.js        # Main server file
├── prisma/              # Database schema and migrations
├── tests/               # Test files
└── docs/                # API documentation
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Blockchain**: Ethereum (Ethers.js)
- **Real-time**: Socket.io
- **Queue**: Bull with Redis
- **File Storage**: AWS S3
- **Payment**: Stripe
- **Email**: SendGrid
- **SMS**: Twilio
- **Monitoring**: Winston logging
- **Testing**: Jest

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- Docker (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd travel-safe-shield-backend
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/travel_safe_shield"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=3001
NODE_ENV=development

# Redis
REDIS_URL="redis://localhost:6379"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="travel-safe-shield-storage"

# Blockchain
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/your-project-id"
ETHEREUM_PRIVATE_KEY="your-ethereum-private-key"

# Payment
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"

# Email & SMS
SENDGRID_API_KEY="your-sendgrid-api-key"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
POST /api/auth/logout       # Logout user
POST /api/auth/refresh      # Refresh JWT token
GET  /api/auth/me          # Get current user
POST /api/auth/forgot-password    # Request password reset
POST /api/auth/reset-password     # Reset password
```

### Tourist Endpoints

```
GET  /api/tourist/profile           # Get tourist profile
PUT  /api/tourist/profile           # Update tourist profile
POST /api/tourist/location          # Update location
GET  /api/tourist/safety-score      # Get safety score
POST /api/tourist/voice-command     # Process voice command
GET  /api/tourist/trust-network     # Get trust connections
POST /api/tourist/trust-connection  # Create trust connection
```

### Emergency Endpoints

```
POST /api/emergency/alert           # Create emergency alert
GET  /api/emergency/alerts          # Get user's emergency alerts
GET  /api/emergency/alerts/:id      # Get specific alert
PATCH /api/emergency/alerts/:id/status  # Update alert status
GET  /api/emergency/statistics      # Get emergency statistics
POST /api/emergency/manual-report   # Submit manual report
```

### Police Endpoints

```
GET  /api/police/emergency-alerts           # Get active alerts
GET  /api/police/emergency-alerts/:id       # Get alert details
POST /api/police/emergency-alerts/:id/respond  # Respond to alert
PATCH /api/police/emergency-responses/:id   # Update response
GET  /api/police/tourists                   # Get all tourists
GET  /api/police/tourists/:id               # Get tourist details
GET  /api/police/statistics                 # Get police statistics
PATCH /api/police/duty-status               # Update duty status
```

### Blockchain Endpoints

```
GET  /api/blockchain/identity               # Get blockchain identity
POST /api/blockchain/identity/verify        # Verify identity
GET  /api/blockchain/status                 # Get blockchain status
POST /api/blockchain/emergency-data         # Update emergency data
```

### Payment Endpoints

```
POST /api/payment/create-session           # Create payment session
POST /api/payment/confirm                  # Confirm payment
GET  /api/payment/history                  # Get payment history
POST /api/payment/subscription             # Manage subscription
```

## 🔧 Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testNamePattern="auth"
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Create new migration
npm run db:migrate

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t travel-safe-shield-backend .

# Run with Docker Compose
docker-compose up -d
```

### Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure load balancer
5. Set up monitoring and logging

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔒 Security

### API Security
- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers

### Data Protection
- Password hashing with bcrypt
- Sensitive data encryption
- Audit logging
- GDPR compliance features

## 📊 Monitoring

### Health Check
```
GET /health
```

### Metrics
- Request/response times
- Error rates
- Database performance
- Memory usage
- Active connections

### Logging
- Winston structured logging
- Daily log rotation
- Error tracking with Sentry
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Email: support@travelsafeshield.com
- Documentation: https://docs.travelsafeshield.com
- Issues: GitHub Issues

## 🔮 Roadmap

- [ ] Mobile app backend
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Integration with emergency services
- [ ] IoT device integration
- [ ] Advanced blockchain features
- [ ] Machine learning models
- [ ] Real-time translation
- [ ] Advanced geofencing

---

**Travel Safe Shield Backend** - Empowering tourist safety through technology

