import { useConversation } from '@elevenlabs/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import FireVolumeArc from './components/FireVolumeArc'
import './App.css'

// Your ElevenLabs Agent ID
const AGENT_ID = 'agent_0401kdc3mwc7e978bwp99qzty7e4'
const IDLE_DISCONNECT_MS = 60_000

function App() {
  const [isActive, setIsActive] = useState(false)

  const [inputVolume, setInputVolume] = useState(0)
  const idleTimeoutRef = useRef(null)
  const lastActivityRef = useRef(0)

  const conversation = useConversation({
    connectionDelay: {
      default: 0,
      android: 0,
      ios: 0,
    },
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

  const clearIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
  }, [])

  const scheduleIdleDisconnect = useCallback(() => {
    clearIdleTimer()
    if (!isActive) return

    const elapsed = Date.now() - lastActivityRef.current
    const delay = Math.max(0, IDLE_DISCONNECT_MS - elapsed)

    idleTimeoutRef.current = setTimeout(async () => {
      if (!isActive) return
      const idleFor = Date.now() - lastActivityRef.current
      if (idleFor < IDLE_DISCONNECT_MS) {
        scheduleIdleDisconnect()
        return
      }

      try {
        await conversation.endSession()
      } finally {
        setIsActive(false)
      }
    }, delay)
  }, [clearIdleTimer, conversation, isActive])

  const toggleConversation = useCallback(async () => {
    if (isActive) {
      clearIdleTimer()
      await conversation.endSession()
      setIsActive(false)
    } else {
      try {
        await conversation.startSession({
          agentId: AGENT_ID,
          connectionType: 'webrtc',
        })
        setIsActive(true)
        lastActivityRef.current = Date.now()
        scheduleIdleDisconnect()
      } catch (error) {
        console.error('Failed to start conversation:', error)
      }
    }
  }, [clearIdleTimer, conversation, isActive, scheduleIdleDisconnect])

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const isListening = isConnected && !isSpeaking
  const statusLabel = isConnecting
    ? 'AWAKENING'
    : !isActive
      ? 'TAP TO SUMMON'
      : isSpeaking
        ? 'SPEAKING'
        : isListening
          ? 'LISTENING'
          : 'AWAITING'

  useEffect(() => {
    if (!isActive) {
      setInputVolume(0)
      return
    }

    let rafId
    const tick = () => {
      const nextVolume = typeof conversation.getInputVolume === 'function'
        ? conversation.getInputVolume()
        : 0
      setInputVolume(Number.isFinite(nextVolume) ? nextVolume : 0)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [conversation, isActive])

  useEffect(() => {
    if (!isActive) {
      clearIdleTimer()
      return
    }

    const isUserTalking = inputVolume > 0.06
    if (isUserTalking || isSpeaking) {
      lastActivityRef.current = Date.now()
      scheduleIdleDisconnect()
    }
  }, [clearIdleTimer, inputVolume, isActive, isSpeaking, scheduleIdleDisconnect])

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
        <span className="status-text">{statusLabel}</span>
      </div>

      {/* Fire volume arc at bottom */}
      <FireVolumeArc
        volume={inputVolume}
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
