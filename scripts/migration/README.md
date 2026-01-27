# GPS Dental Training - WordPress Migration Scripts

Scripts to migrate data from WordPress/WooCommerce to the new headless stack (Supabase + Strapi + Clerk).

## Prerequisites

### 1. Environment Variables

Create a `.env` file in the project root with:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WordPress Database (read-only access is sufficient)
WP_DB_HOST=localhost
WP_DB_PORT=3306
WP_DB_USER=wordpress_reader
WP_DB_PASSWORD=your-password
WP_DB_NAME=gpsdentaltraining
WP_TABLE_PREFIX=wp_

# Strapi (for content migration)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token

# Clerk (for user migration)
CLERK_SECRET_KEY=sk_test_...
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Migration Settings (optional)
MIGRATION_DRY_RUN=false
MIGRATION_LOG_LEVEL=info
```

### 2. Install Dependencies

```bash
# From project root
npm install mysql2 @clerk/clerk-sdk-node
```

### 3. Database Access

Ensure you have read access to the WordPress database. For production, use a read replica or take a backup.

## Migration Order

The migration must run in this order due to data dependencies:

1. **Users** - Creates user records in Clerk and Supabase
2. **Events** - Migrates courses, speakers, ticket types
3. **Seminars** - Migrates monthly seminars and sessions
4. **Orders** - Migrates WooCommerce orders and GPS tickets
5. **Credits** - Migrates CE ledger, certificates, waitlist

## Usage

### Full Migration (Recommended Flow)

```bash
# Step 1: Dry run to export and review data
npx tsx scripts/migration/run-migration.ts --dry-run

# Step 2: Review exported files in scripts/migration/output/

# Step 3: Run actual migration
npx tsx scripts/migration/run-migration.ts
```

### Run Individual Steps

```bash
# Migrate only users
npx tsx scripts/migration/migrate-users.ts

# Migrate only events (requires users first)
npx tsx scripts/migration/migrate-events.ts

# Migrate only seminars
npx tsx scripts/migration/migrate-seminars.ts

# Migrate only orders
npx tsx scripts/migration/migrate-orders.ts

# Migrate only credits/certificates
npx tsx scripts/migration/migrate-credits.ts
```

### Continue from a Step

```bash
# If migration failed at orders, continue from there
npx tsx scripts/migration/run-migration.ts --from=orders
```

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Export data without making changes |
| `--step=<name>` | Run only a specific step |
| `--from=<name>` | Start from a specific step |
| `--export-only` | Export data for review (users only) |
| `--help` | Show help |

## Output Files

After migration, find reports in `scripts/migration/output/`:

- `id-mappings.json` - WordPress ID to Supabase ID mappings
- `migration-report-*.json` - Detailed migration results
- `users-review.csv` - User data for review
- `clerk-import.json` - Clerk bulk import format
- `events-export.json` - Event data export
- `seminars-export.json` - Seminar data export
- `orders-export.json` - Order data export

## Data Mapping

### Users
| WordPress | Supabase | Clerk |
|-----------|----------|-------|
| wp_users.ID | users.id | user.externalId |
| wp_users.user_email | users.email | user.emailAddresses |
| wp_usermeta.first_name | users.first_name | user.firstName |
| wp_usermeta.last_name | users.last_name | user.lastName |
| wp_capabilities | users.role | user.publicMetadata.role |

### Events
| WordPress | Supabase | Strapi |
|-----------|----------|--------|
| gps_event.ID | events.id | events.id |
| gps_event.post_title | events.title | title |
| _gps_start_date | events.start_date | startDate |
| _gps_ce_credits | events.ce_credits | ceCredits |
| _gps_speaker_ids | event_speakers | speakers (relation) |

### Tickets
| WordPress | Supabase |
|-----------|----------|
| gps_ticket.ID | ticket_types.id |
| wp_gps_tickets.ticket_code | tickets.ticket_code |
| wp_gps_tickets.attendee_name | tickets.attendee_name |

## Troubleshooting

### Connection Issues

```bash
# Test WordPress database connection
mysql -h $WP_DB_HOST -u $WP_DB_USER -p$WP_DB_PASSWORD $WP_DB_NAME -e "SELECT COUNT(*) FROM wp_users"
```

### Missing ID Mappings

If migration fails mid-way, ID mappings are saved incrementally. Use `--from=<step>` to continue.

### Clerk Rate Limits

If creating many users, you may hit Clerk rate limits. The script includes delays, but you may need to:
- Use `--export-only` to generate `clerk-import.json`
- Import users via Clerk dashboard bulk import
- Then continue migration with `--from=events`

### Large Orders Table

For large order volumes, use the `--since` flag:

```bash
npx tsx scripts/migration/migrate-orders.ts --since=2024-01-01
```

## Post-Migration Verification

After migration, verify:

1. **User counts match**
   ```sql
   -- WordPress
   SELECT COUNT(*) FROM wp_users;
   -- Supabase
   SELECT COUNT(*) FROM users;
   ```

2. **Event counts match**
   ```sql
   -- WordPress
   SELECT COUNT(*) FROM wp_posts WHERE post_type = 'gps_event';
   -- Supabase
   SELECT COUNT(*) FROM events;
   ```

3. **Ticket codes preserved**
   ```sql
   SELECT ticket_code FROM tickets LIMIT 10;
   ```

4. **CE credits totals**
   ```sql
   SELECT user_id, SUM(credits) FROM ce_ledger GROUP BY user_id;
   ```

## Recovery

If you need to start over:

```sql
-- WARNING: This deletes all migrated data!
-- Run in Supabase SQL editor

TRUNCATE TABLE seminar_attendance CASCADE;
TRUNCATE TABLE seminar_registrations CASCADE;
TRUNCATE TABLE seminar_sessions CASCADE;
TRUNCATE TABLE seminars CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE waitlist CASCADE;
TRUNCATE TABLE certificates CASCADE;
TRUNCATE TABLE ce_ledger CASCADE;
TRUNCATE TABLE event_speakers CASCADE;
TRUNCATE TABLE ticket_types CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE speakers CASCADE;
TRUNCATE TABLE user_migration_map CASCADE;
TRUNCATE TABLE users CASCADE;
```

Then delete `scripts/migration/output/id-mappings.json` and run migration again.
