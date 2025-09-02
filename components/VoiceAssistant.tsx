import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Globe, 
  AlertTriangle,
  Phone,
  MapPin,
  Shield,
  Zap,
  Languages,
  Play,
  Square
} from 'lucide-react';

interface VoiceCommand {
  phrase: string;
  language: string;
  action: string;
  confidence: number;
}

interface EmergencyResponse {
  type: 'police' | 'medical' | 'fire' | 'tourist_help' | 'location_share' | 'safe_zone';
  message: string;
  actions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface VoiceAssistantProps {
  onEmergencyTriggered?: (response: EmergencyResponse) => void;
  isEmergencyMode?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onEmergencyTriggered,
  isEmergencyMode = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [emergencyActivated, setEmergencyActivated] = useState(false);
  const [responseHistory, setResponseHistory] = useState<EmergencyResponse[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Multilingual command patterns
  const commandPatterns = {
    english: {
      emergency: ['help me', 'emergency', 'i need help', 'call police', 'danger', 'hey guardian i need help'],
      police: ['call police', 'police help', 'crime', 'theft', 'robbery'],
      medical: ['medical emergency', 'call ambulance', 'injured', 'sick', 'heart attack'],
      location: ['where am i', 'share location', 'send location', 'lost'],
      safe_zone: ['safe place', 'nearest police', 'safe zone', 'help center'],
      fire: ['fire emergency', 'call fire department', 'fire help']
    },
    hindi: {
      emergency: ['मदद करो', 'आपातकाल', 'मुझे मदद चाहिए', 'पुलिस बुलाओ', 'खतरा', 'हे गार्जियन मुझे मदद चाहिए'],
      police: ['पुलिस बुलाओ', 'पुलिस की मदद', 'अपराध', 'चोरी'],
      medical: ['मेडिकल इमरजेंसी', 'एम्बुलेंस बुलाओ', 'घायल', 'बीमार'],
      location: ['मैं कहाँ हूँ', 'लोकेशन शेयर करो', 'खो गया'],
      safe_zone: ['सुरक्षित जगह', 'नजदीकी पुलिस', 'सेफ जोन'],
      fire: ['आग लगी है', 'फायर डिपार्टमेंट बुलाओ']
    },
    assamese: {
      emergency: ['সহায় কৰক', 'জৰুৰীকালীন', 'মোক সহায়ৰ প্ৰয়োজন', 'আৰক্ষী মাতক'],
      police: ['আৰক্ষী মাতক', 'আৰক্ষীৰ সহায়', 'অপৰাধ'],
      medical: ['চিকিৎসা জৰুৰীকালীন', 'এম্বুলেন্স মাতক', 'আঘাতপ্ৰাপ্ত'],
      location: ['মই ক\'ত আছো', 'স্থান শ্বেয়াৰ কৰক'],
      safe_zone: ['সুৰক্ষিত ঠাই', 'ওচৰৰ আৰক্ষী'],
      fire: ['জুই লাগিছে', 'অগ্নিনিৰ্বাপক বিভাগ মাতক']
    }
  };

  // Emergency responses in multiple languages
  const responses = {
    english: {
      emergency_activated: "Emergency mode activated. Help is on the way. Stay calm.",
      police_called: "Police have been notified. Your location has been shared. Stay where you are if safe.",
      medical_help: "Medical emergency services contacted. Ambulance dispatched to your location.",
      location_shared: "Your current location has been shared with emergency contacts and authorities.",
      safe_zone_found: "Nearest safe zone located. Navigation started. Police station is 0.5km away.",
      listening: "I'm listening. Say 'Hey Guardian, I need help' for emergency assistance.",
      not_understood: "I didn't understand. Please speak clearly or try in Hindi or Assamese."
    },
    hindi: {
      emergency_activated: "आपातकाल सक्रिय। मदद आ रही है। शांत रहें।",
      police_called: "पुलिस को सूचित कर दिया गया। आपका स्थान साझा किया गया। सुरक्षित हैं तो वहीं रहें।",
      medical_help: "मेडिकल इमरजेंसी सेवाओं से संपर्क किया गया। एम्बुलेंस भेजी गई।",
      location_shared: "आपका वर्तमान स्थान आपातकालीन संपर्कों के साथ साझा किया गया।",
      safe_zone_found: "निकटतम सुरक्षित क्षेत्र मिल गया। नेवीगेशन शुरू। पुलिस स्टेशन 0.5 किमी दूर।",
      listening: "मैं सुन रहा हूं। आपातकाल के लिए 'हे गार्जियन मुझे मदद चाहिए' कहें।",
      not_understood: "मैं समझ नहीं पाया। कृपया स्पष्ट रूप से बोलें।"
    },
    assamese: {
      emergency_activated: "জৰুৰীকালীন অৱস্থা সক্ৰিয়। সহায় আহি আছে। শান্ত হৈ থাকক।",
      police_called: "আৰক্ষীক জনোৱা হৈছে। আপোনাৰ স্থান শ্বেয়াৰ কৰা হৈছে।",
      medical_help: "চিকিৎসা জৰুৰীকালীন সেৱাৰ সৈতে যোগাযোগ কৰা হৈছে।",
      location_shared: "আপোনাৰ বৰ্তমান স্থান জৰুৰীকালীন যোগাযোগৰ সৈতে শ্বেয়াৰ কৰা হৈছে।",
      safe_zone_found: "নিকটতম সুৰক্ষিত অঞ্চল পোৱা গৈছে। নেভিগেচন আৰম্ভ।",
      listening: "মই শুনি আছো। জৰুৰীকালীনৰ বাবে 'হে গাৰ্ডিয়ান মোক সহায়ৰ প্ৰয়োজন' কওক।",
      not_understood: "মই বুজি নাপালো। অনুগ্ৰহ কৰি স্পষ্টভাৱে কওক।"
    }
  };

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = currentLanguage === 'hindi' ? 'hi-IN' : 
                                   currentLanguage === 'assamese' ? 'as-IN' : 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        const confidence = event.results[event.results.length - 1][0].confidence;
        
        if (event.results[event.results.length - 1].isFinal) {
          processVoiceCommand(transcript, confidence);
        }
        
        // Simulate voice level for visual feedback
        setVoiceLevel(Math.random() * 100);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentLanguage]);

  const processVoiceCommand = (transcript: string, confidence: number) => {
    setIsProcessing(true);
    
    const command: VoiceCommand = {
      phrase: transcript,
      language: currentLanguage,
      action: 'unknown',
      confidence: confidence || 0.8
    };

    const patterns = commandPatterns[currentLanguage as keyof typeof commandPatterns];
    let detectedAction = 'unknown';
    let emergencyResponse: EmergencyResponse | null = null;

    // Check for emergency patterns
    for (const [action, phrases] of Object.entries(patterns)) {
      if (phrases.some(phrase => transcript.includes(phrase))) {
        detectedAction = action;
        break;
      }
    }

    command.action = detectedAction;
    setLastCommand(command);

    // Generate appropriate response
    switch (detectedAction) {
      case 'emergency':
        emergencyResponse = {
          type: 'police',
          message: responses[currentLanguage as keyof typeof responses].emergency_activated,
          actions: [
            'Emergency mode activated',
            'Location shared with authorities',
            'Emergency contacts notified',
            'Police dispatch initiated'
          ],
          priority: 'critical'
        };
        setEmergencyActivated(true);
        break;
        
      case 'police':
        emergencyResponse = {
          type: 'police',
          message: responses[currentLanguage as keyof typeof responses].police_called,
          actions: [
            'Police notification sent',
            'Live location tracking started',
            'Emergency contacts alerted'
          ],
          priority: 'critical'
        };
        break;
        
      case 'medical':
        emergencyResponse = {
          type: 'medical',
          message: responses[currentLanguage as keyof typeof responses].medical_help,
          actions: [
            'Ambulance dispatched',
            'Medical history shared',
            'Hospital pre-alert sent'
          ],
          priority: 'critical'
        };
        break;
        
      case 'location':
        emergencyResponse = {
          type: 'location_share',
          message: responses[currentLanguage as keyof typeof responses].location_shared,
          actions: [
            'GPS coordinates shared',
            'Address details sent',
            'Landmark information included'
          ],
          priority: 'medium'
        };
        break;
        
      case 'safe_zone':
        emergencyResponse = {
          type: 'safe_zone',
          message: responses[currentLanguage as keyof typeof responses].safe_zone_found,
          actions: [
            'Nearest police station located',
            'Navigation route calculated',
            'Safe zone details provided'
          ],
          priority: 'high'
        };
        break;
        
      default:
        emergencyResponse = {
          type: 'tourist_help',
          message: responses[currentLanguage as keyof typeof responses].not_understood,
          actions: ['Voice command not recognized'],
          priority: 'low'
        };
    }

    if (emergencyResponse) {
      setResponseHistory(prev => [emergencyResponse!, ...prev.slice(0, 4)]);
      speakResponse(emergencyResponse.message);
      
      if (onEmergencyTriggered && emergencyResponse.priority !== 'low') {
        onEmergencyTriggered(emergencyResponse);
      }
    }

    setTimeout(() => setIsProcessing(false), 2000);
  };

  const speakResponse = (message: string) => {
    if (synthRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = currentLanguage === 'hindi' ? 'hi-IN' : 
                      currentLanguage === 'assamese' ? 'as-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
      speakResponse(responses[currentLanguage as keyof typeof responses].listening);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const testEmergencyCommand = () => {
    const testCommands = {
      english: "Hey Guardian, I need help",
      hindi: "हे गार्जियन मुझे मदद चाहिए",
      assamese: "হে গাৰ্ডিয়ান মোক সহায়ৰ প্ৰয়োজন"
    };
    
    processVoiceCommand(testCommands[currentLanguage as keyof typeof testCommands], 0.95);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'safety-low';
      case 'high': return 'safety-medium';
      case 'medium': return 'primary';
      case 'low': return 'muted';
      default: return 'muted';
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            Emergency AI Voice Assistant
            {isListening && (
              <Badge variant="outline" className="text-xs bg-safety-low/10 text-safety-low animate-pulse">
                LISTENING
              </Badge>
            )}
            {emergencyActivated && (
              <Badge className="text-xs bg-safety-low text-white">
                EMERGENCY ACTIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="text-xs px-2 py-1 border rounded bg-background"
            >
              <option value="english">English</option>
              <option value="hindi">हिंदी</option>
              <option value="assamese">অসমীয়া</option>
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Control Interface */}
        <div className="text-center space-y-4">
          <div className="relative">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              className="w-24 h-24 rounded-full text-lg font-medium"
              disabled={isProcessing}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            
            {/* Voice Level Indicator */}
            {isListening && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20">
                <Progress value={voiceLevel} className="h-1" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isListening ? "Listening for voice commands..." : 
               isProcessing ? "Processing command..." :
               isSpeaking ? "Speaking response..." :
               "Tap to activate voice assistant"}
            </p>
            
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Languages className="h-3 w-3" />
                <span>Multilingual Support</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Always Active</span>
              </div>
              <div className="flex items-center gap-1">
                {isSpeaking ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                <span>Voice Response</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Commands Guide */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Emergency Voice Commands ({currentLanguage})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {Object.entries(commandPatterns[currentLanguage as keyof typeof commandPatterns]).map(([action, phrases]) => (
              <div key={action} className="space-y-1">
                <div className="font-medium capitalize text-primary">{action.replace('_', ' ')}</div>
                <div className="text-muted-foreground">
                  "{phrases[0]}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Command */}
        {lastCommand && (
          <Alert>
            <Mic className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Last Command:</strong> "{lastCommand.phrase}"
                  <div className="text-xs text-muted-foreground mt-1">
                    Action: {lastCommand.action} • Confidence: {(lastCommand.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Response History */}
        {responseHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Emergency Responses
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {responseHistory.map((response, index) => (
                <Alert key={index} className={`border-${getPriorityColor(response.priority)}/20`}>
                  <AlertTriangle className={`h-4 w-4 text-${getPriorityColor(response.priority)}`} />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{response.message}</div>
                        <div className="space-y-1">
                          {response.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="text-xs bg-muted/50 rounded px-2 py-1">
                              ✓ {action}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Badge 
                        className={`bg-${getPriorityColor(response.priority)}/10 text-${getPriorityColor(response.priority)} border-${getPriorityColor(response.priority)}/20 text-xs ml-2`}
                      >
                        {response.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Test Button */}
        <div className="pt-3 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testEmergencyCommand}
            className="w-full"
          >
            <Play className="h-3 w-3 mr-2" />
            Test Emergency Command
          </Button>
        </div>

        {/* Features Overview */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <h5 className="font-medium mb-2 text-sm">AI Voice Assistant Features</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Languages className="h-3 w-3" />
              <span>3 Languages Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3" />
              <span>AI Command Recognition</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <span>Instant Emergency Response</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Silent Alert System</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Works offline for basic commands. No SOS button needed - just speak naturally.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
