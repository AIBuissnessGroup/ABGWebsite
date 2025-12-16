import { MongoClient } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

export type HeroContent = {
  id: string;
  mainTitle: string;
  subTitle: string;
  thirdTitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const defaultHeroContent: HeroContent = {
  id: 'default-hero',
  mainTitle: 'AI SHAPES',
  subTitle: 'TOMORROW.',
  thirdTitle: 'WE MAKE AI',
  description:
    "One project at a time. We're building the bridge between artificial intelligence and real-world business impact at the University of Michigan.",
  primaryButtonText: "See What's Possible",
  primaryButtonLink: '#join',
  secondaryButtonText: 'Explore Projects',
  secondaryButtonLink: '/projects',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getHeroContent(): Promise<HeroContent> {
  const client = new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });
  try {
    await client.connect();
    const db = client.db();

    // Prefer explicitly authored hero content
    let heroContent = await db.collection('HeroContent').findOne({
      mainTitle: { $exists: true },
    });

    // Fallback to most recent active entry
    if (!heroContent) {
      heroContent = await db.collection('HeroContent').findOne({ isActive: true });
    }

    if (!heroContent) {
      await db.collection('HeroContent').insertOne(defaultHeroContent);
      heroContent = defaultHeroContent;
    }

    return heroContent as HeroContent;
  } finally {
    await client.close();
  }
}

export async function upsertHeroContent(data: Partial<HeroContent>) {
  const client = new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });
  try {
    await client.connect();
    const db = client.db();

    let existingHero = await db.collection('HeroContent').findOne({
      mainTitle: { $exists: true },
    });

    const updateData = {
      ...data,
      isActive: true,
      updatedAt: new Date(),
    };

    let heroContent;
    if (existingHero) {
      await db
        .collection('HeroContent')
        .updateOne({ _id: existingHero._id }, { $set: updateData });

      await db
        .collection('HeroContent')
        .updateMany({ _id: { $ne: existingHero._id } }, { $set: { isActive: false } });

      heroContent = await db.collection('HeroContent').findOne({ _id: existingHero._id });
    } else {
      const newContent = {
        ...updateData,
        createdAt: new Date(),
      };
      const insertResult = await db.collection('HeroContent').insertOne(newContent);

      await db
        .collection('HeroContent')
        .updateMany({ _id: { $ne: insertResult.insertedId } }, { $set: { isActive: false } });

      heroContent = newContent;
    }

    return heroContent;
  } finally {
    await client.close();
  }
}
