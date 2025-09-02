import React from 'react';
import { cn } from '@/lib/utils';
import { ThreatLevel } from '@/lib/report-converter';

interface ThreatIndicatorProps {
  threatLevel: ThreatLevel;
  className?: string;
  showLabel?: boolean;
}

export const ThreatIndicator: React.FC<ThreatIndicatorProps> = ({
  threatLevel,
  className,
  showLabel = true
}) => {
  const getThreatColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-threat-low border-threat-low';
      case 'Medium': return 'bg-threat-medium border-threat-medium';
      case 'High': return 'bg-threat-high border-threat-high';
      case 'Severe': return 'bg-threat-severe border-threat-severe';
      default: return 'bg-muted border-muted';
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {showLabel && (
        <div className="text-sm font-medium text-foreground">
          Threat Level: <span className="font-bold text-intel-cyan">{threatLevel.level}</span>
          <span className="text-muted-foreground ml-1">(Score: {threatLevel.score})</span>
        </div>
      )}
      
      <div className="w-full h-4 bg-muted rounded-full overflow-hidden border">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            getThreatColor(threatLevel.level)
          )}
          style={{ width: threatLevel.width }}
        />
      </div>
      
      <div className={cn(
        "px-3 py-1 rounded-full text-xs font-bold border",
        getThreatColor(threatLevel.level),
        "text-white shadow-md"
      )}>
        {threatLevel.level.toUpperCase()}
      </div>
    </div>
  );
};