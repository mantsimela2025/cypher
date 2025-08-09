const { db } = require('../src/db');
const { systems } = require('../src/db/schema');
const { v4: uuidv4 } = require('uuid');

async function createSystems() {
  try {
    console.log('🏢 Creating Systems Data...\n');
    
    // Define the systems that match the asset seeder system IDs
    const systemsToCreate = [
      {
        systemId: 'SYS-001',
        name: 'Corporate Network Infrastructure',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Infrastructure',
        responsibleOrganization: 'IT Department',
        systemOwner: 'John Smith',
        informationSystemSecurityOfficer: 'Jane Doe',
        authorizingOfficial: 'Mike Johnson',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'high',
        description: 'Core network infrastructure including servers, switches, routers, and network services'
      },
      {
        systemId: 'SYS-002',
        name: 'Web Application Platform',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Application',
        responsibleOrganization: 'Development Team',
        systemOwner: 'Sarah Wilson',
        informationSystemSecurityOfficer: 'Jane Doe',
        authorizingOfficial: 'Mike Johnson',
        confidentialityImpact: 'high',
        integrityImpact: 'high',
        availabilityImpact: 'moderate',
        description: 'Web applications, application servers, and related web services'
      },
      {
        systemId: 'SYS-003',
        name: 'Database Management System',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Database',
        responsibleOrganization: 'Data Team',
        systemOwner: 'Bob Anderson',
        informationSystemSecurityOfficer: 'Jane Doe',
        authorizingOfficial: 'Mike Johnson',
        confidentialityImpact: 'high',
        integrityImpact: 'high',
        availabilityImpact: 'high',
        description: 'Database servers and data management systems'
      },
      {
        systemId: 'SYS-004',
        name: 'Employee Workstation Environment',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Workstation',
        responsibleOrganization: 'IT Department',
        systemOwner: 'John Smith',
        informationSystemSecurityOfficer: 'Jane Doe',
        authorizingOfficial: 'Mike Johnson',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'moderate',
        description: 'Employee workstations, laptops, and end-user computing devices'
      },
      {
        systemId: 'SYS-005',
        name: 'Cloud Services Platform',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Cloud',
        responsibleOrganization: 'Cloud Team',
        systemOwner: 'Lisa Chen',
        informationSystemSecurityOfficer: 'Jane Doe',
        authorizingOfficial: 'Mike Johnson',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'moderate',
        description: 'Cloud-based resources, virtual machines, and cloud services'
      }
    ];
    
    // Clear existing systems first
    console.log('🗑️ Clearing existing systems...');
    try {
      await db.delete(systems);
      console.log('✅ Existing systems cleared\n');
    } catch (error) {
      console.log('⚠️ No existing systems to clear or table empty\n');
    }
    
    // Create new systems
    console.log('📝 Creating systems...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const system of systemsToCreate) {
      try {
        await db.insert(systems).values(system);
        console.log(`✅ Created: ${system.systemId} - ${system.name}`);
        console.log(`   Type: ${system.systemType}`);
        console.log(`   Owner: ${system.systemOwner}`);
        console.log(`   Organization: ${system.responsibleOrganization}`);
        console.log(`   Impact: C-${system.confidentialityImpact}, I-${system.integrityImpact}, A-${system.availabilityImpact}\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create ${system.systemId}: ${error.message}\n`);
        errorCount++;
      }
    }
    
    // Summary
    console.log('🎉 Systems creation completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Successfully created: ${successCount} systems`);
    console.log(`   ❌ Failed: ${errorCount} systems`);
    console.log(`   📋 Total systems: ${successCount} systems ready for asset association`);
    
    // Verify systems were created
    console.log('\n🔍 Verifying systems in database...');
    const createdSystems = await db.select().from(systems);
    console.log(`📊 Found ${createdSystems.length} systems in database:`);
    
    createdSystems.forEach((system, index) => {
      console.log(`   ${index + 1}. ${system.systemId}: ${system.name}`);
    });
    
    if (createdSystems.length === systemsToCreate.length) {
      console.log('\n✅ All systems successfully created and verified!');
      console.log('🚀 Ready to run asset seeder with system associations.');
    } else {
      console.log('\n⚠️ Some systems may not have been created properly.');
    }
    
  } catch (error) {
    console.error('❌ Error creating systems:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the systems creator
createSystems();
