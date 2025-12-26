import './VolumeIndicator.css'

function VolumeIndicator({ volume, frequencies, isSpeaking, isListening }) {
  // Determine the active state for styling
  const mode = isSpeaking ? 'speaking' : isListening ? 'listening' : 'inactive'

  return (
    <div className={`volume-indicator ${mode}`}>
      {/* Circular volume ring around text */}
      <div className="volume-ring-container">
        <svg className="volume-ring" viewBox="0 0 100 100">
          <circle
            className="volume-ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="3"
          />
          <circle
            className="volume-ring-fill"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="4"
            strokeDasharray={`${volume * 283} 283`}
            strokeLinecap="round"
          />
        </svg>
        <span className="volume-label">
          {isSpeaking ? 'OUTPUT' : 'INPUT'}
        </span>
      </div>

      {/* Frequency bars */}
      <div className="frequency-bars">
        {frequencies.slice(0, 16).map((freq, i) => (
          <div
            key={i}
            className="freq-bar"
            style={{
              height: `${Math.max(4, freq * 100)}%`,
              opacity: 0.4 + freq * 0.6
            }}
          />
        ))}
      </div>

      {/* dB level indicator */}
      <div className="db-level">
        <span className="db-value">{Math.round(volume * 100)}</span>
        <span className="db-unit">%</span>
      </div>
    </div>
  )
}

export default VolumeIndicator
