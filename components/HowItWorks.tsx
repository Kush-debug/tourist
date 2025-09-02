import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Shield, 
  AlertTriangle, 
  ArrowRight, 
  QrCode, 
  MapPin, 
  Smartphone,
  Headphones,
  Eye,
  Zap
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
}

export const HowItWorks: React.FC = () => {
  const steps: Step[] = [
    {
      id: 1,
      title: "Register & Get Digital ID",
      description: "Quick 2-minute registration creates your secure blockchain-based digital tourist ID",
      icon: <UserPlus className="h-8 w-8" />,
      features: [
        "Secure KYC verification",
        "QR code generation",
        "Emergency contacts setup",
        "Travel itinerary upload"
      ],
      color: "primary"
    },
    {
      id: 2,
      title: "Travel Safe with AI Monitoring",
      description: "Real-time safety score tracking and intelligent alerts keep you protected",
      icon: <Shield className="h-8 w-8" />,
      features: [
        "Live safety score updates",
        "Geo-fence protection",
        "Route deviation alerts",
        "24/7 AI monitoring"
      ],
      color: "safety-high"
    },
    {
      id: 3,
      title: "Instant SOS & Emergency Support",
      description: "Multiple emergency channels ensure help is always just seconds away",
      icon: <AlertTriangle className="h-8 w-8" />,
      features: [
        "One-tap panic button",
        "Voice-activated SOS",
        "Auto-location sharing",
        "Instant police dispatch"
      ],
      color: "safety-low"
    }
  ];

  const aiFeatures = [
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Anomaly Detection",
      description: "AI detects unusual patterns like prolonged inactivity or route deviations"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Predictive Alerts",
      description: "Smart algorithms predict and prevent potential safety incidents"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Smart Geo-fencing",
      description: "Dynamic safety zones that adapt to real-time conditions and threats"
    },
    {
      icon: <Headphones className="h-5 w-5" />,
      title: "Voice Recognition",
      description: "Multilingual voice commands in English, Hindi, and regional languages"
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">How Travel Safe Shield Works</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Three simple steps to ensure your complete safety while exploring Northeast India
        </p>
        <Badge className="bg-gradient-primary text-white border-0 px-4 py-2">
          🚀 Powered by AI, Blockchain & IoT
        </Badge>
      </div>

      {/* Main Steps */}
      <div className="relative">
        {/* Connection Line */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-primary transform -translate-y-1/2 z-0"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              {/* Step Card */}
              <Card className={`shadow-card border-0 w-full bg-gradient-to-br from-card to-${step.color}/5 hover:shadow-glow transition-all duration-300`}>
                <CardContent className="p-6 text-center space-y-4">
                  {/* Step Number & Icon */}
                  <div className="relative">
                    <div className={`w-16 h-16 bg-${step.color}/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-${step.color}/20`}>
                      <div className={`text-${step.color}`}>
                        {step.icon}
                      </div>
                    </div>
                    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-${step.color} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                      {step.id}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center justify-center gap-2 text-sm">
                        <div className={`w-2 h-2 bg-${step.color} rounded-full`}></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex items-center justify-center my-4">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Features Section */}
      <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-safety-high/5">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-3">🤖 AI-Powered Safety Features</h3>
            <p className="text-muted-foreground">
              Advanced artificial intelligence working 24/7 to keep you safe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <div className="text-primary">
                    {feature.icon}
                  </div>
                </div>
                <h4 className="font-medium">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-bold">Built with Cutting-Edge Technology</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <Badge variant="outline" className="px-4 py-2 bg-card">
            <QrCode className="h-4 w-4 mr-2" />
            Blockchain Security
          </Badge>
          <Badge variant="outline" className="px-4 py-2 bg-card">
            <Smartphone className="h-4 w-4 mr-2" />
            Progressive Web App
          </Badge>
          <Badge variant="outline" className="px-4 py-2 bg-card">
            <MapPin className="h-4 w-4 mr-2" />
            Real-time GPS
          </Badge>
          <Badge variant="outline" className="px-4 py-2 bg-card">
            <Eye className="h-4 w-4 mr-2" />
            Computer Vision
          </Badge>
          <Badge variant="outline" className="px-4 py-2 bg-card">
            <Headphones className="h-4 w-4 mr-2" />
            Voice Recognition
          </Badge>
        </div>
      </div>

      {/* Success Stats */}
      <Card className="shadow-card border-0 bg-gradient-safety text-white">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Proven Results</h3>
            <p className="text-white/90">Making tourism safer across Northeast India</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">1,247</div>
              <div className="text-sm text-white/80">Tourists Protected</div>
            </div>
            <div>
              <div className="text-3xl font-bold">23</div>
              <div className="text-sm text-white/80">Incidents Prevented</div>
            </div>
            <div>
              <div className="text-3xl font-bold">3.2min</div>
              <div className="text-sm text-white/80">Avg Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-white/80">System Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Ready to Travel Safely?</h3>
        <p className="text-muted-foreground">
          Join thousands of tourists who trust Travel Safe Shield for their safety
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="bg-gradient-primary border-0">
            <UserPlus className="h-4 w-4 mr-2" />
            Get Your Digital ID
          </Button>
          <Button size="lg" variant="outline">
            <Smartphone className="h-4 w-4 mr-2" />
            Download PWA
          </Button>
        </div>
      </div>
    </div>
  );
};