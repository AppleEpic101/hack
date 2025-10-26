import { useState, useRef, useEffect } from 'react'
import './App.css'
import WaveformVisualizer from './components/WaveformVisualizer'
import Dashboard from './components/Dashboard'
import './Dashboard.css'

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
  const [dashboardEntries, setDashboardEntries] = useState([])
  const [view, setView] = useState('main') // 'main' or 'dashboard'

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioElementRef = useRef(null)

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
        // Optionally, you can still prepare the formData for upload here if needed
        // const formData = new FormData()
        // formData.append('audio', audioBlob, 'recording.wav')
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
        <nav style={{ marginTop: '1.5rem' }}>
          <button className="record-button" style={{ marginRight: 12 }} onClick={() => setView('main')}>Main</button>
          <button className="record-button" onClick={() => setView('dashboard')}>Dashboard</button>
        </nav>
      </header>
      <main className="main-content">
        {view === 'dashboard' ? (
          <Dashboard entries={dashboardEntries} />
        ) : (
          <div className="recording-section">
            <div className="recording-visualizer">
              <WaveformVisualizer 
                audioStream={audioStream}
                isRecording={isRecording}
                audioElement={audioElementRef.current}
                isPlaying={isPlaying}
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
                <p>Click the button and speak for 30 seconds</p>
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
                  ref={audioElementRef}
                  src={recordingUrl}
                  onTimeUpdate={(e) => {
                    setCurrentTime(e.target.currentTime);
                    setProgress((e.target.currentTime / e.target.duration) * 100);
                  }}
                  onLoadedMetadata={(e) => {
                    setDuration(e.target.duration);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    setProgress(0);
                    setCurrentTime(0);
                  }}
                />
                <div style={{ marginTop: '1em' }}>
                  <a
                    href={recordingUrl}
                    download={`parkisense-recording-${new Date().toISOString()}.wav`}
                    className="download-link"
                  >
                    Download Recording
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
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
