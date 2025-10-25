import { useState } from 'react'
import './App.css'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ParkiSense</h1>
        <p className="subtitle">AI Voice Analysis for Early Parkinson's Detection</p>
      </header>
      
      <main className="main-content">
        <div className="recording-section">
          <div className="recording-visualizer">
            {/* Waveform visualization will go here */}
          </div>
          
          <button 
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? 'Stop Recording' : 'Start Voice Analysis'}
          </button>
          
          <div className="instructions">
            {!isRecording ? (
              <p>Click the button and say "ahhh" for 10 seconds</p>
            ) : (
              <p>Recording... Keep saying "ahhh"</p>
            )}
          </div>
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
