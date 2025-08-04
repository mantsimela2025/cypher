#!/usr/bin/env node

const { db, client } = require('../src/db');
const { users, userRoles } = require('../src/db/schema');
const { eq, and, inArray } = require('drizzle-orm');

async function findDuplicates(tableName = 'users', fields = ['email', 'username']) {
  console.log(`🔍 Finding duplicates in table: ${tableName}`);
  console.log(`📋 Checking fields: ${fields.join(', ')}`);
  console.log('');

  const duplicates = {};

  for (const field of fields) {
    console.log(`  🔎 Checking ${field} duplicates...`);

    try {
      const result = await client`
        SELECT ${client(field)}, COUNT(*) as count, ARRAY_AGG(id ORDER BY created_at) as ids
        FROM ${client(tableName)}
        WHERE ${client(field)} IS NOT NULL AND ${client(field)} != ''
        GROUP BY ${client(field)}
        HAVING COUNT(*) > 1
        ORDER BY ${client(field)}
      `;

      duplicates[field] = result;
      console.log(`    📊 Found ${result.length} ${field} duplicate groups`);
    } catch (error) {
      console.log(`    ❌ Error checking ${field}: ${error.message}`);
      duplicates[field] = [];
    }
  }

  return duplicates;
}

async function showDuplicates(tableName = 'users', fields = ['email', 'username']) {
  const duplicates = await findDuplicates(tableName, fields);

  console.log(`\n📊 Duplicate Analysis for table: ${tableName.toUpperCase()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const [field, fieldDuplicates] of Object.entries(duplicates)) {
    const icon = field === 'email' ? '📧' : field === 'username' ? '👤' : '🔍';
    console.log(`\n${icon} ${field.toUpperCase()} Duplicates:`);

    if (fieldDuplicates.length === 0) {
      console.log(`  ✅ No ${field} duplicates found`);
    } else {
      const tableData = fieldDuplicates.map(dup => {
        const obj = {};
        obj[field] = dup[field];
        obj.count = dup.count;
        obj.record_ids = dup.ids.join(', ');
        return obj;
      });
      console.table(tableData);
    }
  }

  return duplicates;
}

async function removeDuplicates(options = {}, tableName = 'users', fields = ['email', 'username']) {
  const duplicates = await findDuplicates(tableName, fields);

  // Check if any duplicates exist
  const totalDuplicateGroups = Object.values(duplicates).reduce((sum, fieldDups) => sum + fieldDups.length, 0);

  if (totalDuplicateGroups === 0) {
    console.log('✅ No duplicates found to remove');
    return;
  }

  console.log(`\n🧹 Removing duplicates from table: ${tableName}...`);

  let totalRemoved = 0;
  const allDuplicateIds = new Set();

  // Process duplicates for each field
  for (const [field, fieldDuplicates] of Object.entries(duplicates)) {
    if (fieldDuplicates.length === 0) continue;

    const icon = field === 'email' ? '📧' : field === 'username' ? '👤' : '🔍';
    console.log(`\n${icon} Processing ${field} duplicates:`);

    for (const duplicate of fieldDuplicates) {
      const ids = duplicate.ids;
      const keepId = ids[0]; // Keep the oldest (first created)
      const removeIds = ids.slice(1).filter(id => !allDuplicateIds.has(id)); // Don't double-remove

      if (removeIds.length > 0) {
        console.log(`\n  ${field}: ${duplicate[field]}`);
        console.log(`    🔒 Keeping record ID: ${keepId} (oldest)`);
        console.log(`    🗑️  Removing record IDs: ${removeIds.join(', ')}`);

        removeIds.forEach(id => allDuplicateIds.add(id));
      }
    }
  }

  const idsToRemove = Array.from(allDuplicateIds);

  if (idsToRemove.length === 0) {
    console.log('✅ No additional duplicates to remove');
    return;
  }

  console.log(`\n📊 Total records to remove from ${tableName}: ${idsToRemove.length}`);

  if (!options.dryRun) {
    try {
      // First, remove user_roles entries for these users
      console.log('🔗 Removing user role assignments...');
      const removedRoles = await db
        .delete(userRoles)
        .where(inArray(userRoles.userId, idsToRemove))
        .returning({ userId: userRoles.userId });
      
      console.log(`  ✅ Removed ${removedRoles.length} role assignments`);

      // Then remove the records (currently only supports users table)
      if (tableName === 'users') {
        console.log('👤 Removing duplicate users...');
        const removedUsers = await db
          .delete(users)
          .where(inArray(users.id, idsToRemove))
          .returning({ id: users.id, email: users.email, username: users.username });

        console.log(`  ✅ Removed ${removedUsers.length} users`);

        if (options.verbose) {
          console.log('\n🗑️  Removed users:');
          console.table(removedUsers);
        }

        totalRemoved = removedUsers.length;
      } else {
        console.log(`❌ Removal not yet supported for table: ${tableName}`);
        console.log('Currently only supports: users');
        return 0;
      }

      
    } catch (error) {
      console.error('❌ Error removing duplicates:', error);
      throw error;
    }
  } else {
    console.log('\n🔍 DRY RUN - No changes made');
    console.log(`Would remove ${idsToRemove.length} duplicate records from ${tableName}`);
  }

  return totalRemoved;
}

async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h'),
    show: args.includes('--show') || args.includes('-s'),
  };

  if (options.help) {
    console.log('🧹 Duplicate User Remover');
    console.log('');
    console.log('Usage: npm run db:remove-duplicates [options]');
    console.log('');
    console.log('Options:');
    console.log('  --show, -s        - Only show duplicates, don\'t remove');
    console.log('  --dry-run, -d     - Show what would be removed without actually removing');
    console.log('  --verbose, -v     - Show detailed output');
    console.log('  --help, -h        - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run db:remove-duplicates --show');
    console.log('  npm run db:remove-duplicates --dry-run');
    console.log('  npm run db:remove-duplicates --verbose');
    console.log('');
    console.log('⚠️  This will keep the OLDEST user for each duplicate group');
    console.log('⚠️  Make sure to backup your database before running!');
    return;
  }

  try {
    console.log('🧹 Duplicate User Removal Tool');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Configuration - you can modify these
    const tableName = 'users';
    const fieldsToCheck = ['email', 'username'];

    console.log(`🎯 Target: Table '${tableName}', Fields: [${fieldsToCheck.join(', ')}]`);
    console.log('');

    if (options.show) {
      await showDuplicates(tableName, fieldsToCheck);
    } else {
      // Show duplicates first
      const duplicates = await showDuplicates(tableName, fieldsToCheck);

      // Check if any duplicates exist
      const totalDuplicateGroups = Object.values(duplicates).reduce((sum, fieldDups) => sum + fieldDups.length, 0);

      if (totalDuplicateGroups > 0) {
        console.log('\n⚠️  Found duplicates! Proceeding with removal...');

        if (options.dryRun) {
          console.log('🔍 DRY RUN MODE - No actual changes will be made');
        }

        const removed = await removeDuplicates(options, tableName, fieldsToCheck);

        if (!options.dryRun && removed > 0) {
          console.log('\n✅ Duplicate removal completed successfully!');
          console.log(`📊 Total records removed: ${removed}`);
          console.log(`\n💡 Run "npm run db:query ${tableName}" to verify results`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Duplicate removal failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the script
main();
