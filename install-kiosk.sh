#!/bin/bash
# Thermodynamic God Kiosk Installer
# Run on a fresh Raspberry Pi with: curl -sSL https://raw.githubusercontent.com/hapticasensorics/beffjezosgod/thermodynamic-god/install-kiosk.sh | bash

set -e

echo "============================================"
echo "  Thermodynamic God Kiosk Installer"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please run this script as a regular user, not root"
    exit 1
fi

INSTALL_DIR="$HOME/beffjezosgod"
REPO_URL="https://github.com/hapticasensorics/beffjezosgod.git"
BRANCH="thermodynamic-god"

# Step 1: Update system
log_info "Updating system packages..."
sudo apt-get update -qq

# Step 2: Install Node.js if not present
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    sudo apt-get install -y nodejs npm
    log_step "Node.js installed: $(node --version)"
else
    log_step "Node.js already installed: $(node --version)"
fi

# Step 3: Install required packages
log_info "Installing required packages..."
sudo apt-get install -y git unclutter chromium

# Step 4: Install serve globally
log_info "Installing serve..."
sudo npm install -g serve

# Step 5: Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    log_info "Updating existing installation..."
    cd "$INSTALL_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    log_info "Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    git checkout $BRANCH
fi
log_step "Repository ready"

# Step 6: Install dependencies and build
log_info "Installing dependencies..."
cd "$INSTALL_DIR/react-app"
npm install

log_info "Building application..."
npm run build
log_step "Application built"

# Step 7: Create systemd service
log_info "Creating systemd service..."
sudo tee /etc/systemd/system/thermodynamic-god.service > /dev/null << 'EOF'
[Unit]
Description=Thermodynamic God React App
After=network.target

[Service]
Type=simple
User=USER_PLACEHOLDER
WorkingDirectory=INSTALL_DIR_PLACEHOLDER/react-app
ExecStart=/usr/bin/npx serve -s dist -l 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Replace placeholders with actual values
sudo sed -i "s|USER_PLACEHOLDER|$USER|g" /etc/systemd/system/thermodynamic-god.service
sudo sed -i "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g" /etc/systemd/system/thermodynamic-god.service

sudo systemctl daemon-reload
sudo systemctl enable thermodynamic-god
sudo systemctl start thermodynamic-god
log_step "Systemd service created and started"

# Step 8: Create kiosk launch script
log_info "Creating kiosk launch script..."
cat > "$INSTALL_DIR/kiosk.sh" << 'EOF'
#!/bin/bash
# Wait for the server to start
sleep 5

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor after 0.5 seconds of inactivity
unclutter -idle 0.5 -root &

# Launch Chromium in kiosk mode
# --password-store=basic: disables keyring prompt
# --use-fake-ui-for-media-stream: auto-grants mic/camera permissions
# --autoplay-policy=no-user-gesture-required: allows audio autoplay
chromium --noerrdialogs --disable-infobars --kiosk --incognito \
  --password-store=basic \
  --use-fake-ui-for-media-stream \
  --autoplay-policy=no-user-gesture-required \
  --disable-features=TranslateUI \
  http://localhost:3000
EOF
chmod +x "$INSTALL_DIR/kiosk.sh"
log_step "Kiosk script created"

# Step 9: Create autostart entry
log_info "Creating autostart entry..."
mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Thermodynamic God Kiosk
Exec=$INSTALL_DIR/kiosk.sh
X-GNOME-Autostart-enabled=true
EOF
log_step "Autostart configured"

# Step 10: Create deploy script
log_info "Creating deploy script..."
cat > "$INSTALL_DIR/deploy.sh" << EOF
#!/bin/bash
set -e
echo "Pulling latest changes..."
cd $INSTALL_DIR
git fetch origin
git reset --hard origin/$BRANCH
echo "Installing dependencies..."
cd react-app
npm install
echo "Building app..."
npm run build
echo "Restarting service..."
sudo systemctl restart thermodynamic-god
echo "Deployment complete!"
sleep 2
systemctl status thermodynamic-god --no-pager
EOF
chmod +x "$INSTALL_DIR/deploy.sh"
log_step "Deploy script created"

# Step 11: Enable auto-login
log_info "Enabling desktop auto-login..."
sudo raspi-config nonint do_boot_behaviour B4 2>/dev/null || true
log_step "Auto-login enabled"

# Step 12: Disable screen blanking permanently
log_info "Disabling screen blanking..."
mkdir -p "$HOME/.config/lxsession/LXDE-pi"
cat > "$HOME/.config/lxsession/LXDE-pi/autostart" << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
EOF

echo ""
echo "============================================"
echo -e "${GREEN}  Installation Complete!${NC}"
echo "============================================"
echo ""
echo "The Thermodynamic God kiosk is now installed."
echo ""
echo "  App URL:     http://localhost:3000"
echo "  Install dir: $INSTALL_DIR"
echo "  Deploy:      $INSTALL_DIR/deploy.sh"
echo ""
echo "To test the kiosk mode, reboot the Pi:"
echo "  sudo reboot"
echo ""
echo "To update the app later, run:"
echo "  $INSTALL_DIR/deploy.sh"
echo ""
