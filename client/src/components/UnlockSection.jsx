import { useState } from 'react'
import './UnlockSection.css'

function UnlockSection() {
  const [unlocking, setUnlocking] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUnlock = async () => {
    setUnlocking(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/door/unlock', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.simulated ? 
          '✅ Door unlock simulated (GPIO not available)' : 
          '✅ Door unlocked successfully!'
        )
        
        // Start countdown
        const duration = data.duration / 1000
        setCountdown(duration)
        
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              setUnlocking(false)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || 'Failed to unlock door')
        setUnlocking(false)
      }
    } catch (err) {
      setError('Network error')
      setUnlocking(false)
    }
  }

  return (
    <div className="unlock-section">
      <div className="unlock-card card">
        <h2>Door Control</h2>
        <p className="unlock-description">
          Click the button below to unlock the door. It will automatically lock again after 8 seconds.
        </p>

        <button 
          className="btn btn-success unlock-button"
          onClick={handleUnlock}
          disabled={unlocking}
        >
          {unlocking ? '🔓 Unlocking...' : '🔓 Unlock Door'}
        </button>

        {countdown > 0 && (
          <div className="countdown-container">
            <div className="countdown-bar">
              <div 
                className="countdown-progress"
                style={{ width: `${(countdown / 8) * 100}%` }}
              ></div>
            </div>
            <p className="countdown-text">
              Auto-locking in {countdown} second{countdown !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="info-card card">
        <h3>ℹ️ Information</h3>
        <ul className="info-list">
          <li>The door will remain unlocked for exactly 8 seconds</li>
          <li>Access is logged for security purposes</li>
          <li>Only authorized users can unlock the door</li>
          <li>In case of emergency, use the physical override</li>
        </ul>
      </div>
    </div>
  )
}

export default UnlockSection
