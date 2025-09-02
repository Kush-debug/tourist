import crypto from 'crypto-js';

export interface BlockchainWallet {
  address: string;
  privateKey: string;
  publicKey: string;
}

export interface BlockchainTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  type: 'trust' | 'safety' | 'emergency' | 'identity';
  data: any;
  signature: string;
}

export interface TrustScore {
  userAddress: string;
  score: number;
  interactions: number;
  lastUpdated: number;
}

class BlockchainService {
  private readonly BLOCKCHAIN_NAME = 'TravelSafeShield';
  private readonly VERSION = '1.0.0';

  // Generate a new blockchain wallet
  generateWallet(): BlockchainWallet {
    const privateKey = crypto.lib.WordArray.random(32).toString();
    const publicKey = crypto.SHA256(privateKey).toString();
    const address = this.generateAddress(publicKey);
    
    return {
      address,
      privateKey,
      publicKey
    };
  }

  // Generate address from public key
  private generateAddress(publicKey: string): string {
    const hash = crypto.SHA256(publicKey).toString();
    return `TSS${hash.substring(0, 37).toUpperCase()}`;
  }

  // Verify wallet address format
  verifyAddress(address: string): boolean {
    return /^TSS[A-F0-9]{37}$/.test(address);
  }

  // Create a digital signature
  createSignature(data: string, privateKey: string): string {
    return crypto.HmacSHA256(data, privateKey).toString();
  }

  // Verify a digital signature
  verifySignature(data: string, signature: string, publicKey: string): boolean {
    const expectedSignature = crypto.HmacSHA256(data, publicKey).toString();
    return signature === expectedSignature;
  }

  // Create a blockchain transaction
  createTransaction(
    from: string,
    to: string,
    amount: number,
    type: 'trust' | 'safety' | 'emergency' | 'identity',
    data: any,
    privateKey: string
  ): BlockchainTransaction {
    const transaction: Omit<BlockchainTransaction, 'id' | 'signature'> = {
      from,
      to,
      amount,
      timestamp: Date.now(),
      type,
      data
    };

    const transactionData = JSON.stringify(transaction);
    const signature = this.createSignature(transactionData, privateKey);
    const id = crypto.SHA256(transactionData + signature).toString();

    return {
      ...transaction,
      id,
      signature
    };
  }

  // Verify a blockchain transaction
  verifyTransaction(transaction: BlockchainTransaction, publicKey: string): boolean {
    const { signature, ...transactionData } = transaction;
    const dataString = JSON.stringify(transactionData);
    return this.verifySignature(dataString, signature, publicKey);
  }

  // Create trust score transaction
  createTrustTransaction(
    fromWallet: BlockchainWallet,
    toAddress: string,
    trustScore: number,
    interactionType: string
  ): BlockchainTransaction {
    return this.createTransaction(
      fromWallet.address,
      toAddress,
      trustScore,
      'trust',
      {
        interactionType,
        timestamp: Date.now(),
        blockchain: this.BLOCKCHAIN_NAME,
        version: this.VERSION
      },
      fromWallet.privateKey
    );
  }

  // Create safety incident transaction
  createSafetyTransaction(
    wallet: BlockchainWallet,
    incidentType: string,
    location: { lat: number; lng: number },
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): BlockchainTransaction {
    return this.createTransaction(
      wallet.address,
      'TSS_SAFETY_SYSTEM',
      0,
      'safety',
      {
        incidentType,
        location,
        severity,
        timestamp: Date.now(),
        blockchain: this.BLOCKCHAIN_NAME,
        version: this.VERSION
      },
      wallet.privateKey
    );
  }

  // Create emergency alert transaction
  createEmergencyTransaction(
    wallet: BlockchainWallet,
    alertType: string,
    location: { lat: number; lng: number },
    description: string
  ): BlockchainTransaction {
    return this.createTransaction(
      wallet.address,
      'TSS_EMERGENCY_SYSTEM',
      0,
      'emergency',
      {
        alertType,
        location,
        description,
        timestamp: Date.now(),
        blockchain: this.BLOCKCHAIN_NAME,
        version: this.VERSION
      },
      wallet.privateKey
    );
  }

  // Create identity verification transaction
  createIdentityTransaction(
    wallet: BlockchainWallet,
    identityData: {
      name: string;
      nationality: string;
      phoneNumber: string;
      verifiedBy: string;
    }
  ): BlockchainTransaction {
    return this.createTransaction(
      wallet.address,
      'TSS_IDENTITY_SYSTEM',
      0,
      'identity',
      {
        ...identityData,
        timestamp: Date.now(),
        blockchain: this.BLOCKCHAIN_NAME,
        version: this.VERSION
      },
      wallet.privateKey
    );
  }

  // Calculate trust score from blockchain data
  calculateTrustScore(transactions: BlockchainTransaction[]): TrustScore {
    let totalScore = 0;
    let interactionCount = 0;
    let lastUpdated = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'trust') {
        totalScore += transaction.amount;
        interactionCount++;
        lastUpdated = Math.max(lastUpdated, transaction.timestamp);
      }
    });

    const averageScore = interactionCount > 0 ? totalScore / interactionCount : 50;

    return {
      userAddress: transactions[0]?.from || '',
      score: Math.min(100, Math.max(0, averageScore)),
      interactions: interactionCount,
      lastUpdated
    };
  }

  // Generate QR code data for wallet
  generateWalletQR(wallet: BlockchainWallet): string {
    const qrData = {
      blockchain: this.BLOCKCHAIN_NAME,
      version: this.VERSION,
      address: wallet.address,
      publicKey: wallet.publicKey,
      timestamp: Date.now()
    };

    return JSON.stringify(qrData);
  }

  // Parse QR code data
  parseWalletQR(qrData: string): { address: string; publicKey: string } | null {
    try {
      const data = JSON.parse(qrData);
      if (data.blockchain === this.BLOCKCHAIN_NAME && data.version === this.VERSION) {
        return {
          address: data.address,
          publicKey: data.publicKey
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Create a blockchain hash for data integrity
  createDataHash(data: any): string {
    return crypto.SHA256(JSON.stringify(data)).toString();
  }

  // Verify data integrity
  verifyDataIntegrity(data: any, expectedHash: string): boolean {
    const actualHash = this.createDataHash(data);
    return actualHash === expectedHash;
  }

  // Get blockchain network info
  getNetworkInfo() {
    return {
      name: this.BLOCKCHAIN_NAME,
      version: this.VERSION,
      networkId: 'TSS_MAINNET',
      consensus: 'Proof of Trust',
      blockTime: 10000, // 10 seconds
      totalSupply: 1000000,
      circulatingSupply: 500000
    };
  }

  // Create a smart contract for trust scoring
  createTrustContract(
    wallet: BlockchainWallet,
    contractAddress: string,
    rules: {
      minTrustScore: number;
      maxTrustScore: number;
      decayRate: number;
      boostRate: number;
    }
  ): BlockchainTransaction {
    return this.createTransaction(
      wallet.address,
      contractAddress,
      0,
      'trust',
      {
        contractType: 'TrustScoring',
        rules,
        timestamp: Date.now(),
        blockchain: this.BLOCKCHAIN_NAME,
        version: this.VERSION
      },
      wallet.privateKey
    );
  }

  // Simulate blockchain mining (for demo purposes)
  simulateMining(transactions: BlockchainTransaction[]): {
    blockHash: string;
    blockNumber: number;
    timestamp: number;
    transactions: BlockchainTransaction[];
  } {
    const blockData = {
      blockNumber: Math.floor(Date.now() / 10000),
      timestamp: Date.now(),
      transactions,
      previousHash: crypto.SHA256('previous_block').toString()
    };

    const blockHash = crypto.SHA256(JSON.stringify(blockData)).toString();

    return {
      blockHash,
      blockNumber: blockData.blockNumber,
      timestamp: blockData.timestamp,
      transactions
    };
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
