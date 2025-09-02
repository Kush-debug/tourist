import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Shield, User, MapPin, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import qrShieldIcon from '@/assets/qr-shield-icon.png';

interface TouristRecord {
  id: string;
  name: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  checkInDate: string;
  plannedDeparture: string;
  emergencyContact: string;
  safetyScore: number;
  status: 'verified' | 'expired' | 'flagged';
  currentLocation: string;
}

export const QRCodeScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTourist, setScannedTourist] = useState<TouristRecord | null>(null);
  const [scanHistory, setScanHistory] = useState<{ tourist: TouristRecord; timestamp: Date }[]>([]);

  // Mock tourist data for demo
  const mockTouristData: TouristRecord = {
    id: 'TS-2024-001247',
    name: 'John Smith',
    nationality: 'United States',
    documentType: 'Passport',
    documentNumber: 'US123456789',
    checkInDate: '2024-01-15',
    plannedDeparture: '2024-01-25',
    emergencyContact: '+1-555-0123',
    safetyScore: 87,
    status: 'verified',
    currentLocation: 'Guwahati, Assam'
  };

  const simulateQRScan = () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      setScannedTourist(mockTouristData);
      setScanHistory(prev => [...prev, { tourist: mockTouristData, timestamp: new Date() }]);
      setIsScanning(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'safety-high';
      case 'expired': return 'safety-medium';
      case 'flagged': return 'safety-low';
      default: return 'muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <QrCode className="h-5 w-5 text-primary" />
          Tourist ID Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Scan tourist QR codes to verify identity and check safety status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scanner Interface */}
        <div className="text-center space-y-4">
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 border-2 border-dashed border-primary/30">
            {isScanning ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Scanning QR Code...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <img src={qrShieldIcon} alt="QR Scanner" className="w-16 h-16 mx-auto opacity-50" />
                <p className="text-sm text-muted-foreground">Position QR code within the frame</p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={simulateQRScan} 
            disabled={isScanning}
            className="w-full"
            size="lg"
          >
            <QrCode className="mr-2 h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Simulate QR Scan (Demo)'}
          </Button>
        </div>

        {/* Scanned Tourist Details */}
        {scannedTourist && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Tourist Verification Result
              </h4>
              <Badge 
                className={`bg-${getStatusColor(scannedTourist.status)}/10 text-${getStatusColor(scannedTourist.status)} border-${getStatusColor(scannedTourist.status)}/20`}
              >
                {getStatusIcon(scannedTourist.status)}
                {scannedTourist.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tourist ID</label>
                  <div className="font-mono text-sm">{scannedTourist.id}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <div className="font-medium">{scannedTourist.name}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Nationality</label>
                  <div>{scannedTourist.nationality}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Document</label>
                  <div>{scannedTourist.documentType}: {scannedTourist.documentNumber}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Check-in Date</label>
                  <div>{new Date(scannedTourist.checkInDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Planned Departure</label>
                  <div>{new Date(scannedTourist.plannedDeparture).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Safety Score</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-safety-high">{scannedTourist.safetyScore}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Current Location</label>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {scannedTourist.currentLocation}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="h-3 w-3 mr-1" />
                Contact Emergency
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <MapPin className="h-3 w-3 mr-1" />
                Track Location
              </Button>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Scans</h4>
            <div className="space-y-2">
              {scanHistory.slice(-3).reverse().map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border border-border bg-muted/30">
                  <div>
                    <div className="font-medium text-sm">{scan.tourist.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {scan.tourist.id}</div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={`bg-${getStatusColor(scan.tourist.status)}/10 text-${getStatusColor(scan.tourist.status)} border-${getStatusColor(scan.tourist.status)}/20 text-xs mb-1`}
                    >
                      {scan.tourist.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {scan.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};