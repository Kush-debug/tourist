import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComprehensiveDashboard } from '@/components/ComprehensiveDashboard';
import { SafetyScore } from '@/components/SafetyScore';
import { AnomalyDetection } from '@/components/AnomalyDetection';
import { TrustNetwork } from '@/components/TrustNetwork';
import TrustDashboard from '@/components/TrustDashboard';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { BlockchainIdentity } from '@/components/BlockchainIdentity';
import { TouristRegistration } from '@/components/TouristRegistration';
import { EmergencyPanic } from '@/components/EmergencyPanic';
import { SafetyMap } from '@/components/SafetyMap';
import { LiveHeatmap } from '@/components/LiveHeatmap';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { CostBenefitCard } from '@/components/CostBenefitCard';
import { ContactForm } from '@/components/ContactForm';
import { HowItWorks } from '@/components/HowItWorks';
import { PoliceDashboard } from '@/components/PoliceDashboard';
import { TouristDigitalID } from '@/components/TouristDigitalID';
import { LiveLocationTracking } from '@/components/LiveLocationTracking';
import { SOSButton } from '@/components/SOSButton';
import { EnhancedSafetyScore } from '@/components/EnhancedSafetyScore';
import { AIAnomalyDetection } from '@/components/AIAnomalyDetection';
import { VoiceActivatedSOS } from '@/components/VoiceActivatedSOS';
import { TrustNetworkMap } from '@/components/TrustNetworkMap';
import { BlockchainLogSystem } from '@/components/BlockchainLogSystem';
import { Shield, Users, BarChart3, AlertTriangle, MapPin, Clock, Globe, Brain, Mic, QrCode, Zap, Star, CheckCircle } from 'lucide-react';
import heroImage from '@/assets/hero-safety.jpg';

const Index = () => {
  const [activeTab, setActiveTab] = useState('comprehensive-dashboard');

  const stats = [
    { label: 'Active Tourists', value: '2,847', icon: Users, color: 'text-primary' },
    { label: 'Safe Zones', value: '456', icon: Shield, color: 'text-safety-high' },
    { label: 'AI Detections', value: '99.2%', icon: Brain, color: 'text-safety-medium' },
    { label: 'Avg Safety Score', value: '92.8', icon: BarChart3, color: 'text-primary' }
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'Smart Safety Score',
      description: 'Real-time safety calculation based on location, time, crowd density, and AI analysis',
      color: 'text-primary'
    },
    {
      icon: Brain,
      title: 'AI Anomaly Detection',
      description: 'Automatic detection of unusual patterns - no SOS button needed',
      color: 'text-safety-medium'
    },
    {
      icon: Users,
      title: 'Trust Network',
      description: 'Verified safe zones, certified guides, and trusted service providers',
      color: 'text-safety-high'
    },
    {
      icon: Mic,
      title: 'Voice Assistant',
      description: 'Multilingual emergency assistant - just say "Hey Guardian, I need help"',
      color: 'text-primary'
    },
    {
      icon: QrCode,
      title: 'Blockchain Identity',
      description: 'Tamper-proof digital tourist ID accepted by authorities',
      color: 'text-safety-high'
    },
    {
      icon: Zap,
      title: 'Instant Response',
      description: 'Silent alerts to police and family without manual intervention',
      color: 'text-safety-medium'
    }
  ];

  const recentAlerts = [
    { id: 1, tourist: 'John D.', location: 'Kaziranga NP', type: 'Geo-fence Alert', time: '2 min ago', status: 'resolved' },
    { id: 2, tourist: 'Sarah M.', location: 'Shillong', type: 'Low Safety Score', time: '15 min ago', status: 'monitoring' },
    { id: 3, tourist: 'Mike R.', location: 'Tezpur', type: 'Route Deviation', time: '1 hour ago', status: 'resolved' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Travel Safe Shield</h1>
                <p className="text-xs text-muted-foreground">Smart Tourist Safety System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-safety-high/10 text-safety-high border-safety-high/20">
                <div className="w-2 h-2 rounded-full bg-safety-high mr-2 animate-pulse"></div>
                System Active
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Northeast India
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="h-96 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60"></div>
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Next-Gen Tourist Safety
              </h2>
              <p className="text-xl mb-6 text-white/90">
                Market-ready AI platform with smart safety scoring, anomaly detection, 
                voice assistance, and blockchain identity - all in one comprehensive solution.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 font-medium"
                  onClick={() => setActiveTab('register')}
                >
                  Get Digital Tourist ID
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary"
                  onClick={() => setActiveTab('emergency')}
                >
                  Emergency SOS
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 lg:w-fit mb-8">
            <TabsTrigger value="comprehensive-dashboard" className="text-sm">
              <Zap className="h-4 w-4 mr-2" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger value="police" className="text-sm">
              <Shield className="h-4 w-4 mr-2" />
              Police Dashboard
            </TabsTrigger>
            <TabsTrigger value="trust-network" className="text-sm">
              <Users className="h-4 w-4 mr-2" />
              Trust Network
            </TabsTrigger>
            <TabsTrigger value="demo" className="text-sm">
              <Brain className="h-4 w-4 mr-2" />
              AI Demo
            </TabsTrigger>
            <TabsTrigger value="register" className="text-sm">
              <QrCode className="h-4 w-4 mr-2" />
              Register
            </TabsTrigger>
            <TabsTrigger value="impact" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Impact
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comprehensive-dashboard">
            <ComprehensiveDashboard />
          </TabsContent>

          <TabsContent value="police">
            <PoliceDashboard />
          </TabsContent>

          <TabsContent value="trust-network">
            <TrustDashboard />
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SafetyScore realTimeMode={true} />
              <AnomalyDetection userId="demo_user" realTimeMode={true} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VoiceAssistant />
              <BlockchainIdentity />
            </div>
            <TrustNetwork />
          </TabsContent>

          <TabsContent value="register">
            <div className="max-w-2xl mx-auto">
              <TouristRegistration />
            </div>
          </TabsContent>

          <TabsContent value="impact">
            <div className="max-w-4xl mx-auto">
              <CostBenefitCard />
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <ContactForm />
          </TabsContent>
        </Tabs>

        {/* How It Works Section */}
        <section className="mt-16">
          <HowItWorks />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold">Travel Safe Shield</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Powered by AI, Blockchain, and IoT for comprehensive tourist safety monitoring.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">AI Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Smart Safety Scoring</li>
                <li>• Anomaly Detection</li>
                <li>• Voice Assistant (3 Languages)</li>
                <li>• Blockchain Identity</li>
                <li>• Trust Network</li>
                <li>• Silent Emergency Alerts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Emergency Contacts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Police: 100</li>
                <li>Medical Emergency: 102</li>
                <li>Tourist Helpline: 1363</li>
                <li>Fire Service: 101</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Travel Safe Shield - Market Ready AI Tourist Safety Platform. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;