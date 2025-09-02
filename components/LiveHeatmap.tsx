import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface HeatmapData {
  area: string;
  tourists: number;
  riskLevel: 'low' | 'medium' | 'high';
  incidents: number;
  coordinates: { x: number; y: number };
}

export const LiveHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([
    { area: 'Guwahati City Center', tourists: 127, riskLevel: 'low', incidents: 0, coordinates: { x: 30, y: 40 } },
    { area: 'Kamakhya Temple', tourists: 89, riskLevel: 'low', incidents: 0, coordinates: { x: 50, y: 30 } },
    { area: 'Brahmaputra Riverfront', tourists: 156, riskLevel: 'medium', incidents: 1, coordinates: { x: 70, y: 50 } },
    { area: 'Umananda Island', tourists: 45, riskLevel: 'low', incidents: 0, coordinates: { x: 40, y: 60 } },
    { area: 'Pobitora Wildlife', tourists: 23, riskLevel: 'high', incidents: 2, coordinates: { x: 80, y: 30 } },
    { area: 'Deepor Beel', tourists: 12, riskLevel: 'medium', incidents: 0, coordinates: { x: 20, y: 70 } },
  ]);

  const [animationKey, setAnimationKey] = useState(0);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setHeatmapData(prev => prev.map(area => ({
        ...area,
        tourists: Math.max(5, area.tourists + Math.floor((Math.random() - 0.5) * 10)),
        coordinates: {
          x: Math.max(10, Math.min(90, area.coordinates.x + (Math.random() - 0.5) * 2)),
          y: Math.max(10, Math.min(90, area.coordinates.y + (Math.random() - 0.5) * 2))
        }
      })));
      setAnimationKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'safety-high';
      case 'medium': return 'safety-medium';
      case 'high': return 'safety-low';
      default: return 'muted';
    }
  };

  const getHeatmapIntensity = (tourists: number) => {
    if (tourists > 100) return 'high';
    if (tourists > 50) return 'medium';
    return 'low';
  };

  const totalTourists = heatmapData.reduce((sum, area) => sum + area.tourists, 0);
  const highRiskAreas = heatmapData.filter(area => area.riskLevel === 'high').length;
  const totalIncidents = heatmapData.reduce((sum, area) => sum + area.incidents, 0);

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          Live Tourist Heatmap
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-safety-high rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
          <div className="text-muted-foreground">Updates every 5 seconds</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalTourists}</div>
            <div className="text-sm text-muted-foreground">Active Tourists</div>
          </div>
          <div className="text-center p-3 bg-safety-low/10 rounded-lg">
            <div className="text-2xl font-bold text-safety-low">{highRiskAreas}</div>
            <div className="text-sm text-muted-foreground">High Risk Areas</div>
          </div>
          <div className="text-center p-3 bg-safety-medium/10 rounded-lg">
            <div className="text-2xl font-bold text-safety-medium">{totalIncidents}</div>
            <div className="text-sm text-muted-foreground">Active Incidents</div>
          </div>
        </div>

        {/* Heatmap Visualization */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-80 overflow-hidden border">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          
          {/* Map title */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-sm font-medium">Northeast India Tourism Heatmap</div>
            <div className="text-xs text-muted-foreground">Real-time Tourist Density</div>
          </div>

          {/* Heatmap points */}
          {heatmapData.map((area, index) => {
            const intensity = getHeatmapIntensity(area.tourists);
            const size = intensity === 'high' ? 'w-12 h-12' : intensity === 'medium' ? 'w-8 h-8' : 'w-6 h-6';
            
            return (
              <div
                key={`${area.area}-${animationKey}`}
                className={`absolute ${size} rounded-full border-2 border-white/50 shadow-lg cursor-pointer transition-all duration-1000 animate-pulse`}
                style={{
                  left: `${area.coordinates.x}%`,
                  top: `${area.coordinates.y}%`,
                  backgroundColor: `hsl(var(--${getRiskColor(area.riskLevel)}) / 0.7)`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${index * 0.2}s`
                }}
                title={`${area.area}: ${area.tourists} tourists`}
              >
                <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20"></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap bg-white/90 px-1 rounded">
                  {area.tourists}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs">
            <div className="font-medium">Tourist Density</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-safety-high/70"></div>
                <span>Low Risk (&lt;50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-safety-medium/70"></div>
                <span>Medium Risk (50-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-safety-low/70"></div>
                <span>High Risk (&gt;100)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Area Details */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tourist Distribution by Area
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {heatmapData
              .sort((a, b) => b.tourists - a.tourists)
              .map((area) => (
                <div key={area.area} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium text-sm">{area.area}</div>
                    <div className="text-xs text-muted-foreground">
                      {area.tourists} tourists active
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {area.incidents > 0 && (
                      <AlertTriangle className="h-4 w-4 text-safety-low" />
                    )}
                    <Badge 
                      className={`bg-${getRiskColor(area.riskLevel)}/10 text-${getRiskColor(area.riskLevel)} border-${getRiskColor(area.riskLevel)}/20 text-xs`}
                    >
                      {area.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};