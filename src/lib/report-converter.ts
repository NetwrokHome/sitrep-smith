// Intelligence Report Converter - Core Logic
export interface ThreatWeights {
  actions: Record<string, number>;
  targets: Record<string, number>;
  casualties: Record<string, number>;
}

export interface LocationCode {
  code: string;
  lat: number;
  lon: number;
}

export interface ReportAnalysis {
  w: string; // Who (group)
  ac: string; // Action
  t: string | null; // Target
  l: string; // Location
  c: Set<string>; // Casualties
  d: Set<string>; // Details
  s: string; // Source
  notes: string; // Notes
}

export interface ConversionResult {
  r: string; // Formatted report
  a: ReportAnalysis; // Analysis
}

export interface ThreatLevel {
  level: 'Low' | 'Medium' | 'High' | 'Severe';
  score: number;
  color: string;
  width: string;
}

export interface SmartSuggestion {
  text: string;
  action: string;
  field?: string;
  value?: string;
}

export interface ValidatedReport {
  timestamp: number;
  output: string;
  analysis: ReportAnalysis;
  rawInput: string;
}

export class ReportConverter {
  private defaultData: any;
  public am: Record<string, string[]>; // Action mapping
  public lc: Record<string, LocationCode>; // Location codes
  public tm: Record<string, string[]>; // Target mapping
  public m: string[]; // Militant groups
  private threatWeights: ThreatWeights;

  constructor() {
    this.defaultData = this.getDefaults();
    this.loadTables();
    this.threatWeights = {
      actions: {
        "sb attk": 10,
        "strike": 9,
        "ambush": 8,
        "blast": 7,
        "fire raid": 6,
        "raid": 5
      },
      targets: {
        "SFs cny": 8,
        "SFs Post/CP": 7,
        "LEAs": 6,
        "Army": 7,
        "SFs": 5
      },
      casualties: {
        "sh": 5,
        "inj": 2,
        "Ts killed": -1
      }
    };
  }

  private getDefaults() {
    return {
      actionMap: {
        "ambush": ["ambush"],
        "sb attk": ["suicide bomber", "sb"],
        "fire raid": ["sniper", "laser", "gl", "fire raid", "shot", "gunmen", "motorcyclist"],
        "blast": ["mine", "ied", "blast"],
        "strike": ["missile", "drone"],
        "raid": ["raid", "cp attack", "post attack", "attacked", "attk on", "hideout", "ambushed"],
        "tgt attk": ["targeted", "target attk"],
        "repulse": ["repulse"]
      },
      targetMap: {
        "SFs cny": ["convoy", "cny"],
        "SFs Post/CP": ["post", "cp", "checkpost", "observation post"],
        "LEAs": ["police", "asi"],
        "Army": ["army"],
        "SFs": ["sfs", "security forces", "military"]
      },
      locationCodes: {
        "Bannu": { "code": "Bxu", "lat": 32.98, "lon": 70.6 },
        "North Waziristan": { "code": "NWD", "lat": 32.96, "lon": 69.84 },
        "South Waziristan": { "code": "SWD", "lat": 32.42, "lon": 69.79 },
        "Kurram": { "code": "Krm", "lat": 33.8, "lon": 70.1 }
      },
      militantGroups: ["FAK", "IMP", "BLA", "BLF", "FAH", "TTP"]
    };
  }

  private loadTables() {
    this.am = JSON.parse(localStorage.getItem('actionMapping') || 'null') || this.defaultData.actionMap;
    this.lc = JSON.parse(localStorage.getItem('locationCodes') || 'null') || this.defaultData.locationCodes;
    this.tm = JSON.parse(localStorage.getItem('targetMapping') || 'null') || this.defaultData.targetMap;
    this.m = JSON.parse(localStorage.getItem('militantGroups') || 'null') || this.defaultData.militantGroups;
  }

  public convert(text: string): ConversionResult {
    if (!text) return { r: '', a: this.createEmptyAnalysis() };

    const originalText = text;
    const analysis: ReportAnalysis = {
      w: 'Unknown Ts',
      ac: 'raid',
      t: null,
      l: '',
      c: new Set(),
      d: new Set(),
      s: '',
      notes: ''
    };

    const isClaimed = text.toLowerCase().includes('claimed');
    text = text.replace(/claimed\s*/i, '');

    this.extractSource(text, analysis);
    text = text.replace(/(@[A-Za-z]+)\s*$/, '').trim();
    this.extractWho(originalText, analysis);
    this.extractAction(text, analysis, isClaimed);
    this.extractTarget(text, analysis);
    this.extractLocation(text, analysis);
    this.extractCasualties(originalText, analysis);
    this.extractDetails(originalText, analysis);

    return {
      r: this.assembleReport(analysis),
      a: analysis
    };
  }

  private createEmptyAnalysis(): ReportAnalysis {
    return {
      w: 'Unknown Ts',
      ac: 'raid',
      t: null,
      l: '',
      c: new Set(),
      d: new Set(),
      s: '',
      notes: ''
    };
  }

  public getThreatLevel(analysis: ReportAnalysis): ThreatLevel {
    let score = 0;
    
    score += this.threatWeights.actions[analysis.ac] || 3;
    score += this.threatWeights.targets[analysis.t || ''] || 2;
    
    analysis.c.forEach(cas => {
      const match = cas.match(/(\d+)\s*x\s*.*\s*(sh|inj|Ts killed)/);
      if (match) {
        const type = match[2];
        const count = parseInt(match[1]);
        score += (this.threatWeights.casualties[type] || 0) * count;
      }
    });

    if (score < 8) return { level: 'Low', score, color: 'threat-low', width: '25%' };
    if (score < 15) return { level: 'Medium', score, color: 'threat-medium', width: '50%' };
    if (score < 25) return { level: 'High', score, color: 'threat-high', width: '75%' };
    return { level: 'Severe', score, color: 'threat-severe', width: '100%' };
  }

  public getSmartSuggestions(analysis: ReportAnalysis, log: ValidatedReport[], rawInput: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Group attribution suggestion
    if (analysis.w === 'Unknown Ts' && analysis.l) {
      const locationCode = analysis.l.split(',').pop()?.trim();
      const groupsInArea = log
        .filter(r => r.analysis.l && r.analysis.l.includes(locationCode || '') && r.analysis.w !== 'Unknown Ts')
        .map(r => r.analysis.w);

      if (groupsInArea.length > 0) {
        const groupCounts = groupsInArea.reduce((acc, g) => {
          acc[g] = (acc[g] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const topGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0][0];
        suggestions.push({
          text: `Consider attributing to <strong>${topGroup}</strong>, which is active in ${locationCode}.`,
          action: 'setField',
          field: 'analysis-w',
          value: topGroup
        });
      }
    }

    // Pattern recognition
    const lastSimilarAttack = log.find(r => 
      r.analysis.ac === analysis.ac && r.analysis.t === analysis.t
    );

    if (lastSimilarAttack) {
      const daysAgo = Math.round((new Date().getTime() - new Date(lastSimilarAttack.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 14) {
        suggestions.push({
          text: `This matches a pattern: a similar attack occurred <strong>${daysAgo} day${daysAgo > 1 ? 's' : ''} ago</strong>.`,
          action: 'highlightPattern'
        });
      }
    }

    // Casualties check
    if (analysis.c.size === 0 && rawInput && (rawInput.toLowerCase().includes('cas') || rawInput.toLowerCase().includes('casualties'))) {
      suggestions.push({
        text: 'Report mentions casualties but none were parsed. Add details?',
        action: 'focusField',
        field: 'analysis-c'
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        text: '<strong>Pro Tip:</strong> Add your own analysis or context in the "Notes" field before saving.',
        action: 'focusField',
        field: 'analysis-notes'
      });
    }

    return suggestions;
  }

  private extractWho(text: string, analysis: ReportAnalysis) {
    const match = text.match(new RegExp(`^(${this.m.join('|')})`, 'i'));
    if (match) {
      analysis.w = match[0].toUpperCase();
      return;
    }

    const claimedMatch = text.match(new RegExp(`(?:claimed|owned) by (${this.m.join('|')})`, 'i'));
    if (claimedMatch) {
      analysis.w = claimedMatch[1].toUpperCase();
      return;
    }

    if (text.toLowerCase().startsWith('militants')) {
      analysis.w = 'Unknown Ts';
    }
  }

  private extractAction(text: string, analysis: ReportAnalysis, isClaimed: boolean) {
    const lowerText = text.toLowerCase();
    let found = false;

    for (const [action, keywords] of Object.entries(this.am)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        analysis.ac = action;
        found = true;
        break;
      }
    }

    if (isClaimed && !found) {
      analysis.ac = 'claimed attk';
    }
  }

  private extractTarget(text: string, analysis: ReportAnalysis) {
    const lowerText = text.toLowerCase();
    
    for (const [target, keywords] of Object.entries(this.tm)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        analysis.t = target;
        break;
      }
    }

    if (analysis.t === 'Army') analysis.t = 'SFs';
    if (lowerText.includes('post') && lowerText.includes('cp')) {
      analysis.t = 'SFs Post and CP';
    }
  }

  private extractLocation(text: string, analysis: ReportAnalysis) {
    // Try district-area format first
    let match = text.match(/(\w{3})-([\w\s]+)/);
    if (match) {
      analysis.l = `${match[2].trim().replace(/bazar/i, '').trim()}, ${match[1].toUpperCase()}`;
      return;
    }

    // Sort locations by length for better matching
    const sortedLocations = Object.keys(this.lc).sort((a, b) => b.length - a.length);

    for (const location of sortedLocations) {
      const regex = new RegExp(`([\\w\\s,]+?),?\\s*(${location.replace(/ /g, '\\s+')}(?:\\s+District|\\s+Tehsil)?)`, 'i');
      match = text.match(regex);
      if (match) {
        const place = match[1].replace(/,$/, '').trim();
        const code = this.lc[location].code;
        analysis.l = `${place}, ${code}`;
        return;
      }
    }

    // Additional location extraction patterns...
    for (const location of sortedLocations) {
      if (text.toLowerCase().includes(location.toLowerCase())) {
        analysis.l = this.lc[location].code;
        return;
      }
    }
  }

  private extractCasualties(text: string, analysis: ReportAnalysis) {
    const lowerText = text.toLowerCase();
    const results: Record<string, number> = {};

    const patterns = [
      { re: /(\d+)\s*x?\s*(sfs?|sldrs?|pc|police pers|fc pers|ctd pers|pers|policeman|constable|asi|personnel)?\s*(sh|killed|dead|martyred)/gi, type: 'sh' },
      { re: /(\d+)\s*x?\s*(sfs?|sldrs?|pc|police pers|fc pers|ctd pers|pers|policeman|constable|asi|personnel)?\s*(inj|injured)/gi, type: 'inj' },
      { re: /(\d+)\s*x?\s*(ts?|ks?|terrorists?|militants?)\s*(sh|killed|dead)/gi, type: 'Ts killed' },
      { re: /(\d+)\s*x?\s*(ts?|ks?|terrorists?|militants?)\s*(inj|injured)/gi, type: 'Ts inj' }
    ];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.re.source, 'gi');
      while ((match = regex.exec(lowerText)) !== null) {
        const quantity = parseInt(match[1] || '1', 10);
        let key = pattern.type;
        
        if (pattern.type === 'sh' || pattern.type === 'inj') {
          const entity = match[2] ? match[2].toLowerCase() : '';
          let entityKey = 'sldrs';
          
          if (['pc', 'police constable', 'policeman', 'constable', 'asi'].includes(entity)) {
            entityKey = 'PC';
          } else if (entity.includes('fc')) {
            entityKey = 'FC pers';
          } else if (entity.includes('police') || entity.includes('leas')) {
            entityKey = 'LEAs pers';
          }
          
          key = `${entityKey} ${pattern.type}`;
        }
        
        results[key] = (results[key] || 0) + quantity;
      }
    });

    for (const [key, value] of Object.entries(results)) {
      const standalone = ["pers abducted", "IED defused", "W&A seized"].includes(key);
      analysis.c.add(standalone ? key : `${value} x ${key}`);
    }
  }

  private extractDetails(text: string, analysis: ReportAnalysis) {
    const lowerText = text.toLowerCase();
    const detailPatterns = [
      { re: /\balleged\b/i, detail: 'alleged' },
      { re: /as per ([\w\s]+) intel/i, detail: (match: RegExpMatchArray) => `tgt as per ${match[1]} intel` },
      { re: /(?:intense|heavy)\s*(?:exchange of )?fire/i, detail: 'intense EoF' },
      { re: /search\s*(?:and clearance )?op(?:eration)?(?:s)?\s*(?:underway|conducted|launched)/i, detail: 'search op underway' },
      { re: /area\s*(?:has been\s*)?(?:cordoned|sealed)/i, detail: 'area cordoned' },
      { re: /attackers?\s*(?:managed to )?fled|fled the area/i, detail: 'attackers fled' }
    ];

    detailPatterns.forEach(pattern => {
      const match = lowerText.match(pattern.re);
      if (match) {
        const value = typeof pattern.detail === 'function' ? pattern.detail(match) : pattern.detail;
        analysis.d.add(value);
      }
    });
  }

  private extractSource(text: string, analysis: ReportAnalysis) {
    const match = text.match(/(@[A-Za-z]+)\s*$/);
    if (match) {
      analysis.s = match[1];
    }
  }

  private assembleReport(analysis: ReportAnalysis): string {
    let target = analysis.t ? `on ${analysis.t}` : '';
    if (analysis.d.has('alleged') && analysis.t) {
      target = `on alleged ${analysis.t}`;
    }

    let location = analysis.l ? `at ${analysis.l}` : '';
    let casualties = '';
    
    if (analysis.c.size > 0) {
      casualties = `; ${Array.from(analysis.c).join(', ')}`;
    }

    let details = '';
    if (analysis.d.size > 0) {
      const detailsArray = Array.from(analysis.d).filter(item => item !== 'alleged');
      if (detailsArray.length > 0) {
        details = `, ${detailsArray.join(', ')}`;
      }
    }

    let source = analysis.s ? `. ${analysis.s}` : '.';
    let notes = analysis.notes ? ` [Notes: ${analysis.notes}]` : '';

    let report = `${analysis.w} ${analysis.ac} ${target} ${location}${details}${casualties}${source}${notes}`;
    return report.replace(/\s+/g, ' ').replace(' .', '.').trim();
  }

  public saveTables() {
    localStorage.setItem('actionMapping', JSON.stringify(this.am));
    localStorage.setItem('locationCodes', JSON.stringify(this.lc));
    localStorage.setItem('targetMapping', JSON.stringify(this.tm));
    localStorage.setItem('militantGroups', JSON.stringify(this.m));
  }

  public resetToDefaults() {
    this.am = { ...this.defaultData.actionMap };
    this.lc = { ...this.defaultData.locationCodes };
    this.tm = { ...this.defaultData.targetMap };
    this.m = [...this.defaultData.militantGroups];
    this.saveTables();
  }
}