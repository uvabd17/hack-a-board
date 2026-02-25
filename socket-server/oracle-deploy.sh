#!/bin/bash
# ================================================================
# Hackaboard Socket Server — Oracle Cloud Always Free VM Setup
# Run this on a fresh Ubuntu 22.04 instance as the default user (ubuntu)
# Usage:
#   chmod +x oracle-deploy.sh
#   ./oracle-deploy.sh
# ================================================================

set -e

REPO_URL="https://github.com/uvabd17/hack-a-board.git"
APP_DIR="/opt/hackaboard-socket"
SERVICE_NAME="hackaboard-socket"
NODE_VERSION="20"

echo "================================================"
echo " Hackaboard Socket Server - Oracle Cloud Setup"
echo "================================================"

# ── 1. System update ────────────────────────────
echo "[1/8] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# ── 2. Install Node.js via NodeSource ───────────
echo "[2/8] Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs git

node -v && npm -v

# ── 3. Install NGINX + Certbot ──────────────────
echo "[3/8] Installing NGINX and Certbot..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

# ── 4. Clone repo and build ─────────────────────
echo "[4/8] Cloning repository and building socket server..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
    echo "Repo already cloned — pulling latest..."
    cd "$APP_DIR" && git pull
else
    git clone "$REPO_URL" /tmp/hack-a-board-clone
    cp -r /tmp/hack-a-board-clone/socket-server/. "$APP_DIR/"
    rm -rf /tmp/hack-a-board-clone
fi

cd "$APP_DIR"
npm ci
npm run build
echo "Build complete: dist/index.js"

# ── 5. Create .env file ─────────────────────────
echo "[5/8] Creating .env file..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "CLIENT_ORIGIN=https://REPLACE_WITH_YOUR_VERCEL_URL" > "$APP_DIR/.env"
    echo "EMIT_SECRET=REPLACE_WITH_YOUR_SECRET" >> "$APP_DIR/.env"
    echo "PORT=3001" >> "$APP_DIR/.env"
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file before starting the service:"
    echo "    nano $APP_DIR/.env"
fi

# ── 6. Create systemd service ───────────────────
echo "[6/8] Creating systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Hackaboard Socket.IO Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
echo "Systemd service created and enabled."

# ── 7. Configure NGINX ──────────────────────────
echo "[7/8] Configuring NGINX..."
sudo tee /etc/nginx/sites-available/hackaboard-socket > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    # WebSocket upgrade support
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Keep-alive for long-lived WebSocket connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_connect_timeout 60s;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/hackaboard-socket /etc/nginx/sites-enabled/hackaboard-socket
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "NGINX configured."

# ── 8. Open Oracle firewall (OCI iptables rule) ─
echo "[8/8] Opening port 80 and 443 in OS firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true

echo ""
echo "================================================"
echo " ✅ Setup complete!"
echo "================================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Edit secrets:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Start the service:"
echo "   sudo systemctl start $SERVICE_NAME"
echo "   sudo systemctl status $SERVICE_NAME"
echo ""
echo "3. Set up TLS (after DNS is configured):"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "4. Or use the IP address directly (HTTP):"
echo "   http://\$(curl -s ifconfig.me):3001/health"
echo ""
echo "5. View logs:"
echo "   journalctl -u $SERVICE_NAME -f"
