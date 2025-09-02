import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Phone, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Your message has been sent successfully!', {
        description: 'We will respond within 24 hours.',
        duration: 5000,
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: '',
          subject: '',
          message: '',
          priority: 'medium'
        });
      }, 3000);
    }, 2000);
  };

  const isFormValid = formData.name && formData.email && formData.subject && formData.message && formData.category;

  const categories = [
    { value: 'technical', label: 'Technical Support' },
    { value: 'emergency', label: 'Emergency Response' },
    { value: 'registration', label: 'Tourist Registration' },
    { value: 'privacy', label: 'Privacy & Data' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'partnership', label: 'Partnership Inquiry' },
    { value: 'other', label: 'Other' }
  ];

  if (isSubmitted) {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-safety-high/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-safety-high" />
            </div>
            <h3 className="text-xl font-bold text-safety-high">Message Sent Successfully!</h3>
            <p className="text-muted-foreground">
              Thank you for contacting Travel Safe Shield. We have received your message and will respond within 24 hours.
            </p>
            <Badge className="bg-safety-high/10 text-safety-high border-safety-high/20">
              Ticket ID: TSS-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact Form */}
      <div className="lg:col-span-2">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              Contact Us
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Send us a message and we'll respond as soon as possible
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Brief description of your inquiry"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Please provide detailed information about your inquiry or issue..."
                  rows={6}
                  required
                />
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant={formData.priority === priority ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleInputChange('priority', priority)}
                      className={`capitalize ${
                        priority === 'urgent' ? 'border-safety-low text-safety-low hover:bg-safety-low hover:text-white' :
                        priority === 'high' ? 'border-safety-medium text-safety-medium hover:bg-safety-medium hover:text-white' :
                        ''
                      }`}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">Emergency Hotline</div>
                <div className="text-sm text-muted-foreground">+91-361-SAFE-123</div>
                <div className="text-xs text-safety-low">24/7 Emergency Support</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">General Inquiries</div>
                <div className="text-sm text-muted-foreground">support@travelsafeshield.gov.in</div>
                <div className="text-xs text-muted-foreground">Response within 24 hours</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">Office Address</div>
                <div className="text-sm text-muted-foreground">
                  Tourism Department<br />
                  Govt. of Assam<br />
                  Guwahati, Assam 781001
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">Office Hours</div>
                <div className="text-sm text-muted-foreground">
                  Mon - Fri: 9:00 AM - 6:00 PM<br />
                  Sat: 9:00 AM - 2:00 PM<br />
                  Sun: Emergency only
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              📋 FAQ & Help Center
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              🔧 Technical Support
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              🚨 Report Emergency
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              📊 System Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};