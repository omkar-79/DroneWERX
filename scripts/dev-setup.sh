#!/bin/bash

# DroneWERX Development Setup Script
# This script sets up the development environment for the DroneWERX project

set -e

echo "🚀 Setting up DroneWERX Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed (for local development)
check_node() {
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed. You can still use Docker for development."
    else
        NODE_VERSION=$(node --version)
        log_success "Node.js is installed: $NODE_VERSION"
    fi
}

# Create environment files
setup_env_files() {
    log_info "Setting up environment files..."
    
    # Backend environment file
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/env.example" ]; then
            cp backend/env.example backend/.env
            log_success "Created backend/.env from example"
        else
            log_error "backend/env.example not found"
            exit 1
        fi
    else
        log_warning "backend/.env already exists, skipping..."
    fi
    
    # Frontend environment file
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:4000/api/v1
REACT_APP_GRAPHQL_URL=http://localhost:4000/graphql
REACT_APP_WS_URL=ws://localhost:4000/graphql
GENERATE_SOURCEMAP=false
FAST_REFRESH=true
EOF
        log_success "Created frontend/.env"
    else
        log_warning "frontend/.env already exists, skipping..."
    fi
}

# Generate secure secrets
generate_secrets() {
    log_info "Generating secure secrets..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Update backend .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secure-jwt-secret-key-here-minimum-32-characters/$JWT_SECRET/g" backend/.env
        sed -i '' "s/your-super-secure-refresh-secret-key-here-minimum-32-characters/$JWT_REFRESH_SECRET/g" backend/.env
        sed -i '' "s/your-32-character-encryption-key-here/$ENCRYPTION_KEY/g" backend/.env
    else
        # Linux
        sed -i "s/your-super-secure-jwt-secret-key-here-minimum-32-characters/$JWT_SECRET/g" backend/.env
        sed -i "s/your-super-secure-refresh-secret-key-here-minimum-32-characters/$JWT_REFRESH_SECRET/g" backend/.env
        sed -i "s/your-32-character-encryption-key-here/$ENCRYPTION_KEY/g" backend/.env
    fi
    
    log_success "Generated secure secrets"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    directories=(
        "backend/logs"
        "backend/uploads"
        "nginx/ssl"
        "nginx/logs"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        fi
    done
}

# Install dependencies locally (optional)
install_dependencies() {
    if command -v node &> /dev/null; then
        log_info "Installing local dependencies (optional for development)..."
        
        # Backend dependencies
        if [ -d "backend" ]; then
            cd backend
            if [ -f "package.json" ]; then
                npm install
                log_success "Installed backend dependencies"
            fi
            cd ..
        fi
        
        # Frontend dependencies
        if [ -d "frontend" ]; then
            cd frontend
            if [ -f "package.json" ]; then
                npm install
                log_success "Installed frontend dependencies"
            fi
            cd ..
        fi
    else
        log_warning "Node.js not found, skipping local dependency installation"
    fi
}

# Start development environment
start_development() {
    log_info "Starting development environment..."
    
    # Build and start containers
    docker-compose --profile development up --build -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Development environment started successfully!"
        
        echo ""
        echo "🎉 DroneWERX is ready for development!"
        echo ""
        echo "📱 Services:"
        echo "   • Frontend:      http://localhost:3000"
        echo "   • Backend API:   http://localhost:4000"
        echo "   • GraphQL:       http://localhost:4000/graphql"
        echo "   • PgAdmin:       http://localhost:8080"
        echo "   • Redis Commander: http://localhost:8081"
        echo ""
        echo "🗃️  Database:"
        echo "   • PostgreSQL:    localhost:5432"
        echo "   • Redis:         localhost:6379"
        echo ""
        echo "🔧 Quick commands:"
        echo "   • View logs:     docker-compose logs -f"
        echo "   • Stop services: docker-compose down"
        echo "   • Restart:       docker-compose restart"
        echo ""
    else
        log_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Run database migrations and seeding
setup_database() {
    log_info "Setting up database..."
    
    # Wait a bit more for database to be fully ready
    sleep 5
    
    # Run migrations
    if docker-compose exec -T backend npm run migrate; then
        log_success "Database migrations completed"
    else
        log_warning "Database migrations failed, but continuing..."
    fi
    
    # Seed database
    if docker-compose exec -T backend npm run seed; then
        log_success "Database seeded successfully"
    else
        log_warning "Database seeding failed, but continuing..."
    fi
}

# Main execution
main() {
    echo ""
    log_info "Starting DroneWERX development setup..."
    echo ""
    
    # Pre-flight checks
    check_docker
    check_node
    
    # Setup process
    setup_env_files
    generate_secrets
    create_directories
    
    # Ask user if they want to install local dependencies
    if command -v node &> /dev/null; then
        echo ""
        read -p "Install local Node.js dependencies? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_dependencies
        fi
    fi
    
    # Start development environment
    echo ""
    read -p "Start development environment now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_development
        setup_database
    else
        log_info "Setup complete! Run 'docker-compose --profile development up -d' to start."
    fi
}

# Run main function
main "$@" 