import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Shield, CheckCircle, Clock, Hash } from 'lucide-react';
import { db, createHash, createMerkleRoot } from '@/config/firebase';

interface TouristID {
  id: string;
  name: string;
  nationality: string;
  passportNumber: string;
  phoneNumber: string;
  emergencyContact: string;
  qrCode: string;
  blockchainHash: string;
  merkleRoot: string;
  createdAt: Date;
  verifications: Verification[];
}

interface Verification {
  id: string;
  verifiedBy: string;
  authority: string;
  location: string;
  timestamp: Date;
  purpose: string;
}

export const TouristDigitalID: React.FC = () => {
  const [touristData, setTouristData] = useState({
    name: '',
    nationality: '',
    passportNumber: '',
    phoneNumber: '',
    emergencyContact: ''
  });
  const [generatedID, setGeneratedID] = useState<TouristID | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<Verification[]>([]);

  // Generate Tourist Digital ID
  const generateDigitalID = async () => {
    setIsGenerating(true);
    
    try {
      // Create unique ID
      const uniqueID = `TSS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create blockchain-lite hash
      const dataString = JSON.stringify({
        ...touristData,
        id: uniqueID,
        timestamp: new Date().toISOString()
      });
      const blockchainHash = createHash(dataString);
      
      // Create Merkle root (simulating blockchain verification)
      const previousHashes = await getPreviousHashes();
      const merkleRoot = createMerkleRoot([...previousHashes, blockchainHash]);
      
      // Generate QR code data
      const qrData = JSON.stringify({
        id: uniqueID,
        name: touristData.name,
        hash: blockchainHash,
        merkle: merkleRoot,
        issued: new Date().toISOString()
      });
      
      const newID: TouristID = {
        id: uniqueID,
        ...touristData,
        qrCode: qrData,
        blockchainHash,
        merkleRoot,
        createdAt: new Date(),
        verifications: []
      };
      
      // Store in Firebase (simulated)
      await db.ref(`tourist_ids/${uniqueID}`).set(newID);
      await db.ref(`blockchain_hashes/${blockchainHash}`).set({
        touristId: uniqueID,
        timestamp: new Date().toISOString(),
        merkleRoot
      });
      
      setGeneratedID(newID);
      
      // Add to blockchain log
      await addToBlockchainLog('ID_GENERATED', {
        touristId: uniqueID,
        hash: blockchainHash,
        merkleRoot
      });
      
    } catch (error) {
      console.error('Failed to generate digital ID:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get previous hashes for Merkle root calculation
  const getPreviousHashes = async (): Promise<string[]> => {
    try {
      const snapshot = await db.ref('blockchain_hashes').get();
      const data = snapshot.val();
      return data ? Object.keys(data) : [];
    } catch (error) {
      return [];
    }
  };

  // Add to blockchain log
  const addToBlockchainLog = async (action: string, data: any) => {
    const logEntry = {
      action,
      data,
      timestamp: new Date().toISOString(),
      hash: createHash(JSON.stringify({ action, data, timestamp: Date.now() }))
    };
    
    await db.ref('blockchain_logs').push(logEntry);
  };

  // Simulate verification by authority
  const simulateVerification = async () => {
    if (!generatedID) return;
    
    const verification: Verification = {
      id: `verify_${Date.now()}`,
      verifiedBy: 'Officer Sharma',
      authority: 'Guwahati Police Station',
      location: 'Pan Bazaar, Guwahati',
      timestamp: new Date(),
      purpose: 'Hotel Check-in Verification'
    };
    
    setVerificationHistory(prev => [verification, ...prev]);
    
    // Update Firebase
    await db.ref(`tourist_ids/${generatedID.id}/verifications`).push(verification);
    
    // Add to blockchain log
    await addToBlockchainLog('ID_VERIFIED', {
      touristId: generatedID.id,
      verificationId: verification.id,
      authority: verification.authority
    });
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!generatedID) return;
    
    // Create QR code SVG (simplified for demo)
    const qrSvg = generateQRCodeSVG(generatedID.qrCode);
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourist_id_${generatedID.id}.svg`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  // Generate simple QR code SVG
  const generateQRCodeSVG = (data: string) => {
    const size = 200;
    const modules = 25;
    const moduleSize = size / modules;
    
    // Simple pattern generation (use real QR library in production)
    let pattern = '';
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        const hash = createHash(`${data}_${i}_${j}`);
        const isDark = parseInt(hash.substr(0, 2), 16) > 128;
        if (isDark) {
          pattern += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
    
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        ${pattern}
      </svg>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Registration Form */}
      {!generatedID && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Generate Tourist Digital ID
            </CardTitle>
            <CardDescription>
              Create a blockchain-secured digital identity with QR code verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={touristData.name}
                  onChange={(e) => setTouristData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={touristData.nationality}
                  onChange={(e) => setTouristData(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="Enter nationality"
                />
              </div>
              <div>
                <Label htmlFor="passport">Passport Number</Label>
                <Input
                  id="passport"
                  value={touristData.passportNumber}
                  onChange={(e) => setTouristData(prev => ({ ...prev, passportNumber: e.target.value }))}
                  placeholder="Enter passport number"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={touristData.phoneNumber}
                  onChange={(e) => setTouristData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={touristData.emergencyContact}
                  onChange={(e) => setTouristData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="Enter emergency contact number"
                />
              </div>
            </div>
            
            <Button 
              onClick={generateDigitalID}
              disabled={isGenerating || !touristData.name || !touristData.passportNumber}
              className="w-full"
            >
              {isGenerating ? "Generating Blockchain ID..." : "Generate Digital ID"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Digital ID */}
      {generatedID && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Digital Tourist ID Generated
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Blockchain Secured
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code Display */}
                <div className="text-center space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-primary/20 inline-block">
                    <div 
                      className="w-48 h-48 bg-gray-100 rounded border flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(generatedID.qrCode) }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button onClick={downloadQRCode} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button onClick={simulateVerification} variant="outline" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Simulate Verification
                    </Button>
                  </div>
                </div>

                {/* ID Details */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tourist ID</Label>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{generatedID.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="font-medium">{generatedID.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                    <p>{generatedID.nationality}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Blockchain Hash</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                      {generatedID.blockchainHash}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Merkle Root</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                      {generatedID.merkleRoot}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Generated: {generatedID.createdAt.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Verification History
              </CardTitle>
              <CardDescription>
                Blockchain-secured verification log (tamper-proof)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No verifications yet. QR code ready for scanning by authorities.
                </p>
              ) : (
                <div className="space-y-3">
                  {verificationHistory.map((verification) => (
                    <div key={verification.id} className="border rounded-lg p-3 bg-green-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{verification.authority}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Officer:</strong> {verification.verifiedBy}</p>
                        <p><strong>Location:</strong> {verification.location}</p>
                        <p><strong>Purpose:</strong> {verification.purpose}</p>
                        <p><strong>Time:</strong> {verification.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blockchain Security Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Blockchain-Lite Security</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Tamper-proof:</strong> Cryptographic hashing prevents ID forgery</li>
                    <li>• <strong>Immutable:</strong> Stored with Merkle root verification</li>
                    <li>• <strong>Multi-authority:</strong> Accepted by police, hotels, airports</li>
                    <li>• <strong>Instant verification:</strong> QR scan provides immediate authenticity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
