import { getDb } from '../mongodb';

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
  const db = await getDb();
  const teamMembers = await db
    .collection('TeamMember')
    .find({ active: true })
    .sort({ featured: -1, sortOrder: 1, joinDate: 1 })
    .toArray();

  return teamMembers.map((member: any) => ({
    ...member,
    id: member._id ? member._id.toString() : member.id,
  }));
}
