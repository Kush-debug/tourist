import React, { useState, useEffect } from 'react';
import { trustNetworkService, TrustScore, TrustMetrics, TrustRecommendation } from '../services/TrustNetworkService';

const TrustDashboard: React.FC = () => {
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<TrustRecommendation[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrustData();
  }, []);

  const loadTrustData = async () => {
    try {
      setLoading(true);
      
      // Generate comprehensive trust report
      const report = await trustNetworkService.generateTrustReport();
      setTrustScore(report.current_score);
      setMetrics(report.metrics);
      setRecommendations(report.recommendations);

      // Get additional insights
      const trustInsights = await trustNetworkService.getTrustInsights();
      setInsights(trustInsights);

    } catch (error) {
      setError('Failed to load trust data');
      console.error('Error loading trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (level: string): string => {
    switch (level) {
      case 'very_high': return 'text-green-600 bg-green-100';
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'very_low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrustLevelIcon = (level: string): string => {
    switch (level) {
      case 'very_high': return '🟢';
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🟠';
      case 'very_low': return '🔴';
      default: return '⚪';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trust Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive trust analytics and reputation insights</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Trust Score */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Trust Score</h2>
            
            {trustScore && (
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {trustScore.overall_score}
                </div>
                <div className="text-sm text-gray-600 mb-4">out of 100</div>
                
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTrustLevelColor(trustScore.trust_level)}`}>
                  <span className="mr-2">{getTrustLevelIcon(trustScore.trust_level)}</span>
                  {trustScore.trust_level.replace('_', ' ').toUpperCase()}
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${trustScore.overall_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <div>Interactions: {trustScore.interaction_count}</div>
                  <div className="flex items-center justify-center mt-1">
                    <span className="mr-1">Blockchain:</span>
                    {trustScore.blockchain_verified ? (
                      <span className="text-green-600">✅ Verified</span>
                    ) : (
                      <span className="text-red-600">❌ Not Verified</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trust Metrics */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trust Metrics</h2>
            
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.total_relationships}</div>
                  <div className="text-sm text-gray-600">Relationships</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.average_trust_score}</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{metrics.highest_trust_score}</div>
                  <div className="text-sm text-gray-600">Highest Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics.lowest_trust_score}</div>
                  <div className="text-sm text-gray-600">Lowest Score</div>
                </div>
              </div>
            )}

            {/* Trust Distribution */}
            {metrics && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Trust Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(metrics.trust_distribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">{getTrustLevelIcon(level)}</span>
                        <span className="text-sm capitalize">{level.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              level === 'very_high' || level === 'high' ? 'bg-green-500' :
                              level === 'medium' ? 'bg-yellow-500' :
                              level === 'low' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(count / metrics.total_relationships) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reputation Trend */}
            {metrics && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Reputation Trend</h3>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getTrendIcon(metrics.reputation_trend)}</span>
                  <span className="text-lg capitalize">{metrics.reputation_trend}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Insights */}
      {insights && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{insights.network_strength}</div>
                <div className="text-sm text-gray-600">Network Strength</div>
                <div className="text-xs text-gray-500 mt-1">Based on connections and scores</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{insights.diversity_score}</div>
                <div className="text-sm text-gray-600">Diversity Score</div>
                <div className="text-xs text-gray-500 mt-1">Geographic and cultural diversity</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 capitalize">{insights.activity_level}</div>
                <div className="text-sm text-gray-600">Activity Level</div>
                <div className="text-xs text-gray-500 mt-1">Based on interaction frequency</div>
              </div>
            </div>

            {/* Geographic Distribution */}
            {insights.geographic_distribution && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Geographic Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(insights.geographic_distribution).map(([country, count]) => (
                    <div key={country} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-gray-900">{country}</div>
                      <div className="text-sm text-gray-600">{count} connections</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trust Recommendations</h2>
            
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.user_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">👤</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{rec.user_name}</h4>
                        <p className="text-sm text-gray-600">{rec.nationality}</p>
                        <p className="text-xs text-gray-500">{rec.mutual_connections} mutual connections</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{rec.recommended_score}</div>
                      <div className="text-sm text-gray-600">Recommended Score</div>
                      <div className="text-xs text-gray-500">
                        Confidence: {Math.round(rec.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-700">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Integration Info */}
      <div className="mt-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔗 Blockchain Trust System</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Immutable Trust Records</h4>
              <p className="text-gray-600">
                All trust relationships are recorded on the blockchain, ensuring transparency and preventing tampering.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Decentralized Reputation</h4>
              <p className="text-gray-600">
                Your reputation is built through verified interactions and cannot be manipulated by any single entity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustDashboard;
