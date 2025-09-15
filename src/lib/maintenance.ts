import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL!);

export async function getMaintenanceStatus() {
  try {
    await client.connect();
    const db = client.db();
    
    const maintenanceSetting = await db.collection('SiteSettings').findOne({ key: 'maintenance_mode' });
    const messageSetting = await db.collection('SiteSettings').findOne({ key: 'maintenance_message' });
    const exemptPathsSetting = await db.collection('SiteSettings').findOne({ key: 'maintenance_exempt_paths' });
    
    return {
      enabled: maintenanceSetting?.value === 'true',
      message: messageSetting?.value || 'We are currently performing scheduled maintenance. We\'ll be back online shortly.',
      exemptPaths: exemptPathsSetting?.value?.split(',').map((path: string) => path.trim()) || ['/admin', '/api/admin', '/auth']
    };
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    return {
      enabled: false,
      message: '',
      exemptPaths: ['/admin', '/api/admin', '/auth']
    };
  } finally {
    await client.close();
  }
}
