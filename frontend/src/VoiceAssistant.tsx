import React, { useEffect, useState, useRef } from 'react';
import SpeechRecognition, {
  useSpeechRecognition
} from 'react-speech-recognition';
import { sendChatMessage } from './api';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

const VoiceConsole: React.FC = () => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition }
    = useSpeechRecognition();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'wake' | 'command'>('wake');
  const [isActive, setIsActive] = useState(false);
  const [commandBuffer, setCommandBuffer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isCancel = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Enhanced speech synthesis with better voice selection
  const speakText = (text: string, priority: 'high' | 'normal' = 'normal') => {
    if (isCancel.current) return;

    // Cancel current speech if high priority
    if (priority === 'high') {
      window.speechSynthesis.cancel();
    }

    // Pause speech recognition while AI is speaking
    setIsSpeaking(true);
    SpeechRecognition.stopListening();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Select the best available voice
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') && voice.name.includes('Female')
    ) || voices.find(voice => 
      voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.name.includes('Female')
    ) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    // Resume listening after speech ends
    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening after a short delay to avoid picking up the end of speech
      setTimeout(() => {
        if (!isCancel.current) {
          SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
        }
      }, 500);
    };

    // Handle speech errors
    utterance.onerror = () => {
      setIsSpeaking(false);
      setTimeout(() => {
        if (!isCancel.current) {
          SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
        }
      }, 500);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Audio visualization setup
  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && listening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.warn('Audio visualization not available:', error);
    }
  };

  // Check for wake word and handle commands
  useEffect(() => {
    // Don't process transcript if AI is speaking
    if (transcript.trim() && !isCancel.current && !isSpeaking) {
      console.log('You said →', transcript);
      
      if (mode === 'wake') {
        // Check for wake phrase - Changed to "hello hexa"
        if (transcript.toLowerCase().includes('hello hexa')) {
          console.log('Wake word detected!');
          setMode('command');
          setIsActive(true);
          resetTranscript();
          setCommandBuffer('');
          setShowWaveform(true);
          
          // Enhanced wake response - Changed to Hexa
          speakText("Hello! Hexa AI is now active. What can I help you with?", 'high');
        }
      } else if (mode === 'command' && !isProcessing) {
        // Buffer the command and set auto-processing timeout
        setCommandBuffer(transcript);
        
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set timeout - auto-process after 3 seconds of no new speech
        timeoutRef.current = setTimeout(() => {
          if (transcript.trim() && !isCancel.current && !isSpeaking) {
            handleCommand(transcript);
          }
        }, 3000);
      }
    }
  }, [transcript, mode, isProcessing, isSpeaking]);

  const handleCommand = async (command: string) => {
    if (isCancel.current) return;
    
    setIsProcessing(true);
    
    try {
      console.log('Processing command:', command);
      
      // Enhanced processing feedback
      speakText("Processing your request. Please wait...", 'normal');
      
      const response = await sendChatMessage(command);
      console.log('API response:', response);
      
      // Handle different action types with appropriate responses
      if (response.action_type === 'navigate' && response.route) {
        console.log('Navigating to:', response.route);
        speakText("Navigating to the requested page.", 'high');
        navigate(response.route);
      } else if (response.action_type === 'create' && response.api_call) {
        console.log('Making API call:', response.api_call);
        
        try {
          let apiResponse;
          
          if (response.api_call.method === 'POST') {
            apiResponse = await api.post(response.api_call.endpoint, response.api_call.data);
          } else if (response.api_call.method === 'GET') {
            apiResponse = await api.get(response.api_call.endpoint);
          } else if (response.api_call.method === 'PUT') {
            apiResponse = await api.put(response.api_call.endpoint, response.api_call.data);
          } else if (response.api_call.method === 'DELETE') {
            apiResponse = await api.delete(response.api_call.endpoint);
          }
          
          console.log('API call successful:', apiResponse?.data);
          
          // Enhanced success feedback
          if (!isCancel.current) {
            speakText("Operation completed successfully! Your request has been processed.", 'high');
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
          
          // Enhanced error feedback
          if (!isCancel.current) {
            speakText("I'm sorry, but I encountered an error while processing your request. Please try again.", 'high');
          }
        }
      } else {
        // For unknown action types or no action type
        if (!isCancel.current) {
          speakText("I can't process those details right now. Please try a different request.", 'high');
        }
      }
      
      // Reset to wake mode after processing
      resetToWakeMode();
    } catch (error) {
      console.error('Error processing command:', error);
      
      // Enhanced error feedback
      if (!isCancel.current) {
        speakText("I apologize, but I'm having trouble processing your request right now. Please try again in a moment.", 'high');
      }
      
      resetToWakeMode();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToWakeMode = () => {
    setMode('wake');
    setIsActive(false);
    resetTranscript();
    setCommandBuffer('');
    setShowWaveform(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleCancel = () => {
    isCancel.current = true;
    window.speechSynthesis.cancel();
    SpeechRecognition.stopListening();
    setIsSpeaking(false);
    resetToWakeMode();
    setIsProcessing(false);
    
    // Reset cancel flag after a short delay
    setTimeout(() => {
      isCancel.current = false;
    }, 500);
  };

  // Start listening on component mount
  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      isCancel.current = false;
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
      setupAudioVisualization();
    }
  }, [browserSupportsSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!browserSupportsSpeechRecognition) {
    return <p>Your browser does not support the Web Speech API.</p>;
  }

  const start = () => {
    isCancel.current = false;
    SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
  };

  const stop = () => {
    handleCancel();
  };

  const toggle = () => {
    if (listening) {
      stop();
    } else {
      start();
    }
  };

  // Generate waveform bars - Fixed animation property issue
  const generateWaveform = () => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      const height = Math.random() * 30 + 5;
      bars.push(
        <div
          key={i}
          style={{
            width: '3px',
            height: `${height}px`,
            backgroundColor: isActive ? '#00ff41' : '#00bcd4',
            margin: '0 1px',
            borderRadius: '2px',
            opacity: listening ? 1 : 0.3,
            // Fixed: Using separate animation properties instead of shorthand
            animationName: listening ? `waveform-${i % 3}` : 'none',
            animationDuration: '1s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${i * 0.1}s`
          }}
        />
      );
    }
    return bars;
  };

  return (
    <>
      <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000 }}>
        {/* Main Voice Assistant Button */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Outer Ring Animation */}
          <div
            style={{
              position: 'absolute',
              width: listening ? '100px' : '70px',
              height: listening ? '100px' : '70px',
              borderRadius: '50%',
              border: `2px solid ${isActive ? '#00ff41' : '#00bcd4'}`,
              opacity: listening ? 0.6 : 0.3,
              animationName: listening ? 'pulse-ring' : 'none',
              animationDuration: '2s',
              animationTimingFunction: 'ease-out',
              animationIterationCount: 'infinite',
              transition: 'all 0.3s ease'
            }}
          />
          
          {/* Inner Ring Animation */}
          <div
            style={{
              position: 'absolute',
              width: listening ? '80px' : '60px',
              height: listening ? '80px' : '60px',
              borderRadius: '50%',
              border: `1px solid ${isActive ? '#00ff41' : '#00bcd4'}`,
              opacity: listening ? 0.8 : 0.5,
              animationName: listening ? 'pulse-ring' : 'none',
              animationDuration: '2s',
              animationTimingFunction: 'ease-out',
              animationIterationCount: 'infinite',
              animationDelay: '0.5s',
              transition: 'all 0.3s ease'
            }}
          />

          {/* Main Button */}
          <button
            onClick={toggle}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              background: isProcessing 
                ? 'linear-gradient(45deg, #ff6b35, #f7931e)' 
                : isSpeaking
                  ? 'linear-gradient(45deg, #9c27b0, #673ab7)'
                  : isActive 
                    ? 'linear-gradient(45deg, #00ff41, #00e676)' 
                    : listening 
                      ? 'linear-gradient(45deg, #00bcd4, #00acc1)' 
                      : 'linear-gradient(45deg, #455a64, #607d8b)',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              boxShadow: listening 
                ? `0 0 20px ${isActive ? '#00ff41' : '#00bcd4'}` 
                : '0 4px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              zIndex: 10,
              position: 'relative'
            }}
            title={
              isProcessing ? 'Processing command...' :
              isSpeaking ? 'AI is speaking...' :
              isActive ? 'Hexa Active - Say your command' :
              listening ? 'Listening for "Hello Hexa"' :
              'Click to activate Hexa AI'
            }
          >
            {isProcessing ? '⚡' : isSpeaking ? '🔊' : isActive ? '🎯' : '🤖'}
          </button>

          {/* Cancel button when processing */}
          {isProcessing && (
            <button
              onClick={handleCancel}
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                color: 'white',
                fontSize: 10,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(244,67,54,0.4)',
                zIndex: 11
              }}
              title="Cancel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Futuristic Status Panel */}
        {(listening || isSpeaking) && (
          <div
            style={{
              marginTop: 15,
              padding: '15px 20px',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(30,30,30,0.9))',
              borderRadius: 15,
              minWidth: 280,
              fontSize: 14,
              border: `2px solid ${isActive ? '#00ff41' : '#00bcd4'}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(${isActive ? '0,255,65' : '0,188,212'},0.2)`,
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontFamily: 'Monaco, "Courier New", monospace'
            }}
          >
            {/* Status Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 10
            }}>
              <div style={{ 
                color: isActive ? '#00ff41' : '#00bcd4',
                fontSize: 12,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {isProcessing ? 'PROCESSING' : 
                 isSpeaking ? 'AI SPEAKING' :
                 isActive ? 'HEXA ACTIVE' : 'STANDBY MODE'}
              </div>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%',
                backgroundColor: isActive ? '#00ff41' : '#00bcd4',
                animationName: 'pulse-dot',
                animationDuration: '1s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite'
              }} />
            </div>

            {/* Waveform Visualization */}
            {showWaveform && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 40,
                marginBottom: 10
              }}>
                {generateWaveform()}
              </div>
            )}

            {/* Command Display */}
            <div style={{ 
              minHeight: 20,
              color: '#fff',
              fontSize: 13,
              lineHeight: '1.4'
            }}>
              {isProcessing ? 
                <span style={{ color: '#ff6b35' }}>Processing your request...</span> :
                isSpeaking ?
                  <span style={{ color: '#9c27b0' }}>AI is speaking... (mic paused)</span> :
                  isActive ? 
                    <span>
                      {commandBuffer ? 
                        <><span style={{ color: '#00ff41' }}>Command:</span> "{commandBuffer}"</> : 
                        <span style={{ color: '#00bcd4' }}>Listening for your command...</span>
                      }
                    </span> : 
                    <span style={{ color: '#00bcd4' }}>Say "Hello Hexa" to activate</span>
              }
            </div>

            {/* Audio Level Indicator */}
            <div style={{ 
              marginTop: 10,
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(audioLevel * 2, 100)}%`,
                backgroundColor: isActive ? '#00ff41' : '#00bcd4',
                transition: 'width 0.1s ease',
                borderRadius: 2
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Futuristic CSS Animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes waveform-0 {
          0%, 100% { height: 5px; }
          50% { height: 25px; }
        }
        
        @keyframes waveform-1 {
          0%, 100% { height: 8px; }
          50% { height: 30px; }
        }
        
        @keyframes waveform-2 {
          0%, 100% { height: 3px; }
          50% { height: 20px; }
        }
      `}</style>
    </>
  );
};

export default VoiceConsole;
