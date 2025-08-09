const { EventEmitter } = require('events');
const AWS = require('aws-sdk');
const logger = require('../utils/logger');
const validator = require('../utils/validator');

/**
 * AWSScanner class for scanning AWS resources for security issues
 */
class AWSScanner extends EventEmitter {
  /**
   * Create a new AWS scanner instance
   * @param {Object} options - Scanner options
   * @param {string} options.region - AWS region to scan
   */
  constructor(options = {}) {
    super();
    this.region = options.region || 'us-east-1';
    this.scanInProgress = false;
    this.aborted = false;
  }

  /**
   * Scan AWS resources for security issues
   * @param {Object} options - Scan options
   * @param {string} options.region - AWS region to scan
   * @param {Array<string>|string} options.services - AWS services to scan
   * @returns {Promise<Object>} - Results of the AWS scan
   */
  async scan(options = {}) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    // Use provided region or default to constructor region
    const region = options.region || this.region;
    
    if (!validator.isValidAwsRegion(region)) {
      throw new Error(`Invalid AWS region: ${region}`);
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    // Determine which services to scan
    let servicesToScan = [];
    if (!options.services) {
      servicesToScan = ['ec2', 's3', 'iam', 'rds'];
    } else if (Array.isArray(options.services)) {
      servicesToScan = options.services;
    } else if (typeof options.services === 'string') {
      servicesToScan = options.services.split(',').map(s => s.trim().toLowerCase());
    }

    logger.scan.start('AWS', `region: ${region}, services: ${servicesToScan.join(', ')}`);
    
    // Configure AWS SDK
    AWS.config.update({ region });
    
    // Check for credentials
    try {
      const sts = new AWS.STS();
      await sts.getCallerIdentity().promise();
    } catch (error) {
      this.scanInProgress = false;
      logger.error(`AWS authentication error: ${error.message}`);
      if (error.code === 'CredentialsError' || error.code === 'UnauthorizedOperation') {
        throw new Error('AWS credentials not found or invalid. Make sure you have configured your credentials properly.');
      }
      throw error;
    }
    
    // Results object
    const results = {
      timestamp: new Date().toISOString(),
      region,
      scannedServices: [],
      findings: []
    };
    
    try {
      // Scan each requested service
      let completedServices = 0;
      const totalServices = servicesToScan.length;
      
      for (const service of servicesToScan) {
        if (this.aborted) {
          break;
        }
        
        logger.info(`Scanning AWS ${service} resources...`);
        this.emit('progress', {
          phase: 'service-scan',
          service,
          current: completedServices + 1,
          total: totalServices
        });
        
        try {
          let serviceFindings = [];
          
          switch (service) {
            case 'ec2':
              serviceFindings = await this.scanEC2(region);
              break;
            case 's3':
              serviceFindings = await this.scanS3(region);
              break;
            case 'iam':
              serviceFindings = await this.scanIAM(region);
              break;
            case 'rds':
              serviceFindings = await this.scanRDS(region);
              break;
            default:
              logger.warn(`Unsupported AWS service for scanning: ${service}`);
              break;
          }
          
          results.findings.push(...serviceFindings);
          results.scannedServices.push({
            name: service,
            findings: serviceFindings.length
          });
        } catch (serviceError) {
          logger.error(`Error scanning AWS ${service}: ${serviceError.message}`);
          results.scannedServices.push({
            name: service,
            error: serviceError.message
          });
        }
        
        completedServices++;
      }
      
      // Calculate findings statistics
      results.stats = {
        total: results.findings.length,
        critical: results.findings.filter(f => f.severity === 'critical').length,
        high: results.findings.filter(f => f.severity === 'high').length,
        medium: results.findings.filter(f => f.severity === 'medium').length,
        low: results.findings.filter(f => f.severity === 'low').length,
        info: results.findings.filter(f => f.severity === 'info').length
      };
      
      logger.scan.complete('AWS', `region: ${region}`, results);
      this.scanInProgress = false;
      return results;
    } catch (error) {
      this.scanInProgress = false;
      logger.error(`AWS scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan EC2 resources for security issues
   * @param {string} region - AWS region to scan
   * @returns {Promise<Array>} - Security findings
   */
  async scanEC2(region) {
    const findings = [];
    const ec2 = new AWS.EC2({ region });
    
    try {
      // Get all instances
      const { Reservations } = await ec2.describeInstances().promise();
      const instances = Reservations.flatMap(r => r.Instances || []);
      
      logger.info(`Found ${instances.length} EC2 instances`);
      
      // Check instances for security issues
      for (const instance of instances) {
        // Check for instances without tags
        if (!instance.Tags || instance.Tags.length === 0) {
          findings.push({
            id: `ec2-no-tags-${instance.InstanceId}`,
            name: 'EC2 Instance Missing Tags',
            description: 'EC2 instance has no tags, which makes it difficult to track ownership and purpose.',
            resource: instance.InstanceId,
            service: 'ec2',
            severity: 'low',
            region,
            details: {
              instanceType: instance.InstanceType,
              state: instance.State?.Name
            }
          });
        }
        
        // Check security groups
        const securityGroups = instance.SecurityGroups || [];
        for (const sg of securityGroups) {
          try {
            const { SecurityGroups } = await ec2.describeSecurityGroups({
              GroupIds: [sg.GroupId]
            }).promise();
            
            if (SecurityGroups && SecurityGroups.length > 0) {
              const securityGroup = SecurityGroups[0];
              
              // Check for overly permissive security group rules
              for (const ipPermission of securityGroup.IpPermissions || []) {
                const hasOpenToWorld = (ipPermission.IpRanges || []).some(range => 
                  range.CidrIp === '0.0.0.0/0' && (!ipPermission.FromPort || ipPermission.FromPort <= 22)
                );
                
                if (hasOpenToWorld) {
                  findings.push({
                    id: `ec2-sg-open-${sg.GroupId}-${ipPermission.FromPort || 'all'}`,
                    name: 'Security Group with Unrestricted Access',
                    description: `Security group allows unrestricted access (0.0.0.0/0) ${
                      ipPermission.FromPort ? `to port ${ipPermission.FromPort}` : 'to all ports'
                    }`,
                    resource: sg.GroupId,
                    service: 'ec2',
                    severity: 'high',
                    region,
                    details: {
                      instanceId: instance.InstanceId,
                      securityGroupName: sg.GroupName,
                      ipProtocol: ipPermission.IpProtocol,
                      fromPort: ipPermission.FromPort,
                      toPort: ipPermission.ToPort
                    }
                  });
                }
              }
            }
          } catch (error) {
            logger.debug(`Error checking security group ${sg.GroupId}: ${error.message}`);
          }
        }
        
        // Check for public IP addresses
        if (instance.PublicIpAddress) {
          findings.push({
            id: `ec2-public-ip-${instance.InstanceId}`,
            name: 'EC2 Instance with Public IP',
            description: 'EC2 instance has a public IP address, increasing its exposure to the internet.',
            resource: instance.InstanceId,
            service: 'ec2',
            severity: 'medium',
            region,
            details: {
              publicIp: instance.PublicIpAddress,
              state: instance.State?.Name
            }
          });
        }
      }
      
      // Get all volumes
      const { Volumes } = await ec2.describeVolumes().promise();
      
      // Check for unencrypted volumes
      for (const volume of Volumes || []) {
        if (!volume.Encrypted) {
          findings.push({
            id: `ec2-unencrypted-volume-${volume.VolumeId}`,
            name: 'Unencrypted EBS Volume',
            description: 'EBS volume is not encrypted, which could expose sensitive data if the physical storage is compromised.',
            resource: volume.VolumeId,
            service: 'ec2',
            severity: 'medium',
            region,
            details: {
              volumeType: volume.VolumeType,
              size: volume.Size,
              attachments: volume.Attachments?.map(a => a.InstanceId) || []
            }
          });
        }
      }
      
      return findings;
    } catch (error) {
      logger.error(`Error scanning EC2 resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan S3 resources for security issues
   * @param {string} region - AWS region to scan
   * @returns {Promise<Array>} - Security findings
   */
  async scanS3(region) {
    const findings = [];
    const s3 = new AWS.S3({ region });
    
    try {
      // Get all buckets
      const { Buckets } = await s3.listBuckets().promise();
      
      logger.info(`Found ${Buckets.length} S3 buckets`);
      
      for (const bucket of Buckets || []) {
        const bucketName = bucket.Name;
        
        try {
          // Check bucket ACL
          const { Grants } = await s3.getBucketAcl({ Bucket: bucketName }).promise();
          
          const publicGrants = Grants.filter(grant => 
            grant.Grantee && 
            (grant.Grantee.URI === 'http://acs.amazonaws.com/groups/global/AllUsers' || 
             grant.Grantee.URI === 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers')
          );
          
          if (publicGrants.length > 0) {
            findings.push({
              id: `s3-public-acl-${bucketName}`,
              name: 'S3 Bucket with Public ACL',
              description: 'S3 bucket has an ACL that grants access to the public.',
              resource: bucketName,
              service: 's3',
              severity: 'high',
              region,
              details: {
                grants: publicGrants.map(g => ({
                  permission: g.Permission,
                  grantee: g.Grantee.URI
                }))
              }
            });
          }
          
          // Check bucket policy
          try {
            const { Policy } = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
            
            if (Policy) {
              const policyObj = JSON.parse(Policy);
              const statements = policyObj.Statement || [];
              
              const publicStatements = statements.filter(stmt => {
                const principal = stmt.Principal;
                return stmt.Effect === 'Allow' && (
                  principal === '*' || 
                  principal === {'AWS': '*'} || 
                  (Array.isArray(principal?.AWS) && principal.AWS.includes('*')) ||
                  (typeof principal?.AWS === 'string' && principal.AWS === '*')
                );
              });
              
              if (publicStatements.length > 0) {
                findings.push({
                  id: `s3-public-policy-${bucketName}`,
                  name: 'S3 Bucket with Public Policy',
                  description: 'S3 bucket has a policy that allows public access.',
                  resource: bucketName,
                  service: 's3',
                  severity: 'high',
                  region,
                  details: {
                    statements: publicStatements
                  }
                });
              }
            }
          } catch (policyError) {
            // No bucket policy or unable to access it
            if (policyError.code !== 'NoSuchBucketPolicy') {
              logger.debug(`Error getting bucket policy for ${bucketName}: ${policyError.message}`);
            }
          }
          
          // Check for bucket encryption
          try {
            await s3.getBucketEncryption({ Bucket: bucketName }).promise();
          } catch (encryptionError) {
            if (encryptionError.code === 'ServerSideEncryptionConfigurationNotFoundError') {
              findings.push({
                id: `s3-no-encryption-${bucketName}`,
                name: 'S3 Bucket without Default Encryption',
                description: 'S3 bucket does not have default encryption enabled.',
                resource: bucketName,
                service: 's3',
                severity: 'medium',
                region
              });
            } else {
              logger.debug(`Error checking bucket encryption for ${bucketName}: ${encryptionError.message}`);
            }
          }
          
          // Check for bucket versioning
          try {
            const { Status } = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
            
            if (!Status || Status !== 'Enabled') {
              findings.push({
                id: `s3-no-versioning-${bucketName}`,
                name: 'S3 Bucket without Versioning',
                description: 'S3 bucket does not have versioning enabled, which reduces ability to recover from accidental deletion or overwrite.',
                resource: bucketName,
                service: 's3',
                severity: 'low',
                region
              });
            }
          } catch (versioningError) {
            logger.debug(`Error checking bucket versioning for ${bucketName}: ${versioningError.message}`);
          }
          
          // Check for bucket logging
          try {
            const logging = await s3.getBucketLogging({ Bucket: bucketName }).promise();
            
            if (!logging.LoggingEnabled) {
              findings.push({
                id: `s3-no-logging-${bucketName}`,
                name: 'S3 Bucket without Access Logging',
                description: 'S3 bucket does not have access logging enabled, which reduces visibility into bucket access patterns.',
                resource: bucketName,
                service: 's3',
                severity: 'low',
                region
              });
            }
          } catch (loggingError) {
            logger.debug(`Error checking bucket logging for ${bucketName}: ${loggingError.message}`);
          }
          
        } catch (bucketError) {
          // This might happen if the bucket is in a different region
          logger.debug(`Error analyzing bucket ${bucketName}: ${bucketError.message}`);
        }
      }
      
      return findings;
    } catch (error) {
      logger.error(`Error scanning S3 resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan IAM resources for security issues
   * @param {string} region - AWS region to scan
   * @returns {Promise<Array>} - Security findings
   */
  async scanIAM(region) {
    const findings = [];
    const iam = new AWS.IAM();
    
    try {
      // Get IAM users
      const { Users } = await iam.listUsers().promise();
      
      logger.info(`Found ${Users.length} IAM users`);
      
      for (const user of Users || []) {
        // Check for console access (login profile)
        try {
          await iam.getLoginProfile({ UserName: user.UserName }).promise();
          
          // User has console access, check for MFA
          const { MFADevices } = await iam.listMFADevices({ UserName: user.UserName }).promise();
          
          if (!MFADevices || MFADevices.length === 0) {
            findings.push({
              id: `iam-no-mfa-${user.UserName}`,
              name: 'IAM User without MFA',
              description: 'IAM user has console access but does not have multi-factor authentication enabled.',
              resource: user.UserName,
              service: 'iam',
              severity: 'high',
              region,
              details: {
                userId: user.UserId,
                arn: user.Arn,
                created: user.CreateDate
              }
            });
          }
        } catch (profileError) {
          // User does not have console access
          if (profileError.code !== 'NoSuchEntity') {
            logger.debug(`Error checking login profile for ${user.UserName}: ${profileError.message}`);
          }
        }
        
        // Check for access keys
        try {
          const { AccessKeyMetadata } = await iam.listAccessKeys({ UserName: user.UserName }).promise();
          
          for (const key of AccessKeyMetadata || []) {
            if (key.Status === 'Active') {
              // Check key age
              const keyAge = Math.floor((new Date() - key.CreateDate) / (1000 * 60 * 60 * 24));
              
              if (keyAge > 90) {
                findings.push({
                  id: `iam-old-access-key-${key.AccessKeyId}`,
                  name: 'IAM User with Old Access Key',
                  description: `IAM user has an access key that is ${keyAge} days old.`,
                  resource: user.UserName,
                  service: 'iam',
                  severity: 'medium',
                  region,
                  details: {
                    keyId: key.AccessKeyId,
                    keyAge: `${keyAge} days`,
                    created: key.CreateDate
                  }
                });
              }
              
              // Additional check for root account access keys
              if (user.UserName === 'root' || user.Arn.includes(':root')) {
                findings.push({
                  id: `iam-root-access-key-${key.AccessKeyId}`,
                  name: 'Root Account with Access Key',
                  description: 'The root account has an active access key, which is a security risk.',
                  resource: 'root',
                  service: 'iam',
                  severity: 'critical',
                  region,
                  details: {
                    keyId: key.AccessKeyId,
                    created: key.CreateDate
                  }
                });
              }
            }
          }
        } catch (keysError) {
          logger.debug(`Error checking access keys for ${user.UserName}: ${keysError.message}`);
        }
      }
      
      // Check password policy
      try {
        const { PasswordPolicy } = await iam.getAccountPasswordPolicy().promise();
        
        const policyIssues = [];
        
        if (!PasswordPolicy.RequireUppercaseCharacters) {
          policyIssues.push('Does not require uppercase characters');
        }
        
        if (!PasswordPolicy.RequireLowercaseCharacters) {
          policyIssues.push('Does not require lowercase characters');
        }
        
        if (!PasswordPolicy.RequireSymbols) {
          policyIssues.push('Does not require symbols');
        }
        
        if (!PasswordPolicy.RequireNumbers) {
          policyIssues.push('Does not require numbers');
        }
        
        if (PasswordPolicy.MinimumPasswordLength < 14) {
          policyIssues.push(`Minimum password length is only ${PasswordPolicy.MinimumPasswordLength} characters`);
        }
        
        if (!PasswordPolicy.ExpirePasswords || PasswordPolicy.MaxPasswordAge > 90) {
          policyIssues.push('Passwords do not expire or expire after more than 90 days');
        }
        
        if (policyIssues.length > 0) {
          findings.push({
            id: 'iam-weak-password-policy',
            name: 'Weak IAM Password Policy',
            description: 'The IAM password policy does not enforce strong security practices.',
            resource: 'account',
            service: 'iam',
            severity: 'medium',
            region,
            details: {
              issues: policyIssues,
              policy: PasswordPolicy
            }
          });
        }
      } catch (policyError) {
        if (policyError.code === 'NoSuchEntity') {
          findings.push({
            id: 'iam-no-password-policy',
            name: 'No IAM Password Policy',
            description: 'There is no IAM password policy defined for the account.',
            resource: 'account',
            service: 'iam',
            severity: 'high',
            region
          });
        } else {
          logger.debug(`Error checking password policy: ${policyError.message}`);
        }
      }
      
      // Check for roles with overly permissive policies
      try {
        const { Roles } = await iam.listRoles().promise();
        
        for (const role of Roles || []) {
          try {
            const { PolicyDocument } = role.AssumeRolePolicyDocument 
              ? role 
              : await iam.getRole({ RoleName: role.RoleName }).promise();
            
            if (PolicyDocument) {
              const doc = typeof PolicyDocument === 'string' 
                ? JSON.parse(decodeURIComponent(PolicyDocument)) 
                : PolicyDocument;
              
              const statements = doc.Statement || [];
              
              const wildcardPrincipals = statements.filter(stmt => {
                const principal = stmt.Principal;
                return stmt.Effect === 'Allow' && (
                  principal === '*' || 
                  principal?.AWS === '*' || 
                  (Array.isArray(principal?.AWS) && principal.AWS.includes('*'))
                );
              });
              
              if (wildcardPrincipals.length > 0) {
                findings.push({
                  id: `iam-role-wildcard-principal-${role.RoleName}`,
                  name: 'IAM Role with Wildcard Principal',
                  description: 'IAM role trust policy allows wildcard principals, which could permit unintended access.',
                  resource: role.RoleName,
                  service: 'iam',
                  severity: 'high',
                  region,
                  details: {
                    arn: role.Arn,
                    wildcardStatements: wildcardPrincipals
                  }
                });
              }
            }
          } catch (roleError) {
            logger.debug(`Error checking role ${role.RoleName}: ${roleError.message}`);
          }
        }
      } catch (rolesError) {
        logger.debug(`Error listing roles: ${rolesError.message}`);
      }
      
      return findings;
    } catch (error) {
      logger.error(`Error scanning IAM resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan RDS resources for security issues
   * @param {string} region - AWS region to scan
   * @returns {Promise<Array>} - Security findings
   */
  async scanRDS(region) {
    const findings = [];
    const rds = new AWS.RDS({ region });
    
    try {
      // Get RDS instances
      const { DBInstances } = await rds.describeDBInstances().promise();
      
      logger.info(`Found ${DBInstances.length} RDS instances`);
      
      for (const instance of DBInstances || []) {
        // Check for publicly accessible instances
        if (instance.PubliclyAccessible) {
          findings.push({
            id: `rds-public-${instance.DBInstanceIdentifier}`,
            name: 'Publicly Accessible RDS Instance',
            description: 'RDS instance is publicly accessible, which increases exposure to potential attacks.',
            resource: instance.DBInstanceIdentifier,
            service: 'rds',
            severity: 'high',
            region,
            details: {
              engine: `${instance.Engine} ${instance.EngineVersion}`,
              endpoint: instance.Endpoint?.Address
            }
          });
        }
        
        // Check for encryption
        if (!instance.StorageEncrypted) {
          findings.push({
            id: `rds-unencrypted-${instance.DBInstanceIdentifier}`,
            name: 'Unencrypted RDS Instance',
            description: 'RDS instance storage is not encrypted, which could expose sensitive data if the physical storage is compromised.',
            resource: instance.DBInstanceIdentifier,
            service: 'rds',
            severity: 'medium',
            region,
            details: {
              engine: `${instance.Engine} ${instance.EngineVersion}`,
              allocatedStorage: instance.AllocatedStorage
            }
          });
        }
        
        // Check for automated backups
        if (!instance.BackupRetentionPeriod || instance.BackupRetentionPeriod < 7) {
          findings.push({
            id: `rds-insufficient-backup-${instance.DBInstanceIdentifier}`,
            name: 'Insufficient RDS Backup Retention',
            description: `RDS instance has backup retention period of ${instance.BackupRetentionPeriod || 0} days, which may not meet disaster recovery requirements.`,
            resource: instance.DBInstanceIdentifier,
            service: 'rds',
            severity: 'low',
            region,
            details: {
              engine: `${instance.Engine} ${instance.EngineVersion}`,
              backupRetentionPeriod: instance.BackupRetentionPeriod || 0
            }
          });
        }
        
        // Check for Multi-AZ deployment
        if (!instance.MultiAZ) {
          findings.push({
            id: `rds-no-multiaz-${instance.DBInstanceIdentifier}`,
            name: 'RDS Instance without Multi-AZ',
            description: 'RDS instance is not configured for Multi-AZ deployment, which reduces high availability and resilience.',
            resource: instance.DBInstanceIdentifier,
            service: 'rds',
            severity: 'low',
            region,
            details: {
              engine: `${instance.Engine} ${instance.EngineVersion}`,
              availabilityZone: instance.AvailabilityZone
            }
          });
        }
        
        // Check for auto minor version upgrade
        if (!instance.AutoMinorVersionUpgrade) {
          findings.push({
            id: `rds-no-auto-minor-upgrade-${instance.DBInstanceIdentifier}`,
            name: 'RDS Instance without Auto Minor Version Upgrade',
            description: 'RDS instance is not configured to automatically apply minor version upgrades, which may delay security patches.',
            resource: instance.DBInstanceIdentifier,
            service: 'rds',
            severity: 'low',
            region,
            details: {
              engine: `${instance.Engine} ${instance.EngineVersion}`
            }
          });
        }
      }
      
      // Get RDS snapshots
      const { DBSnapshots } = await rds.describeDBSnapshots().promise();
      
      for (const snapshot of DBSnapshots || []) {
        // Check for public snapshots
        try {
          const { AttributeValues } = await rds.describeDBSnapshotAttributes({
            DBSnapshotIdentifier: snapshot.DBSnapshotIdentifier
          }).promise();
          
          if (AttributeValues && AttributeValues.includes('all')) {
            findings.push({
              id: `rds-public-snapshot-${snapshot.DBSnapshotIdentifier}`,
              name: 'Publicly Accessible RDS Snapshot',
              description: 'RDS snapshot is publicly accessible, which could expose sensitive data.',
              resource: snapshot.DBSnapshotIdentifier,
              service: 'rds',
              severity: 'critical',
              region,
              details: {
                engine: snapshot.Engine,
                snapshotType: snapshot.SnapshotType,
                snapshotCreateTime: snapshot.SnapshotCreateTime
              }
            });
          }
        } catch (snapshotError) {
          logger.debug(`Error checking snapshot attributes for ${snapshot.DBSnapshotIdentifier}: ${snapshotError.message}`);
        }
      }
      
      return findings;
    } catch (error) {
      logger.error(`Error scanning RDS resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      logger.info('AWS scan aborted');
    }
  }
}

module.exports = AWSScanner;
