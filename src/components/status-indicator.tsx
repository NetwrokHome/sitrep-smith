import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isOnline,
  className
}) => {
  return (
    <div className={cn(
      "absolute top-2 left-2 flex items-center space-x-2 text-xs",
      className
    )}>
      <div className={cn(
        "h-3 w-3 rounded-full transition-all duration-300",
        isOnline ? "status-online" : "status-offline"
      )} />
      <span className={cn(
        "font-medium transition-colors duration-300",
        isOnline ? "text-threat-low" : "text-threat-high"
      )}>
        {isOnline ? "ONLINE" : "OFFLINE"}
      </span>
      {isOnline ? (
        <Wifi className="h-3 w-3 text-threat-low" />
      ) : (
        <WifiOff className="h-3 w-3 text-threat-high" />
      )}
    </div>
  );
};