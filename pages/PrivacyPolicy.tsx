import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowLeft, Calendar, Lock, Eye, Database, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Travel Safe Shield</h1>
                <p className="text-xs text-muted-foreground">Privacy Policy</p>
              </div>
            </div>
            <Badge className="bg-safety-high/10 text-safety-high border-safety-high/20">
              <Lock className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-card border-0 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Lock className="h-6 w-6 text-primary" />
              Privacy Policy
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: January 15, 2024
            </div>
            <p className="text-muted-foreground">
              Your privacy and safety are our top priorities. This policy explains how we collect, use, and protect your personal information.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Privacy Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-safety-high/10 border border-safety-high/20">
                <Lock className="h-5 w-5 text-safety-high mb-2" />
                <div className="font-medium text-sm">End-to-End Encryption</div>
                <div className="text-xs text-muted-foreground">All data encrypted in transit and at rest</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Eye className="h-5 w-5 text-primary mb-2" />
                <div className="font-medium text-sm">Transparent Data Use</div>
                <div className="text-xs text-muted-foreground">Clear visibility into data collection</div>
              </div>
              <div className="p-4 rounded-lg bg-safety-medium/10 border border-safety-medium/20">
                <Users className="h-5 w-5 text-safety-medium mb-2" />
                <div className="font-medium text-sm">User Control</div>
                <div className="text-xs text-muted-foreground">You control your data and privacy settings</div>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5" />
                1. Information We Collect
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Personal Information:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Name, nationality, and government-issued ID details</li>
                    <li>Passport or Aadhaar information for identity verification</li>
                    <li>Emergency contact information</li>
                    <li>Travel itinerary and accommodation details</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Location Data:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Real-time GPS coordinates (when location services are enabled)</li>
                    <li>Historical location patterns for safety analysis</li>
                    <li>Geo-fence entry/exit events</li>
                    <li>Route deviations from planned itineraries</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Usage Information:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>App usage patterns and feature interactions</li>
                    <li>Device information (type, OS, unique identifiers)</li>
                    <li>Emergency alert triggers and responses</li>
                    <li>Voice recordings (only during SOS activation)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <div className="space-y-4">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h4 className="font-medium text-safety-high mb-2">🛡️ Safety & Security</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li>Real-time safety score calculation and risk assessment</li>
                    <li>Anomaly detection for unusual behavior patterns</li>
                    <li>Emergency response coordination with local authorities</li>
                    <li>Geo-fence monitoring for restricted or dangerous areas</li>
                  </ul>
                </div>

                <div className="p-4 bg-card border border-border rounded-lg">
                  <h4 className="font-medium text-primary mb-2">🔍 Service Improvement</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li>Platform performance optimization and bug fixes</li>
                    <li>AI model training for better anomaly detection</li>
                    <li>User experience enhancements based on usage patterns</li>
                    <li>Safety algorithm improvements</li>
                  </ul>
                </div>

                <div className="p-4 bg-card border border-border rounded-lg">
                  <h4 className="font-medium text-safety-medium mb-2">📊 Analytics & Insights</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li>Aggregated tourism safety trends (anonymized)</li>
                    <li>Regional risk assessment and heat mapping</li>
                    <li>Emergency response effectiveness analysis</li>
                    <li>System performance and uptime monitoring</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Sharing & Disclosure</h2>
              <div className="space-y-3">
                <div className="p-4 bg-safety-high/10 border border-safety-high/20 rounded-lg">
                  <h4 className="font-medium text-safety-high mb-2">✅ Authorized Sharing</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li><strong>Emergency Services:</strong> During active emergencies for rescue operations</li>
                    <li><strong>Law Enforcement:</strong> When required by law or for tourist safety</li>
                    <li><strong>Tourism Authorities:</strong> For regulatory compliance and safety oversight</li>
                    <li><strong>Healthcare Providers:</strong> During medical emergencies with tourist consent</li>
                  </ul>
                </div>

                <div className="p-4 bg-safety-low/10 border border-safety-low/20 rounded-lg">
                  <h4 className="font-medium text-safety-low mb-2">❌ Never Shared</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li>Personal data sold to third parties for commercial purposes</li>
                    <li>Location history with marketing companies</li>
                    <li>Identity documents for non-safety purposes</li>
                    <li>Private communications or personal preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h4 className="font-medium mb-2">🔐 Technical Safeguards</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li>AES-256 encryption for data at rest</li>
                    <li>TLS 1.3 for data in transit</li>
                    <li>Multi-factor authentication</li>
                    <li>Regular security audits</li>
                  </ul>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h4 className="font-medium mb-2">🏛️ Organizational Measures</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                    <li>Staff privacy training programs</li>
                    <li>Role-based access controls</li>
                    <li>Data breach response procedures</li>
                    <li>Regular compliance assessments</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Your Rights & Choices</h2>
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-primary mb-2">Your Data Rights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Access:</strong> View your personal data
                    </div>
                    <div>
                      <strong>Rectification:</strong> Correct inaccurate information
                    </div>
                    <div>
                      <strong>Erasure:</strong> Delete your data (with safety exceptions)
                    </div>
                    <div>
                      <strong>Portability:</strong> Export your data
                    </div>
                    <div>
                      <strong>Restriction:</strong> Limit data processing
                    </div>
                    <div>
                      <strong>Objection:</strong> Opt-out of certain uses
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Tourist Registration Data:</strong> Retained for the duration of your visit plus 90 days</p>
                <p><strong>Location History:</strong> Automatically deleted after 30 days (unless part of an active safety case)</p>
                <p><strong>Emergency Records:</strong> Retained for 2 years for safety analysis and legal compliance</p>
                <p><strong>System Logs:</strong> Anonymized and retained for 1 year for security and performance monitoring</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-muted-foreground mb-3">
                  For privacy concerns, data requests, or questions about this policy:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Data Protection Officer</strong><br />
                    Email: privacy@travelsafeshield.gov.in<br />
                    Phone: +91-361-PRIV-123 (7748-123)
                  </div>
                  <div>
                    <strong>Postal Address</strong><br />
                    Privacy Office, Travel Safe Shield<br />
                    Tourism Department, Govt. of Assam<br />
                    Guwahati, Assam 781001
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                This privacy policy is designed to be transparent and understandable. Your trust is essential to our mission of keeping tourists safe.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PrivacyPolicy;