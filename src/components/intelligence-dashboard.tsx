import React, { useState, useEffect } from 'react';
import { Printer, BrainCircuit, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportConverter, ValidatedReport } from '@/lib/report-converter';
import { db } from '@/lib/database';

interface IntelligenceDashboardProps {
  converter: ReportConverter;
}

interface DashboardKPI {
  totalIncidents: number;
  avgThreatLevel: string;
  mostActiveGroup: string;
  lethalAttacks: number;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({
  converter
}) => {
  const [reports, setReports] = useState<ValidatedReport[]>([]);
  const [kpis, setKpis] = useState<DashboardKPI>({
    totalIncidents: 0,
    avgThreatLevel: 'N/A',
    mostActiveGroup: 'N/A',
    lethalAttacks: 0
  });
  const [forecast, setForecast] = useState<string>('Insufficient data for a reliable forecast. Need more recent reports.');

  console.log('Dashboard rendered, reports:', reports.length);

  // Load reports from database on component mount and listen for updates
  useEffect(() => {
    loadReportsFromDB();
    
    const handleReportsUpdate = () => {
      loadReportsFromDB();
    };

    window.addEventListener('reportsUpdated', handleReportsUpdate);
    
    return () => {
      window.removeEventListener('reportsUpdated', handleReportsUpdate);
    };
  }, []);

  const loadReportsFromDB = async () => {
    try {
      const reportData = await db.loadReports();
      setReports(reportData);
      calculateKPIs(reportData);
      generateForecast(reportData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const calculateKPIs = (reports: ValidatedReport[]) => {
    if (reports.length === 0) return;

    const totalIncidents = reports.length;
    
    // Calculate average threat level
    const threatScores = reports.map(r => converter.getThreatLevel(r.analysis).score);
    const avgScore = threatScores.reduce((sum, score) => sum + score, 0) / threatScores.length;
    const avgThreatLevel = avgScore < 8 ? 'Low' : avgScore < 15 ? 'Medium' : avgScore < 25 ? 'High' : 'Severe';
    
    // Find most active group
    const groupCounts = reports.reduce((acc, r) => {
      if (r.analysis.w && r.analysis.w !== 'Unknown Ts') {
        acc[r.analysis.w] = (acc[r.analysis.w] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveGroup = Object.keys(groupCounts).length > 0
      ? Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';
    
    // Calculate lethal attacks
    const lethalAttacks = reports.filter(r => 
      Array.from(r.analysis.c).some(casualty => 
        casualty.includes('sh') || casualty.includes('killed') || casualty.includes('martyred')
      )
    ).length;

    setKpis({
      totalIncidents,
      avgThreatLevel,
      mostActiveGroup,
      lethalAttacks
    });
  };

  const generateForecast = (reports: ValidatedReport[]) => {
    // Get reports from last 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentReports = reports.filter(r => r.timestamp >= weekAgo);
    
    if (recentReports.length < 3) {
      setForecast('Insufficient recent data for reliable forecast. Need more reports from the last 7 days.');
      return;
    }

    const avgDaily = recentReports.length / 7;
    const threatLevels = recentReports.map(r => converter.getThreatLevel(r.analysis));
    const avgThreat = threatLevels.reduce((sum, t) => sum + t.score, 0) / threatLevels.length;
    
    let forecastText = `Based on ${recentReports.length} incidents in the last 7 days (${avgDaily.toFixed(1)} per day), `;
    
    if (avgThreat < 10) {
      forecastText += 'threat levels remain relatively stable with low-to-medium risk activities expected.';
    } else if (avgThreat < 18) {
      forecastText += 'moderate threat levels suggest continued militant activity with potential for escalation.';
    } else {
      forecastText += 'high threat environment indicates elevated risk of significant incidents in the near term.';
    }

    setForecast(forecastText);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-intel-cyan">Intelligence Dashboard</h2>
        <Button onClick={handlePrint} variant="tactical" className="w-full sm:w-auto">
          <Printer />
          <span className="hidden sm:inline">Print Report</span>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tactical-card text-center">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-intel-cyan mb-1">
              {kpis.totalIncidents}
            </div>
            <div className="text-sm text-muted-foreground">Total Incidents</div>
          </CardContent>
        </Card>

        <Card className="tactical-card text-center">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-intel-cyan mb-1">
              {kpis.avgThreatLevel}
            </div>
            <div className="text-sm text-muted-foreground">Avg. Threat Level</div>
          </CardContent>
        </Card>

        <Card className="tactical-card text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-intel-cyan mb-1 truncate">
              {kpis.mostActiveGroup}
            </div>
            <div className="text-sm text-muted-foreground">Most Active Group</div>
          </CardContent>
        </Card>

        <Card className="tactical-card text-center">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-intel-cyan mb-1">
              {kpis.lethalAttacks}
            </div>
            <div className="text-sm text-muted-foreground">Lethal Attacks</div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Forecast */}
      <Card className="tactical-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-intel-cyan mb-4">
            <BrainCircuit className="h-8 w-8 mr-3" />
            <h3 className="text-xl font-bold">AI Threat Forecast</h3>
          </div>
          <p className="text-lg text-foreground text-center leading-relaxed">
            {forecast}
          </p>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Based on activity patterns in the last 7 days • AI-assisted analysis
          </p>
        </CardContent>
      </Card>

      {/* Incident Hotspots Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="tactical-card">
          <CardHeader>
            <CardTitle className="text-intel-cyan flex items-center">
              <MapPin className="mr-2" />
              Incident Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Interactive map will be rendered here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tactical-card">
          <CardHeader>
            <CardTitle className="text-intel-cyan">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last 24 Hours</span>
                <span className="font-bold text-intel-cyan">
                  {reports.filter(r => Date.now() - r.timestamp < 24 * 60 * 60 * 1000).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last 7 Days</span>
                <span className="font-bold text-intel-cyan">
                  {reports.filter(r => Date.now() - r.timestamp < 7 * 24 * 60 * 60 * 1000).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last 30 Days</span>
                <span className="font-bold text-intel-cyan">
                  {reports.filter(r => Date.now() - r.timestamp < 30 * 24 * 60 * 60 * 1000).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Incident Log */}
      <Card className="tactical-card">
        <CardHeader>
          <CardTitle className="text-intel-cyan">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground">Date</th>
                  <th className="text-left p-2 text-muted-foreground">Group</th>
                  <th className="text-left p-2 text-muted-foreground">Action</th>
                  <th className="text-left p-2 text-muted-foreground">Target</th>
                  <th className="text-left p-2 text-muted-foreground">Location</th>
                  <th className="text-left p-2 text-muted-foreground">Threat</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 10).map((report) => {
                  const threat = converter.getThreatLevel(report.analysis);
                  return (
                    <tr key={report.timestamp} className="border-b border-border/50">
                      <td className="p-2 text-intel-cyan intel-mono text-xs">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-2">{report.analysis.w}</td>
                      <td className="p-2">{report.analysis.ac}</td>
                      <td className="p-2">{report.analysis.t || '-'}</td>
                      <td className="p-2">{report.analysis.l || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          threat.level === 'Low' ? 'bg-threat-low text-white' :
                          threat.level === 'Medium' ? 'bg-threat-medium text-white' :
                          threat.level === 'High' ? 'bg-threat-high text-white' :
                          'bg-threat-severe text-white'
                        }`}>
                          {threat.level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>No incident data available.</p>
                <p className="text-sm">Generate some reports to see dashboard analytics.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};