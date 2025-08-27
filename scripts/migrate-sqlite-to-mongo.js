// migrate-sqlite-to-mongo.js
// This script migrates data from SQLite to MongoDB using Prisma

const { PrismaClient: SqlitePrisma } = require('@prisma/client');
const { PrismaClient: MongoPrisma } = require('@prisma/client');

// SQLite Prisma client (uses old .env config)
const sqlite = new SqlitePrisma({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
});

// MongoDB Prisma client (uses new .env config)
const mongo = new MongoPrisma();

async function migrateTable(tableName) {
  const records = await sqlite[tableName].findMany();
  for (const record of records) {
    // Remove id if present, let MongoDB generate _id
    const { id, ...data } = record;
    await mongo[tableName].create({ data });
  }
  console.log(`Migrated ${records.length} records from ${tableName}`);
}

async function main() {
  // List of tables to migrate (add/remove as needed)
  const tables = [
    'User',
    'Form',
    'FormQuestion',
    'Application',
    'ApplicationResponse',
    'FormDraft',
    'Account',
    'Session',
    'VerificationToken',
    'NewsletterSubscription',
    'TeamMember',
    'Project',
    'ProjectTeamMember',
    'ProjectFunding',
    'Event',
    'Company',
    'ProjectPartnership',
    'EventPartnership',
    'BlogPost',
    'SiteSettings',
    'HeroContent',
    'AboutContent',
    'JoinContent',
    'AuditLog',
    'MemberLevelsContent',
    'RecruitmentTimelineContent',
    'CoffeeChatSlot',
    'CoffeeChatSignup'
  ];

  for (const table of tables) {
    try {
      await migrateTable(table);
    } catch (err) {
      console.error(`Error migrating ${table}:`, err.message);
    }
  }

  await sqlite.$disconnect();
  await mongo.$disconnect();
  console.log('Migration complete.');
}

main();
