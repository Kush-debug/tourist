import React, { useState, useEffect } from 'react';
import { apiService } from '../services/ApiService';
import { blockchainService } from '../services/BlockchainService';

interface TrustRelationship {
  id: number;
  user_id: number;
  trusted_user_id: number;
  trust_score: number;
  interaction_count: number;
  created_at: string;
  updated_at: string;
  trusted_user_name: string;
  nationality: string;
  blockchain_wallet: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  nationality: string;
  blockchain_wallet: string;
  trust_score?: number;
}

const TrustNetwork: React.FC = () => {
  const [trustNetwork, setTrustNetwork] = useState<TrustRelationship[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTrust, setShowAddTrust] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [trustScore, setTrustScore] = useState(50);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadTrustNetwork();
    loadAllUsers();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadTrustNetwork = async () => {
    try {
      setLoading(true);
      const network = await apiService.getTrustNetwork();
      setTrustNetwork(network);
    } catch (error) {
      setError('Failed to load trust network');
      console.error('Error loading trust network:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      // For demo purposes, we'll create a mock list of users
      // In a real app, this would be an API call
      const mockUsers: User[] = [
        { id: 1, name: 'John Smith', email: 'john.smith@example.com', nationality: 'USA', blockchain_wallet: 'TSS123...' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@example.com', nationality: 'UK', blockchain_wallet: 'TSS456...' },
        { id: 3, name: 'Raj Patel', email: 'raj.patel@example.com', nationality: 'India', blockchain_wallet: 'TSS789...' },
        { id: 4, name: 'Maria Garcia', email: 'maria.garcia@example.com', nationality: 'Spain', blockchain_wallet: 'TSS012...' },
        { id: 5, name: 'Yuki Tanaka', email: 'yuki.tanaka@example.com', nationality: 'Japan', blockchain_wallet: 'TSS345...' },
        { id: 6, name: 'Alex Muller', email: 'alex.muller@example.com', nationality: 'Germany', blockchain_wallet: 'TSS678...' }
      ];
      setAllUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const addTrustRelationship = async () => {
    if (!selectedUser || !userProfile) return;

    try {
      // Create blockchain transaction for trust
      const transaction = blockchainService.createTrustTransaction(
        {
          address: userProfile.blockchain_wallet,
          privateKey: '', // In real app, this would be securely stored
          publicKey: ''
        },
        allUsers.find(u => u.id === selectedUser)?.blockchain_wallet || '',
        trustScore,
        'trust_rating'
      );

      // Add trust relationship via API
      await apiService.addTrustRelationship(selectedUser, trustScore);

      // Reload trust network
      await loadTrustNetwork();
      
      setShowAddTrust(false);
      setSelectedUser(null);
      setTrustScore(50);

      console.log('Trust transaction created:', transaction);
    } catch (error) {
      setError('Failed to add trust relationship');
      console.error('Error adding trust relationship:', error);
    }
  };

  const getTrustLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'High Trust', color: 'text-green-600' };
    if (score >= 60) return { level: 'Medium Trust', color: 'text-yellow-600' };
    if (score >= 40) return { level: 'Low Trust', color: 'text-orange-600' };
    return { level: 'Very Low Trust', color: 'text-red-600' };
  };

  const getTrustIcon = (score: number): string => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  };

  const calculateOverallTrustScore = (): number => {
    if (trustNetwork.length === 0) return 0;
    const totalScore = trustNetwork.reduce((sum, relationship) => sum + relationship.trust_score, 0);
    return Math.round(totalScore / trustNetwork.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trust Network</h1>
            <p className="text-gray-600 mt-2">Manage your trust relationships and reputation</p>
          </div>
          <button
            onClick={() => setShowAddTrust(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Trust Relationship
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Overall Trust Score */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Overall Trust Score</h2>
              <p className="text-gray-600">Based on {trustNetwork.length} relationships</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {calculateOverallTrustScore()}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${calculateOverallTrustScore()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Trust Network List */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Your Trust Network</h3>
          
          {trustNetwork.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">🤝</div>
              <p className="text-lg">No trust relationships yet</p>
              <p className="text-sm">Start building your trust network by adding relationships</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {trustNetwork.map((relationship) => {
                const trustLevel = getTrustLevel(relationship.trust_score);
                return (
                  <div key={relationship.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getTrustIcon(relationship.trust_score)}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{relationship.trusted_user_name}</h4>
                          <p className="text-sm text-gray-600">{relationship.nationality}</p>
                          <p className="text-xs text-gray-500 font-mono">{relationship.blockchain_wallet}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${trustLevel.color}`}>
                          {relationship.trust_score}
                        </div>
                        <div className={`text-sm ${trustLevel.color}`}>
                          {trustLevel.level}
                        </div>
                        <div className="text-xs text-gray-500">
                          {relationship.interaction_count} interactions
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            relationship.trust_score >= 80 ? 'bg-green-500' :
                            relationship.trust_score >= 60 ? 'bg-yellow-500' :
                            relationship.trust_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${relationship.trust_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Trust Relationship Modal */}
        {showAddTrust && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Add Trust Relationship</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a user...</option>
                    {allUsers
                      .filter(user => !trustNetwork.some(rel => rel.trusted_user_id === user.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.nationality})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trust Score: {trustScore}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trustScore}
                    onChange={(e) => setTrustScore(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>No Trust</span>
                    <span>Complete Trust</span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddTrust(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTrustRelationship}
                    disabled={!selectedUser}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Trust
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Integration Info */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔗 Blockchain Integration</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Trust Transactions</h4>
              <p className="text-gray-600">
                Each trust relationship is recorded as a blockchain transaction, ensuring transparency and immutability.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reputation System</h4>
              <p className="text-gray-600">
                Your overall trust score is calculated from all relationships and stored on the blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustNetwork;
export { TrustNetwork };