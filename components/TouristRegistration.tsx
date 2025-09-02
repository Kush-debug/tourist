import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, QrCode, Shield, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';
import qrShieldIcon from '@/assets/qr-shield-icon.png';

interface TouristData {
  name: string;
  phone: string;
  idType: string;
  idNumber: string;
  destination: string;
  emergencyContact: string;
}

export const TouristRegistration: React.FC = () => {
  const [formData, setFormData] = useState<TouristData>({
    name: '',
    phone: '',
    idType: 'passport',
    idNumber: '',
    destination: '',
    emergencyContact: ''
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [touristId, setTouristId] = useState('');

  const handleInputChange = (field: keyof TouristData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateTouristId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TS-${timestamp}-${random}`.toUpperCase();
  };

  const handleRegistration = async () => {
    const id = generateTouristId();
    setTouristId(id);

    // Create QR code data
    const qrData = JSON.stringify({
      touristId: id,
      name: formData.name,
      phone: formData.phone,
      destination: formData.destination,
      registrationTime: new Date().toISOString(),
      status: 'active'
    });

    try {
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e40af', // Primary blue
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
      setIsRegistered(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  if (isRegistered) {
    return (
      <Card className="shadow-card border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl text-primary">
            <CheckCircle className="h-6 w-6" />
            Registration Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-gradient-primary p-6 rounded-xl text-white">
            <div className="mb-4">
              <Badge className="bg-white/20 text-white text-sm px-3 py-1">
                Digital Tourist ID
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-2">{touristId}</div>
            <div className="text-white/90">{formData.name}</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-inner">
            <img src={qrCodeUrl} alt="Tourist QR Code" className="mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Scan this QR code at checkpoints and hotels
            </p>
          </div>

          <div className="bg-safety-high/10 p-4 rounded-lg border border-safety-high/20">
            <div className="flex items-center gap-2 mb-2 text-safety-high font-medium">
              <Shield className="h-4 w-4" />
              You're now protected by Travel Safe Shield
            </div>
            <p className="text-sm text-muted-foreground">
              Your safety score is being monitored. Keep your phone charged and location services enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <img src={qrShieldIcon} alt="QR Shield" className="h-6 w-6" />
          Tourist Registration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Register to get your Digital Tourist ID and activate safety monitoring
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+91 9876543210"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="idNumber">ID Number *</Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => handleInputChange('idNumber', e.target.value)}
              placeholder="Passport/Aadhaar Number"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              placeholder="Northeast India"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="emergency">Emergency Contact *</Label>
          <Input
            id="emergency"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            placeholder="Emergency contact number"
            className="mt-1"
          />
        </div>

        <Button 
          onClick={handleRegistration}
          className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
          size="lg"
          disabled={!formData.name || !formData.phone || !formData.idNumber}
        >
          <QrCode className="mr-2 h-5 w-5" />
          Generate Digital Tourist ID
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          By registering, you agree to location sharing for safety monitoring. 
          Your data is protected by blockchain-grade security.
        </div>
      </CardContent>
    </Card>
  );
};