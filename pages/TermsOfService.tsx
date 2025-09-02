import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
                <p className="text-xs text-muted-foreground">Terms of Service</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-card border-0 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="h-6 w-6 text-primary" />
              Terms of Service
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: January 15, 2024
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using the Travel Safe Shield platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Travel Safe Shield is a comprehensive tourist safety monitoring system that provides:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Digital tourist ID generation and verification</li>
                <li>Real-time safety score monitoring</li>
                <li>Emergency SOS and panic button functionality</li>
                <li>Geo-fencing and location-based alerts</li>
                <li>AI-powered anomaly detection</li>
                <li>Voice-activated emergency assistance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Tourist Users:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Provide accurate personal information during registration</li>
                    <li>Keep your digital tourist ID secure and accessible</li>
                    <li>Use emergency features responsibly and only in genuine emergencies</li>
                    <li>Maintain your device in good working condition for optimal service</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Authorized Personnel:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Use the dashboard and monitoring tools only for legitimate safety purposes</li>
                    <li>Protect tourist privacy and data according to applicable laws</li>
                    <li>Respond promptly and appropriately to emergency alerts</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to protecting your privacy. Location data, personal information, and emergency records are encrypted and stored securely. Data is only shared with authorized emergency services and tourism authorities when necessary for your safety. For detailed information, please review our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Emergency Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our emergency features are designed to supplement, not replace, official emergency services. In case of emergency:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Always call local emergency numbers (100, 102, 101) when immediate help is needed</li>
                <li>Use our SOS features as an additional safety measure</li>
                <li>Understand that response times may vary based on location and circumstances</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                While we strive to provide reliable safety services, we cannot guarantee 100% accuracy or availability. Users acknowledge that the service is a safety aid and not a complete security solution. Travel Safe Shield shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We aim to maintain 99.9% uptime but cannot guarantee uninterrupted service. Maintenance, technical issues, or force majeure events may temporarily affect service availability. Critical safety features are prioritized during any service disruptions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modifications to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via the platform or registered contact methods. Continued use of the service after modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of India and the specific regulations of Northeast Indian states where the service operates. Any disputes shall be resolved through appropriate legal channels in the jurisdiction where the service is provided.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-muted-foreground mb-2">
                  For questions about these terms or our service:
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Email: legal@travelsafeshield.gov.in</li>
                  <li>Phone: +91-361-SAFE-123 (7233-123)</li>
                  <li>Address: Tourism Department, Govt. of Assam, Guwahati</li>
                </ul>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                By using Travel Safe Shield, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TermsOfService;