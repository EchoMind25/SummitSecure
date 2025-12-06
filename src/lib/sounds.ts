// Create simple audio context for web audio API sounds
const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  return new Promise<void>((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

      setTimeout(resolve, duration * 1000)
    } catch (error) {
      // Fallback to Web Audio API not available
      resolve()
    }
  })
}

// Sound effects using Web Audio API (no external files needed)
export const playSuccessSound = async () => {
  try {
    // Play a pleasant ascending chord
    await Promise.all([
      createTone(523.25, 0.2), // C5
      createTone(659.25, 0.2), // E5
      createTone(783.99, 0.2), // G5
    ])
  } catch (error) {
    console.warn('Sound playback failed:', error)
  }
}

export const playNotificationSound = async () => {
  try {
    // Simple notification beep
    await createTone(800, 0.1, 'square')
  } catch (error) {
    console.warn('Sound playback failed:', error)
  }
}

export const playUnlockSound = async () => {
  try {
    // Pleasant unlock sound
    await createTone(600, 0.15)
    setTimeout(() => createTone(800, 0.15), 100)
  } catch (error) {
    console.warn('Sound playback failed:', error)
  }
}

// Button hover sound
export const playHoverSound = async () => {
  try {
    // Soft click sound for button hovers
    await createTone(800, 0.05, 'sine')
  } catch (error) {
    // Silently fail if audio isn't supported
  }
}

// Note: For production, you might want to add actual audio files
// and use the Web Audio API or Howler.js for better cross-browser support
