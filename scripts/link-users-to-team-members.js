/**
 * Link existing users to their team member profiles
 * Matches by email address and can also update team member profile images
 * 
 * Usage: node scripts/link-users-to-team-members.js [--dry-run] [--update-images]
 * 
 * Options:
 *   --dry-run       Show what would be linked without making changes
 *   --update-images Also update team member imageUrl from user's Google profile image
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UPDATE_IMAGES = args.includes('--update-images');

async function linkUsersToTeamMembers() {
  const client = new MongoClient(process.env.DATABASE_URL, {
    tls: true,
    tlsCAFile: process.env.NODE_ENV === 'production' ? '/app/global-bundle.pem' : undefined,
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production'
  });

  try {
    await client.connect();
    console.log('Connected to database');
    console.log(DRY_RUN ? '🔍 DRY RUN MODE - No changes will be made\n' : '');
    console.log(UPDATE_IMAGES ? '📸 Will update team member images from Google profiles\n' : '');

    const db = client.db();

    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users in the database\n`);

    // Get all team members
    const teamMembers = await db.collection('TeamMember').find({}).toArray();
    console.log(`Found ${teamMembers.length} team members in the database\n`);

    // Create a map of team members by email (lowercase for case-insensitive matching)
    const teamMembersByEmail = new Map();
    for (const tm of teamMembers) {
      if (tm.email) {
        teamMembersByEmail.set(tm.email.toLowerCase(), tm);
      }
    }

    let linkedCount = 0;
    let alreadyLinkedCount = 0;
    let noMatchCount = 0;
    let imageUpdatedCount = 0;

    console.log('=== LINKING RESULTS ===\n');

    for (const user of users) {
      const userEmail = user.email?.toLowerCase();
      
      if (!userEmail) {
        console.log(`⚠️  User ${user._id} has no email, skipping`);
        continue;
      }

      // Check if already linked
      if (user.teamMemberId) {
        alreadyLinkedCount++;
        console.log(`✓  ${user.email} - Already linked to team member`);
        
        // Even if linked, check if we should update the image
        if (UPDATE_IMAGES && user.image) {
          const teamMember = teamMembers.find(tm => tm._id.toString() === user.teamMemberId.toString());
          if (teamMember && !teamMember.imageUrl) {
            if (!DRY_RUN) {
              await db.collection('TeamMember').updateOne(
                { _id: teamMember._id },
                { $set: { imageUrl: user.image, updatedAt: new Date() } }
              );
            }
            imageUpdatedCount++;
            console.log(`   📸 Updated profile image for ${teamMember.name}`);
          }
        }
        continue;
      }

      // Try to find matching team member by email
      const teamMember = teamMembersByEmail.get(userEmail);

      if (teamMember) {
        linkedCount++;
        console.log(`🔗 ${user.email} -> ${teamMember.name} (${teamMember.role})`);

        if (!DRY_RUN) {
          // Link the user to the team member
          await db.collection('users').updateOne(
            { _id: user._id },
            { 
              $set: { 
                teamMemberId: teamMember._id.toString(),
                updatedAt: new Date()
              }
            }
          );

          // Optionally update the team member's image
          if (UPDATE_IMAGES && user.image && !teamMember.imageUrl) {
            await db.collection('TeamMember').updateOne(
              { _id: teamMember._id },
              { $set: { imageUrl: user.image, updatedAt: new Date() } }
            );
            imageUpdatedCount++;
            console.log(`   📸 Updated profile image for ${teamMember.name}`);
          }
        }
      } else {
        noMatchCount++;
        console.log(`❌ ${user.email} - No matching team member found`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Already linked: ${alreadyLinkedCount}`);
    console.log(`Newly linked: ${linkedCount}`);
    console.log(`No match found: ${noMatchCount}`);
    if (UPDATE_IMAGES) {
      console.log(`Images updated: ${imageUpdatedCount}`);
    }

    if (DRY_RUN) {
      console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Changes applied successfully!');
    }

    // Show unlinked team members (those without a user account)
    console.log('\n=== TEAM MEMBERS WITHOUT USER ACCOUNTS ===');
    const linkedEmails = new Set(users.filter(u => u.teamMemberId).map(u => u.email?.toLowerCase()));
    const userEmails = new Set(users.map(u => u.email?.toLowerCase()));
    
    for (const tm of teamMembers) {
      if (tm.email && !userEmails.has(tm.email.toLowerCase())) {
        console.log(`📋 ${tm.name} (${tm.email}) - No user account exists`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

linkUsersToTeamMembers().catch(console.error);
