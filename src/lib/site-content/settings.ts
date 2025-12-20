import { MongoClient } from 'mongodb';
import { mongoUri, createMongoClient } from '../mongodb';

const uri = mongoUri;

export type SiteSetting = {
  _id?: string;
  key: string;
  value: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getAllSiteSettings(): Promise<SiteSetting[]> {
  const client = createMongoClient();
  try {
    await client.connect();
    const db = client.db();
    return await db.collection('SiteSettings').find({}).sort({ key: 1 }).toArray();
  } finally {
    await client.close();
  }
}

export async function upsertSiteSetting(key: string, value: string | number | boolean) {
  const client = createMongoClient();
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
