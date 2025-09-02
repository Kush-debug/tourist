import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Shield, AlertTriangle, Users, DollarSign, Clock } from 'lucide-react';

interface ImpactMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: React.ReactNode;
}

export const CostBenefitCard: React.FC = () => {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([
    {
      label: 'Tourists Safeguarded',
      value: '1,247',
      trend: 'up',
      description: 'Active tourists under protection this week',
      icon: <Users className="h-4 w-4" />
    },
    {
      label: 'Incidents Prevented',
      value: '23',
      trend: 'up',
      description: 'Potential incidents avoided through early alerts',
      icon: <Shield className="h-4 w-4" />
    },
    {
      label: 'Emergency Response Time',
      value: '3.2 min',
      trend: 'down',
      description: 'Average response time to emergency alerts',
      icon: <Clock className="h-4 w-4" />
    },
    {
      label: 'Cost Savings',
      value: '₹2.8L',
      trend: 'up',
      description: 'Estimated savings from prevented incidents',
      icon: <DollarSign className="h-4 w-4" />
    }
  ]);

  const [weeklyStats, setWeeklyStats] = useState({
    touristsSafe: 1247,
    alertsResolved: 156,
    emergencyResponse: 98.7,
    systemUptime: 99.9
  });

  // Simulate real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        let newValue = metric.value;
        
        switch (metric.label) {
          case 'Tourists Safeguarded':
            const currentCount = parseInt(metric.value.replace(',', ''));
            const newCount = currentCount + Math.floor(Math.random() * 3);
            newValue = newCount.toLocaleString();
            break;
          case 'Incidents Prevented':
            const incidents = parseInt(metric.value);
            newValue = (incidents + (Math.random() > 0.8 ? 1 : 0)).toString();
            break;
          case 'Emergency Response Time':
            const time = parseFloat(metric.value.replace(' min', ''));
            const variation = (Math.random() - 0.5) * 0.2;
            newValue = `${Math.max(2.5, Math.min(4.0, time + variation)).toFixed(1)} min`;
            break;
          case 'Cost Savings':
            const savings = parseFloat(metric.value.replace('₹', '').replace('L', ''));
            const newSavings = savings + (Math.random() * 0.1);
            newValue = `₹${newSavings.toFixed(1)}L`;
            break;
        }
        
        return { ...metric, value: newValue };
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-safety-high" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-safety-high transform rotate-180" />;
      default: return <div className="w-3 h-3 rounded-full bg-safety-medium"></div>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-safety-high';
      case 'down': return 'text-safety-high'; // Down is good for response time
      default: return 'text-safety-medium';
    }
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          Impact & Cost-Benefit Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time metrics showing the system's effectiveness and value
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="p-4 rounded-lg border border-border bg-gradient-to-br from-card to-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-full bg-primary/10">
                  {metric.icon}
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{metric.value}</div>
                <div className="text-sm font-medium">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Performance Summary */}
        <div className="bg-gradient-primary rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5" />
            <h4 className="font-medium">This Week's Performance</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{weeklyStats.touristsSafe.toLocaleString()}</div>
              <div className="text-sm opacity-90">Tourists kept safe</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{weeklyStats.alertsResolved}</div>
              <div className="text-sm opacity-90">Alerts resolved</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{weeklyStats.emergencyResponse}%</div>
              <div className="text-sm opacity-90">Emergency response rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{weeklyStats.systemUptime}%</div>
              <div className="text-sm opacity-90">System uptime</div>
            </div>
          </div>
        </div>

        {/* ROI Calculation */}
        <div className="border border-border rounded-lg p-4 bg-muted/30">
          <h5 className="font-medium mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Return on Investment (ROI)
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">System Operation Cost</span>
              <span className="font-medium">₹50,000/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Prevented Incident Costs</span>
              <span className="font-medium text-safety-high">₹2,80,000/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tourism Revenue Protected</span>
              <span className="font-medium text-safety-high">₹12,50,000/month</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-medium">Net Benefit</span>
              <span className="font-bold text-lg text-safety-high">₹14,80,000/month</span>
            </div>
            <Badge className="w-full justify-center py-2 bg-safety-high/10 text-safety-high border-safety-high/20">
              2,960% ROI - Exceptional Value
            </Badge>
          </div>
        </div>

        {/* Success Stories */}
        <div className="space-y-3">
          <h5 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-safety-medium" />
            Recent Success Stories
          </h5>
          <div className="space-y-2">
            <div className="p-3 bg-safety-high/10 rounded-lg border border-safety-high/20">
              <div className="text-sm font-medium text-safety-high">Tourist Rescued in Remote Area</div>
              <div className="text-xs text-muted-foreground">
                System detected 45-minute inactivity, dispatched help - tourist found safely with minor injury
              </div>
            </div>
            <div className="p-3 bg-safety-medium/10 rounded-lg border border-safety-medium/20">
              <div className="text-sm font-medium text-safety-medium">Route Deviation Alert</div>
              <div className="text-xs text-muted-foreground">
                Prevented tourist from entering restricted wildlife area during dangerous weather
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm font-medium text-primary">Emergency SOS Response</div>
              <div className="text-xs text-muted-foreground">
                Voice SOS detected, emergency services reached tourist in 2.8 minutes
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};