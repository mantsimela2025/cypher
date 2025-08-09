# AWS RDS Migration Instructions

## Prerequisites
- AWS RDS PostgreSQL instance up and running
- Database credentials with sufficient privileges
- Network connectivity to the RDS instance

## Step 1: Create the Database

Run the database creation script against the postgres database on your RDS instance:

```bash
psql -h <aws-rds-hostname> -U <admin-user> -d postgres -f create_database.sql
```

## Step 2: Apply the Schema

Run the schema script against your newly created database:

```bash
psql -h <aws-rds-hostname> -U <admin-user> -d RasDashDb -f schema_backup.sql
```

## Step 3: Import Data (Optional)

If you have a data backup file, run it against your database:

```bash
psql -h <aws-rds-hostname> -U <admin-user> -d RasDashDb -f data_backup.sql
```

## Important Notes

1. **Encryption Key**: Ensure your AWS environment has the same `ENCRYPTION_KEY` as your source environment to decrypt encrypted data properly.

2. **Data Size**: For large datasets, consider breaking the data import into smaller chunks or tables.

3. **Extensions**: Make sure any required PostgreSQL extensions are enabled in your RDS instance.

4. **Connection String Update**: Update your application's database connection string to point to the new AWS RDS instance.
