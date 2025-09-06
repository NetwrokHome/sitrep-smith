import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  X, 
  Copy, 
  Save, 
  RefreshCw,
  Search,
  List,
  Calendar,
  FileJson,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThreatIndicator } from '@/components/ui/threat-indicator';
import { ReportConverter, ValidatedReport, ReportAnalysis, SmartSuggestion } from '@/lib/report-converter';
import { AnalysisPanel } from './analysis-panel';
import { ValidatedLog } from './validated-log';
import { db } from '@/lib/database';

interface SitrepGeneratorProps {
  converter: ReportConverter;
}

export const SitrepGenerator: React.FC<SitrepGeneratorProps> = ({ converter }) => {
  const [rawInput, setRawInput] = useState('');
  const [output, setOutput] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<ReportAnalysis | null>(null);
  const [validatedLog, setValidatedLog] = useState<ValidatedReport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [logFilter, setLogFilter] = useState('');
  const { toast } = useToast();

  // Load reports from database on component mount
  useEffect(() => {
    loadReportsFromDB();
  }, []);

  const loadReportsFromDB = async () => {
    try {
      const reports = await db.loadReports();
      setValidatedLog(reports);
    } catch (error) {
      console.error('Error loading reports from database:', error);
      toast({
        title: "Error Loading Reports",
        description: "Could not load reports from database.",
        variant: "destructive"
      });
    }
  };

  const handleConvert = async () => {
    if (!rawInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter raw report data to convert.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const result = converter.convert(rawInput.trim());
      setOutput(result.r);
      setCurrentAnalysis(result.a);
      
      // Generate smart suggestions
      const smartSuggestions = converter.getSmartSuggestions(result.a, validatedLog, rawInput);
      setSuggestions(smartSuggestions);
      
      toast({
        title: "Conversion Complete",
        description: "Report has been processed and analyzed.",
      });
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: "An error occurred during report processing.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setRawInput('');
    setOutput('');
    setCurrentAnalysis(null);
    setSuggestions([]);
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied",
        description: "Report copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleSaveReport = async () => {
    if (!output || !currentAnalysis) {
      toast({
        title: "Nothing to Save",
        description: "Convert a report first.",
        variant: "destructive"
      });
      return;
    }

    const newReport: ValidatedReport = {
      timestamp: Date.now(),
      output,
      analysis: { ...currentAnalysis },
      rawInput
    };

    try {
      const success = await db.saveReport(newReport);
      if (success) {
        setValidatedLog(prev => [newReport, ...prev]);
        // Notify other components that reports have been updated
        window.dispatchEvent(new Event('reportsUpdated'));
        
        toast({
          title: "Report Saved",
          description: "Report saved to database successfully.",
        });
      } else {
        throw new Error('Failed to save to database');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Could not save report to database.",
        variant: "destructive"
      });
    }
  };

  const handleRebuild = () => {
    if (!currentAnalysis) return;
    
    // Rebuild report from current analysis
    const rebuiltReport = converter.convert(rawInput);
    setOutput(rebuiltReport.r);
    
    toast({
      title: "Report Rebuilt",
      description: "Report regenerated from current analysis.",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Input and Output */}
      <Card className="tactical-card">
        <CardHeader>
          <CardTitle className="text-intel-cyan">Report Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              1. Raw Input:
            </label>
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste one or many raw reports here..."
              className="intel-input min-h-[200px] intel-mono"
              rows={8}
            />
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={handleConvert}
              disabled={isProcessing || !rawInput.trim()}
              variant="intel"
              className="flex-1"
            >
              {isProcessing ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <ArrowRightLeft />
              )}
              {isProcessing ? 'Processing...' : 'Convert'}
            </Button>
            <Button
              onClick={handleClear}
              variant="secure"
            >
              <X />
              Clear
            </Button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-foreground">
                2. Standardized Report:
              </label>
              <Button
                onClick={handleCopyOutput}
                disabled={!output}
                variant="ghost"
                size="sm"
              >
                <Copy />
              </Button>
            </div>
            <div className="tactical-card min-h-[150px] p-4">
              <div className="intel-mono text-intel-cyan whitespace-pre-wrap break-words">
                {output || 'Converted report will appear here...'}
              </div>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Smart Suggestions:
            </label>
            <div className="space-y-2">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="tactical-card p-3 cursor-pointer hover:bg-background-tertiary transition-colors"
                    onClick={() => {
                      // Handle suggestion click based on action type
                      if (suggestion.action === 'focusField' && suggestion.field) {
                        const element = document.getElementById(suggestion.field);
                        element?.focus();
                      }
                    }}
                  >
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: suggestion.text }} />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Convert a report to see suggestions.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column 2: Analysis and Correction */}
      <Card className="tactical-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-intel-cyan">3. Analysis & Correction</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnalysisPanel
            analysis={currentAnalysis}
            converter={converter}
            onAnalysisUpdate={setCurrentAnalysis}
            onRebuild={handleRebuild}
            onSave={handleSaveReport}
            isEditable={!!currentAnalysis}
          />
        </CardContent>
      </Card>

      {/* Column 3: Validated Log */}
      <Card className="tactical-card flex flex-col">
        <CardHeader className="border-b border-border">
          <div className="flex justify-between items-center">
            <CardTitle className="text-intel-cyan">Validated Log</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <List />
              </Button>
              <Button variant="ghost" size="sm">
                <FileJson />
              </Button>
              <Button variant="ghost" size="sm">
                <FileSpreadsheet />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search log..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="intel-input pl-8"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ValidatedLog
            reports={validatedLog}
            filter={logFilter}
            onDeleteReport={async (timestamp) => {
              try {
                const success = await db.deleteReport(timestamp);
                if (success) {
                  setValidatedLog(prev => prev.filter(r => r.timestamp !== timestamp));
                  // Notify other components that reports have been updated
                  window.dispatchEvent(new Event('reportsUpdated'));
                  toast({
                    title: "Report Deleted",
                    description: "Report removed from database.",
                  });
                } else {
                  throw new Error('Failed to delete from database');
                }
              } catch (error) {
                console.error('Error deleting report:', error);
                toast({
                  title: "Delete Failed",
                  description: "Could not delete report from database.",
                  variant: "destructive"
                });
              }
            }}
            onCopyReport={async (report) => {
              try {
                await navigator.clipboard.writeText(report.output);
                toast({
                  title: "Copied",
                  description: "Report copied to clipboard.",
                });
              } catch (error) {
                toast({
                  title: "Copy Failed",
                  description: "Could not copy to clipboard.",
                  variant: "destructive"
                });
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};