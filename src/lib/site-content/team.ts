import { MongoClient } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

export type TeamMember = {
  _id: string;
  id?: string;
  name: string;
  role: string;
  year: string;
  major?: string | null;
  bio?: string | null;
  email?: string | null;
  linkedIn?: string | null;
  github?: string | null;
  imageUrl?: string | null;
  featured: boolean;
  active: boolean;
  memberType?: string;
  project?: string | null;
  sortOrder?: number;
  joinDate?: Date;
};

export async function getActiveTeamMembers(): Promise<TeamMember[]> {
  const client = new MongoClient(uri, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });
  try {
    await client.connect();
    const db = client.db();
    const teamMembers = await db
      .collection('TeamMember')
      .find({ active: true })
      .sort({ featured: -1, sortOrder: 1, joinDate: 1 })
      .toArray();

    return teamMembers.map((member: any) => ({
      ...member,
      id: member._id ? member._id.toString() : member.id,
    }));
  } finally {
    await client.close();
  }
}
