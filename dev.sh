#!/bin/bash

# Development helper script for Secure Document Vault

case "$1" in
  db-start)
    echo "Starting database only..."
    sudo docker-compose -f docker-compose.dev-db.yml up -d
    echo "Database started! Connect at localhost:3306"
    echo "Adminer UI: http://localhost:8080"
    ;;

  db-stop)
    echo "Stopping database..."
    sudo docker-compose -f docker-compose.dev-db.yml down
    ;;

  db-logs)
    sudo docker-compose -f docker-compose.dev-db.yml logs -f mysql
    ;;

  backend-start)
    echo "Starting backend with hot-reload..."
    cd backend && npm run dev:local:watch
    ;;

  backend-test)
    echo "Testing database connection..."
    cd backend && npm run dev:local
    ;;

  full-start)
    echo "Starting full stack in Docker..."
    sudo docker-compose up -d
    ;;

  full-stop)
    echo "Stopping full stack..."
    sudo docker-compose down
    ;;

  *)
    echo "Secure Document Vault - Development Commands"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  db-start        - Start only MySQL database in Docker"
    echo "  db-stop         - Stop database"
    echo "  db-logs         - Show database logs"
    echo "  backend-start   - Run backend locally with hot-reload"
    echo "  backend-test    - Test backend without hot-reload"
    echo "  full-start      - Start everything in Docker"
    echo "  full-stop       - Stop everything"
    echo ""
    echo "Recommended workflow:"
    echo "  1. ./dev.sh db-start"
    echo "  2. ./dev.sh backend-start (in another terminal)"
    echo ""
    ;;
esac
