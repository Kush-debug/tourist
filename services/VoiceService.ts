import { emergencyService } from './EmergencyService';
import { locationService } from './LocationService';

export interface VoiceCommand {
  command: string;
  action: () => Promise<void>;
  confidence: number;
}

export interface LanguageConfig {
  code: string;
  name: string;
  commands: {
    [key: string]: string[];
  };
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private currentLanguage = 'en';
  private onCommandRecognized?: (command: string) => void;
  private onEmergencyTriggered?: () => void;

  // Language configurations
  private languages: LanguageConfig[] = [
    {
      code: 'en',
      name: 'English',
      commands: {
        'emergency': ['emergency', 'help', 'sos', 'panic', 'danger'],
        'location': ['where am i', 'my location', 'current location'],
        'safety': ['safety score', 'how safe am i', 'safety status'],
        'contacts': ['emergency contacts', 'call police', 'call hospital'],
        'stop': ['stop', 'cancel', 'end', 'quit']
      }
    },
    {
      code: 'hi',
      name: 'Hindi',
      commands: {
        'emergency': ['आपातकाल', 'मदद', 'सहायता', 'खतरा'],
        'location': ['मैं कहाँ हूँ', 'मेरा स्थान', 'वर्तमान स्थान'],
        'safety': ['सुरक्षा स्कोर', 'मैं कितना सुरक्षित हूँ', 'सुरक्षा स्थिति'],
        'contacts': ['आपातकालीन संपर्क', 'पुलिस को बुलाओ', 'अस्पताल को बुलाओ'],
        'stop': ['रुको', 'रद्द करो', 'समाप्त', 'बंद करो']
      }
    },
    {
      code: 'as',
      name: 'Assamese',
      commands: {
        'emergency': ['জৰুৰী', 'সাহায্য', 'বিপদ', 'সহায়তা'],
        'location': ['মই ক'ত আছো', 'মোৰ অৱস্থান', 'বৰ্তমান অৱস্থান'],
        'safety': ['নিরাপত্তা স্কোর', 'মই কিমান নিরাপদ', 'নিরাপত্তা স্থিতি'],
        'contacts': ['জৰুৰী যোগাযোগ', 'পুলিচক মাতক', 'হাস্পতালক মাতক'],
        'stop': ['ৰাখক', 'বাতিল কৰক', 'শেষ কৰক', 'বন্ধ কৰক']
      }
    }
  ];

  // Initialize voice service
  async initialize(): Promise<boolean> {
    try {
      // Check for speech recognition support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported');
      }

      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;

      // Initialize speech synthesis
      this.synthesis = window.speechSynthesis;

      // Set up recognition event handlers
      this.setupRecognitionHandlers();

      return true;
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      return false;
    }
  }

  // Set up speech recognition event handlers
  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('Voice recognition started');
      this.isListening = true;
    };

    this.recognition.onend = () => {
      console.log('Voice recognition ended');
      this.isListening = false;
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.processVoiceCommand(finalTranscript.toLowerCase().trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };
  }

  // Process voice command
  private async processVoiceCommand(transcript: string): Promise<void> {
    console.log('Processing voice command:', transcript);
    
    const currentLangConfig = this.languages.find(lang => lang.code === this.currentLanguage);
    if (!currentLangConfig) return;

    // Check for emergency commands
    if (currentLangConfig.commands.emergency.some(cmd => transcript.includes(cmd))) {
      await this.handleEmergencyCommand();
      return;
    }

    // Check for location commands
    if (currentLangConfig.commands.location.some(cmd => transcript.includes(cmd))) {
      await this.handleLocationCommand();
      return;
    }

    // Check for safety commands
    if (currentLangConfig.commands.safety.some(cmd => transcript.includes(cmd))) {
      await this.handleSafetyCommand();
      return;
    }

    // Check for contacts commands
    if (currentLangConfig.commands.contacts.some(cmd => transcript.includes(cmd))) {
      await this.handleContactsCommand();
      return;
    }

    // Check for stop commands
    if (currentLangConfig.commands.stop.some(cmd => transcript.includes(cmd))) {
      await this.handleStopCommand();
      return;
    }

    // Unknown command
    this.speak('I did not understand that command. Please try again.');
  }

  // Handle emergency command
  private async handleEmergencyCommand(): Promise<void> {
    this.speak('Emergency activated! Sending alert to authorities.');
    
    try {
      const success = await emergencyService.triggerPanicAlert('Voice-activated emergency alert');
      if (success) {
        this.speak('Emergency alert sent successfully. Help is on the way.');
        this.onEmergencyTriggered?.();
      } else {
        this.speak('Failed to send emergency alert. Please try again or use the panic button.');
      }
    } catch (error) {
      console.error('Emergency command failed:', error);
      this.speak('Emergency system error. Please use the panic button.');
    }
  }

  // Handle location command
  private async handleLocationCommand(): Promise<void> {
    const location = locationService.getLastLocation();
    if (location) {
      this.speak(`You are currently at ${location.address}`);
    } else {
      this.speak('Location not available. Please enable location services.');
    }
  }

  // Handle safety command
  private async handleSafetyCommand(): Promise<void> {
    const location = locationService.getLastLocation();
    if (location) {
      const safetyScore = locationService.calculateLocationSafetyScore(location);
      let safetyMessage = '';
      
      if (safetyScore >= 80) {
        safetyMessage = 'You are in a safe area.';
      } else if (safetyScore >= 60) {
        safetyMessage = 'You are in a caution area. Please be alert.';
      } else {
        safetyMessage = 'You are in a high-risk area. Please move to a safer location.';
      }
      
      this.speak(`Your safety score is ${safetyScore} percent. ${safetyMessage}`);
    } else {
      this.speak('Location not available to calculate safety score.');
    }
  }

  // Handle contacts command
  private async handleContactsCommand(): Promise<void> {
    const contacts = emergencyService.getEmergencyContacts();
    if (contacts.length > 0) {
      this.speak('Emergency contacts available. Say "call police" or "call hospital" for specific contacts.');
    } else {
      this.speak('No emergency contacts configured. Please add contacts in settings.');
    }
  }

  // Handle stop command
  private async handleStopCommand(): Promise<void> {
    this.stopListening();
    this.speak('Voice assistant stopped.');
  }

  // Start listening
  startListening(): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Speak text
  speak(text: string, language?: string): void {
    if (!this.synthesis) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || this.currentLanguage;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    this.synthesis.speak(utterance);
  }

  // Set language
  setLanguage(languageCode: string): boolean {
    const language = this.languages.find(lang => lang.code === languageCode);
    if (!language) return false;

    this.currentLanguage = languageCode;
    if (this.recognition) {
      this.recognition.lang = languageCode;
    }

    return true;
  }

  // Get available languages
  getAvailableLanguages(): LanguageConfig[] {
    return [...this.languages];
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Check if listening
  isVoiceListening(): boolean {
    return this.isListening;
  }

  // Set command callbacks
  setCallbacks(
    onCommandRecognized?: (command: string) => void,
    onEmergencyTriggered?: () => void
  ): void {
    this.onCommandRecognized = onCommandRecognized;
    this.onEmergencyTriggered = onEmergencyTriggered;
  }

  // Get voice recognition status
  getVoiceRecognitionStatus(): {
    supported: boolean;
    listening: boolean;
    language: string;
  } {
    return {
      supported: !!(this.recognition),
      listening: this.isListening,
      language: this.currentLanguage
    };
  }

  // Test voice recognition
  async testVoiceRecognition(): Promise<boolean> {
    if (!this.recognition) return false;

    return new Promise((resolve) => {
      const testRecognition = this.recognition;
      if (!testRecognition) {
        resolve(false);
        return;
      }

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          testRecognition.stop();
          resolve(false);
        }
      }, 5000);

      testRecognition.onresult = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          testRecognition.stop();
          resolve(true);
        }
      };

      testRecognition.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      };

      try {
        testRecognition.start();
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      }
    });
  }
}

export const voiceService = new VoiceService();
export default voiceService;
