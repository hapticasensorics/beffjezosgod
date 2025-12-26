import { useConversation } from '@elevenlabs/react'
import { useState, useCallback, useMemo } from 'react'
import FireVolumeArc from './components/FireVolumeArc'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'
import './App.css'

// Your ElevenLabs Agent ID
const AGENT_ID = 'agent_0401kdc3mwc7e978bwp99qzty7e4'

function App() {
  const [isActive, setIsActive] = useState(false)

  // Audio analyzer for volume visualization
  const { volume, frequencies } = useAudioAnalyzer(isActive)
  const volumePercent = useMemo(
    () => Math.round(Math.max(0, Math.min(1, volume || 0)) * 100),
    [volume]
  )

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to Thermodynamic God')
    },
    onDisconnect: () => {
      console.log('Disconnected from Thermodynamic God')
      setIsActive(false)
    },
    onMessage: (message) => {
      console.log('Message:', message)
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const { status, isSpeaking } = conversation

  const toggleConversation = useCallback(async () => {
    if (isActive) {
      await conversation.endSession()
      setIsActive(false)
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        await conversation.startSession({
          agentId: AGENT_ID,
        })
        setIsActive(true)
      } catch (error) {
        console.error('Failed to start conversation:', error)
      }
    }
  }, [conversation, isActive])

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const isListening = isConnected && !isSpeaking

  return (
    <div
      className={`app ${isActive ? 'active' : ''} ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}
      onClick={!isConnecting ? toggleConversation : undefined}
    >
      {/* Fullscreen video avatar */}
      <video
        className="fullscreen-video"
        src="/avatar.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay darkening when dormant */}
      <div className={`dormant-overlay ${!isActive ? 'visible' : ''}`} />

      {/* Status indicator */}
      <div className={`status-overlay ${status} ${isSpeaking ? 'speaking' : ''}`}>
        <span className="status-dot" />
        <span className="status-text">
          {isConnecting && 'AWAKENING'}
          {isSpeaking && 'SPEAKING'}
          {isListening && 'LISTENING'}
          {!isActive && !isConnecting && 'TAP TO SUMMON'}
        </span>
      </div>

      {/* Volume readout above the fire arc */}
      {isActive && (
        <div
          className={`volume-readout ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}
          aria-live="polite"
        >
          <span className="volume-label">{isSpeaking ? 'OUTPUT' : 'INPUT'}</span>
          <span className="volume-value">{volumePercent}%</span>
        </div>
      )}

      {/* Fire volume arc at bottom */}
      <FireVolumeArc
        volume={volume}
        frequencies={frequencies}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isActive={isActive}
      />

      {/* Connecting spinner */}
      {isConnecting && (
        <div className="connecting-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  )
}

export default App
