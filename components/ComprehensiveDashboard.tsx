import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafetyScore } from './SafetyScore';
import { AnomalyDetection } from './AnomalyDetection';
import { TrustNetwork } from './TrustNetwork';
import { VoiceAssistant } from './VoiceAssistant';
import { BlockchainIdentity } from './BlockchainIdentity';
import { 
  Shield, 
  Brain, 
  Users, 
  Mic, 
  QrCode, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  Globe,
  Phone,
  Activity,
  Bell,
  Settings
} from 'lucide-react';

interface DashboardStats {
  safetyScore: number;
  activeAlerts: number;
  nearbyHelp: number;
  verifications: number;
  lastUpdate: Date;
}

interface SystemAlert {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actions?: string[];
}

export const ComprehensiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    safetyScore: 87,
    activeAlerts: 0,
    nearbyHelp: 12,
    verifications: 3,
    lastUpdate: new Date()
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [notifications, setNotifications] = useState<SystemAlert[]>([]);

  // Initialize dashboard data
  useEffect(() => {
    const initialAlerts: SystemAlert[] = [
      {
        id: 'alert_1',
        type: 'success',
        title: 'Identity Verified',
        message: 'Your digital tourist ID was successfully verified at Radisson Blu Hotel',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        isRead: false
      },
      {
        id: 'alert_2',
        type: 'info',
        title: 'Safety Score Updated',
        message: 'Your safety score increased to 87/100 due to improved location safety',
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        isRead: false
      }
    ];
    
    setSystemAlerts(initialAlerts);
    setNotifications(initialAlerts);
  }, []);

  // Handle emergency activation
  const handleEmergencyActivation = () => {
    setIsEmergencyMode(true);
    const emergencyAlert: SystemAlert = {
      id: `emergency_${Date.now()}`,
      type: 'emergency',
      title: 'EMERGENCY MODE ACTIVATED',
      message: 'All emergency services have been notified. Help is on the way.',
      timestamp: new Date(),
      isRead: false,
      actions: ['Police Notified', 'Location Shared', 'Contacts Alerted']
    };
    
    setSystemAlerts(prev => [emergencyAlert, ...prev]);
    setNotifications(prev => [emergencyAlert, ...prev]);
    setDashboardStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
  };

  // Real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardStats(prev => ({
        ...prev,
        safetyScore: Math.max(60, Math.min(100, prev.safetyScore + (Math.random() - 0.5) * 5)),
        lastUpdate: new Date()
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'safety-low';
      case 'warning': return 'safety-medium';
      case 'info': return 'primary';
      case 'success': return 'safety-high';
      default: return 'muted';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Mode Banner */}
      {isEmergencyMode && (
        <Alert className="border-safety-low bg-safety-low/10 mb-4">
          <AlertTriangle className="h-4 w-4 text-safety-low animate-pulse" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>EMERGENCY MODE ACTIVE</strong> - All emergency services notified. Stay calm and follow instructions.
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEmergencyMode(false)}
                className="border-safety-low text-safety-low hover:bg-safety-low hover:text-white"
              >
                Deactivate
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Stats */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border mb-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Travel Safe Shield
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  MARKET READY
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Tourist Safety Platform • Real-time Protection
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmergencyActivation}
                className="animate-pulse"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                SOS
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-2xl font-bold text-primary">{dashboardStats.safetyScore}</div>
              <div className="text-xs text-muted-foreground">Safety Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-safety-high/5 border border-safety-high/20">
              <div className="text-2xl font-bold text-safety-high">{dashboardStats.nearbyHelp}</div>
              <div className="text-xs text-muted-foreground">Safe Zones Nearby</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-safety-medium/5 border border-safety-medium/20">
              <div className="text-2xl font-bold text-safety-medium">{dashboardStats.activeAlerts}</div>
              <div className="text-xs text-muted-foreground">Active Alerts</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/5 border border-muted/20">
              <div className="text-2xl font-bold">{dashboardStats.verifications}</div>
              <div className="text-xs text-muted-foreground">ID Verifications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6">
            <TabsTrigger value="overview" className="text-sm">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-sm">
              <Shield className="h-4 w-4 mr-2" />
              Safety Score
            </TabsTrigger>
            <TabsTrigger value="ai-detection" className="text-sm">
              <Brain className="h-4 w-4 mr-2" />
              AI Detection
            </TabsTrigger>
            <TabsTrigger value="trust-network" className="text-sm">
              <Users className="h-4 w-4 mr-2" />
              Trust Network
            </TabsTrigger>
            <TabsTrigger value="voice-assistant" className="text-sm">
              <Mic className="h-4 w-4 mr-2" />
              Voice Assistant
            </TabsTrigger>
            <TabsTrigger value="blockchain-id" className="text-sm">
              <QrCode className="h-4 w-4 mr-2" />
              Digital ID
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-sm relative">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SafetyScore 
                score={dashboardStats.safetyScore}
                realTimeMode={true}
                riskFactors={isEmergencyMode ? ['Emergency Mode Active'] : []}
              />
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span>AI Monitoring</span>
                      <Badge className="bg-safety-high/10 text-safety-high">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Voice Assistant</span>
                      <Badge className="bg-primary/10 text-primary">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Location Tracking</span>
                      <Badge className="bg-safety-high/10 text-safety-high">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Emergency Contacts</span>
                      <Badge className="bg-safety-high/10 text-safety-high">Synced</Badge>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      Last Updated: {dashboardStats.lastUpdate.toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Location: Guwahati, Assam (Verified)
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('trust-network')}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-xs">Find Safe Zones</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('voice-assistant')}
                  >
                    <Mic className="h-6 w-6" />
                    <span className="text-xs">Voice Help</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('blockchain-id')}
                  >
                    <QrCode className="h-6 w-6" />
                    <span className="text-xs">Show ID</span>
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="h-20 flex-col gap-2"
                    onClick={handleEmergencyActivation}
                  >
                    <Phone className="h-6 w-6" />
                    <span className="text-xs">Emergency</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Feature Tabs */}
          <TabsContent value="safety">
            <SafetyScore 
              score={dashboardStats.safetyScore}
              realTimeMode={true}
              riskFactors={isEmergencyMode ? ['Emergency Mode Active'] : []}
            />
          </TabsContent>

          <TabsContent value="ai-detection">
            <AnomalyDetection 
              userId="user_123"
              realTimeMode={true}
              onAnomalyDetected={(alert) => {
                const systemAlert: SystemAlert = {
                  id: `anomaly_${Date.now()}`,
                  type: alert.severity === 'critical' ? 'emergency' : 'warning',
                  title: 'AI Anomaly Detected',
                  message: alert.message,
                  timestamp: new Date(),
                  isRead: false,
                  actions: alert.autoActions
                };
                setSystemAlerts(prev => [systemAlert, ...prev]);
                setNotifications(prev => [systemAlert, ...prev]);
              }}
            />
          </TabsContent>

          <TabsContent value="trust-network">
            <TrustNetwork 
              userLocation={{ lat: 26.1445, lng: 91.7362 }}
              emergencyMode={isEmergencyMode}
            />
          </TabsContent>

          <TabsContent value="voice-assistant">
            <VoiceAssistant 
              isEmergencyMode={isEmergencyMode}
              onEmergencyTriggered={(response) => {
                if (response.priority === 'critical') {
                  handleEmergencyActivation();
                }
              }}
            />
          </TabsContent>

          <TabsContent value="blockchain-id">
            <BlockchainIdentity 
              onIdentityCreated={(identity) => {
                const alert: SystemAlert = {
                  id: `identity_${Date.now()}`,
                  type: 'success',
                  title: 'Digital ID Created',
                  message: `Tourist ID ${identity.id} successfully generated with blockchain security`,
                  timestamp: new Date(),
                  isRead: false
                };
                setSystemAlerts(prev => [alert, ...prev]);
                setNotifications(prev => [alert, ...prev]);
              }}
            />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  System Notifications & Alerts
                  {unreadCount > 0 && (
                    <Badge className="bg-primary/10 text-primary">
                      {unreadCount} Unread
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Alert 
                        key={notification.id} 
                        className={`border-${getAlertColor(notification.type)}/20 cursor-pointer transition-opacity ${
                          notification.isRead ? 'opacity-60' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <AlertTriangle className={`h-4 w-4 text-${getAlertColor(notification.type)}`} />
                        <AlertDescription>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">{notification.title}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </div>
                              {notification.actions && (
                                <div className="space-y-1">
                                  {notification.actions.map((action, index) => (
                                    <div key={index} className="text-xs bg-muted/50 rounded px-2 py-1 inline-block mr-2">
                                      ✓ {action}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                {notification.timestamp.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Badge 
                                className={`bg-${getAlertColor(notification.type)}/10 text-${getAlertColor(notification.type)} border-${getAlertColor(notification.type)}/20 text-xs`}
                              >
                                {notification.type.toUpperCase()}
                              </Badge>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              )}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
