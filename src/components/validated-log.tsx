import React from 'react';
import { Copy, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ValidatedReport } from '@/lib/report-converter';
import { cn } from '@/lib/utils';

interface ValidatedLogProps {
  reports: ValidatedReport[];
  filter: string;
  onDeleteReport: (timestamp: number) => void;
  onCopyReport: (report: ValidatedReport) => void;
}

export const ValidatedLog: React.FC<ValidatedLogProps> = ({
  reports,
  filter,
  onDeleteReport,
  onCopyReport
}) => {
  const filteredReports = reports.filter(report =>
    report.output.toLowerCase().includes(filter.toLowerCase()) ||
    (report.analysis.notes && report.analysis.notes.toLowerCase().includes(filter.toLowerCase()))
  );

  if (filteredReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">
          {filter ? 'No matching reports found.' : 'Your log is empty.'}
        </p>
        <p className="text-sm">
          {filter ? 'Try adjusting your search terms.' : 'Convert a report to get started.'}
        </p>
      </div>
    );
  }

  // Group reports by date
  const groupedByDate = filteredReports.reduce((acc, report) => {
    const date = new Date(report.timestamp).toLocaleDateString('en-CA');
    if (!acc[date]) acc[date] = [];
    acc[date].push(report);
    return acc;
  }, {} as Record<string, ValidatedReport[]>);

  return (
    <div className="intel-scroll h-full overflow-y-auto">
      <div className="space-y-4 p-4">
        {Object.keys(groupedByDate)
          .sort()
          .reverse()
          .map(date => {
            const friendlyDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div key={date} className="space-y-3">
                <div className="sticky top-0 bg-card-header z-10 p-2 rounded-md">
                  <h3 className="text-sm font-semibold text-intel-cyan">
                    {friendlyDate}
                  </h3>
                </div>
                
                <div className="space-y-2 pl-2">
                  {groupedByDate[date].map((report) => (
                    <div
                      key={report.timestamp}
                      className={cn(
                        "tactical-card p-3 group transition-all duration-200",
                        "hover:bg-background-tertiary cursor-pointer"
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-grow min-w-0">
                          <p className="intel-mono text-intel-cyan text-xs break-words">
                            {report.output}
                          </p>
                          {report.analysis.notes && (
                            <p className="text-xs text-yellow-400 mt-2 pt-2 border-t border-border">
                              <strong>Notes:</strong> {report.analysis.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyReport(report);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteReport(report.timestamp);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};