import { MongoClient } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

export type SiteSetting = {
  _id?: string;
  key: string;
  value: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getAllSiteSettings(): Promise<SiteSetting[]> {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    return await db.collection('SiteSettings').find({}).sort({ key: 1 }).toArray();
  } finally {
    await client.close();
  }
}

export async function upsertSiteSetting(key: string, value: string | number | boolean) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    const existingSetting = await db.collection('SiteSettings').findOne({ key });
    let setting;

    if (existingSetting) {
      await db
        .collection('SiteSettings')
        .updateOne({ key }, { $set: { value, updatedAt: new Date() } });
      setting = await db.collection('SiteSettings').findOne({ key });
    } else {
      const newSetting: SiteSetting = {
        key,
        value: value as string,
        type: 'TEXT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('SiteSettings').insertOne(newSetting);
      setting = newSetting;
    }

    return setting;
  } finally {
    await client.close();
  }
}
