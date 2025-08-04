const { db } = require('../src/db');
const { assets, assetNetwork, assetSystems } = require('../src/db/schema');
const { sql } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

// Sample data arrays for realistic asset generation
const hostnames = [
  'web-server-01', 'web-server-02', 'web-server-03', 'app-server-01', 'app-server-02',
  'db-server-01', 'db-server-02', 'db-server-03', 'mail-server-01', 'mail-server-02',
  'file-server-01', 'file-server-02', 'dns-server-01', 'dns-server-02', 'dhcp-server-01',
  'backup-server-01', 'backup-server-02', 'proxy-server-01', 'proxy-server-02', 'fw-01',
  'fw-02', 'sw-core-01', 'sw-core-02', 'sw-access-01', 'sw-access-02', 'sw-access-03',
  'workstation-001', 'workstation-002', 'workstation-003', 'workstation-004', 'workstation-005',
  'laptop-001', 'laptop-002', 'laptop-003', 'laptop-004', 'laptop-005', 'laptop-006',
  'printer-001', 'printer-002', 'printer-003', 'scanner-001', 'scanner-002',
  'cloud-vm-001', 'cloud-vm-002', 'cloud-vm-003', 'cloud-vm-004', 'cloud-vm-005',
  'docker-host-01', 'docker-host-02', 'k8s-master-01', 'k8s-worker-01', 'k8s-worker-02',
  'jenkins-01', 'gitlab-01', 'nexus-01', 'sonar-01', 'elastic-01', 'kibana-01',
  'redis-01', 'mongo-01', 'postgres-01', 'mysql-01', 'oracle-01', 'mssql-01',
  'nginx-01', 'apache-01', 'tomcat-01', 'iis-01', 'node-app-01', 'python-app-01',
  'domain-controller-01', 'domain-controller-02', 'exchange-01', 'sharepoint-01',
  'citrix-01', 'vmware-vcenter-01', 'vmware-esxi-01', 'vmware-esxi-02', 'vmware-esxi-03',
  'storage-nas-01', 'storage-san-01', 'ups-01', 'ups-02', 'camera-001', 'camera-002'
];

const operatingSystems = [
  'Windows Server 2019', 'Windows Server 2022', 'Windows Server 2016',
  'Windows 10 Enterprise', 'Windows 11 Pro', 'Windows 10 Pro',
  'Ubuntu 20.04 LTS', 'Ubuntu 22.04 LTS', 'Ubuntu 18.04 LTS',
  'CentOS 7', 'CentOS 8', 'Red Hat Enterprise Linux 8', 'Red Hat Enterprise Linux 9',
  'Debian 11', 'Debian 10', 'SUSE Linux Enterprise Server 15',
  'macOS Monterey', 'macOS Ventura', 'macOS Big Sur',
  'VMware ESXi 7.0', 'VMware ESXi 6.7', 'Citrix XenServer',
  'FreeBSD 13', 'OpenBSD 7.1', 'Solaris 11'
];

const systemTypes = ['server', 'workstation', 'host', 'cloud', 'web_application', 'domain'];

const networkNames = ['Corporate Network', 'DMZ Network', 'Guest Network', 'Management Network', 'Production Network', 'Development Network'];

const tenableSystemTypes = ['general-purpose', 'server', 'workstation', 'network-device', 'mobile-device', 'embedded-device'];

const criticalityRatings = ['critical', 'high', 'medium', 'low'];

const systemIds = ['SYS-001', 'SYS-002', 'SYS-003', 'SYS-004', 'SYS-005'];

const ipRanges = [
  '192.168.1.', '192.168.10.', '192.168.20.', '192.168.100.',
  '10.0.1.', '10.0.10.', '10.1.1.', '10.2.1.',
  '172.16.1.', '172.16.10.', '172.17.1.', '172.18.1.'
];

const domains = [
  'corp.local', 'company.com', 'internal.local', 'domain.local',
  'enterprise.local', 'organization.com', 'business.local'
];

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateIPAddress() {
  const range = getRandomItem(ipRanges);
  const lastOctet = getRandomNumber(10, 254);
  return range + lastOctet;
}

function generateMacAddress() {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hex[Math.floor(Math.random() * 16)];
    mac += hex[Math.floor(Math.random() * 16)];
  }
  return mac;
}

function generateFQDN(hostname) {
  const domain = getRandomItem(domains);
  return `${hostname}.${domain}`;
}

function generateExposureScore() {
  // Weighted distribution: 40% low, 30% medium, 20% high, 10% critical
  const rand = Math.random();
  if (rand < 0.4) return getRandomNumber(0, 299);      // Low
  if (rand < 0.7) return getRandomNumber(300, 499);    // Medium
  if (rand < 0.9) return getRandomNumber(500, 699);    // High
  return getRandomNumber(700, 1000);                   // Critical
}

function generateACRScore() {
  return (Math.random() * 9 + 1).toFixed(1);
}

function generateDate(daysAgo) {
  const now = new Date();
  return new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
}

function generateNetbiosName(hostname) {
  // NetBIOS names are typically uppercase and max 15 characters
  return hostname.toUpperCase().substring(0, 15);
}

async function seedTenableAssets() {
  try {
    console.log('🌱 Starting Tenable asset seeding...');

    // Ensure systems exist first
    console.log('🏢 Checking and creating systems...');
    const { systems } = require('../src/db/schema');

    const requiredSystems = [
      {
        systemId: 'SYS-001',
        name: 'Corporate Network Infrastructure',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Infrastructure',
        responsibleOrganization: 'IT Department',
        systemOwner: 'John Smith',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'high'
      },
      {
        systemId: 'SYS-002',
        name: 'Web Application Platform',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Application',
        responsibleOrganization: 'Development Team',
        systemOwner: 'Sarah Wilson',
        confidentialityImpact: 'high',
        integrityImpact: 'high',
        availabilityImpact: 'moderate'
      },
      {
        systemId: 'SYS-003',
        name: 'Database Management System',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Database',
        responsibleOrganization: 'Data Team',
        systemOwner: 'Bob Anderson',
        confidentialityImpact: 'high',
        integrityImpact: 'high',
        availabilityImpact: 'high'
      },
      {
        systemId: 'SYS-004',
        name: 'Employee Workstation Environment',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Workstation',
        responsibleOrganization: 'IT Department',
        systemOwner: 'John Smith',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'moderate'
      },
      {
        systemId: 'SYS-005',
        name: 'Cloud Services Platform',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Cloud',
        responsibleOrganization: 'Cloud Team',
        systemOwner: 'Lisa Chen',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'moderate'
      }
    ];

    // First, check if systems table exists and clear it
    try {
      await db.delete(systems);
      console.log('🗑️ Cleared existing systems data...');
    } catch (error) {
      console.log('⚠️ Systems table might be empty or not exist yet...');
    }

    // Create all required systems using raw SQL to match exact schema
    let systemsCreated = 0;
    for (const system of requiredSystems) {
      try {
        await db.execute(sql`
          INSERT INTO systems (
            system_id,
            name,
            uuid,
            status,
            authorization_boundary,
            system_type,
            responsible_organization,
            system_owner,
            information_system_security_officer,
            authorizing_official,
            last_assessment_date,
            authorization_date,
            authorization_termination_date,
            created_at,
            updated_at,
            source,
            batch_id,
            raw_json,
            confidentiality_impact,
            integrity_impact,
            availability_impact
          ) VALUES (
            ${system.systemId},
            ${system.name},
            ${system.uuid},
            ${system.status},
            ${system.systemType + ' Boundary'},
            ${system.systemType},
            ${system.responsibleOrganization},
            ${system.systemOwner},
            'Jane Doe',
            'Mike Johnson',
            ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)},
            ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)},
            ${new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            'xacta',
            ${uuidv4()},
            ${JSON.stringify({
              system_id: system.systemId,
              name: system.name,
              type: system.systemType,
              owner: system.systemOwner,
              organization: system.responsibleOrganization
            })},
            ${system.confidentialityImpact},
            ${system.integrityImpact},
            ${system.availabilityImpact}
          )
        `);
        console.log(`✅ Created system: ${system.systemId} - ${system.name}`);
        systemsCreated++;
      } catch (error) {
        console.error(`❌ Error creating system ${system.systemId}:`, error.message);
        // Continue with other systems even if one fails
      }
    }

    console.log(`📊 Successfully created ${systemsCreated}/${requiredSystems.length} systems\n`);

    // Clear existing assets first
    console.log('🗑️ Clearing existing asset data...');
    await db.delete(assetSystems);
    await db.delete(assetNetwork);
    await db.delete(assets);
    
    console.log('📊 Creating 50 comprehensive Tenable assets...');

    const assetsToCreate = [];
    const networkToCreate = [];
    const systemsToCreate = [];

    for (let i = 0; i < 50; i++) {
      const hostname = hostnames[i % hostnames.length] + (i > hostnames.length - 1 ? `-${Math.floor(i / hostnames.length) + 1}` : '');
      const assetUuid = uuidv4();
      const exposureScore = generateExposureScore();
      const acrScore = generateACRScore();
      const lastSeenDays = getRandomNumber(0, 30);
      const firstSeenDays = lastSeenDays + getRandomNumber(1, 365);
      const hasAgent = Math.random() > 0.25; // 75% have agents
      const hasPluginResults = Math.random() > 0.15; // 85% have plugin results
      const ipAddress = generateIPAddress();
      const macAddress = generateMacAddress();
      const fqdn = generateFQDN(hostname);
      const operatingSystem = getRandomItem(operatingSystems);
      const systemType = getRandomItem(systemTypes);
      const tenableSystemType = getRandomItem(tenableSystemTypes);
      const networkName = getRandomItem(networkNames);
      const netbiosName = generateNetbiosName(hostname);

      // Determine criticality based on exposure score
      let criticalityRating;
      if (exposureScore >= 700) criticalityRating = 'critical';
      else if (exposureScore >= 500) criticalityRating = 'high';
      else if (exposureScore >= 300) criticalityRating = 'medium';
      else criticalityRating = 'low';
      
      // Create asset record
      const asset = {
        assetUuid,
        hostname,
        netbiosName,
        systemId: getRandomItem(systemIds),
        hasAgent,
        hasPluginResults,
        firstSeen: generateDate(firstSeenDays),
        lastSeen: generateDate(lastSeenDays),
        exposureScore,
        acrScore,
        criticalityRating,
        source: 'tenable',
        batchId: uuidv4(),
        rawJson: {
          acr_score: parseFloat(acrScore),
          agent_uuid: [],
          aws_availability_zone: null,
          aws_ec2_instance_ami_id: null,
          aws_ec2_instance_id: null,
          aws_owner_id: null,
          aws_region: null,
          criticality_rating: criticalityRating,
          exposure_score: exposureScore,
          first_scan_time: generateDate(firstSeenDays).toISOString(),
          first_seen: generateDate(firstSeenDays).toISOString(),
          fqdn: [fqdn],
          has_agent: hasAgent,
          hostname: [hostname],
          id: assetUuid,
          indexed: new Date().toISOString(),
          ipv4: [ipAddress],
          ipv6: [],
          last_authenticated_scan_date: generateDate(getRandomNumber(0, 7)).toISOString(),
          last_scan_time: generateDate(getRandomNumber(0, 3)).toISOString(),
          last_seen: generateDate(lastSeenDays).toISOString(),
          mac_address: [macAddress],
          netbios_name: netbiosName,
          network_id: uuidv4(),
          network_name: networkName,
          operating_system: [operatingSystem],
          system_type: [tenableSystemType]
        }
      };
      
      assetsToCreate.push(asset);
      
      // Create network record
      const network = {
        assetUuid,
        fqdn,
        ipv4Address: ipAddress, // This should work now with proper handling
        macAddress,
        networkType: 'ethernet',
        isPrimary: true
      };

      networkToCreate.push(network);

      // Create system record
      const system = {
        assetUuid,
        operatingSystem,
        systemType,
        isPrimary: true
      };
      
      systemsToCreate.push(system);
    }
    
    // Insert all data using raw SQL to match exact schema
    console.log('💾 Inserting assets...');

    for (const asset of assetsToCreate) {
      try {
        await db.execute(sql`
          INSERT INTO assets (
            asset_uuid,
            hostname,
            netbios_name,
            system_id,
            has_agent,
            has_plugin_results,
            first_seen,
            last_seen,
            exposure_score,
            acr_score,
            criticality_rating,
            created_at,
            updated_at,
            source,
            batch_id,
            raw_json
          ) VALUES (
            ${asset.assetUuid},
            ${asset.hostname},
            ${asset.netbiosName},
            ${asset.systemId},
            ${asset.hasAgent},
            ${asset.hasPluginResults},
            ${asset.firstSeen},
            ${asset.lastSeen},
            ${asset.exposureScore},
            ${asset.acrScore},
            ${asset.criticalityRating},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            'tenable',
            ${asset.batchId},
            ${JSON.stringify(asset.rawJson)}
          )
        `);
      } catch (error) {
        console.error(`Error inserting asset ${asset.hostname}:`, error.message);
      }
    }

    console.log('🌐 Inserting network data...');
    // Insert network data using raw SQL to handle inet type properly
    for (const network of networkToCreate) {
      try {
        await db.execute(sql`
          INSERT INTO asset_network (asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary)
          VALUES (${network.assetUuid}, ${network.fqdn}, ${network.ipv4Address}::inet, ${network.macAddress}, ${network.networkType}, ${network.isPrimary})
        `);
      } catch (error) {
        console.error(`Error inserting network for ${network.assetUuid}:`, error.message);
      }
    }

    console.log('💻 Inserting system data...');
    await db.insert(assetSystems).values(systemsToCreate);
    
    // Generate statistics
    const totalAssets = assetsToCreate.length;
    const criticalAssets = assetsToCreate.filter(a => a.criticalityRating === 'critical').length;
    const highAssets = assetsToCreate.filter(a => a.criticalityRating === 'high').length;
    const mediumAssets = assetsToCreate.filter(a => a.criticalityRating === 'medium').length;
    const lowAssets = assetsToCreate.filter(a => a.criticalityRating === 'low').length;
    const withAgent = assetsToCreate.filter(a => a.hasAgent).length;
    const withPlugins = assetsToCreate.filter(a => a.hasPluginResults).length;
    
    console.log('\n🎉 Tenable asset seeding completed successfully!');
    console.log('📊 Statistics:');
    console.log(`   Total Assets: ${totalAssets}`);
    console.log(`   Critical: ${criticalAssets} (${((criticalAssets/totalAssets)*100).toFixed(1)}%)`);
    console.log(`   High: ${highAssets} (${((highAssets/totalAssets)*100).toFixed(1)}%)`);
    console.log(`   Medium: ${mediumAssets} (${((mediumAssets/totalAssets)*100).toFixed(1)}%)`);
    console.log(`   Low: ${lowAssets} (${((lowAssets/totalAssets)*100).toFixed(1)}%)`);
    console.log(`   With Agent: ${withAgent} (${((withAgent/totalAssets)*100).toFixed(1)}%)`);
    console.log(`   With Plugin Results: ${withPlugins} (${((withPlugins/totalAssets)*100).toFixed(1)}%)`);
    console.log(`   Network Records: ${networkToCreate.length}`);
    console.log(`   System Records: ${systemsToCreate.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding Tenable assets:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedTenableAssets();
