import React, { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from './api';

// Add SpeechRecognition type for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  onNavigate?: (route: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNavigate }) => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string>('');
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    checkMicrophonePermission();
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(finalTranscript);
            setError(''); // Clear any previous errors
            handleVoiceCommand(finalTranscript);
          }
        };

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError('');
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (isActive) {
            // Restart listening if still active
            setTimeout(() => {
              if (isActive && recognitionRef.current && microphonePermission === 'granted') {
                recognitionRef.current.start();
              }
            }, 100);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          // Handle different error types
          switch (event.error) {
            case 'not-allowed':
              setError('Microphone access denied. Please enable microphone permissions or use HTTPS.');
              setMicrophonePermission('denied');
              break;
            case 'no-speech':
              setError('No speech detected. Please try again.');
              break;
            case 'network':
              setError('Network error. Please check your connection.');
              break;
            default:
              setError(`Speech recognition error: ${event.error}`);
          }
        };
      }
    } else {
      setError('Speech recognition is not supported in your browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isActive, microphonePermission]);

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(result.state as any);
        
        result.onchange = () => {
          setMicrophonePermission(result.state as any);
        };
      }
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      setError('');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicrophonePermission('denied');
      setError('Microphone access denied. Please allow microphone access in your browser settings.');
      return false;
    }
  };

  // Handle voice commands
  const handleVoiceCommand = async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Check for activation phrase
    if (lowerTranscript.includes('hello horizon') || lowerTranscript.includes('hey horizon')) {
      if (!isActive) {
        setIsActive(true);
        speak("Hello! I'm Horizon, your AI assistant. How can I help you today?");
        return;
      }
    }

    // Check for deactivation phrases
    if (lowerTranscript.includes('goodbye') || lowerTranscript.includes('stop listening') || lowerTranscript.includes('deactivate')) {
      if (isActive) {
        setIsActive(false);
        speak("Goodbye! Say 'Hello Horizon' to activate me again.");
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        return;
      }
    }

    // Process commands only if active
    if (isActive && !isProcessing) {
      setIsProcessing(true);
      try {
        const response = await sendChatMessage(transcript);
        setResponse(response.message);
        
        // Speak the response
        speak(response.message);
        
        // Handle navigation if needed
        if (response.action_type === 'navigate' && response.route && onNavigate) {
          setTimeout(() => {
            onNavigate(response.route);
          }, 1000); // Small delay to let speech finish
        }
        
      } catch (error) {
        console.error('Error processing voice command:', error);
        speak("Sorry, I encountered an error processing your request.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Text-to-speech function
  const speak = (text: string) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsActive(false);
    } else {
      setIsActive(true);
      if (microphonePermission !== 'granted') {
        requestMicrophonePermission().then(granted => {
          if (granted) {
            recognitionRef.current.start();
          }
        });
      } else {
        recognitionRef.current.start();
      }
    }
  };

  // Manual activation
  const activateAssistant = async () => {
    if (microphonePermission !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setError('Cannot activate voice assistant without microphone permission.');
        return;
      }
    }
    
    setIsActive(true);
    speak("Hello! I'm Horizon, your AI assistant. How can I help you today?");
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',  // Changed from right to left to avoid conflict with chat
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',  // Changed from flex-end to flex-start
      gap: '10px'
    }}>
      {/* Voice Assistant Status */}
      {(isActive || transcript || response || error) && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '300px',
          border: error ? '2px solid #f44336' : (isActive ? '2px solid #4CAF50' : '2px solid #ddd')
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: error ? '#f44336' : (isActive ? '#4CAF50' : '#ddd')
            }} />
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: error ? '#f44336' : (isActive ? '#4CAF50' : '#666')
            }}>
              {error ? 'Horizon Error' : (isActive ? 'Horizon Active' : 'Horizon Inactive')}
            </span>
          </div>
          
          {error && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#f44336',
                background: '#ffebee',
                padding: '8px',
                borderRadius: '6px',
                marginBottom: '8px'
              }}>
                {error}
              </div>
              
              {error.includes('not-allowed') && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  background: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '6px'
                }}>
                  <strong>Solutions:</strong><br/>
                  1. Enable microphone in browser settings<br/>
                  2. Use HTTPS (https://localhost:3050)<br/>
                  3. Use Chrome with --allow-running-insecure-content flag
                </div>
              )}
            </div>
          )}
          
          {transcript && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                You said:
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#333',
                fontStyle: 'italic',
                background: '#f8f9fa',
                padding: '8px',
                borderRadius: '6px'
              }}>
                "{transcript}"
              </div>
            </div>
          )}
          
          {response && (
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Horizon says:
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#333',
                background: '#e3f2fd',
                padding: '8px',
                borderRadius: '6px'
              }}>
                {response}
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              Processing...
            </div>
          )}
        </div>
      )}

      {/* Voice Assistant Button */}
      <button
        onClick={isActive ? toggleListening : activateAssistant}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: isActive 
            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          animation: isListening ? 'pulse 1.5s infinite' : 'none'
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        title={
          error ? error :
          isActive ? 'Click to deactivate Horizon' : 
          microphonePermission === 'denied' ? 'Microphone access denied - click to retry' :
          'Click to activate Horizon or say "Hello Horizon"'
        }
      >
        {error ? '❌' :
         isProcessing ? '⏳' : 
         isSpeaking ? '🔊' :
         isListening ? '🎤' : 
         isActive ? '👂' : 
         microphonePermission === 'denied' ? '🚫' : '🤖'}
      </button>

      {/* Instructions */}
      {!isActive && (
        <div style={{
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '200px'
        }}>
          Say "Hello Horizon" or click the button to activate voice assistant
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
            50% { box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4); }
            100% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
          }
        `}
      </style>
    </div>
  );
};

export default VoiceAssistant;
