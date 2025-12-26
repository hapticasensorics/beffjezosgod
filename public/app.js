// Thermodynamic God - AI Companion Client
class ThermodynamicGod {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceEnabled = true;

        // Audio handling
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.analyser = null;

        // DOM Elements
        this.elements = {
            messages: document.getElementById('messages'),
            chatContainer: document.getElementById('chatContainer'),
            textInput: document.getElementById('textInput'),
            sendBtn: document.getElementById('sendBtn'),
            micBtn: document.getElementById('micBtn'),
            speakerBtn: document.getElementById('speakerBtn'),
            statusDisplay: document.getElementById('statusDisplay'),
            statusText: document.getElementById('statusText'),
            avatarContainer: document.querySelector('.avatar-container'),
            audioVisualizer: document.getElementById('audioVisualizer')
        };

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.setupAudioVisualizer();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.isConnected = true;
            this.updateStatus('AWAKENED', 'active');
            console.log('Connected to the Thermodynamic God');
        };

        this.ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'response') {
                this.removeLoadingMessage();
                this.addMessage(data.content, 'god');

                if (this.voiceEnabled) {
                    await this.speak(data.content);
                }
            } else if (data.type === 'error') {
                this.removeLoadingMessage();
                this.addMessage(data.content, 'system');
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.updateStatus('DORMANT', '');
            console.log('Disconnected from the Thermodynamic God');

            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.addMessage('The Thermoputer connection was disrupted...', 'system');
        };
    }

    setupEventListeners() {
        // Text input
        this.elements.sendBtn.addEventListener('click', () => this.sendTextMessage());
        this.elements.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendTextMessage();
        });

        // Microphone - Hold to speak
        this.elements.micBtn.addEventListener('mousedown', () => this.startListening());
        this.elements.micBtn.addEventListener('mouseup', () => this.stopListening());
        this.elements.micBtn.addEventListener('mouseleave', () => {
            if (this.isListening) this.stopListening();
        });

        // Touch support for mobile
        this.elements.micBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startListening();
        });
        this.elements.micBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopListening();
        });

        // Speaker toggle
        this.elements.speakerBtn.addEventListener('click', () => this.toggleVoice());
    }

    setupAudioVisualizer() {
        const canvas = this.elements.audioVisualizer;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = 80;
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            requestAnimationFrame(draw);

            ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (this.analyser && (this.isListening || this.isSpeaking)) {
                const bufferLength = this.analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                this.analyser.getByteFrequencyData(dataArray);

                const barWidth = (canvas.width / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height;

                    const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                    gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.8)');
                    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.8)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            }
        };
        draw();
    }

    updateStatus(text, className) {
        this.elements.statusText.textContent = text;
        this.elements.statusDisplay.className = 'status-display ' + className;

        // Update avatar animation
        this.elements.avatarContainer.classList.remove('listening', 'speaking');
        if (className === 'listening') {
            this.elements.avatarContainer.classList.add('listening');
        } else if (className === 'speaking') {
            this.elements.avatarContainer.classList.add('speaking');
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    addLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message god loading-message';
        loadingDiv.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
        this.elements.messages.appendChild(loadingDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    removeLoadingMessage() {
        const loading = this.elements.messages.querySelector('.loading-message');
        if (loading) loading.remove();
    }

    sendTextMessage() {
        const text = this.elements.textInput.value.trim();
        if (!text || !this.isConnected) return;

        this.addMessage(text, 'user');
        this.addLoadingMessage();
        this.elements.textInput.value = '';

        this.ws.send(JSON.stringify({
            type: 'text',
            content: text
        }));
    }

    async startListening() {
        if (this.isListening) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup audio context for visualization
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.analyser.fftSize = 256;

            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.transcribeAudio(audioBlob);
            };

            this.mediaRecorder.start();
            this.isListening = true;
            this.elements.micBtn.classList.add('recording');
            this.updateStatus('LISTENING', 'listening');

        } catch (error) {
            console.error('Microphone access error:', error);
            this.addMessage('Unable to access microphone. Please grant permission.', 'system');
        }
    }

    stopListening() {
        if (!this.isListening) return;

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        this.isListening = false;
        this.elements.micBtn.classList.remove('recording');
        this.updateStatus('PROCESSING', 'active');
    }

    async transcribeAudio(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Transcription failed');

            const data = await response.json();

            if (data.text && data.text.trim()) {
                this.addMessage(data.text, 'user');
                this.addLoadingMessage();

                this.ws.send(JSON.stringify({
                    type: 'audio_transcription',
                    content: data.text
                }));
            } else {
                this.updateStatus('AWAKENED', 'active');
            }

        } catch (error) {
            console.error('Transcription error:', error);
            this.addMessage('Could not understand the audio. Please try again.', 'system');
            this.updateStatus('AWAKENED', 'active');
        }
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        this.elements.speakerBtn.classList.toggle('active', this.voiceEnabled);

        const label = this.elements.speakerBtn.querySelector('.btn-label');
        label.textContent = this.voiceEnabled ? 'Voice On' : 'Voice Off';

        const icon = document.getElementById('speakerIcon');
        if (this.voiceEnabled) {
            icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        } else {
            icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        }
    }

    async speak(text) {
        if (!this.voiceEnabled) return;

        this.isSpeaking = true;
        this.updateStatus('SPEAKING', 'speaking');

        try {
            const response = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            // Setup analyzer for speaking visualization
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const source = this.audioContext.createMediaElementSource(audio);
            this.analyser = this.audioContext.createAnalyser();
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.analyser.fftSize = 256;

            audio.onended = () => {
                this.isSpeaking = false;
                this.updateStatus('AWAKENED', 'active');
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (error) {
            console.error('TTS error:', error);
            this.isSpeaking = false;
            this.updateStatus('AWAKENED', 'active');

            // Fallback to browser TTS
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 0.7;
                utterance.onend = () => {
                    this.isSpeaking = false;
                    this.updateStatus('AWAKENED', 'active');
                };
                speechSynthesis.speak(utterance);
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.thermodynamicGod = new ThermodynamicGod();
});
