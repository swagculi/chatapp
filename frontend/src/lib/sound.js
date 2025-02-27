// Audio context for web audio API
let audioContext = null;

// Initialize audio context on first user interaction
export const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

// Play notification sound
export const playNotificationSound = async () => {
  try {
    // Check if audio is enabled in local storage
    const soundEnabled = localStorage.getItem('chat-sound-enabled') !== 'false';
    
    if (!soundEnabled) return;
    
    // Initialize audio context if needed
    initAudio();
    
    // Fetch the audio file
    const response = await fetch('/sounds/notification.mp3');
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create a buffer source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    // Play the sound
    source.start();
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}; 