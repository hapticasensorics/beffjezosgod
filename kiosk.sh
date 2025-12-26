#!/bin/bash
# Thermodynamic God Kiosk Launcher
# This script is auto-generated on each Pi by install-kiosk.sh
# Launched automatically on desktop login via ~/.config/autostart/kiosk.desktop

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
