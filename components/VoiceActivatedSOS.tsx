import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, Languages, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '@/config/firebase';

interface VoiceCommand {
  id: string;
  text: string;
  language: string;
  confidence: number;
  timestamp: Date;
  action: string;
  triggered: boolean;
}

export const VoiceActivatedSOS: React.FC<{ userId?: string }> = ({ userId = 'tourist_123' }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'english' | 'hindi' | 'assamese'>('english');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [lastCommand, setLastCommand] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Multilingual emergency keywords
  const emergencyKeywords = {
    english: [
      'help me', 'emergency', 'i need help', 'call police', 'danger', 
      'help', 'rescue', 'save me', 'police', 'ambulance', 'fire'
    ],
    hindi: [
      'मदद करो', 'बचाओ', 'पुलिस बुलाओ', 'खतरा', 'आपातकाल', 
      'सहायता', 'रक्षा करो', 'एम्बुलेंस', 'अग्निशमन'
    ],
    assamese: [
      'সহায় কৰক', 'বচাওক', 'পুলিচ মাতক', 'বিপদ', 'জৰুৰীকালীন',
      'সাহায্য', 'ৰক্ষা কৰক', 'এম্বুলেন্স'
    ]
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = getLanguageCode(currentLanguage);

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      const confidence = event.results[event.results.length - 1][0].confidence;
      
      setLastCommand(transcript);
      
      // Check for emergency keywords
      const keywords = emergencyKeywords[currentLanguage];
      const isEmergencyCommand = keywords.some(keyword => 
        transcript.includes(keyword.toLowerCase())
      );
      
      if (isEmergencyCommand && confidence > 0.7) {
        triggerVoiceEmergency(transcript, confidence);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };
  };

  // Get language code for speech recognition
  const getLanguageCode = (lang: string) => {
    switch (lang) {
      case 'hindi': return 'hi-IN';
      case 'assamese': return 'as-IN';
      default: return 'en-US';
    }
  };

  // Initialize speech synthesis
  const initializeSpeechSynthesis = () => {
    synthRef.current = window.speechSynthesis;
  };

  // Speak response in selected language
  const speakResponse = (text: string, lang: string) => {
    if (!synthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(lang);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    synthRef.current.speak(utterance);
  };

  // Trigger voice emergency
  const triggerVoiceEmergency = async (transcript: string, confidence: number) => {
    const command: VoiceCommand = {
      id: `voice_${Date.now()}`,
      text: transcript,
      language: currentLanguage,
      confidence,
      timestamp: new Date(),
      action: 'emergency_triggered',
      triggered: true
    };

    setVoiceCommands(prev => [command, ...prev]);

    try {
      // Store in Firebase
      await db.ref(`voice_commands/${command.id}`).set(command);
      
      // Trigger emergency alert
      await db.ref(`live_emergencies/${userId}`).set({
        type: 'voice_activated',
        commandId: command.id,
        touristId: userId,
        transcript,
        confidence,
        timestamp: new Date().toISOString(),
        autoTriggered: true
      });

      // Provide voice feedback
      const responses = {
        english: "Emergency alert activated. Help is on the way. Stay calm.",
        hindi: "आपातकालीन अलर्ट सक्रिय। मदद आ रही है। शांत रहें।",
        assamese: "জৰুৰীকালীন সতৰ্কতা সক্ৰিয়। সহায় আহি আছে। শান্ত থাকক।"
      };
      
      speakResponse(responses[currentLanguage], currentLanguage);

    } catch (error) {
      console.error('Failed to trigger voice emergency:', error);
    }
  };

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
    
    // Auto-start listening
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    }, 1000);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Update language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLanguageCode(currentLanguage);
    }
  }, [currentLanguage]);

  return (
    <div className="space-y-6">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice-Activated SOS
            </div>
            <Badge variant="outline" className={isListening ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
              {isListening ? 'LISTENING' : 'STOPPED'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Multilingual voice commands for instant emergency response
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span className="text-sm font-medium">Language:</span>
            <div className="flex gap-2">
              {(['english', 'hindi', 'assamese'] as const).map((lang) => (
                <Button
                  key={lang}
                  onClick={() => setCurrentLanguage(lang)}
                  variant={currentLanguage === lang ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                >
                  {lang}
                </Button>
              ))}
            </div>
          </div>

          {/* Voice Control */}
          <div className="text-center space-y-4">
            <Button
              onClick={toggleListening}
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className="w-full h-16"
            >
              {isListening ? (
                <>
                  <Mic className="h-6 w-6 mr-3 animate-pulse" />
                  Listening for Emergency Commands...
                </>
              ) : (
                <>
                  <MicOff className="h-6 w-6 mr-3" />
                  Start Voice Monitoring
                </>
              )}
            </Button>

            {lastCommand && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Last heard:</p>
                <p className="text-sm text-muted-foreground">"{lastCommand}"</p>
              </div>
            )}
          </div>

          {/* Emergency Keywords */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Emergency Keywords ({currentLanguage}):</h4>
            <div className="flex flex-wrap gap-2">
              {emergencyKeywords[currentLanguage].slice(0, 6).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  "{keyword}"
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Command History */}
      {voiceCommands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Command History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {voiceCommands.slice(0, 5).map((command) => (
                <div key={command.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {command.language}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {command.triggered ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {command.confidence.toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">"{command.text}"</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{command.timestamp.toLocaleString()}</span>
                    <span>{command.triggered ? 'Emergency Triggered' : 'No Action'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice SOS Info */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Mic className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">Voice SOS Benefits</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>Hands-free:</strong> No need to reach for phone during panic</li>
                <li>• <strong>Multilingual:</strong> Works in English, Hindi, and Assamese</li>
                <li>• <strong>Always listening:</strong> Continuous monitoring for keywords</li>
                <li>• <strong>Instant response:</strong> Immediate emergency activation</li>
                <li>• <strong>Voice feedback:</strong> Confirms help is coming</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
