# Thermodynamic God - System Architecture

## Overview

Thermodynamic God is an interactive AI voice experience deployed as kiosk installations on Raspberry Pi devices. Users tap to summon the "Thermodynamic God" and engage in voice conversations powered by ElevenLabs' Conversational AI.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
│                    (Tap screen, speak into mic)                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RASPBERRY PI KIOSK                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Chromium Browser (Kiosk Mode)                              │   │
│  │  - Fullscreen, no UI chrome                                 │   │
│  │  - Auto-granted mic permissions                             │   │
│  │  - Serves http://localhost:3000                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React App (Static Build)                                   │   │
│  │  - FireVolumeArc visualization                              │   │
│  │  - ElevenLabs React SDK                                     │   │
│  │  - Idle timeout auto-disconnect                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Node.js serve (systemd service)                            │   │
│  │  - Serves static files on port 3000                         │   │
│  │  - Auto-restarts on failure                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ WebRTC
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ELEVENLABS CLOUD                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Conversational AI Agent                                    │   │
│  │  - Agent ID: agent_0401kdc3mwc7e978bwp99qzty7e4            │   │
│  │  - Real-time speech-to-text                                 │   │
│  │  - LLM processing (Thermodynamic God persona)               │   │
│  │  - Text-to-speech response                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. React Application (`react-app/`)

The frontend is a Vite-built React application with the following structure:

```
react-app/
├── src/
│   ├── App.jsx              # Main component, conversation logic
│   ├── App.css              # Global styles
│   ├── components/
│   │   ├── FireVolumeArc.jsx    # Canvas-based fire visualization
│   │   └── FireVolumeArc.css
│   └── hooks/
│       └── useAudioAnalyzer.js  # (legacy, now using ElevenLabs SDK)
├── index.html
├── vite.config.js
└── package.json
```

#### Key Features

**Conversation Flow (`App.jsx`)**
- Uses `@elevenlabs/react` SDK's `useConversation` hook
- WebRTC connection for low-latency audio streaming
- States: `TAP TO SUMMON` → `AWAKENING` → `LISTENING` ↔ `SPEAKING`
- Auto-disconnect after 60 seconds of idle (no voice activity)

**Fire Visualization (`FireVolumeArc.jsx`)**
- Canvas-based particle system
- Particles spawn along a semi-circular arc at screen bottom
- Height and intensity respond to voice volume
- Color shifts: cyan/blue when listening, orange/red when speaking

**Volume Detection**
- Uses ElevenLabs SDK's `conversation.getInputVolume()` for mic input
- Smoothed volume values for stable visualization
- Activity threshold (>0.06) resets idle timer

### 2. ElevenLabs Integration

The app connects directly to ElevenLabs' Conversational AI service:

```javascript
const conversation = useConversation({
  connectionDelay: { default: 0, android: 0, ios: 0 },
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
  onError: (error) => console.error('Error:', error),
})

// Start session
await conversation.startSession({
  agentId: AGENT_ID,
  connectionType: 'webrtc',
})
```

**Connection Type**: WebRTC for real-time bidirectional audio
**Agent Configuration**: Managed in ElevenLabs dashboard (voice, persona, knowledge base)

### 3. Raspberry Pi Kiosk Infrastructure

Each kiosk runs on a Raspberry Pi 5 with the following stack:

#### Boot Sequence
```
Power On
    │
    ▼
Boot (no splash screen) ──── ~2-3 seconds saved
    │
    ▼
Auto-login to desktop (user: deepai)
    │
    ▼
Autostart: kiosk.sh
    │
    ├── Disable screen blanking (xset)
    ├── Hide cursor (unclutter)
    └── Launch Chromium in kiosk mode
            │
            ▼
        Load http://localhost:3000
            │
            ▼
        React app ready for interaction
```

#### Systemd Service (`thermodynamic-god.service`)
```ini
[Unit]
Description=Thermodynamic God React App
After=network.target

[Service]
Type=simple
User=deepai
WorkingDirectory=/home/deepai/beffjezosgod/react-app
ExecStart=/usr/bin/npx serve -s dist -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Chromium Kiosk Flags
```bash
chromium --noerrdialogs --disable-infobars --kiosk --incognito \
  --password-store=basic \           # Disable keyring prompt
  --use-fake-ui-for-media-stream \   # Auto-grant mic permissions
  --autoplay-policy=no-user-gesture-required \  # Allow audio autoplay
  --disable-features=TranslateUI \   # Disable translation popup
  http://localhost:3000
```

## Deployment

### Repository Structure
```
beffjezosgod/
├── react-app/           # Main application
├── install-kiosk.sh     # One-command Pi setup
├── ARCHITECTURE.md      # This file
├── .gitignore
└── (legacy server files)
```

### GitHub Repository
- **URL**: https://github.com/hapticasensorics/beffjezosgod
- **Branch**: `thermodynamic-god`

### Initial Pi Setup

Run on a fresh Raspberry Pi:
```bash
curl -sSL https://raw.githubusercontent.com/hapticasensorics/beffjezosgod/thermodynamic-god/install-kiosk.sh | bash
```

The install script:
1. Installs Node.js, git, unclutter, chromium
2. Clones the repository
3. Builds the React app
4. Creates systemd service
5. Configures kiosk autostart
6. Enables auto-login
7. Disables splash screen
8. Creates deploy script

### Updating Deployed Kiosks

**From any machine with SSH access:**
```bash
ssh deepai@<PI_IP> "~/beffjezosgod/deploy.sh"
```

**Deploy script performs:**
1. `git fetch && git reset --hard origin/thermodynamic-god`
2. `npm install`
3. `npm run build`
4. `sudo systemctl restart thermodynamic-god`

### Development Workflow

```
Local Development (Windows)
         │
         │  Edit code in react-app/
         │
         ▼
    git add && git commit && git push
         │
         │
         ▼
    GitHub (thermodynamic-god branch)
         │
         │  SSH into each Pi
         │
         ▼
    ~/beffjezosgod/deploy.sh
         │
         │
         ▼
    Kiosk updated and running
```

## Current Fleet

| Hostname | IP Address     | Purpose |
|----------|---------------|---------|
| deepai   | 192.168.1.241 | Kiosk 1 |
| deepai2  | 192.168.1.91  | Kiosk 2 |
| deepai3  | 192.168.1.200 | Kiosk 3 |

**SSH Access**: `ssh deepai@<IP>` (password: deepai)

## Configuration

### ElevenLabs Agent
- **Agent ID**: `agent_0401kdc3mwc7e978bwp99qzty7e4`
- **Dashboard**: https://elevenlabs.io/app/conversational-ai
- Configure voice, persona, and behavior in the ElevenLabs dashboard

### Application Constants (`App.jsx`)
```javascript
const AGENT_ID = 'agent_0401kdc3mwc7e978bwp99qzty7e4'
const IDLE_DISCONNECT_MS = 60_000  // 60 second idle timeout
```

## Troubleshooting

### Service not running
```bash
sudo systemctl status thermodynamic-god
sudo journalctl -u thermodynamic-god -f
```

### Restart kiosk browser
```bash
pkill chromium
~/beffjezosgod/kiosk.sh &
```

### Full reboot
```bash
sudo reboot
```

### Check current version
```bash
cd ~/beffjezosgod && git log -1 --oneline
```

### Manual deploy
```bash
cd ~/beffjezosgod
git fetch origin
git reset --hard origin/thermodynamic-god
cd react-app
npm install
npm run build
sudo systemctl restart thermodynamic-god
```
