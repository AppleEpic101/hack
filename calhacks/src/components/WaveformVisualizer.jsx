import { useEffect, useRef } from 'react';

const WaveformVisualizer = ({ audioStream, isRecording, audioElement, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const previousDataRef = useRef(new Float32Array(1024).fill(0));
  const smoothingFactor = 0.75; // Adjust this value between 0 and 1 (higher = longer persistence)

  // Persist playback context/analyser/source for the same audioElement
  useEffect(() => {
    let usingPlayback = false;
    let bufferLength, dataArray;

    // For playback: only create context/source/analyser once per audioElement
    if (audioElement && !isRecording) {
      usingPlayback = true;
      if (!audioContextRef.current || audioContextRef.current._element !== audioElement) {
        // Clean up previous context if audioElement changed
        if (audioContextRef.current && audioContextRef.current.close) {
          audioContextRef.current.close();
        }
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioElement);
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        audioContext._element = audioElement; // custom property to track element
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      } else {
        // Reuse existing
        bufferLength = analyserRef.current.frequencyBinCount;
        dataArray = dataArrayRef.current;
      }
    } else if (isRecording && audioStream) {
      // For recording: always create new context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);
      analyser.fftSize = 2048;
      source.connect(analyser);
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      usingPlayback = false;
    } else {
      return;
    }

    const draw = () => {
      if (!canvasRef.current) return;
      if (usingPlayback && !(audioElement && isPlaying && !audioElement.paused)) return;
      if (!usingPlayback && !isRecording) return;

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      // Clear canvas with gradient
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgb(248, 249, 250)');
      gradient.addColorStop(1, 'rgb(240, 242, 245)');
      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(0, 0, width, height);

      // Apply smoothing
      for (let i = 0; i < bufferLength; i++) {
        const currentValue = dataArrayRef.current[i] / 128.0;
        previousDataRef.current[i] = previousDataRef.current[i] * smoothingFactor + 
                                   currentValue * (1 - smoothingFactor);
      }

      // Draw main waveform
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#4a90e2';
      canvasCtx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = previousDataRef.current[i];
        const y = (v * height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother lines
          const xc = (x + x - sliceWidth) / 2;
          const yc = (y + previousDataRef.current[i-1] * height / 2) / 2;
          canvasCtx.quadraticCurveTo(x - sliceWidth, previousDataRef.current[i-1] * height / 2, xc, yc);
        }

        x += sliceWidth;
      }

      // Add glow effect
      canvasCtx.shadowColor = '#4a90e2';
      canvasCtx.shadowBlur = 5;
      canvasCtx.stroke();
      
      // Draw a second, lighter layer for extra smoothness
      canvasCtx.beginPath();
      x = 0;
      canvasCtx.lineWidth = 1;
      canvasCtx.strokeStyle = 'rgba(74, 144, 226, 0.3)';
      canvasCtx.shadowBlur = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = previousDataRef.current[i];
        const y = (v * height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.stroke();

      // Continue animation if still playing/recording
      if ((usingPlayback && audioElement && isPlaying && !audioElement.paused) || (!usingPlayback && isRecording)) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    // Start animation
    if ((usingPlayback && audioElement && isPlaying && !audioElement.paused) || (!usingPlayback && isRecording)) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Only clean up playback context if audioElement changes or component unmounts
      if (!isRecording && audioContextRef.current && audioContextRef.current._element !== audioElement) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
      }
      // Always clean up recording context
      if (isRecording && audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [audioStream, isRecording, audioElement, isPlaying]);

  useEffect(() => {
    // Resize canvas to match container size
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default WaveformVisualizer;