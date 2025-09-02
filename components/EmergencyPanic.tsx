import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone, MapPin, Mic, MicOff, Shield } from 'lucide-react';
import panicButtonIcon from '@/assets/panic-button-icon.png';

interface EmergencyPanicProps {
  currentLocation?: { lat: number; lng: number };
  touristId?: string;
}

export const EmergencyPanic: React.FC<EmergencyPanicProps> = ({
  currentLocation = { lat: 26.1445, lng: 91.7362 }, // Guwahati coordinates
  touristId = "TS-DEMO-123"
}) => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emergencyType, setEmergencyType] = useState<string>('');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isEmergencyActive) {
      // Emergency activated - send alerts
      handleEmergencyActivation();
    }
  }, [countdown, isEmergencyActive]);

  const startEmergency = (type: string) => {
    setEmergencyType(type);
    setIsEmergencyActive(true);
    setCountdown(10); // 10-second countdown
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setCountdown(0);
    setEmergencyType('');
  };

  const handleEmergencyActivation = () => {
    // Simulate emergency alert sending
    console.log('Emergency Alert Sent:', {
      touristId,
      location: currentLocation,
      type: emergencyType,
      timestamp: new Date().toISOString()
    });
  };

  const startVoiceSOS = () => {
    setIsListening(!isListening);
    // Simulate voice recognition
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        startEmergency('voice_sos');
      }, 3000);
    }
  };

  if (isEmergencyActive) {
    return (
      <Card className="shadow-emergency border-safety-low border-2 animate-pulse-emergency">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-safety-low">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">EMERGENCY ACTIVATED</h2>
            </div>

            {countdown > 0 ? (
              <>
                <div className="text-6xl font-bold text-safety-low">
                  {countdown}
                </div>
                <p className="text-lg">
                  Emergency alert will be sent in <strong>{countdown}</strong> seconds
                </p>
                <Button
                  onClick={cancelEmergency}
                  variant="outline"
                  size="lg"
                  className="border-safety-low text-safety-low hover:bg-safety-low hover:text-white"
                >
                  Cancel Emergency
                </Button>
              </>
            ) : (
              <>
                <div className="bg-safety-low/10 p-4 rounded-lg">
                  <h3 className="font-bold text-safety-low mb-2">HELP IS ON THE WAY</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location shared with authorities
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency contacts notified
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="h-4 w-4" />
                      Police dispatch initiated
                    </div>
                  </div>
                </div>
                <p className="text-safety-low font-medium">
                  Stay in a safe location. Help is coming.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Emergency Assistance</h3>
            <p className="text-muted-foreground">
              Press for immediate help or use voice command "Help me"
            </p>
          </div>

          <div className="space-y-4">
            {/* Main Panic Button */}
            <Button
              onClick={() => startEmergency('panic_button')}
              className="w-full h-20 bg-safety-low hover:bg-safety-low/90 text-white text-xl font-bold shadow-emergency"
              size="lg"
            >
              <img src={panicButtonIcon} alt="Panic" className="mr-3 h-8 w-8" />
              EMERGENCY SOS
            </Button>

            {/* Voice SOS */}
            <Button
              onClick={startVoiceSOS}
              variant="outline"
              className={`w-full border-2 ${isListening ? 'border-safety-low bg-safety-low/10 animate-pulse-emergency' : 'border-primary'}`}
              size="lg"
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 h-5 w-5 text-safety-low" />
                  Listening... Say "Help me"
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Voice SOS (Say "Help me")
                </>
              )}
            </Button>
          </div>

          {/* Emergency Numbers */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Quick Dial Emergency Numbers</h4>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline" className="justify-center py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Police: 100
              </Badge>
              <Badge variant="outline" className="justify-center py-2 cursor-pointer hover:bg-safety-low hover:text-white">
                Medical: 102
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Tourist ID: {touristId} • Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};