import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SitrepGenerator } from './sitrep-generator';
import { IntelligenceDashboard } from './intelligence-dashboard';
import { AdminPanel } from './admin-panel';
import { StatusIndicator } from './status-indicator';
import { ReportConverter } from '@/lib/report-converter';
import intelBg from '@/assets/intel-bg.jpg';

type ViewType = 'generator' | 'dashboard' | 'admin';

export const IntelligenceSuite: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('generator');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [converter] = useState(() => new ReportConverter());

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const getViewButtonVariant = (view: ViewType) => 
    currentView === view ? 'intel' : 'tactical';

  return (
    <div 
      className="min-h-screen bg-background text-foreground relative"
      style={{
        backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), url(${intelBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-8 relative">
          <StatusIndicator isOnline={isOnline} />
          
          <div className="relative">
            <h1 className="intel-display mb-2 relative z-10">
              INTELLIGENCE SUITE
            </h1>
            <div 
              className="absolute inset-0 intel-display blur-lg opacity-30 z-0"
              style={{ color: 'hsl(var(--intel-cyan))' }}
            >
              INTELLIGENCE SUITE
            </div>
          </div>
          
          <p className="text-muted-foreground text-lg font-medium tracking-wide">
            SITREP Generator & Interactive Intelligence Dashboard
          </p>
          
          {/* Navigation */}
          <div className="absolute top-0 right-0 flex space-x-2">
            <Button
              variant={getViewButtonVariant('generator')}
              size="sm"
              onClick={() => setCurrentView('generator')}
              className="hidden sm:flex"
            >
              <FileText />
              Generator
            </Button>
            <Button
              variant={getViewButtonVariant('generator')}
              size="icon"
              onClick={() => setCurrentView('generator')}
              className="sm:hidden"
            >
              <FileText />
            </Button>

            <Button
              variant={getViewButtonVariant('dashboard')}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="hidden sm:flex"
            >
              <LayoutDashboard />
              Dashboard
            </Button>
            <Button
              variant={getViewButtonVariant('dashboard')}
              size="icon"
              onClick={() => setCurrentView('dashboard')}
              className="sm:hidden"
            >
              <LayoutDashboard />
            </Button>

            <Button
              variant={getViewButtonVariant('admin')}
              size="sm"
              onClick={() => setCurrentView('admin')}
              className="hidden sm:flex"
            >
              <Settings />
              Admin
            </Button>
            <Button
              variant={getViewButtonVariant('admin')}
              size="icon"
              onClick={() => setCurrentView('admin')}
              className="sm:hidden"
            >
              <Settings />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className={cn("transition-all duration-500 ease-out", "animate-tactical-slide")}>
          {currentView === 'generator' && (
            <SitrepGenerator converter={converter} />
          )}
          {currentView === 'dashboard' && (
            <IntelligenceDashboard converter={converter} />
          )}
          {currentView === 'admin' && (
            <AdminPanel converter={converter} />
          )}
        </main>
      </div>
      
      {/* Tactical Grid Overlay */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(var(--intel-cyan)) 1px, transparent 1px),
            linear-gradient(hsl(var(--intel-cyan)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
};