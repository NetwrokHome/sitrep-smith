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
        "ambush": ["ambush", "ambushed"],
        "sb attk": ["suicide bomber", "sb attk", "sb"],
        "fire raid": ["sniper", "laser", "gl", "fire raid", "shot", "gunmen", "motorcyclist", "sniper fire"],
        "blast": ["mine", "ied", "blast"],
        "strike": ["missile", "drone"],
        "raid": ["raid", "cp attack", "post attack", "attacked", "attk on", "hideout"],
        "tgt attk": ["targeted", "target attk", "shot dead", "martyred"],
        "repulse": ["repulse"],
        "claimed attk": ["claimed"]
      },
      targetMap: {
        "SFs cny": ["convoy", "cny", "military convoy"],
        "SFs Post/CP": ["post", "cp", "checkpost", "observation post", "bungalow", "bungla"],
        "LEAs": ["police", "policeman", "police station", "ps"],
        "Army": ["army", "military"],
        "SFs": ["sfs", "security forces", "sf", "mil"],
        "CTD": ["ctd"],
        "FC": ["fc"],
        "PC": ["police constable", "constable"],
        "ASI": ["asi"]
      },
      locationCodes: {
        "Bannu": { "code": "Bxu", "lat": 32.98, "lon": 70.6 },
        "North Waziristan": { "code": "NWD", "lat": 32.96, "lon": 69.84 },
        "South Waziristan": { "code": "SWD", "lat": 32.42, "lon": 69.79 },
        "Kurram": { "code": "Krm", "lat": 33.8, "lon": 70.1 },
        "Bajaur": { "code": "Bjr", "lat": 34.7, "lon": 71.1 },
        "Khyber": { "code": "Khy", "lat": 34.0, "lon": 71.1 },
        "Lakki Marwat": { "code": "Lki", "lat": 32.6, "lon": 70.9 },
        "Karachi": { "code": "Kci", "lat": 24.86, "lon": 67.01 },
        "Mardan": { "code": "Mdx", "lat": 34.2, "lon": 72.0 },
        "Dir Lower": { "code": "DIL", "lat": 35.2, "lon": 71.9 },
        "Dir Upper": { "code": "DIU", "lat": 35.8, "lon": 72.0 },
        "Dera Ismail Khan": { "code": "DIK", "lat": 31.8, "lon": 70.9 },
        "Panjgur": { "code": "Pjr", "lat": 26.97, "lon": 64.10 },
        "Balochistan": { "code": "Bln", "lat": 28.4, "lon": 65.0 }
      },
      militantGroups: ["FAK", "IMP", "BLA", "BLF", "FAH", "TTP"],
      locationCorrections: {
        "Jhao": "Jhalo",
        "Dosli": "Dosali",
        "Patnr": "Patne",
        "Spinwam": "Spenwam"
      }
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
    
    // Handle multiple posts/checkpoints
    if ((lowerText.includes('post') && lowerText.includes('cp')) || 
        (lowerText.match(/\b\w+\s+post.*\b\w+\s+cp\b/i))) {
      analysis.t = 'SFs Post/CP';
      return;
    }

    // Handle specific target types
    if (lowerText.includes('ctd')) {
      analysis.t = 'CTD';
      return;
    }

    if (lowerText.includes('fc pers') || (lowerText.includes('fc') && lowerText.includes('post'))) {
      analysis.t = 'FC';
      return;
    }

    if (lowerText.includes('police constable') || lowerText.includes('pc ')) {
      analysis.t = 'PC';
      return;
    }

    if (lowerText.includes('asi ')) {
      analysis.t = 'ASI';
      return;
    }

    // Standard target mapping
    for (const [target, keywords] of Object.entries(this.tm)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        analysis.t = target;
        break;
      }
    }

    // Normalize targets
    if (analysis.t === 'Army') analysis.t = 'SFs';
    if (analysis.t === 'PC' && lowerText.includes('at ')) analysis.t = 'LEAs';
    if (analysis.t === 'ASI' && lowerText.includes('at ')) analysis.t = 'LEAs';
  }

  private extractLocation(text: string, analysis: ReportAnalysis) {
    // Apply location corrections first
    let correctedText = text;
    const corrections = this.defaultData.locationCorrections || {};
    for (const [wrong, correct] of Object.entries(corrections)) {
      correctedText = correctedText.replace(new RegExp(wrong, 'gi'), correct as string);
    }

    // Try district-area format first (e.g., "NWD-Dosli" -> "Dosali, NWD")
    let match = correctedText.match(/(\w{3})-([\w\s]+)/);
    if (match) {
      let area = match[2].trim().replace(/bazar/i, 'Bazaar').trim();
      analysis.l = `${area}, ${match[1].toUpperCase()}`;
      return;
    }

    // Handle complex location strings like "Tirah Valley, Khy"
    match = correctedText.match(/(?:at|in|near)\s+([\w\s]+?),?\s*(\w{3})\b/i);
    if (match) {
      const area = match[1].replace(/bazar/i, 'Bazaar').replace(/(?:valley|area|tehsil|district)$/i, '').trim();
      analysis.l = `${area}, ${match[2].toUpperCase()}`;
      return;
    }

    // Handle "en-route" or convoy movement patterns
    match = correctedText.match(/(?:from|to)\s+[\w\s]+(?:to|,)\s+([\w\s]+)/i);
    if (match) {
      const destination = match[1].trim();
      for (const [location, data] of Object.entries(this.lc)) {
        if (destination.toLowerCase().includes(location.toLowerCase())) {
          analysis.l = `en-route to ${data.code}`;
          return;
        }
      }
    }

    // Sort locations by length for better matching
    const sortedLocations = Object.keys(this.lc).sort((a, b) => b.length - a.length);

    // Try to match area, location pattern
    for (const location of sortedLocations) {
      const regex = new RegExp(`([\\w\\s,]+?),?\\s*(${location.replace(/ /g, '\\s+')}(?:\\s+District|\\s+Tehsil)?)`, 'i');
      match = correctedText.match(regex);
      if (match) {
        let place = match[1].replace(/,$/, '').replace(/bazar/i, 'Bazaar').trim();
        const code = this.lc[location].code;
        analysis.l = `${place}, ${code}`;
        return;
      }
    }

    // Match just the district/area codes
    const locationCodes = Object.values(this.lc).map(v => v.code);
    for (const code of locationCodes) {
      if (correctedText.includes(code)) {
        analysis.l = code;
        return;
      }
    }

    // Fallback to just location names
    for (const location of sortedLocations) {
      if (correctedText.toLowerCase().includes(location.toLowerCase())) {
        analysis.l = this.lc[location].code;
        return;
      }
    }
  }

  private extractCasualties(text: string, analysis: ReportAnalysis) {
    const lowerText = text.toLowerCase();
    const results: Record<string, number> = {};

    // Handle exaggerated claims specially
    const exaggeratedMatch = lowerText.match(/exaggerated claims?\s+of\s+(\d+)\s*x?\s*sldrs?\s+sh,?\s*(\d+)\s*x?\s*inj/i);
    if (exaggeratedMatch) {
      analysis.c.add(`claims killing of ${exaggeratedMatch[1]} sldrs, ${exaggeratedMatch[2]} inj`);
      return;
    }

    // Equipment and vehicles
    const equipmentPatterns = [
      { re: /(\d+)\s*x?\s*veh(?:icles?)?\s*destr(?:oyed)?/gi, type: 'vehs destr' },
      { re: /(\d+)\s*x?\s*(?:truck|vehicle)s?\s*seized/gi, type: 'veh seized' },
      { re: /qpt\s*destr/gi, type: 'A/QC destr and seized' },
      { re: /(?:wpns?|weapons?)\s*seized/gi, type: 'W&A seized' }
    ];

    equipmentPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.re.source, 'gi');
      while ((match = regex.exec(lowerText)) !== null) {
        if (pattern.type === 'A/QC destr and seized' || pattern.type === 'W&A seized') {
          analysis.c.add(pattern.type);
        } else {
          const quantity = parseInt(match[1] || '1', 10);
          analysis.c.add(`${quantity} x ${pattern.type}`);
        }
      }
    });

    // Personnel casualties
    const casualtyPatterns = [
      { re: /(\d+)\s*x?\s*(sfs?|sldrs?|sf\s*pers|security\s*forces?)?\s*(sh|killed|dead|martyred)/gi, type: 'sh' },
      { re: /(\d+)\s*x?\s*(sfs?|sldrs?|sf\s*pers|security\s*forces?)?\s*(inj|injured)/gi, type: 'inj' },
      { re: /(\d+)\s*x?\s*(pc|police\s*constable|constables?)?\s*(sh|killed|dead|martyred)/gi, type: 'PC sh' },
      { re: /(\d+)\s*x?\s*(pc|police\s*constable|constables?)?\s*(inj|injured)/gi, type: 'PC inj' },
      { re: /(\d+)\s*x?\s*(asi|assistant\s*sub\s*inspector)?\s*(sh|killed|dead|martyred)/gi, type: 'ASI sh' },
      { re: /(\d+)\s*x?\s*(fc\s*pers|fc)?\s*(sh|killed|dead|martyred)/gi, type: 'FC pers sh' },
      { re: /(\d+)\s*x?\s*(fc\s*pers|fc)?\s*(inj|injured)/gi, type: 'FC pers inj' },
      { re: /(\d+)\s*x?\s*(ctd\s*pers|ctd)?\s*(sh|killed|dead|martyred)/gi, type: 'CTD pers sh' },
      { re: /(\d+)\s*x?\s*(leas?\s*pers|police\s*pers)?\s*(sh|killed|dead|martyred)/gi, type: 'LEAs pers sh' },
      { re: /(\d+)\s*x?\s*(leas?\s*pers|police\s*pers)?\s*(inj|injured)/gi, type: 'LEAs pers inj' },
      { re: /(\d+)\s*x?\s*(ts?|ks?|terrorists?|militants?)\s*(sh|killed|dead)/gi, type: 'Ts killed' },
      { re: /(\d+)\s*x?\s*(ts?|ks?|terrorists?|militants?)\s*(inj|injured)/gi, type: 'Ts inj' }
    ];

    casualtyPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.re.source, 'gi');
      while ((match = regex.exec(lowerText)) !== null) {
        const quantity = parseInt(match[1] || '1', 10);
        let casualtyType = pattern.type;
        
        // Handle generic casualties based on target context
        if (!match[2] && (pattern.type === 'sh' || pattern.type === 'inj')) {
          let inferredType = 'sldrs';
          if (analysis.t) {
            if (analysis.t.includes('LEAs') || analysis.t.includes('police')) inferredType = 'LEAs pers';
            else if (analysis.t.includes('FC')) inferredType = 'FC pers';
            else if (analysis.t.includes('CTD')) inferredType = 'CTD pers';
            else if (analysis.t === 'PC') inferredType = 'PC';
            else if (analysis.t === 'ASI') inferredType = 'ASI';
          }
          casualtyType = `${inferredType} ${pattern.type}`;
        }
        
        results[casualtyType] = (results[casualtyType] || 0) + quantity;
      }
    });

    // Handle generic "casualties reported" patterns
    if ((lowerText.includes('cas reported') || lowerText.includes('cas rptd')) && !Object.keys(results).length) {
      analysis.c.add('multiple cas reported');
    } else if (lowerText.includes('poss cas') && !Object.keys(results).length) {
      analysis.c.add('multiple cas likely');
    } else if (lowerText.includes('additional cas')) {
      analysis.c.add('additional cas likely');
    }

    // Add formatted casualties
    for (const [key, value] of Object.entries(results)) {
      analysis.c.add(`${value} x ${key}`);
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
      { re: /attackers?\s*(?:managed to )?fled|fled the area/i, detail: 'attackers fled' },
      { re: /house\s*set\s*on\s*fire/i, detail: 'house set on fire' },
      { re: /abducted\s*(?:his\s*)?(\d+)\s*nephews?/i, detail: (match: RegExpMatchArray) => `${match[1]} pers abducted` },
      { re: /hideout/i, detail: 'HO' }
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
    } else if (!match && !text.includes('@')) {
      // Add default source for reports without explicit source
      analysis.s = '@X';
    }

    // Handle social media sources
    if (text.toLowerCase().includes('sources report') || text.toLowerCase().includes('militant sources')) {
      const group = analysis.w !== 'Unknown Ts' ? analysis.w : 'FAH';
      analysis.s = `@${group} SM`;
    }
  }

  private assembleReport(analysis: ReportAnalysis): string {
    let target = analysis.t ? `on ${analysis.t}` : '';
    
    // Handle special target formatting
    if (analysis.d.has('alleged') && analysis.t) {
      target = `on alleged ${analysis.t}`;
    }
    
    // Handle CTD hideout -> CTD HO
    if (analysis.t === 'CTD' && analysis.d.has('HO')) {
      target = 'on CTD HO';
    }

    // Handle police station -> PS
    if (analysis.t === 'LEAs' && target.includes('police station')) {
      target = target.replace('police station', 'PS');
    }

    let location = analysis.l ? `at ${analysis.l}` : '';
    let casualties = '';
    
    if (analysis.c.size > 0) {
      casualties = `; ${Array.from(analysis.c).join(', ')}`;
    }

    let details = '';
    if (analysis.d.size > 0) {
      const detailsArray = Array.from(analysis.d).filter(item => 
        item !== 'alleged' && item !== 'HO'
      );
      if (detailsArray.length > 0) {
        details = `, ${detailsArray.join(', ')}`;
      }
    }

    let source = analysis.s ? `. ${analysis.s}` : '.';
    let notes = analysis.notes ? ` [Notes: ${analysis.notes}]` : '';

    let report = `${analysis.w} ${analysis.ac} ${target} ${location}${details}${casualties}${source}${notes}`;
    
    // Clean up formatting
    report = report.replace(/\s+/g, ' ')
                  .replace(' .', '.')
                  .replace(/\bat\s+([^,]+),?\s*([A-Z]{3})\b/g, 'at $1, $2')
                  .trim();
    
    return report;
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