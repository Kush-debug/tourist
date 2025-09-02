import { apiService } from './ApiService';
import { blockchainService } from './BlockchainService';

export interface TrustScore {
  user_id: number;
  overall_score: number;
  interaction_count: number;
  trust_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  last_updated: number;
  blockchain_verified: boolean;
}

export interface TrustMetrics {
  total_relationships: number;
  average_trust_score: number;
  highest_trust_score: number;
  lowest_trust_score: number;
  trust_distribution: {
    very_high: number;
    high: number;
    medium: number;
    low: number;
    very_low: number;
  };
  reputation_trend: 'increasing' | 'decreasing' | 'stable';
  blockchain_transactions: number;
}

export interface TrustRecommendation {
  user_id: number;
  user_name: string;
  nationality: string;
  recommended_score: number;
  reason: string;
  confidence: number;
  mutual_connections: number;
}

class TrustNetworkService {
  private trustHistory: TrustScore[] = [];
  private onTrustUpdate?: (trustScore: TrustScore) => void;
  private onReputationChange?: (metrics: TrustMetrics) => void;

  // Initialize trust network service
  async initialize(): Promise<void> {
    try {
      // Load trust history from localStorage
      const savedHistory = localStorage.getItem('trust_history');
      if (savedHistory) {
        this.trustHistory = JSON.parse(savedHistory);
      }

      // Set up periodic trust score updates
      setInterval(() => {
        this.updateTrustScores();
      }, 300000); // Update every 5 minutes

      console.log('Trust Network Service initialized');
    } catch (error) {
      console.error('Failed to initialize trust network service:', error);
    }
  }

  // Calculate comprehensive trust score
  async calculateTrustScore(userId: number): Promise<TrustScore> {
    try {
      const trustNetwork = await apiService.getTrustNetwork();
      
      if (trustNetwork.length === 0) {
        return {
          user_id: userId,
          overall_score: 50, // Default neutral score
          interaction_count: 0,
          trust_level: 'medium',
          last_updated: Date.now(),
          blockchain_verified: false
        };
      }

      // Calculate weighted average trust score
      let totalScore = 0;
      let totalWeight = 0;
      let totalInteractions = 0;

      trustNetwork.forEach(relationship => {
        const weight = this.calculateTrustWeight(relationship);
        totalScore += relationship.trust_score * weight;
        totalWeight += weight;
        totalInteractions += relationship.interaction_count;
      });

      const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
      const trustLevel = this.getTrustLevel(overallScore);
      
      // Check blockchain verification
      const blockchainVerified = await this.verifyBlockchainTrust(userId);

      const trustScore: TrustScore = {
        user_id: userId,
        overall_score: overallScore,
        interaction_count: totalInteractions,
        trust_level: trustLevel,
        last_updated: Date.now(),
        blockchain_verified: blockchainVerified
      };

      // Save to history
      this.saveTrustScore(trustScore);

      return trustScore;
    } catch (error) {
      console.error('Failed to calculate trust score:', error);
      throw error;
    }
  }

  // Calculate trust weight based on various factors
  private calculateTrustWeight(relationship: any): number {
    let weight = 1.0;

    // More interactions = higher weight
    weight += Math.log(relationship.interaction_count + 1) * 0.1;

    // Recent relationships = higher weight
    const daysSinceUpdate = (Date.now() - new Date(relationship.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    weight += Math.max(0, 1 - daysSinceUpdate / 30) * 0.2;

    // Higher trust scores = higher weight
    weight += (relationship.trust_score / 100) * 0.3;

    return weight;
  }

  // Get trust level from score
  private getTrustLevel(score: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (score >= 90) return 'very_high';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 25) return 'low';
    return 'very_low';
  }

  // Verify trust on blockchain
  private async verifyBlockchainTrust(userId: number): Promise<boolean> {
    try {
      // In a real implementation, this would verify blockchain transactions
      // For demo purposes, we'll simulate verification
      const userProfile = await apiService.getUserProfile();
      if (userProfile.blockchain_wallet) {
        // Simulate blockchain verification
        return Math.random() > 0.3; // 70% chance of verification
      }
      return false;
    } catch (error) {
      console.error('Failed to verify blockchain trust:', error);
      return false;
    }
  }

  // Get trust metrics
  async getTrustMetrics(): Promise<TrustMetrics> {
    try {
      const trustNetwork = await apiService.getTrustNetwork();
      
      if (trustNetwork.length === 0) {
        return {
          total_relationships: 0,
          average_trust_score: 50,
          highest_trust_score: 50,
          lowest_trust_score: 50,
          trust_distribution: {
            very_high: 0,
            high: 0,
            medium: 0,
            low: 0,
            very_low: 0
          },
          reputation_trend: 'stable',
          blockchain_transactions: 0
        };
      }

      const scores = trustNetwork.map(r => r.trust_score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);

      // Calculate distribution
      const distribution = {
        very_high: scores.filter(s => s >= 90).length,
        high: scores.filter(s => s >= 75 && s < 90).length,
        medium: scores.filter(s => s >= 50 && s < 75).length,
        low: scores.filter(s => s >= 25 && s < 50).length,
        very_low: scores.filter(s => s < 25).length
      };

      // Calculate reputation trend
      const trend = this.calculateReputationTrend();

      return {
        total_relationships: trustNetwork.length,
        average_trust_score: Math.round(averageScore),
        highest_trust_score: highestScore,
        lowest_trust_score: lowestScore,
        trust_distribution: distribution,
        reputation_trend: trend,
        blockchain_transactions: trustNetwork.length // Simplified
      };
    } catch (error) {
      console.error('Failed to get trust metrics:', error);
      throw error;
    }
  }

  // Calculate reputation trend
  private calculateReputationTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.trustHistory.length < 2) return 'stable';

    const recent = this.trustHistory.slice(-5);
    const older = this.trustHistory.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, t) => sum + t.overall_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, t) => sum + t.overall_score, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }

  // Get trust recommendations
  async getTrustRecommendations(): Promise<TrustRecommendation[]> {
    try {
      // In a real implementation, this would use ML algorithms
      // For demo purposes, we'll generate mock recommendations
      const recommendations: TrustRecommendation[] = [
        {
          user_id: 1,
          user_name: 'John Smith',
          nationality: 'USA',
          recommended_score: 85,
          reason: 'High interaction frequency and positive feedback',
          confidence: 0.9,
          mutual_connections: 3
        },
        {
          user_id: 2,
          user_name: 'Sarah Johnson',
          nationality: 'UK',
          recommended_score: 78,
          reason: 'Similar travel patterns and shared experiences',
          confidence: 0.8,
          mutual_connections: 2
        },
        {
          user_id: 3,
          user_name: 'Raj Patel',
          nationality: 'India',
          recommended_score: 72,
          reason: 'Local knowledge and cultural insights',
          confidence: 0.7,
          mutual_connections: 1
        }
      ];

      return recommendations;
    } catch (error) {
      console.error('Failed to get trust recommendations:', error);
      return [];
    }
  }

  // Add trust relationship with blockchain transaction
  async addTrustRelationship(
    trustedUserId: number, 
    trustScore: number, 
    reason: string = 'manual_rating'
  ): Promise<void> {
    try {
      // Create blockchain transaction
      const userProfile = await apiService.getUserProfile();
      const transaction = blockchainService.createTrustTransaction(
        {
          address: userProfile.blockchain_wallet,
          privateKey: '', // In real app, this would be securely stored
          publicKey: ''
        },
        `TSS_USER_${trustedUserId}`, // Mock trusted user address
        trustScore,
        reason
      );

      // Add to API
      await apiService.addTrustRelationship(trustedUserId, trustScore);

      // Update local trust scores
      await this.updateTrustScores();

      console.log('Trust relationship added with blockchain transaction:', transaction);
    } catch (error) {
      console.error('Failed to add trust relationship:', error);
      throw error;
    }
  }

  // Update trust scores
  private async updateTrustScores(): Promise<void> {
    try {
      const userProfile = await apiService.getUserProfile();
      const trustScore = await this.calculateTrustScore(userProfile.id);
      
      this.onTrustUpdate?.(trustScore);
    } catch (error) {
      console.error('Failed to update trust scores:', error);
    }
  }

  // Save trust score to history
  private saveTrustScore(trustScore: TrustScore): void {
    this.trustHistory.push(trustScore);
    
    // Keep only last 100 entries
    if (this.trustHistory.length > 100) {
      this.trustHistory = this.trustHistory.slice(-100);
    }

    // Save to localStorage
    localStorage.setItem('trust_history', JSON.stringify(this.trustHistory));
  }

  // Get trust history
  getTrustHistory(): TrustScore[] {
    return [...this.trustHistory];
  }

  // Set callbacks
  setCallbacks(
    onTrustUpdate?: (trustScore: TrustScore) => void,
    onReputationChange?: (metrics: TrustMetrics) => void
  ): void {
    this.onTrustUpdate = onTrustUpdate;
    this.onReputationChange = onReputationChange;
  }

  // Generate trust report
  async generateTrustReport(): Promise<{
    current_score: TrustScore;
    metrics: TrustMetrics;
    recommendations: TrustRecommendation[];
    history: TrustScore[];
  }> {
    try {
      const userProfile = await apiService.getUserProfile();
      const currentScore = await this.calculateTrustScore(userProfile.id);
      const metrics = await this.getTrustMetrics();
      const recommendations = await this.getTrustRecommendations();
      const history = this.getTrustHistory();

      return {
        current_score: currentScore,
        metrics: metrics,
        recommendations: recommendations,
        history: history
      };
    } catch (error) {
      console.error('Failed to generate trust report:', error);
      throw error;
    }
  }

  // Calculate trust decay (scores decrease over time without interaction)
  calculateTrustDecay(relationship: any): number {
    const daysSinceUpdate = (Date.now() - new Date(relationship.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    const decayRate = 0.1; // 0.1 points per day
    const decay = Math.min(daysSinceUpdate * decayRate, 20); // Max 20 point decay
    
    return Math.max(relationship.trust_score - decay, 0);
  }

  // Get trust network insights
  async getTrustInsights(): Promise<{
    network_strength: number;
    diversity_score: number;
    geographic_distribution: any;
    activity_level: 'low' | 'medium' | 'high';
  }> {
    try {
      const trustNetwork = await apiService.getTrustNetwork();
      
      if (trustNetwork.length === 0) {
        return {
          network_strength: 0,
          diversity_score: 0,
          geographic_distribution: {},
          activity_level: 'low'
        };
      }

      // Calculate network strength
      const totalScore = trustNetwork.reduce((sum, r) => sum + r.trust_score, 0);
      const networkStrength = Math.round((totalScore / trustNetwork.length) * (trustNetwork.length / 10));

      // Calculate diversity score based on nationalities
      const nationalities = new Set(trustNetwork.map(r => r.nationality));
      const diversityScore = Math.min(nationalities.size * 20, 100);

      // Geographic distribution
      const geoDistribution = trustNetwork.reduce((acc, r) => {
        acc[r.nationality] = (acc[r.nationality] || 0) + 1;
        return acc;
      }, {} as any);

      // Activity level
      const totalInteractions = trustNetwork.reduce((sum, r) => sum + r.interaction_count, 0);
      const avgInteractions = totalInteractions / trustNetwork.length;
      let activityLevel: 'low' | 'medium' | 'high' = 'low';
      if (avgInteractions > 10) activityLevel = 'high';
      else if (avgInteractions > 5) activityLevel = 'medium';

      return {
        network_strength: networkStrength,
        diversity_score: diversityScore,
        geographic_distribution: geoDistribution,
        activity_level: activityLevel
      };
    } catch (error) {
      console.error('Failed to get trust insights:', error);
      throw error;
    }
  }
}

export const trustNetworkService = new TrustNetworkService();
export default trustNetworkService;
