# Root Directory File Organization Plan

## Current State
The root directory contains many files that should be organized into appropriate folders for better maintainability.

## Proposed Folder Structure

### 1. scripts/ - Utility and administrative scripts
- add-test-user.js (proxy)
- create-admin-user.js (proxy)
- hash-password.js (proxy)
- reset-test-user-password.js (proxy)
- cve-data-importer.js (proxy)
- debug-asset-groups.js (proxy)
- debug-categories.js (proxy)
- debug-categories.mjs

### 2. config/ - Configuration files
- .env.example (keep .env in root)
- drizzle.config.ts
- postcss.config.js
- tailwind.config.ts
- tsconfig.json
- theme.json
- vite.config.ts

### 3. database/ - Database-related files
- create-report-tables.sql
- create-ssp-ato-tables.sql
- complete_dump.sql
- database_backup.sql
- database_schema.sql
- database_schema_updated.sql
- data.sql
- modified_dump.sql
- schema.sql
- update-assets-table.sql

### 4. logs/ - Log files
- audit.log
- combined.log
- error.log
- output.json

### 5. docs/ - Documentation files
- README.md (keep a copy in root)
- generated-icon.png

### 6. scripts/utils/ - Organization scripts (one-time use)
- fix-individual-migration.sh
- fix-migration-files.sh
- fix_schema_imports.sh
- fix-test-proxies.sh
- move-all-migrations.sh
- move-remaining-migrations.sh
- move-root-migrations.sh
- move-test-files.sh
- move-utility-scripts.sh
- organize-migration-proxies.sh

### Repl configuration files (keep in root)
- .replit
- replit.nix
- .gitignore
- package.json
- package-lock.json

### Temporary files (consider deleting if not needed)
- cookies.txt
- temp_head.txt
- temp-package.json

## Implementation Approach

1. Create all necessary directories
2. Move script files first, creating proper proxy files as needed
3. Move configuration files 
4. Move database files
5. Move log files
6. Move organization scripts last
7. Update any references as needed

This organization will make the codebase much more maintainable while preserving backward compatibility through proxy files where needed.