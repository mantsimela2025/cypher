/**
 * @swagger
 * components:
 *   schemas:
 *     # System Discovery Schemas
 *     DiscoveryConfig:
 *       type: object
 *       required:
 *         - name
 *         - targets
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the discovery scan
 *           example: "Production Network Discovery"
 *         description:
 *           type: string
 *           description: Description of the discovery scan
 *           example: "Comprehensive network scan of production environment"
 *         methods:
 *           type: array
 *           items:
 *             type: string
 *             enum: [network_scan, port_scan, service_detection, aws_discovery, azure_discovery, gcp_discovery, ad_discovery, snmp_discovery]
 *           description: Discovery methods to use
 *           example: ["network_scan", "service_detection"]
 *         targets:
 *           type: array
 *           items:
 *             type: string
 *           description: Target IP ranges, domains, or cloud regions
 *           example: ["192.168.1.0/24", "10.0.0.0/16"]
 *         options:
 *           type: object
 *           description: Additional scan options
 *           properties:
 *             timeout:
 *               type: integer
 *               description: Scan timeout in milliseconds
 *               example: 5000
 *             threads:
 *               type: integer
 *               description: Number of concurrent threads
 *               example: 10
 *     
 *     DiscoveryScan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Production Network Discovery"
 *         description:
 *           type: string
 *           example: "Comprehensive network scan of production environment"
 *         status:
 *           type: string
 *           enum: [pending, running, completed, failed, cancelled]
 *           example: "completed"
 *         systemsFound:
 *           type: integer
 *           example: 15
 *         startedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         completedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:45:00Z"
 *         methods:
 *           type: array
 *           items:
 *             type: string
 *           example: ["network_scan", "service_detection"]
 *         targets:
 *           type: array
 *           items:
 *             type: string
 *           example: ["192.168.1.0/24"]
 *     
 *     DiscoveryStats:
 *       type: object
 *       properties:
 *         totalScans:
 *           type: integer
 *           example: 25
 *         completedScans:
 *           type: integer
 *           example: 20
 *         runningScans:
 *           type: integer
 *           example: 2
 *         systemsDiscovered:
 *           type: integer
 *           example: 150
 *         queueSize:
 *           type: integer
 *           example: 2
 *         methodsAvailable:
 *           type: integer
 *           example: 8
 *     
 *     # Security Posture Schemas
 *     SecurityPosture:
 *       type: object
 *       properties:
 *         systemId:
 *           type: integer
 *           example: 1
 *         systemName:
 *           type: string
 *           example: "Production Web Server"
 *         overallScore:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 100
 *           example: 75.5
 *         postureStatus:
 *           type: string
 *           enum: [excellent, good, fair, poor, critical]
 *           example: "good"
 *         vulnerabilityScore:
 *           type: number
 *           format: float
 *           example: 80.0
 *         configurationScore:
 *           type: number
 *           format: float
 *           example: 70.0
 *         patchScore:
 *           type: number
 *           format: float
 *           example: 85.0
 *         complianceScore:
 *           type: number
 *           format: float
 *           example: 90.0
 *         controlEffectiveness:
 *           type: number
 *           format: float
 *           example: 75.0
 *         threatExposure:
 *           type: number
 *           format: float
 *           example: 25.0
 *         businessImpact:
 *           type: number
 *           format: float
 *           example: 80.0
 *         riskFactors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["5 critical vulnerabilities", "Unpatched systems"]
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SecurityRecommendation'
 *         lastAssessment:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *     
 *     SecurityRecommendation:
 *       type: object
 *       properties:
 *         priority:
 *           type: string
 *           enum: [critical, high, medium, low]
 *           example: "critical"
 *         category:
 *           type: string
 *           enum: [vulnerability, configuration, patching, compliance, controls]
 *           example: "vulnerability"
 *         title:
 *           type: string
 *           example: "Address Critical Vulnerabilities"
 *         description:
 *           type: string
 *           example: "System has 5 critical vulnerabilities that require immediate attention"
 *         action:
 *           type: string
 *           example: "Patch or mitigate critical vulnerabilities within 24 hours"
 *         impact:
 *           type: string
 *           enum: [high, medium, low]
 *           example: "high"
 *     
 *     # Risk Scoring Schemas
 *     RiskScore:
 *       type: object
 *       properties:
 *         overallRisk:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 75
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *         components:
 *           type: object
 *           properties:
 *             vulnerabilityRisk:
 *               type: integer
 *               example: 80
 *             configurationRisk:
 *               type: integer
 *               example: 70
 *             patchRisk:
 *               type: integer
 *               example: 60
 *             threatExposure:
 *               type: integer
 *               example: 85
 *             businessImpact:
 *               type: integer
 *               example: 75
 *         riskFactors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["5 critical vulnerabilities", "Unpatched systems", "High external exposure"]
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Patch critical vulnerabilities", "Update configurations", "Reduce attack surface"]
 *         calculatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         model:
 *           type: string
 *           enum: [cvss_vulnerability, configuration_drift, system_composite, enterprise_aggregate]
 *           example: "system_composite"
 *     
 *     # Configuration Drift Schemas
 *     ConfigurationDrift:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         systemId:
 *           type: integer
 *           example: 1
 *         driftType:
 *           type: string
 *           enum: [configuration, patch, service, security]
 *           example: "security"
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *         title:
 *           type: string
 *           example: "Password Minimum Length Reduced"
 *         description:
 *           type: string
 *           example: "Password minimum length changed from 12 to 8"
 *         currentValue:
 *           type: string
 *           example: "8"
 *         expectedValue:
 *           type: string
 *           example: "12"
 *         previousValue:
 *           type: string
 *           example: "12"
 *         detectionMethod:
 *           type: string
 *           example: "security_policy"
 *         impactAssessment:
 *           type: string
 *           example: "Reduced password security increases risk of brute force attacks"
 *         businessImpact:
 *           type: string
 *           enum: [critical, high, medium, low]
 *           example: "high"
 *         remediationSteps:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Review password policy configuration", "Restore minimum length to baseline value"]
 *         detectedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         status:
 *           type: string
 *           enum: [open, acknowledged, resolved, accepted]
 *           example: "open"
 *         acknowledgedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T11:00:00Z"
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T12:00:00Z"
 *     
 *     # Common Response Schemas
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           description: Response data (varies by endpoint)
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 *     
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Operation failed"
 *         details:
 *           type: string
 *           example: "Detailed error message"
 *         missingFields:
 *           type: array
 *           items:
 *             type: string
 *           example: ["name", "targets"]
 *   
 *   # Security Schemes
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login endpoint
 * 
 * # Tags for grouping endpoints
 * tags:
 *   - name: System Discovery
 *     description: Automated system discovery and asset identification
 *   - name: Security Posture
 *     description: Real-time security posture assessment and monitoring
 *   - name: Risk Scoring
 *     description: Dynamic risk assessment and scoring algorithms
 *   - name: Configuration Drift
 *     description: Configuration drift detection and management
 */

module.exports = {}; // This file is used for Swagger documentation only
