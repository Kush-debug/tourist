import { ethers } from 'ethers';
import crypto from 'crypto';
import { prisma } from '../server.js';
import { logger } from '../utils/logger.js';

// Smart Contract ABI for Tourist Identity Management
const TOURIST_IDENTITY_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_nationality",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_passportHash",
        "type": "string"
      }
    ],
    "name": "registerTourist",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_touristId",
        "type": "uint256"
      }
    ],
    "name": "getTouristInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "nationality",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "passportHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "registrationDate",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isVerified",
            "type": "bool"
          }
        ],
        "internalType": "struct TouristIdentity.Tourist",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_touristId",
        "type": "uint256"
      }
    ],
    "name": "verifyTourist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_touristId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_emergencyData",
        "type": "string"
      }
    ],
    "name": "updateEmergencyData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_touristId",
        "type": "uint256"
      }
    ],
    "name": "getEmergencyData",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Smart Contract ABI for Emergency Response System
const EMERGENCY_RESPONSE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_touristId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_emergencyType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "_severity",
        "type": "uint8"
      }
    ],
    "name": "createEmergencyAlert",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_alertId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_status",
        "type": "uint8"
      }
    ],
    "name": "updateAlertStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_alertId",
        "type": "uint256"
      }
    ],
    "name": "getEmergencyAlert",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "touristId",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "emergencyType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "severity",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct EmergencyResponse.EmergencyAlert",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider, wallet, touristIdentityContract, emergencyResponseContract;

export async function initializeBlockchain() {
  try {
    // Initialize Ethereum provider
    const network = process.env.ETHEREUM_NETWORK || 'sepolia';
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    
    if (!rpcUrl) {
      logger.warn('Ethereum RPC URL not provided, blockchain features will be disabled');
      return null;
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Initialize wallet
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    if (!privateKey) {
      logger.warn('Ethereum private key not provided, blockchain features will be disabled');
      return null;
    }

    wallet = new ethers.Wallet(privateKey, provider);
    
    // Initialize contracts
    const touristIdentityAddress = process.env.TOURIST_IDENTITY_CONTRACT_ADDRESS;
    const emergencyResponseAddress = process.env.EMERGENCY_RESPONSE_CONTRACT_ADDRESS;
    
    if (touristIdentityAddress) {
      touristIdentityContract = new ethers.Contract(
        touristIdentityAddress,
        TOURIST_IDENTITY_ABI,
        wallet
      );
    }
    
    if (emergencyResponseAddress) {
      emergencyResponseContract = new ethers.Contract(
        emergencyResponseAddress,
        EMERGENCY_RESPONSE_ABI,
        wallet
      );
    }

    logger.info(`Blockchain initialized on ${network} network`);
    return {
      provider,
      wallet,
      touristIdentityContract,
      emergencyResponseContract
    };
  } catch (error) {
    logger.error('Failed to initialize blockchain:', error);
    return null;
  }
}

export async function createBlockchainIdentity(userId) {
  try {
    if (!touristIdentityContract) {
      throw new Error('Tourist identity contract not initialized');
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { touristProfile: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate wallet
    const wallet = ethers.Wallet.createRandom();
    const privateKeyHash = crypto.createHash('sha256').update(wallet.privateKey).digest('hex');
    
    // Create identity hash
    const identityData = `${user.firstName}${user.lastName}${user.nationality}${user.passportNumber}${Date.now()}`;
    const identityHash = crypto.createHash('sha256').update(identityData).digest('hex');

    // Register on blockchain
    const fullName = `${user.firstName} ${user.lastName}`;
    const passportHash = crypto.createHash('sha256').update(user.passportNumber || '').digest('hex');
    
    const tx = await touristIdentityContract.registerTourist(
      fullName,
      user.nationality || 'Unknown',
      passportHash
    );
    
    await tx.wait();
    
    // Get tourist ID from transaction
    const receipt = await provider.getTransactionReceipt(tx.hash);
    const touristId = receipt.logs[0]?.topics[1] ? 
      ethers.getBigInt(receipt.logs[0].topics[1]) : 
      Date.now();

    // Store in database
    const blockchainIdentity = await prisma.blockchainIdentity.create({
      data: {
        userId,
        walletAddress: wallet.address,
        privateKeyHash,
        publicKey: wallet.publicKey,
        identityHash,
        isVerified: false
      }
    });

    logger.info(`Blockchain identity created for user ${userId}: ${wallet.address}`);
    return blockchainIdentity;

  } catch (error) {
    logger.error(`Failed to create blockchain identity for user ${userId}:`, error);
    throw error;
  }
}

export async function verifyBlockchainIdentity(userId) {
  try {
    if (!touristIdentityContract) {
      throw new Error('Tourist identity contract not initialized');
    }

    const blockchainIdentity = await prisma.blockchainIdentity.findUnique({
      where: { userId }
    });

    if (!blockchainIdentity) {
      throw new Error('Blockchain identity not found');
    }

    // Verify on blockchain
    const tx = await touristIdentityContract.verifyTourist(blockchainIdentity.identityHash);
    await tx.wait();

    // Update database
    await prisma.blockchainIdentity.update({
      where: { userId },
      data: { isVerified: true }
    });

    logger.info(`Blockchain identity verified for user ${userId}`);
    return true;

  } catch (error) {
    logger.error(`Failed to verify blockchain identity for user ${userId}:`, error);
    throw error;
  }
}

export async function createEmergencyAlertOnBlockchain(touristId, emergencyData) {
  try {
    if (!emergencyResponseContract) {
      throw new Error('Emergency response contract not initialized');
    }

    const {
      type,
      location,
      severity,
      description
    } = emergencyData;

    // Create alert on blockchain
    const tx = await emergencyResponseContract.createEmergencyAlert(
      touristId,
      getEmergencyTypeCode(type),
      location,
      getSeverityCode(severity)
    );
    
    await tx.wait();
    
    // Get alert ID from transaction
    const receipt = await provider.getTransactionReceipt(tx.hash);
    const alertId = receipt.logs[0]?.topics[1] ? 
      ethers.getBigInt(receipt.logs[0].topics[1]) : 
      Date.now();

    logger.info(`Emergency alert created on blockchain: ${alertId}`);
    return alertId;

  } catch (error) {
    logger.error('Failed to create emergency alert on blockchain:', error);
    throw error;
  }
}

export async function updateEmergencyDataOnBlockchain(userId, emergencyData) {
  try {
    if (!touristIdentityContract) {
      throw new Error('Tourist identity contract not initialized');
    }

    const blockchainIdentity = await prisma.blockchainIdentity.findUnique({
      where: { userId }
    });

    if (!blockchainIdentity) {
      throw new Error('Blockchain identity not found');
    }

    const emergencyDataString = JSON.stringify(emergencyData);
    
    // Update on blockchain
    const tx = await touristIdentityContract.updateEmergencyData(
      blockchainIdentity.identityHash,
      emergencyDataString
    );
    
    await tx.wait();

    logger.info(`Emergency data updated on blockchain for user ${userId}`);
    return true;

  } catch (error) {
    logger.error(`Failed to update emergency data on blockchain for user ${userId}:`, error);
    throw error;
  }
}

export async function getBlockchainIdentity(userId) {
  try {
    const blockchainIdentity = await prisma.blockchainIdentity.findUnique({
      where: { userId }
    });

    if (!blockchainIdentity) {
      return null;
    }

    // Get additional data from blockchain if contract is available
    if (touristIdentityContract) {
      try {
        const touristInfo = await touristIdentityContract.getTouristInfo(blockchainIdentity.identityHash);
        const emergencyData = await touristIdentityContract.getEmergencyData(blockchainIdentity.identityHash);
        
        return {
          ...blockchainIdentity,
          touristInfo: {
            name: touristInfo.name,
            nationality: touristInfo.nationality,
            registrationDate: new Date(Number(touristInfo.registrationDate) * 1000),
            isVerified: touristInfo.isVerified
          },
          emergencyData: emergencyData ? JSON.parse(emergencyData) : null
        };
      } catch (error) {
        logger.error(`Failed to get blockchain data for user ${userId}:`, error);
      }
    }

    return blockchainIdentity;

  } catch (error) {
    logger.error(`Failed to get blockchain identity for user ${userId}:`, error);
    throw error;
  }
}

export async function createTrustConnectionOnBlockchain(fromUserId, toUserId, trustLevel) {
  try {
    // This would be implemented with a separate smart contract for trust network
    // For now, we'll just log the action
    logger.info(`Trust connection created: ${fromUserId} -> ${toUserId} (${trustLevel})`);
    
    return {
      transactionHash: `trust_${Date.now()}`,
      status: 'success'
    };

  } catch (error) {
    logger.error('Failed to create trust connection on blockchain:', error);
    throw error;
  }
}

// Helper functions
function getEmergencyTypeCode(type) {
  const typeMap = {
    'PANIC_BUTTON': 0,
    'VOICE_COMMAND': 1,
    'ANOMALY_DETECTION': 2,
    'GEOFENCE_VIOLATION': 3,
    'MANUAL_REPORT': 4,
    'MEDICAL_EMERGENCY': 5,
    'CRIME_VICTIM': 6,
    'ACCIDENT': 7,
    'NATURAL_DISASTER': 8
  };
  return typeMap[type] || 0;
}

function getSeverityCode(severity) {
  const severityMap = {
    'LOW': 0,
    'MEDIUM': 1,
    'HIGH': 2,
    'CRITICAL': 3
  };
  return severityMap[severity] || 0;
}

// Smart Contract Deployment Script
export async function deploySmartContracts() {
  try {
    if (!wallet) {
      throw new Error('Wallet not initialized');
    }

    logger.info('Deploying smart contracts...');

    // Deploy Tourist Identity Contract
    const TouristIdentityFactory = new ethers.ContractFactory(
      TOURIST_IDENTITY_ABI,
      TOURIST_IDENTITY_BYTECODE, // You would need the bytecode
      wallet
    );
    
    const touristIdentityContract = await TouristIdentityFactory.deploy();
    await touristIdentityContract.waitForDeployment();
    
    // Deploy Emergency Response Contract
    const EmergencyResponseFactory = new ethers.ContractFactory(
      EMERGENCY_RESPONSE_ABI,
      EMERGENCY_RESPONSE_BYTECODE, // You would need the bytecode
      wallet
    );
    
    const emergencyResponseContract = await EmergencyResponseFactory.deploy();
    await emergencyResponseContract.waitForDeployment();

    logger.info('Smart contracts deployed successfully');
    logger.info(`Tourist Identity Contract: ${touristIdentityContract.target}`);
    logger.info(`Emergency Response Contract: ${emergencyResponseContract.target}`);

    return {
      touristIdentityAddress: touristIdentityContract.target,
      emergencyResponseAddress: emergencyResponseContract.target
    };

  } catch (error) {
    logger.error('Failed to deploy smart contracts:', error);
    throw error;
  }
}

// Get blockchain status
export async function getBlockchainStatus() {
  try {
    if (!provider) {
      return { status: 'disabled', reason: 'Provider not initialized' };
    }

    const network = await provider.getNetwork();
    const balance = await wallet.getBalance();
    const blockNumber = await provider.getBlockNumber();

    return {
      status: 'active',
      network: network.name,
      chainId: network.chainId,
      walletAddress: wallet.address,
      balance: ethers.formatEther(balance),
      blockNumber,
      contracts: {
        touristIdentity: touristIdentityContract?.target || 'Not deployed',
        emergencyResponse: emergencyResponseContract?.target || 'Not deployed'
      }
    };

  } catch (error) {
    logger.error('Failed to get blockchain status:', error);
    return { status: 'error', reason: error.message };
  }
}
