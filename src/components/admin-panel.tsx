import React, { useState } from 'react';
import { Save, RotateCcw, Upload, Download, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ReportConverter } from '@/lib/report-converter';

interface AdminPanelProps {
  converter: ReportConverter;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ converter }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [activeTab, setActiveTab] = useState('actions');
  const { toast } = useToast();

  const addKeyword = (category: string, key: string) => {
    if (!newKeyword.trim()) return;

    if (category === 'actions') {
      if (!converter.am[key]) converter.am[key] = [];
      converter.am[key].push(newKeyword.toLowerCase().trim());
    } else if (category === 'targets') {
      if (!converter.tm[key]) converter.tm[key] = [];
      converter.tm[key].push(newKeyword.toLowerCase().trim());
    }

    setNewKeyword('');
    toast({
      title: "Keyword Added",
      description: `Added "${newKeyword}" to ${category}.`,
    });
  };

  const removeKeyword = (category: string, key: string, keyword: string) => {
    if (category === 'actions' && converter.am[key]) {
      converter.am[key] = converter.am[key].filter(k => k !== keyword);
    } else if (category === 'targets' && converter.tm[key]) {
      converter.tm[key] = converter.tm[key].filter(k => k !== keyword);
    }

    toast({
      title: "Keyword Removed",
      description: `Removed "${keyword}" from ${category}.`,
    });
  };

  const addGroup = () => {
    if (!newGroup.trim()) return;
    
    const group = newGroup.toUpperCase().trim();
    if (!converter.m.includes(group)) {
      converter.m.push(group);
      setNewGroup('');
      toast({
        title: "Group Added",
        description: `Added ${group} to militant groups.`,
      });
    }
  };

  const removeGroup = (group: string) => {
    converter.m = converter.m.filter(g => g !== group);
    toast({
      title: "Group Removed",
      description: `Removed ${group} from militant groups.`,
    });
  };

  const saveConfiguration = () => {
    converter.saveTables();
    toast({
      title: "Configuration Saved",
      description: "All changes have been saved to local storage.",
    });
  };

  const resetToDefaults = () => {
    converter.resetToDefaults();
    toast({
      title: "Reset Complete",
      description: "Configuration restored to defaults.",
    });
  };

  const exportConfiguration = () => {
    const config = {
      actionMap: converter.am,
      targetMap: converter.tm,
      locationCodes: converter.lc,
      militantGroups: converter.m
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'intelligence-suite-config.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Configuration exported successfully.",
    });
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        if (config.actionMap) converter.am = config.actionMap;
        if (config.targetMap) converter.tm = config.targetMap;
        if (config.locationCodes) converter.lc = config.locationCodes;
        if (config.militantGroups) converter.m = config.militantGroups;
        
        converter.saveTables();
        
        toast({
          title: "Import Complete",
          description: "Configuration imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid configuration file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="tactical-card">
      <CardHeader className="border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl text-intel-cyan">Admin Panel: Engine Configuration</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Manage keywords and codes used by the intelligence converter.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={importConfiguration}
              className="hidden"
              id="import-input"
            />
            <Button
              variant="tactical"
              onClick={() => document.getElementById('import-input')?.click()}
            >
              <Upload />
              Import
            </Button>
            <Button variant="tactical" onClick={exportConfiguration}>
              <Download />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-4">
            <h3 className="text-lg font-semibold text-intel-cyan">Action Keywords</h3>
            {Object.entries(converter.am).map(([action, keywords]) => (
              <div key={action} className="space-y-2">
                <h4 className="font-medium text-foreground">{action}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeKeyword('actions', action, keyword)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="intel-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addKeyword('actions', action);
                      }
                    }}
                  />
                  <Button onClick={() => addKeyword('actions', action)} variant="secure">
                    <Plus />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <h3 className="text-lg font-semibold text-intel-cyan">Target Keywords</h3>
            {Object.entries(converter.tm).map(([target, keywords]) => (
              <div key={target} className="space-y-2">
                <h4 className="font-medium text-foreground">{target}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeKeyword('targets', target, keyword)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="intel-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addKeyword('targets', target);
                      }
                    }}
                  />
                  <Button onClick={() => addKeyword('targets', target)} variant="secure">
                    <Plus />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <h3 className="text-lg font-semibold text-intel-cyan">Location Codes</h3>
            <div className="grid gap-4">
              {Object.entries(converter.lc).map(([location, data]) => (
                <div key={location} className="tactical-card p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-foreground">{location}</h4>
                      <p className="text-sm text-muted-foreground">
                        Code: {data.code} | Coordinates: {data.lat}, {data.lon}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <h3 className="text-lg font-semibold text-intel-cyan">Militant Groups</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {converter.m.map((group) => (
                <Badge key={group} variant="secondary" className="flex items-center gap-1">
                  {group}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeGroup(group)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new group (e.g., TTP, BLA)..."
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="intel-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addGroup();
                  }
                }}
              />
              <Button onClick={addGroup} variant="secure">
                <Plus />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-border">
          <Button onClick={saveConfiguration} variant="intel">
            <Save />
            Save Configuration
          </Button>
          <Button onClick={resetToDefaults} variant="destructive">
            <RotateCcw />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};