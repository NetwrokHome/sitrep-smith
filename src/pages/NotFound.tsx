import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="tactical-card max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-16 w-16 text-threat-high" />
          </div>
          
          <h1 className="text-4xl font-bold text-intel-cyan mb-4">404</h1>
          <h2 className="text-xl font-semibold mb-4">Area Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The requested intelligence sector could not be located. 
            This area may be classified or does not exist.
          </p>
          
          <Button 
            onClick={() => window.location.href = "/"} 
            variant="intel"
            className="w-full"
          >
            <Home className="mr-2" />
            Return to Command Center
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Route: <code className="intel-mono text-intel-cyan">{location.pathname}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
