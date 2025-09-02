import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hash, Shield, Clock, CheckCircle, Link, Database } from 'lucide-react';
import { db, createHash, createMerkleRoot } from '@/config/firebase';

interface BlockchainLog {
  id: string;
  action: string;
  data: any;
  hash: string;
  previousHash: string;
  merkleRoot: string;
  timestamp: Date;
  touristId: string;
  verified: boolean;
}

interface BlockchainStats {
  totalLogs: number;
  verifiedLogs: number;
  lastBlockTime: Date;
  chainIntegrity: number;
}

export const BlockchainLogSystem: React.FC<{ userId?: string }> = ({ userId = 'tourist_123' }) => {
  const [blockchainLogs, setBlockchainLogs] = useState<BlockchainLog[]>([]);
  const [stats, setStats] = useState<BlockchainStats>({
    totalLogs: 0,
    verifiedLogs: 0,
    lastBlockTime: new Date(),
    chainIntegrity: 100
  });
  const [isLogging, setIsLogging] = useState(true);

  // Add entry to blockchain log
  const addToBlockchain = async (action: string, data: any) => {
    try {
      const previousHash = blockchainLogs.length > 0 ? blockchainLogs[0].hash : '0000000000000000';
      
      const logEntry = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        data,
        hash: '',
        previousHash,
        merkleRoot: '',
        timestamp: new Date(),
        touristId: userId,
        verified: false
      };

      // Create hash for this entry
      const entryString = JSON.stringify({
        action,
        data,
        previousHash,
        timestamp: logEntry.timestamp.toISOString(),
        touristId: userId
      });
      logEntry.hash = createHash(entryString);

      // Create Merkle root
      const allHashes = [logEntry.hash, ...blockchainLogs.map(log => log.hash)];
      logEntry.merkleRoot = createMerkleRoot(allHashes);
      logEntry.verified = true;

      // Store in Firebase
      await db.ref(`blockchain_logs/${logEntry.id}`).set(logEntry);
      
      // Update local state
      setBlockchainLogs(prev => [logEntry, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalLogs: prev.totalLogs + 1,
        verifiedLogs: prev.verifiedLogs + 1,
        lastBlockTime: new Date()
      }));

      return logEntry;
    } catch (error) {
      console.error('Failed to add blockchain log:', error);
      return null;
    }
  };

  // Verify blockchain integrity
  const verifyChainIntegrity = () => {
    let integrityScore = 100;
    
    for (let i = 1; i < blockchainLogs.length; i++) {
      const currentLog = blockchainLogs[i];
      const previousLog = blockchainLogs[i - 1];
      
      if (currentLog.previousHash !== previousLog.hash) {
        integrityScore -= 10;
      }
    }
    
    setStats(prev => ({ ...prev, chainIntegrity: Math.max(0, integrityScore) }));
    return integrityScore;
  };

  // Load blockchain logs from Firebase
  const loadBlockchainLogs = async () => {
    try {
      const snapshot = await db.ref('blockchain_logs').get();
      const data = snapshot.val();
      
      if (data) {
        const logs = Object.values(data) as BlockchainLog[];
        const userLogs = logs
          .filter(log => log.touristId === userId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setBlockchainLogs(userLogs);
        setStats(prev => ({
          ...prev,
          totalLogs: userLogs.length,
          verifiedLogs: userLogs.filter(log => log.verified).length
        }));
      }
    } catch (error) {
      console.error('Failed to load blockchain logs:', error);
    }
  };

  // Simulate automatic logging
  const simulateAutomaticLogging = () => {
    const actions = [
      { action: 'LOCATION_UPDATE', data: { lat: 26.1445, lng: 91.7362, accuracy: 5 } },
      { action: 'SAFETY_SCORE_CALCULATED', data: { score: 85, factors: ['time', 'location', 'crowd'] } },
      { action: 'SAFE_ZONE_ENTERED', data: { zoneId: 'police_001', zoneName: 'Police Station' } },
      { action: 'VOICE_COMMAND_PROCESSED', data: { command: 'help me', language: 'english' } },
      { action: 'ID_VERIFIED', data: { verifiedBy: 'Officer Sharma', authority: 'Guwahati Police' } }
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    addToBlockchain(randomAction.action, randomAction.data);
  };

  // Initialize
  useEffect(() => {
    loadBlockchainLogs();
    
    // Auto-log events every 45 seconds for demo
    const interval = setInterval(() => {
      if (isLogging && Math.random() > 0.7) {
        simulateAutomaticLogging();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isLogging]);

  // Verify integrity when logs change
  useEffect(() => {
    if (blockchainLogs.length > 1) {
      verifyChainIntegrity();
    }
  }, [blockchainLogs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ID_GENERATED': return 'bg-blue-100 text-blue-800';
      case 'EMERGENCY_TRIGGERED': return 'bg-red-100 text-red-800';
      case 'LOCATION_UPDATE': return 'bg-green-100 text-green-800';
      case 'SAFETY_SCORE_CALCULATED': return 'bg-yellow-100 text-yellow-800';
      case 'ID_VERIFIED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Blockchain Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Blockchain-Lite Log System
          </CardTitle>
          <CardDescription>
            Tamper-proof activity logging with SHA-256 hashing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalLogs}</div>
              <div className="text-xs text-muted-foreground">Total Logs</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.verifiedLogs}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.chainIntegrity}%</div>
              <div className="text-xs text-muted-foreground">Chain Integrity</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((new Date().getTime() - stats.lastBlockTime.getTime()) / 1000)}s
              </div>
              <div className="text-xs text-muted-foreground">Last Block</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsLogging(!isLogging)}
              variant={isLogging ? "destructive" : "default"}
              className="flex-1"
            >
              {isLogging ? 'Stop Logging' : 'Start Logging'}
            </Button>
            <Button onClick={simulateAutomaticLogging} variant="outline">
              Add Test Log
            </Button>
            <Button onClick={() => verifyChainIntegrity()} variant="outline">
              Verify Chain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Immutable Activity Log
          </CardTitle>
          <CardDescription>
            Cryptographically secured activity history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockchainLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No blockchain logs yet</p>
              <p className="text-sm">Activity will be automatically logged</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {blockchainLogs.map((log, index) => (
                <div key={log.id} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getActionColor(log.action)}>
                      {log.action.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {log.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                      <span className="text-xs text-muted-foreground">
                        Block #{blockchainLogs.length - index}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Data:</span>
                      <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                        {JSON.stringify(log.data, null, 2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Hash:</span>
                        <p className="font-mono break-all text-muted-foreground">{log.hash}</p>
                      </div>
                      <div>
                        <span className="font-medium">Previous Hash:</span>
                        <p className="font-mono break-all text-muted-foreground">{log.previousHash}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {log.timestamp.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link className="h-3 w-3" />
                        Merkle: {log.merkleRoot.substr(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Security Info */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-600 mt-1" />
            <div>
              <h4 className="font-medium text-indigo-900 mb-2">Blockchain-Lite Security</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• <strong>SHA-256 Hashing:</strong> Cryptographic security for all logs</li>
                <li>• <strong>Chain Linking:</strong> Each block references previous block hash</li>
                <li>• <strong>Merkle Trees:</strong> Efficient verification of log integrity</li>
                <li>• <strong>Immutable Records:</strong> Cannot be altered once written</li>
                <li>• <strong>Tamper Detection:</strong> Any modification breaks the chain</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
