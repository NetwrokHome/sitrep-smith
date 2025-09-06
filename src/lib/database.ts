import { supabase } from './supabase'
import { ValidatedReport, ReportAnalysis } from './report-converter'

// Convert Set objects to arrays for JSON storage
const serializeAnalysis = (analysis: ReportAnalysis) => ({
  ...analysis,
  c: Array.from(analysis.c),
  d: Array.from(analysis.d)
})

// Convert arrays back to Set objects when loading from database
const deserializeAnalysis = (analysis: any): ReportAnalysis => ({
  ...analysis,
  c: new Set(Array.isArray(analysis.c) ? analysis.c : []),
  d: new Set(Array.isArray(analysis.d) ? analysis.d : [])
})

export class DatabaseService {
  // Save a report to the database
  async saveReport(report: ValidatedReport): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const serializedAnalysis = serializeAnalysis(report.analysis)
      
      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          timestamp: report.timestamp,
          output: report.output,
          raw_input: report.rawInput,
          analysis: serializedAnalysis,
          threat_level: this.getThreatLevelFromAnalysis(report.analysis),
          location: report.analysis.l
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error saving report:', error)
      return false
    }
  }

  // Load all reports for the current user
  async loadReports(): Promise<ValidatedReport[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (error) throw error

      return (data || []).map(record => ({
        timestamp: record.timestamp,
        output: record.output,
        rawInput: record.raw_input,
        analysis: deserializeAnalysis(record.analysis)
      }))
    } catch (error) {
      console.error('Error loading reports:', error)
      return []
    }
  }

  // Delete a specific report
  async deleteReport(timestamp: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', user.id)
        .eq('timestamp', timestamp)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting report:', error)
      return false
    }
  }

  // Save user configurations
  async saveConfiguration(config: {
    actionMapping?: any
    locationCodes?: any
    targetMapping?: any
    militantGroups?: any
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('user_configurations')
        .upsert({
          user_id: user.id,
          action_mapping: config.actionMapping || {},
          location_codes: config.locationCodes || {},
          target_mapping: config.targetMapping || {},
          militant_groups: config.militantGroups || {}
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error saving configuration:', error)
      return false
    }
  }

  // Load user configurations
  async loadConfiguration() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('user_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      return data
    } catch (error) {
      console.error('Error loading configuration:', error)
      return null
    }
  }

  private getThreatLevelFromAnalysis(analysis: ReportAnalysis): string {
    // Simple threat level calculation - you can expand this
    const hasHighValueTarget = analysis.t && analysis.t.toLowerCase().includes('gov');
    const hasCasualties = analysis.c.size > 0;
    
    if (hasHighValueTarget && hasCasualties) return 'High';
    if (hasHighValueTarget || hasCasualties) return 'Medium';
    return 'Low';
  }
}

export const db = new DatabaseService()