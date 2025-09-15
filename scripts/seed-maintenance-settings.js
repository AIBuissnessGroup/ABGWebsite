const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.DATABASE_URL);

async function seedMaintenanceSettings() {
  try {
    await client.connect();
    const db = client.db();

    const settings = [
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable maintenance mode to show maintenance page to non-admin users',
        type: 'BOOLEAN'
      },
      {
        key: 'maintenance_message', 
        value: '',
        description: 'Custom maintenance message (optional)',
        type: 'TEXT'
      },
      {
        key: 'maintenance_exempt_paths',
        value: '/admin,/api/admin,/auth',
        description: 'Comma-separated paths that remain accessible during maintenance',
        type: 'TEXT'
      }
    ];

    for (const setting of settings) {
      await db.collection('SiteSettings').updateOne(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true }
      );
    }

    console.log('✅ Maintenance settings seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding maintenance settings:', error);
  } finally {
    await client.close();
  }
}

seedMaintenanceSettings();
