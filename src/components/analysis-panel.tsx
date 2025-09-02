import React, { useState, useEffect } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThreatIndicator } from '@/components/ui/threat-indicator';
import { ReportConverter, ReportAnalysis } from '@/lib/report-converter';

interface AnalysisPanelProps {
  analysis: ReportAnalysis | null;
  converter: ReportConverter;
  onAnalysisUpdate: (analysis: ReportAnalysis) => void;
  onRebuild: () => void;
  onSave: () => void;
  isEditable: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  converter,
  onAnalysisUpdate,
  onRebuild,
  onSave,
  isEditable
}) => {
  const [editableAnalysis, setEditableAnalysis] = useState<ReportAnalysis | null>(null);

  useEffect(() => {
    if (analysis) {
      setEditableAnalysis({
        ...analysis,
        c: new Set(analysis.c),
        d: new Set(analysis.d)
      });
    }
  }, [analysis]);

  const handleFieldChange = (field: keyof ReportAnalysis, value: string) => {
    if (!editableAnalysis || !isEditable) return;

    const updated = { ...editableAnalysis };
    
    if (field === 'c' || field === 'd') {
      const lines = value.split('\n').filter(line => line.trim());
      updated[field] = new Set(lines);
    } else {
      (updated as any)[field] = value;
    }
    
    setEditableAnalysis(updated);
    onAnalysisUpdate(updated);
  };

  const addQuickCasualty = (casualty: string) => {
    if (!editableAnalysis || !isEditable) return;
    
    const updated = { ...editableAnalysis };
    updated.c = new Set([...updated.c, casualty]);
    setEditableAnalysis(updated);
    onAnalysisUpdate(updated);
  };

  if (!analysis) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Analysis will appear here after converting a report.</p>
      </div>
    );
  }

  const threatLevel = converter.getThreatLevel(editableAnalysis || analysis);

  return (
    <div className="space-y-6">
      {/* Threat Level */}
      <ThreatIndicator threatLevel={threatLevel} />

      {/* Analysis Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Who:</label>
          <div className="col-span-3">
            <Input
              id="analysis-w"
              value={editableAnalysis?.w || ''}
              onChange={(e) => handleFieldChange('w', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Action:</label>
          <div className="col-span-3">
            <Input
              id="analysis-ac"
              value={editableAnalysis?.ac || ''}
              onChange={(e) => handleFieldChange('ac', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Target:</label>
          <div className="col-span-3">
            <Input
              id="analysis-t"
              value={editableAnalysis?.t || ''}
              onChange={(e) => handleFieldChange('t', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Location:</label>
          <div className="col-span-3">
            <Input
              id="analysis-l"
              value={editableAnalysis?.l || ''}
              onChange={(e) => handleFieldChange('l', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <label className="text-sm font-medium text-muted-foreground pt-2">Casualties:</label>
          <div className="col-span-3 space-y-2">
            <Textarea
              id="analysis-c"
              value={Array.from(editableAnalysis?.c || []).join('\n')}
              onChange={(e) => handleFieldChange('c', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
              rows={3}
            />
            {isEditable && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => addQuickCasualty('1 x sldrs sh')}
                  variant="secure"
                  size="sm"
                >
                  +1 KIA
                </Button>
                <Button
                  onClick={() => addQuickCasualty('1 x sldrs inj')}
                  variant="secure"
                  size="sm"
                >
                  +1 WIA
                </Button>
                <Button
                  onClick={() => addQuickCasualty('1 x Ts killed')}
                  variant="secure"
                  size="sm"
                >
                  +1 T KIA
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <label className="text-sm font-medium text-muted-foreground pt-2">Details:</label>
          <div className="col-span-3">
            <Textarea
              id="analysis-d"
              value={Array.from(editableAnalysis?.d || []).join('\n')}
              onChange={(e) => handleFieldChange('d', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">Source:</label>
          <div className="col-span-3">
            <Input
              id="analysis-s"
              value={editableAnalysis?.s || ''}
              onChange={(e) => handleFieldChange('s', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <label className="text-sm font-medium text-muted-foreground pt-2">Notes:</label>
          <div className="col-span-3">
            <Textarea
              id="analysis-notes"
              value={editableAnalysis?.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              disabled={!isEditable}
              className="intel-input"
              rows={2}
              placeholder="Add analysis notes or context..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditable && (
        <div className="space-y-3 pt-4 border-t border-border">
          <Button
            onClick={onRebuild}
            variant="command"
            className="w-full"
          >
            <RefreshCw />
            Rebuild Report
          </Button>
          <Button
            onClick={onSave}
            variant="intel"
            className="w-full"
          >
            <Save />
            Approve & Save
          </Button>
        </div>
      )}
    </div>
  );
};