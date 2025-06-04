# DroneWERX - Military Drone Challenge Platform

A secure, containerized discussion platform for the US Drone Association where warfighters post drone challenges and innovators provide solutions.

---

## 🏁 One-Click Setup

Run the setup script to configure everything (env, DB, storage, etc):

```sh
bash scripts/dev-setup.sh
```
This will:
- Check/install dependencies
- Set up environment files
- Run database migrations and seed data
- Start all services via Docker Compose

---

## 🖼️ Media Management

- All media (images, videos, documents) are stored in Minio object storage.
- Media is organized by thread/solution and shown in a responsive gallery.
- Thumbnails and previews are generated automatically.
- Permissions: Only authors, moderators, and admins can delete attachments.
- Secure download URLs and file type validation.
- See [ROBUST_MEDIA_STORAGE.md](ROBUST_MEDIA_STORAGE.md) for full details.

---

## 👤 User Roles & Platform Features

- **Warfighter**: Post challenges, accept solutions, award bounties, comment, upvote.
- **Innovator**: Submit solutions, comment, upvote, build a public portfolio.
- **Moderator/Admin**: Moderate content, manage users, view audit logs.
- **All users**: View and search challenges, comment, upvote, bookmark, manage profile.

### What You Can Do
- Post and solve real-world drone challenges
- Attach and manage media files
- Award and win bounties
- Track stats and contributions
- Collaborate securely with role-based permissions

---

## 🚀 Features

- Challenge and solution workflow
- Media gallery with thumbnails and permissions
- Bounty and reward system
- Real-time stats and notifications
- Role-based access control (Warfighter, Innovator, Moderator, Admin)
- Secure, auditable, and scalable infrastructure

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Node.js API   │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 4000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │      Redis      │
                       │   (Port 6379)   │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup

```bash
git clone https://github.com/omkar-79/DroneWERX.git
cd DroneWERX

# Copy environment files
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment variables (see Configuration section)
```

### 2. Development Environment

```bash
# Start all services
docker-compose --profile development up -d

# Or build and start
docker-compose --profile development up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Production Environment

```bash
# Start production services
docker-compose --profile production up -d

# With nginx reverse proxy
docker-compose --profile production up --build -d
```

## 🔧 Configuration

### Backend Environment Variables (backend/.env)

```bash
# Database
DATABASE_URL="postgresql://dronewerx:secure_password@localhost:5432/dronewerx_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT Security
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here-minimum-32-characters

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (frontend/.env)

```bash
REACT_APP_API_URL=http://localhost:4000/api/v1
REACT_APP_GRAPHQL_URL=http://localhost:4000/graphql
REACT_APP_WS_URL=ws://localhost:4000/graphql
```

## 🐳 Docker Services

| Service | Description | Port | Health Check |
|---------|-------------|------|--------------|
| `postgres` | PostgreSQL 15 Database | 5432 | `pg_isready` |
| `redis` | Redis 7 Cache | 6379 | `redis-cli ping` |
| `backend` | Node.js API Server | 4000 | `/health` endpoint |
| `frontend` | React Application | 3000 | Nginx health |
| `pgadmin` | Database Admin (dev) | 8080 | Web interface |
| `redis-commander` | Redis Admin (dev) | 8081 | Web interface |
| `nginx` | Reverse Proxy (prod) | 80/443 | Health check |

## 🛠️ Development

### Local Development (without Docker)

```bash
# Backend
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed

# Generate Prisma client
docker-compose exec backend npm run generate

# Reset database
docker-compose exec backend npx prisma migrate reset

# View database
open http://localhost:8080  # PgAdmin
# Email: admin@dronewerx.local
# Password: admin_password_change
```

### Redis Operations

```bash
# View Redis data
open http://localhost:8081  # Redis Commander

# Connect to Redis CLI
docker-compose exec redis redis-cli
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Permission-based API endpoints
- Session management with Redis
- Token blacklisting support

### Data Security
- AES encryption for sensitive data
- bcrypt password hashing
- Input sanitization and validation
- SQL injection prevention (Prisma ORM)
- XSS protection headers

### Infrastructure Security
- Security headers (Helmet.js)
- Rate limiting per IP
- CORS configuration
- Container security (non-root users)
- Network isolation
- Health monitoring

### Audit & Compliance
- Comprehensive audit logging
- Security event tracking
- Failed login attempt monitoring
- Data access logging
- Error tracking and alerting

## 📊 Monitoring & Logging

### Health Checks

```bash
# Backend API
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000/health

# Database
docker-compose exec postgres pg_isready -U dronewerx -d dronewerx_db
```

### Log Files

```bash
# View backend logs
docker-compose exec backend tail -f logs/app.log

# View all service logs
docker-compose logs -f --tail=100

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔄 API Documentation

### REST Endpoints

```
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

# Threads
GET    /api/v1/threads
POST   /api/v1/threads
GET    /api/v1/threads/:id
PUT    /api/v1/threads/:id
DELETE /api/v1/threads/:id

# Solutions
GET    /api/v1/solutions
POST   /api/v1/solutions
PUT    /api/v1/solutions/:id
DELETE /api/v1/solutions/:id

# Users
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
GET    /api/v1/users/:id
```

### GraphQL Endpoint

```
# GraphQL Playground
http://localhost:4000/graphql
```

## 🗄️ Database Schema

### Key Tables
- `users` - User accounts and profiles
- `threads` - Challenge discussions
- `solutions` - Innovation solutions
- `comments` - Thread discussions
- `votes` - Upvote/downvote system
- `attachments` - File uploads
- `audit_logs` - Security audit trail

### Relationships
- Users can create multiple threads
- Threads can have multiple solutions
- Solutions can have comments and votes
- Anonymous posting supported
- Role-based permissions enforced

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Restart PostgreSQL
   docker-compose restart postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

3. **Frontend Not Loading**
   ```bash
   # Check frontend container
   docker-compose ps frontend
   
   # Rebuild frontend
   docker-compose build frontend
   ```

4. **Permission Denied Errors**
   ```bash
   # Fix file permissions
   sudo chown -R $(whoami):$(whoami) .
   ```

### Development Reset

```bash
# Complete reset (removes all data)
docker-compose down -v
docker-compose build --no-cache
docker-compose --profile development up -d

# Reset database only
docker-compose exec backend npm run migrate:reset
```

## 🎯 Production Deployment

### Environment Setup

1. Update all passwords in environment files
2. Configure SSL certificates
3. Set up monitoring and alerting
4. Configure backup strategies
5. Review security configurations

### SSL Configuration

```bash
# Generate SSL certificates (example with Let's Encrypt)
mkdir -p nginx/ssl
# Add your SSL certificate files to nginx/ssl/
```

### Performance Optimization

- Enable Redis persistence
- Configure database connection pooling
- Set up CDN for static assets
- Implement caching strategies
- Monitor resource usage

## 📚 Technology Stack

### Backend
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **Authentication**: JWT + bcrypt
- **API**: REST + GraphQL (Apollo Server)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Joi + class-validator

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand + React Query
- **UI**: Tailwind CSS + Lucide Icons
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios + GraphQL Request

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Database Admin**: PgAdmin 4
- **Cache Admin**: Redis Commander
- **Logging**: Centralized logging
- **Monitoring**: Health checks + metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request



## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section

---

**Built with ❤️ for the US Drone Association**
