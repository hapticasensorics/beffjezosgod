# Deployed Kiosks

## Fleet Overview

| Hostname | IP Address      | Status |
|----------|-----------------|--------|
| deepai   | 192.168.1.241   | Active |
| deepai2  | 192.168.1.91    | Active |
| deepai3  | 192.168.1.200   | Active |

## Hardware Specifications

Each kiosk consists of:

| Component | Specification |
|-----------|---------------|
| Computer | Raspberry Pi 5 (8GB RAM) |
| Display | Waveshare 4" Round LCD, 720x720 resolution |
| Touch | Capacitive touchscreen (built into display) |
| Audio | USB microphone + 3.5mm speaker output |
| Storage | 64GB microSD card |
| OS | Debian 13 (Trixie) / Raspberry Pi OS |

## Access Credentials

**SSH Access:**
```bash
ssh deepai@192.168.1.241   # deepai
ssh deepai@192.168.1.91    # deepai2
ssh deepai@192.168.1.200   # deepai3
```

**Password:** `deepai` (same for all units)

**Raspberry Pi Connect:** All units are registered on Raspberry Pi Connect under the Haptica Sensorics account.

## Software Stack

| Component | Details |
|-----------|---------|
| Node.js | v20.x (Debian packages) |
| Web Server | `serve` (npm package) on port 3000 |
| Browser | Chromium (kiosk mode) |
| Service | `thermodynamic-god.service` (systemd) |

## File Locations

| Path | Purpose |
|------|---------|
| `~/beffjezosgod/` | Application root |
| `~/beffjezosgod/react-app/dist/` | Built React app |
| `~/beffjezosgod/deploy.sh` | Update script |
| `~/beffjezosgod/kiosk.sh` | Chromium launcher |
| `~/.config/autostart/kiosk.desktop` | Autostart entry |
| `/etc/systemd/system/thermodynamic-god.service` | Systemd service |

## Common Commands

### Check status on all units
```bash
for ip in 192.168.1.241 192.168.1.91 192.168.1.200; do
  echo "=== $ip ==="
  ssh deepai@$ip "cd ~/beffjezosgod && git log -1 --oneline && systemctl is-active thermodynamic-god"
done
```

### Deploy to all units
```bash
for ip in 192.168.1.241 192.168.1.91 192.168.1.200; do
  echo "=== Deploying to $ip ==="
  ssh deepai@$ip "~/beffjezosgod/deploy.sh"
done
```

### Reboot all units
```bash
for ip in 192.168.1.241 192.168.1.91 192.168.1.200; do
  ssh deepai@$ip "sudo reboot"
done
```

### View logs
```bash
ssh deepai@192.168.1.241 "sudo journalctl -u thermodynamic-god -f"
```

## Network Configuration

All units are on the local network `192.168.1.x` and require local network access for:
- SSH management
- ElevenLabs API (outbound HTTPS/WebRTC)

## Display Configuration

The Waveshare 4" round display:
- Resolution: 720x720 pixels
- Connection: HDMI + USB (for touch)
- Orientation: Default (no rotation needed)
- The circular form factor is masked by the app's dark background

## Adding New Units

1. Flash Raspberry Pi OS (64-bit, with desktop) to SD card
2. Set hostname to `deepaiN` (where N is the next number)
3. Create user `deepai` with password `deepai`
4. Connect to network and note IP address
5. Run install script:
   ```bash
   curl -sSL https://raw.githubusercontent.com/hapticasensorics/beffjezosgod/thermodynamic-god/install-kiosk.sh | bash
   ```
6. Reboot and verify kiosk mode works
7. Add to Raspberry Pi Connect
8. Update this document
