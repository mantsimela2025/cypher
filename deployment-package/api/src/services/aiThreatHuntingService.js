const aiAssistanceService = require('./aiAssistanceService');
const siemService = require('./siemService');
const { db } = require('../db');
const { siemEvents, siemAlerts, vulnerabilities, assets } = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');

class AiThreatHuntingService {

  // ==================== AUTOMATED THREAT HUNTING ====================

  /**
   * Conduct automated threat hunting based on IOCs
   */
  async huntByIndicators(indicators, timeframe = '24h', userId) {
    try {
      console.log('🔍 Starting AI-powered threat hunting with indicators:', indicators);

      // Generate threat hunting hypothesis using AI
      const hypothesis = await this.generateHuntingHypothesis(indicators, userId);

      // Search for indicators in SIEM data
      const siemFindings = await this.searchSiemForIndicators(indicators, timeframe);

      // Search for indicators in vulnerability data
      const vulnFindings = await this.searchVulnerabilitiesForIndicators(indicators);

      // Analyze findings with AI
      const analysis = await this.analyzeHuntingFindings({
        hypothesis: hypothesis.response,
        siemFindings,
        vulnFindings,
        indicators,
        timeframe
      }, userId);

      // Generate hunting report
      const report = await this.generateHuntingReport({
        hypothesis,
        analysis,
        siemFindings,
        vulnFindings,
        indicators,
        timeframe
      }, userId);

      return {
        huntId: `hunt_${Date.now()}`,
        hypothesis,
        analysis,
        findings: {
          siem: siemFindings,
          vulnerabilities: vulnFindings
        },
        report,
        indicators,
        timeframe,
        conductedAt: new Date()
      };
    } catch (error) {
      console.error('Error conducting threat hunting:', error);
      throw error;
    }
  }

  /**
   * Generate threat hunting hypothesis using AI
   */
  async generateHuntingHypothesis(indicators, userId) {
    try {
      const requestData = {
        requestType: 'threat_hunting',
        title: 'Threat Hunting Hypothesis Generation',
        description: `Generate threat hunting hypothesis for the following indicators: ${indicators.join(', ')}`,
        context: {
          indicators,
          huntingType: 'indicator_based',
          environment: 'government_network'
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating hunting hypothesis:', error);
      throw error;
    }
  }

  /**
   * Search SIEM data for threat indicators
   */
  async searchSiemForIndicators(indicators, timeframe) {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      const findings = [];

      for (const indicator of indicators) {
        // Search in different SIEM fields based on indicator type
        const indicatorType = this.classifyIndicator(indicator);
        
        let searchConditions = [];

        switch (indicatorType) {
          case 'ip':
            searchConditions = [
              eq(siemEvents.sourceIp, indicator),
              eq(siemEvents.destinationIp, indicator)
            ];
            break;
          case 'domain':
            searchConditions = [
              sql`${siemEvents.details}::text ILIKE ${`%${indicator}%`}`,
              sql`${siemEvents.rawData} ILIKE ${`%${indicator}%`}`
            ];
            break;
          case 'hash':
            searchConditions = [
              sql`${siemEvents.details}::text ILIKE ${`%${indicator}%`}`,
              sql`${siemEvents.rawData} ILIKE ${`%${indicator}%`}`
            ];
            break;
          case 'url':
            searchConditions = [
              sql`${siemEvents.details}::text ILIKE ${`%${indicator}%`}`,
              sql`${siemEvents.rawData} ILIKE ${`%${indicator}%`}`
            ];
            break;
          default:
            searchConditions = [
              sql`${siemEvents.summary} ILIKE ${`%${indicator}%`}`,
              sql`${siemEvents.details}::text ILIKE ${`%${indicator}%`}`,
              sql`${siemEvents.rawData} ILIKE ${`%${indicator}%`}`
            ];
        }

        const events = await db.select()
          .from(siemEvents)
          .where(
            and(
              gte(siemEvents.timestamp, startTime),
              or(...searchConditions)
            )
          )
          .orderBy(desc(siemEvents.timestamp))
          .limit(100);

        if (events.length > 0) {
          findings.push({
            indicator,
            indicatorType,
            eventCount: events.length,
            events: events.slice(0, 10), // Limit for performance
            firstSeen: events[events.length - 1].timestamp,
            lastSeen: events[0].timestamp
          });
        }
      }

      return findings;
    } catch (error) {
      console.error('Error searching SIEM for indicators:', error);
      throw error;
    }
  }

  /**
   * Search vulnerability data for threat indicators
   */
  async searchVulnerabilitiesForIndicators(indicators) {
    try {
      const findings = [];

      for (const indicator of indicators) {
        const vulns = await db.select()
          .from(vulnerabilities)
          .where(
            or(
              sql`${vulnerabilities.description} ILIKE ${`%${indicator}%`}`,
              sql`${vulnerabilities.solution} ILIKE ${`%${indicator}%`}`,
              sql`${vulnerabilities.references}::text ILIKE ${`%${indicator}%`}`
            )
          )
          .limit(50);

        if (vulns.length > 0) {
          findings.push({
            indicator,
            vulnerabilityCount: vulns.length,
            vulnerabilities: vulns.slice(0, 10)
          });
        }
      }

      return findings;
    } catch (error) {
      console.error('Error searching vulnerabilities for indicators:', error);
      throw error;
    }
  }

  /**
   * Analyze hunting findings using AI
   */
  async analyzeHuntingFindings(findingsData, userId) {
    try {
      const requestData = {
        requestType: 'threat_analysis',
        title: 'Threat Hunting Findings Analysis',
        description: 'Analyze threat hunting findings and provide threat assessment',
        context: {
          ...findingsData,
          analysisType: 'hunting_findings'
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error analyzing hunting findings:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive hunting report
   */
  async generateHuntingReport(reportData, userId) {
    try {
      const requestData = {
        requestType: 'documentation',
        title: 'Threat Hunting Report',
        description: 'Generate comprehensive threat hunting report with findings and recommendations',
        context: {
          ...reportData,
          reportType: 'threat_hunting'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating hunting report:', error);
      throw error;
    }
  }

  // ==================== BEHAVIORAL ANALYSIS ====================

  /**
   * Conduct behavioral anomaly hunting
   */
  async huntBehavioralAnomalies(timeframe = '7d', userId) {
    try {
      console.log('🧠 Starting behavioral anomaly hunting');

      // Get baseline behavioral patterns
      const baseline = await this.getBaselineBehavior(timeframe);

      // Detect anomalies in current behavior
      const anomalies = await this.detectBehavioralAnomalies(baseline, timeframe);

      // Analyze anomalies with AI
      const analysis = await this.analyzeBehavioralAnomalies(anomalies, baseline, userId);

      return {
        huntId: `behavioral_hunt_${Date.now()}`,
        baseline,
        anomalies,
        analysis,
        timeframe,
        conductedAt: new Date()
      };
    } catch (error) {
      console.error('Error conducting behavioral anomaly hunting:', error);
      throw error;
    }
  }

  /**
   * Get baseline behavioral patterns
   */
  async getBaselineBehavior(timeframe) {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      // User login patterns
      const loginPatterns = await db.select({
        username: siemEvents.username,
        loginCount: count(),
        avgHour: sql`AVG(EXTRACT(HOUR FROM ${siemEvents.timestamp}))`,
        uniqueIps: sql`COUNT(DISTINCT ${siemEvents.sourceIp})`
      })
      .from(siemEvents)
      .where(
        and(
          eq(siemEvents.eventType, 'user_login'),
          gte(siemEvents.timestamp, startTime),
          isNotNull(siemEvents.username)
        )
      )
      .groupBy(siemEvents.username);

      // Network traffic patterns
      const networkPatterns = await db.select({
        sourceIp: siemEvents.sourceIp,
        eventCount: count(),
        uniqueDestinations: sql`COUNT(DISTINCT ${siemEvents.destinationIp})`,
        eventTypes: sql`array_agg(DISTINCT ${siemEvents.eventType})`
      })
      .from(siemEvents)
      .where(
        and(
          gte(siemEvents.timestamp, startTime),
          isNotNull(siemEvents.sourceIp)
        )
      )
      .groupBy(siemEvents.sourceIp)
      .having(sql`COUNT(*) > 10`);

      return {
        loginPatterns,
        networkPatterns,
        timeframe,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting baseline behavior:', error);
      throw error;
    }
  }

  /**
   * Detect behavioral anomalies
   */
  async detectBehavioralAnomalies(baseline, timeframe) {
    try {
      const recentTimeframe = '24h';
      const recentDuration = this.parseTimeframe(recentTimeframe);
      const recentStartTime = new Date(Date.now() - recentDuration);

      const anomalies = [];

      // Check for login anomalies
      for (const userBaseline of baseline.loginPatterns) {
        const recentLogins = await db.select({
          loginCount: count(),
          avgHour: sql`AVG(EXTRACT(HOUR FROM ${siemEvents.timestamp}))`,
          uniqueIps: sql`COUNT(DISTINCT ${siemEvents.sourceIp})`
        })
        .from(siemEvents)
        .where(
          and(
            eq(siemEvents.eventType, 'user_login'),
            eq(siemEvents.username, userBaseline.username),
            gte(siemEvents.timestamp, recentStartTime)
          )
        );

        if (recentLogins.length > 0) {
          const recent = recentLogins[0];
          
          // Check for anomalies
          if (recent.uniqueIps > userBaseline.uniqueIps * 2) {
            anomalies.push({
              type: 'login_anomaly',
              subtype: 'multiple_ips',
              username: userBaseline.username,
              baseline: userBaseline.uniqueIps,
              current: recent.uniqueIps,
              severity: 'medium'
            });
          }

          if (Math.abs(recent.avgHour - userBaseline.avgHour) > 6) {
            anomalies.push({
              type: 'login_anomaly',
              subtype: 'unusual_time',
              username: userBaseline.username,
              baseline: userBaseline.avgHour,
              current: recent.avgHour,
              severity: 'low'
            });
          }
        }
      }

      // Check for network anomalies
      for (const networkBaseline of baseline.networkPatterns) {
        const recentNetwork = await db.select({
          eventCount: count(),
          uniqueDestinations: sql`COUNT(DISTINCT ${siemEvents.destinationIp})`
        })
        .from(siemEvents)
        .where(
          and(
            eq(siemEvents.sourceIp, networkBaseline.sourceIp),
            gte(siemEvents.timestamp, recentStartTime)
          )
        );

        if (recentNetwork.length > 0) {
          const recent = recentNetwork[0];
          
          if (recent.uniqueDestinations > networkBaseline.uniqueDestinations * 3) {
            anomalies.push({
              type: 'network_anomaly',
              subtype: 'port_scanning',
              sourceIp: networkBaseline.sourceIp,
              baseline: networkBaseline.uniqueDestinations,
              current: recent.uniqueDestinations,
              severity: 'high'
            });
          }
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Error detecting behavioral anomalies:', error);
      throw error;
    }
  }

  /**
   * Analyze behavioral anomalies with AI
   */
  async analyzeBehavioralAnomalies(anomalies, baseline, userId) {
    try {
      const requestData = {
        requestType: 'threat_analysis',
        title: 'Behavioral Anomaly Analysis',
        description: 'Analyze detected behavioral anomalies for potential threats',
        context: {
          anomalies,
          baseline,
          analysisType: 'behavioral_anomalies'
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error analyzing behavioral anomalies:', error);
      throw error;
    }
  }

  // ==================== ADVANCED THREAT HUNTING ====================

  /**
   * Hunt for Advanced Persistent Threats (APT)
   */
  async huntAPTActivity(timeframe = '30d', userId) {
    try {
      console.log('🎯 Starting APT hunting');

      // Look for APT indicators
      const aptIndicators = await this.detectAPTIndicators(timeframe);

      // Analyze with AI for APT patterns
      const analysis = await this.analyzeAPTActivity(aptIndicators, userId);

      return {
        huntId: `apt_hunt_${Date.now()}`,
        indicators: aptIndicators,
        analysis,
        timeframe,
        conductedAt: new Date()
      };
    } catch (error) {
      console.error('Error hunting APT activity:', error);
      throw error;
    }
  }

  /**
   * Detect APT indicators
   */
  async detectAPTIndicators(timeframe) {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      const indicators = [];

      // Look for persistence mechanisms
      const persistenceEvents = await db.select()
        .from(siemEvents)
        .where(
          and(
            gte(siemEvents.timestamp, startTime),
            or(
              sql`${siemEvents.eventType} ILIKE '%registry%'`,
              sql`${siemEvents.eventType} ILIKE '%service%'`,
              sql`${siemEvents.eventType} ILIKE '%scheduled_task%'`,
              sql`${siemEvents.summary} ILIKE '%autostart%'`
            )
          )
        )
        .limit(100);

      if (persistenceEvents.length > 0) {
        indicators.push({
          type: 'persistence',
          events: persistenceEvents,
          description: 'Potential persistence mechanisms detected'
        });
      }

      // Look for lateral movement
      const lateralMovement = await db.select({
        sourceIp: siemEvents.sourceIp,
        uniqueDestinations: sql`COUNT(DISTINCT ${siemEvents.destinationIp})`,
        eventCount: count()
      })
      .from(siemEvents)
      .where(
        and(
          gte(siemEvents.timestamp, startTime),
          or(
            sql`${siemEvents.eventType} ILIKE '%remote%'`,
            sql`${siemEvents.eventType} ILIKE '%smb%'`,
            sql`${siemEvents.eventType} ILIKE '%rdp%'`
          )
        )
      )
      .groupBy(siemEvents.sourceIp)
      .having(sql`COUNT(DISTINCT ${siemEvents.destinationIp}) > 5`);

      if (lateralMovement.length > 0) {
        indicators.push({
          type: 'lateral_movement',
          events: lateralMovement,
          description: 'Potential lateral movement detected'
        });
      }

      // Look for data exfiltration
      const exfiltrationEvents = await db.select()
        .from(siemEvents)
        .where(
          and(
            gte(siemEvents.timestamp, startTime),
            or(
              sql`${siemEvents.eventType} ILIKE '%file_transfer%'`,
              sql`${siemEvents.eventType} ILIKE '%upload%'`,
              sql`${siemEvents.eventType} ILIKE '%download%'`,
              sql`${siemEvents.summary} ILIKE '%large_transfer%'`
            )
          )
        )
        .limit(100);

      if (exfiltrationEvents.length > 0) {
        indicators.push({
          type: 'data_exfiltration',
          events: exfiltrationEvents,
          description: 'Potential data exfiltration detected'
        });
      }

      return indicators;
    } catch (error) {
      console.error('Error detecting APT indicators:', error);
      throw error;
    }
  }

  /**
   * Analyze APT activity with AI
   */
  async analyzeAPTActivity(indicators, userId) {
    try {
      const requestData = {
        requestType: 'threat_analysis',
        title: 'APT Activity Analysis',
        description: 'Analyze potential Advanced Persistent Threat activity',
        context: {
          indicators,
          analysisType: 'apt_activity',
          threatType: 'advanced_persistent_threat'
        },
        priority: 'critical'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error analyzing APT activity:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Classify indicator type
   */
  classifyIndicator(indicator) {
    // IP address pattern
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(indicator)) {
      return 'ip';
    }
    
    // Domain pattern
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(indicator)) {
      return 'domain';
    }
    
    // Hash patterns
    if (/^[a-fA-F0-9]{32}$/.test(indicator)) {
      return 'md5';
    }
    if (/^[a-fA-F0-9]{40}$/.test(indicator)) {
      return 'sha1';
    }
    if (/^[a-fA-F0-9]{64}$/.test(indicator)) {
      return 'sha256';
    }
    
    // URL pattern
    if (/^https?:\/\//.test(indicator)) {
      return 'url';
    }
    
    return 'unknown';
  }

  /**
   * Parse timeframe string to milliseconds
   */
  parseTimeframe(timeframe) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    const match = timeframe.match(/^(\d+)([mhdw])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}

module.exports = new AiThreatHuntingService();
