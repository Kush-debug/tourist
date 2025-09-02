import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, MapPin, Clock, Shield, Users, Siren } from 'lucide-react';
import { db } from '@/config/firebase';

interface EmergencyAlert {
  id: string;
  touristId: string;
  location: { lat: number; lng: number; address: string };
  timestamp: Date;
  status: 'active' | 'responding' | 'resolved';
  type: 'manual_sos' | 'auto_detection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  contacts: string[];
  responseTime?: number;
}

export const SOSButton: React.FC<{ userId?: string; currentLocation?: any }> = ({ 
  userId = 'tourist_123',
  currentLocation 
}) => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  // Emergency contacts
  const emergencyContacts = [
    { name: 'Police', number: '+91-100', type: 'police' },
    { name: 'Medical', number: '+91-108', type: 'medical' },
    { name: 'Fire', number: '+91-101', type: 'fire' },
    { name: 'Tourist Helpline', number: '+91-1363', type: 'tourist' }
  ];

  // Trigger SOS Alert
  const triggerSOS = async () => {
    setIsPressed(true);
    setCountdown(3);
    
    // 3-second countdown to prevent accidental triggers
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          activateEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cancel SOS during countdown
  const cancelSOS = () => {
    setIsPressed(false);
    setCountdown(0);
  };

  // Activate emergency response
  const activateEmergency = async () => {
    setIsEmergencyActive(true);
    setIsPressed(false);
    
    const location = currentLocation || {
      lat: 26.1445,
      lng: 91.7362,
      address: 'Guwahati, Assam'
    };

    const emergencyAlert: EmergencyAlert = {
      id: `sos_${Date.now()}`,
      touristId: userId,
      location,
      timestamp: new Date(),
      status: 'active',
      type: 'manual_sos',
      severity: 'critical',
      contacts: emergencyContacts.map(c => c.number)
    };

    try {
      // Send to Firebase
      await db.ref(`emergency_alerts/${emergencyAlert.id}`).set(emergencyAlert);
      await db.ref(`live_emergencies/${userId}`).set({
        ...emergencyAlert,
        isActive: true
      });

      // Add to local state
      setEmergencyAlerts(prev => [emergencyAlert, ...prev]);

      // Simulate emergency response
      simulateEmergencyResponse(emergencyAlert);

    } catch (error) {
      console.error('Failed to send SOS alert:', error);
    }
  };

  // Simulate emergency response
  const simulateEmergencyResponse = (alert: EmergencyAlert) => {
    // Simulate police response after 2 minutes
    setTimeout(async () => {
      const updatedAlert = {
        ...alert,
        status: 'responding' as const,
        responseTime: 120 // 2 minutes
      };
      
      await db.ref(`emergency_alerts/${alert.id}`).set(updatedAlert);
      setEmergencyAlerts(prev => 
        prev.map(a => a.id === alert.id ? updatedAlert : a)
      );
    }, 2000); // 2 seconds for demo

    // Simulate resolution after 5 minutes
    setTimeout(async () => {
      const resolvedAlert = {
        ...alert,
        status: 'resolved' as const,
        responseTime: 300 // 5 minutes
      };
      
      await db.ref(`emergency_alerts/${alert.id}`).set(resolvedAlert);
      await db.ref(`live_emergencies/${userId}`).set(null);
      
      setEmergencyAlerts(prev => 
        prev.map(a => a.id === alert.id ? resolvedAlert : a)
      );
      setIsEmergencyActive(false);
    }, 5000); // 5 seconds for demo
  };

  // Load emergency history
  useEffect(() => {
    const loadEmergencyHistory = async () => {
      try {
        const snapshot = await db.ref(`emergency_alerts`).get();
        const data = snapshot.val();
        if (data) {
          const alerts = Object.values(data) as EmergencyAlert[];
          const userAlerts = alerts.filter(alert => alert.touristId === userId);
          setEmergencyAlerts(userAlerts.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        }
      } catch (error) {
        console.error('Failed to load emergency history:', error);
      }
    };

    loadEmergencyHistory();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'responding': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* SOS Button */}
      <Card className={`${isEmergencyActive ? 'border-red-500 bg-red-50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency SOS
            </div>
            {isEmergencyActive && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <Siren className="h-3 w-3 mr-1" />
                EMERGENCY ACTIVE
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Instant emergency alert to police and emergency contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEmergencyActive ? (
            <div className="text-center space-y-4">
              {!isPressed ? (
                <Button
                  onClick={triggerSOS}
                  size="lg"
                  className="w-full h-20 text-xl font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertTriangle className="h-8 w-8 mr-3" />
                  EMERGENCY SOS
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-600 mb-2">{countdown}</div>
                    <p className="text-red-600 font-medium">Activating Emergency Alert...</p>
                  </div>
                  <Button
                    onClick={cancelSOS}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel SOS
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {emergencyContacts.map((contact) => (
                  <Button
                    key={contact.type}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${contact.number}`)}
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-3 w-3" />
                    {contact.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <Siren className="h-6 w-6 animate-pulse" />
                <span className="text-lg font-bold">EMERGENCY ACTIVATED</span>
              </div>
              <div className="space-y-2 text-sm">
                <p>✅ Police have been notified</p>
                <p>✅ Your location has been shared</p>
                <p>✅ Emergency contacts alerted</p>
                <p>✅ Nearby tourists notified</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Help is on the way - Stay calm</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Alerts History */}
      {emergencyAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency History
            </CardTitle>
            <CardDescription>
              Previous emergency alerts and responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Emergency Alert</span>
                    </div>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{alert.location.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    {alert.responseTime && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        <span>Response time: {alert.responseTime} seconds</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
