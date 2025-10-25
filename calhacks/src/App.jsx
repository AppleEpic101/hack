import { useState, useRef, useEffect } from 'react'
import './App.css'
import WaveformVisualizer from './components/WaveformVisualizer'

const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [recordingUrl, setRecordingUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioStream, setAudioStream] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (isRecording) {
      // Start 30-second timer
      setTimeLeft(30)
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            stopRecording()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else {
      // Clear timer when stopping
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Got audio stream:', stream);
      setAudioStream(stream)
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordingUrl(audioUrl)
        
        // Save the file
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.wav')
        
        // Here you would typically send this to your server
        // For now, we'll just create a download link
        const downloadLink = document.createElement('a')
        downloadLink.href = audioUrl
        downloadLink.download = `parkisense-recording-${new Date().toISOString()}.wav`
        downloadLink.click()
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Error accessing microphone. Please ensure you have granted permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setAudioStream(null)
    }
  }

  const handleRecordButton = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ParkiSense</h1>
        <p className="subtitle">AI Voice Analysis for Early Parkinson's Detection</p>
      </header>
      
      <main className="main-content">
        <div className="recording-section">
          <div className="recording-visualizer">
            <WaveformVisualizer 
              audioStream={audioStream} 
              isRecording={isRecording}
            />
          </div>
          
          <button 
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecordButton}
          >
            {isRecording ? 'Stop Recording' : 'Start Voice Analysis'}
          </button>
          
          <div className="instructions">
            {!isRecording ? (
              <p>Click the button and say "ahhh" for 30 seconds</p>
            ) : (
              <div>
                <p>Recording... Keep saying "ahhh"</p>
                <p className="timer">Time remaining: {timeLeft} seconds</p>
              </div>
            )}
          </div>
          
          {recordingUrl && !isRecording && (
            <div className="recording-playback">
              <h3>Review Recording</h3>
              <div className="audio-player">
                <button 
                  className="play-button"
                  onClick={() => {
                    const audioElement = document.getElementById('recording-audio');
                    if (audioElement.paused) {
                      audioElement.play();
                      setIsPlaying(true);
                    } else {
                      audioElement.pause();
                      setIsPlaying(false);
                    }
                  }}
                >
                  <span className="play-icon">{isPlaying ? '⏸' : '▶'}</span>
                </button>
                
                <div className="progress-bar-container">
                  <input
                    type="range"
                    className="progress-bar"
                    value={progress}
                    min="0"
                    max="100"
                    onChange={(e) => {
                      const audio = document.getElementById('recording-audio');
                      const time = (audio.duration * e.target.value) / 100;
                      audio.currentTime = time;
                      setProgress(e.target.value);
                    }}
                  />
                  <div className="time-display">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
              
              <audio 
                id="recording-audio" 
                src={recordingUrl}
                onTimeUpdate={(e) => {
                  setCurrentTime(e.target.currentTime);
                  setProgress((e.target.currentTime / e.target.duration) * 100);
                }}
                onLoadedMetadata={(e) => {
                  setDuration(e.target.duration);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setProgress(0);
                  setCurrentTime(0);
                }}
              />
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="results-section">
            <h2>Analysis Results</h2>
            {/* Results will be displayed here */}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>This tool is for screening purposes only and does not constitute medical advice. 
           Please consult with a healthcare professional for proper diagnosis.</p>
      </footer>
    </div>
  )
}

export default App
