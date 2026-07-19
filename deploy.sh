#!/bin/bash
set -e

# Load VPS Configuration
source .vps.env

echo "=========================================="
echo "🚀 Starting Deployment of WalkWars to VPS"
echo "Host: $VPS_HOST ($VPS_IP)"
echo "Domain: $TARGET_DOMAIN"
echo "=========================================="

# 1. Ensure remote directories exist
echo "📁 Creating remote directories on VPS..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "mkdir -p /opt/walkwars/backend /var/www/freelogic /var/www/walkwars"

# 2. Transfer docker-compose.prod.yml and backend source code
echo "📦 Uploading Docker and Backend configurations..."
sshpass -p "$VPS_PASS" rsync -avz -e "ssh -o StrictHostKeyChecking=no" --exclude='target' --exclude='.git' --exclude='node_modules' ./docker-compose.prod.yml ./backend "$VPS_USER@$VPS_IP:/opt/walkwars/"

# 3. Transfer Nginx Config file
echo "🌐 Uploading Nginx Configs..."
sshpass -p "$VPS_PASS" rsync -avz -e "ssh -o StrictHostKeyChecking=no" ./freelogic.nginx.conf ./walkwars.nginx.conf "$VPS_USER@$VPS_IP:/opt/walkwars/"

# 4. Transfer Frontend React Built static assets
echo "⚛️ Uploading Frontend (React)..."
sshpass -p "$VPS_PASS" rsync -avz -e "ssh -o StrictHostKeyChecking=no" ./frontend/dist/ "$VPS_USER@$VPS_IP:/var/www/walkwars/"

# 5. Execute Remote Server Setup Actions
echo "🔧 Executing remote server setup and running containers..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" << 'EOF'
  set -e
  cd /opt/walkwars

  # Set up Env variables for Docker Compose
  echo "DB_PASSWORD=walkwars_prod_pass" > .env
  echo "JWT_SECRET=walkwars-production-secret-min-32-chars-jwt-auth" >> .env

  # Update apt packages and install docker and nginx
  echo "📥 Installing Docker and Nginx on VPS..."
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx

  # Start Docker services
  echo "🐳 Running production containers..."
  docker-compose -f docker-compose.prod.yml down --remove-orphans || true
  docker-compose -f docker-compose.prod.yml up -d --build

  # Link Nginx config files
  echo "⚙️ Linking Nginx configurations..."
  cp /opt/walkwars/freelogic.nginx.conf /etc/nginx/sites-available/freelogic
  cp /opt/walkwars/walkwars.nginx.conf /etc/nginx/sites-available/walkwars
  if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
  fi
  if [ ! -f /etc/nginx/sites-enabled/freelogic ]; then
    ln -s /etc/nginx/sites-available/freelogic /etc/nginx/sites-enabled/
  fi
  if [ ! -f /etc/nginx/sites-enabled/walkwars ]; then
    ln -s /etc/nginx/sites-available/walkwars /etc/nginx/sites-enabled/
  fi

  # Restart Nginx
  echo "🔄 Reloading Nginx service..."
  nginx -t
  systemctl reload nginx

  echo "✅ Server-side setup completed!"
EOF

echo "=========================================="
echo "🎉 Deployment successful!"
echo "Next step: Run 'certbot --nginx -d freelogic.in -d www.freelogic.in' on the VPS to enable HTTPS."
echo "=========================================="
