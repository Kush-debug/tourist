import { useState, useEffect, useCallback } from 'react';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceSOSConfig {
  enabled: boolean;
  keywords: string[];
  onSOSTriggered: () => void;
}

export const useVoiceSOS = ({ enabled, keywords, onSOSTriggered }: VoiceSOSConfig) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US,hi-IN'; // English and Hindi
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (enabled) {
          // Restart listening if it was enabled
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.log('Recognition restart failed:', error);
            }
          }, 1000);
        }
      };
      
      recognition.onresult = (event) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        setLastTranscript(transcript.toLowerCase());
        
        // Check for SOS keywords
        const hasSOSKeyword = keywords.some(keyword => 
          transcript.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasSOSKeyword && event.results[event.results.length - 1].isFinal) {
          console.log('SOS keyword detected:', transcript);
          onSOSTriggered();
          
          // Stop recognition temporarily after SOS trigger
          recognition.stop();
          setTimeout(() => {
            if (enabled) {
              try {
                recognition.start();
              } catch (error) {
                console.log('Recognition restart after SOS failed:', error);
              }
            }
          }, 5000);
        }
      };
      
      recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognition);
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.log('Web Speech API not supported');
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (error) {
        console.log('Failed to start recognition:', error);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  // Auto-start listening when enabled
  useEffect(() => {
    if (enabled && isSupported && !isListening) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled, isSupported, isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    lastTranscript,
    startListening,
    stopListening
  };
};