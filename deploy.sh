#!/bin/bash
# Thermodynamic God Deployment Script
# This script is auto-generated on each Pi by install-kiosk.sh
# Run with: ~/beffjezosgod/deploy.sh

set -e

INSTALL_DIR="${INSTALL_DIR:-$HOME/beffjezosgod}"
BRANCH="${BRANCH:-thermodynamic-god}"

echo "Pulling latest changes..."
cd "$INSTALL_DIR"
git fetch origin
git reset --hard origin/$BRANCH

# Ensure scripts are executable
chmod +x "$INSTALL_DIR/kiosk.sh" "$INSTALL_DIR/deploy.sh" 2>/dev/null || true

echo "Installing dependencies..."
cd "$INSTALL_DIR/react-app"
npm install

echo "Building app..."
npm run build

echo "Restarting service..."
sudo systemctl restart thermodynamic-god

echo "Deployment complete!"
sleep 2
systemctl status thermodynamic-god --no-pager
