import { useEffect, useRef } from 'react';

const WaveformVisualizer = ({ audioStream, isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const previousDataRef = useRef(new Float32Array(1024).fill(0));
  const smoothingFactor = 0.75; // Adjust this value between 0 and 1 (higher = longer persistence)

  useEffect(() => {
    console.log('WaveformVisualizer effect:', { audioStream, isRecording });
    if (!audioStream) return;

    console.log('Setting up audio context and analyzer');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    
    analyser.fftSize = 2048;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const draw = () => {
      if (!canvasRef.current || !isRecording) return;

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas with gradient
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgb(248, 249, 250)');
      gradient.addColorStop(1, 'rgb(240, 242, 245)');
      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(0, 0, width, height);

      // Apply smoothing
      for (let i = 0; i < bufferLength; i++) {
        const currentValue = dataArray[i] / 128.0;
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

      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (isRecording) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, isRecording]);

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