import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  QrCode, 
  Shield, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  Lock, 
  Unlock,
  CheckCircle,
  AlertTriangle,
  Hash,
  Clock,
  User,
  MapPin,
  Phone,
  Camera,
  Fingerprint,
  Database
} from 'lucide-react';

interface TouristIdentity {
  id: string;
  qrCode: string;
  personalInfo: {
    name: string;
    nationality: string;
    passportNumber: string;
    emergencyContact: string;
    bloodType: string;
    medicalConditions: string[];
  };
  travelInfo: {
    entryDate: Date;
    plannedDuration: number;
    destinations: string[];
    accommodation: string;
    localGuide?: string;
  };
  securityInfo: {
    biometricHash: string;
    photoHash: string;
    digitalSignature: string;
    issueTimestamp: Date;
    lastVerified: Date;
    verificationCount: number;
  };
  blockchainRecord: {
    blockHash: string;
    previousHash: string;
    merkleRoot: string;
    timestamp: Date;
    nonce: number;
    difficulty: number;
  };
  verificationHistory: VerificationRecord[];
}

interface VerificationRecord {
  id: string;
  timestamp: Date;
  location: { lat: number; lng: number };
  verifierType: 'police' | 'hotel' | 'restaurant' | 'guide' | 'tourist_office';
  verifierName: string;
  purpose: string;
  status: 'verified' | 'flagged' | 'expired';
  digitalSignature: string;
}

interface BlockchainIdentityProps {
  onIdentityCreated?: (identity: TouristIdentity) => void;
  onIdentityVerified?: (verification: VerificationRecord) => void;
}

export const BlockchainIdentity: React.FC<BlockchainIdentityProps> = ({
  onIdentityCreated,
  onIdentityVerified
}) => {
  const [currentIdentity, setCurrentIdentity] = useState<TouristIdentity | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<'syncing' | 'synced' | 'error'>('synced');

  // Simulate blockchain hashing
  const generateHash = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  // Generate Merkle Root for blockchain verification
  const generateMerkleRoot = (transactions: string[]): string => {
    if (transactions.length === 0) return '0';
    if (transactions.length === 1) return generateHash(transactions[0]);
    
    const hashes = transactions.map(tx => generateHash(tx));
    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        newHashes.push(generateHash(left + right));
      }
      hashes.splice(0, hashes.length, ...newHashes);
    }
    return hashes[0];
  };

  // Create new tourist identity
  const generateTouristIdentity = async () => {
    setIsGenerating(true);
    
    // Simulate identity generation process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const personalData = {
      name: "John Doe",
      nationality: "USA",
      passportNumber: "US123456789",
      emergencyContact: "+1-555-0123",
      bloodType: "O+",
      medicalConditions: ["None"]
    };
    
    const travelData = {
      entryDate: new Date(),
      plannedDuration: 7,
      destinations: ["Guwahati", "Kaziranga", "Shillong"],
      accommodation: "Radisson Blu Hotel"
    };
    
    const timestamp = new Date();
    const identityString = JSON.stringify({ ...personalData, ...travelData, timestamp });
    const biometricHash = generateHash("fingerprint_data_" + Date.now());
    const photoHash = generateHash("photo_data_" + Date.now());
    
    // Create blockchain record
    const previousHash = currentIdentity?.blockchainRecord.blockHash || "0000000000000000";
    const transactions = [
      `IDENTITY_CREATED:${personalData.name}`,
      `PASSPORT:${personalData.passportNumber}`,
      `ENTRY_DATE:${timestamp.toISOString()}`
    ];
    const merkleRoot = generateMerkleRoot(transactions);
    const blockData = previousHash + merkleRoot + timestamp.getTime();
    const blockHash = generateHash(blockData);
    
    const newIdentity: TouristIdentity = {
      id: `TSS_${Date.now()}`,
      qrCode: `TSS://${blockHash}?v=${generateHash(identityString)}`,
      personalInfo: personalData,
      travelInfo: travelData,
      securityInfo: {
        biometricHash,
        photoHash,
        digitalSignature: generateHash(identityString + biometricHash),
        issueTimestamp: timestamp,
        lastVerified: timestamp,
        verificationCount: 0
      },
      blockchainRecord: {
        blockHash,
        previousHash,
        merkleRoot,
        timestamp,
        nonce: Math.floor(Math.random() * 1000000),
        difficulty: 4
      },
      verificationHistory: []
    };
    
    setCurrentIdentity(newIdentity);
    setQrCodeData(newIdentity.qrCode);
    setIsGenerating(false);
    
    if (onIdentityCreated) {
      onIdentityCreated(newIdentity);
    }
  };

  // Verify identity using QR code
  const verifyIdentity = async () => {
    if (!verificationCode) return;
    
    setIsVerifying(true);
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verification: VerificationRecord = {
      id: `VER_${Date.now()}`,
      timestamp: new Date(),
      location: { lat: 26.1445, lng: 91.7362 },
      verifierType: 'police',
      verifierName: 'Guwahati Police Station',
      purpose: 'Routine Security Check',
      status: 'verified',
      digitalSignature: generateHash(verificationCode + Date.now())
    };
    
    if (currentIdentity) {
      const updatedIdentity = {
        ...currentIdentity,
        securityInfo: {
          ...currentIdentity.securityInfo,
          lastVerified: new Date(),
          verificationCount: currentIdentity.securityInfo.verificationCount + 1
        },
        verificationHistory: [verification, ...currentIdentity.verificationHistory]
      };
      setCurrentIdentity(updatedIdentity);
    }
    
    setIsVerifying(false);
    setVerificationCode('');
    
    if (onIdentityVerified) {
      onIdentityVerified(verification);
    }
  };

  // Generate QR Code visualization (simplified)
  const generateQRCodeSVG = (data: string) => {
    const size = 200;
    const modules = 25;
    const moduleSize = size / modules;
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    // Generate pattern based on data hash
    const hash = generateHash(data);
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        const shouldFill = parseInt(hash[(i * modules + j) % hash.length], 16) > 7;
        if (shouldFill) {
          svg += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  };

  const downloadQRCode = () => {
    if (!currentIdentity) return;
    
    const svg = generateQRCodeSVG(currentIdentity.qrCode);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourist-id-${currentIdentity.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'safety-high';
      case 'flagged': return 'safety-low';
      case 'expired': return 'safety-medium';
      default: return 'muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Blockchain Status */}
      <Alert className={`border-${blockchainStatus === 'synced' ? 'safety-high' : 'safety-medium'}/20`}>
        <Database className={`h-4 w-4 text-${blockchainStatus === 'synced' ? 'safety-high' : 'safety-medium'}`} />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Blockchain Network: <strong>{blockchainStatus === 'synced' ? 'Synchronized' : 'Syncing...'}</strong>
            </span>
            <Badge className={`bg-${blockchainStatus === 'synced' ? 'safety-high' : 'safety-medium'}/10 text-${blockchainStatus === 'synced' ? 'safety-high' : 'safety-medium'}`}>
              {blockchainStatus === 'synced' ? 'SECURE' : 'SYNCING'}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Identity Generation */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-primary" />
            Blockchain Tourist Identity
            {currentIdentity && (
              <Badge variant="outline" className="bg-safety-high/10 text-safety-high">
                ID: {currentIdentity.id}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentIdentity ? (
            <div className="text-center space-y-4">
              <div className="p-8 border-2 border-dashed border-border rounded-lg">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Generate Your Digital Tourist ID</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a tamper-proof, blockchain-secured digital identity for safe tourism
                </p>
                <Button 
                  onClick={generateTouristIdentity}
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Hash className="h-4 w-4 mr-2 animate-spin" />
                      Generating Identity...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Digital ID
                    </>
                  )}
                </Button>
              </div>
              
              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={66} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Generating cryptographic keys and blockchain record...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-lg border-2 border-primary/20">
                  <div 
                    dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(currentIdentity.qrCode) }}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Your Secure Tourist QR Code</p>
                  <p className="text-xs text-muted-foreground break-all bg-muted/50 p-2 rounded">
                    {currentIdentity.qrCode}
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadQRCode}>
                    <Download className="h-3 w-3 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>

              {/* Identity Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{currentIdentity.personalInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nationality:</span>
                      <span>{currentIdentity.personalInfo.nationality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passport:</span>
                      <span className="font-mono text-xs">{currentIdentity.personalInfo.passportNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blood Type:</span>
                      <span>{currentIdentity.personalInfo.bloodType}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Travel Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Date:</span>
                      <span>{currentIdentity.travelInfo.entryDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{currentIdentity.travelInfo.plannedDuration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destinations:</span>
                      <span className="text-right text-xs">{currentIdentity.travelInfo.destinations.join(', ')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Blockchain Security Info */}
              <Card className="border border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Blockchain Security Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Block Hash:</span>
                      <div className="font-mono text-xs bg-white p-2 rounded border mt-1">
                        {currentIdentity.blockchainRecord.blockHash}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Merkle Root:</span>
                      <div className="font-mono text-xs bg-white p-2 rounded border mt-1">
                        {currentIdentity.blockchainRecord.merkleRoot}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div>Nonce: {currentIdentity.blockchainRecord.nonce}</div>
                      <div>Difficulty: {currentIdentity.blockchainRecord.difficulty}</div>
                      <div>Verifications: {currentIdentity.securityInfo.verificationCount}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  {showPrivateKey && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="text-xs font-medium text-yellow-800 mb-1">Digital Signature:</div>
                      <div className="font-mono text-xs text-yellow-700 break-all">
                        {currentIdentity.securityInfo.digitalSignature}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Identity Verification */}
      {currentIdentity && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-primary" />
              Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter verification code or scan QR"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={verifyIdentity}
                disabled={!verificationCode || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Hash className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>

            {/* Verification History */}
            {currentIdentity.verificationHistory.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Verification History ({currentIdentity.verificationHistory.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentIdentity.verificationHistory.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium text-sm">{record.verifierName}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.purpose} • {record.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <Badge 
                        className={`bg-${getStatusColor(record.status)}/10 text-${getStatusColor(record.status)} border-${getStatusColor(record.status)}/20 text-xs`}
                      >
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card className="shadow-card border-0 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Blockchain-Lite Security Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-high" />
                <span>Tamper-proof digital identity</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-high" />
                <span>Cryptographic hash verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-high" />
                <span>Immutable verification logs</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-high" />
                <span>Instant QR code verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-high" />
                <span>Emergency contact integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-safety-high" />
                <span>Multi-authority acceptance</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Blockchain-like security without the complexity. Accepted by police, hotels, and certified service providers.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
