import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { isAdminEmail } from './admin';

const isProduction = process.env.NODE_ENV === 'production';

// Check if connection string already has TLS/SSL settings
const connectionString = process.env.DATABASE_URL || '';
const hasTlsInConnectionString = /[?&](tls|ssl)=/.test(connectionString);

// MongoDB connection options
// - In production: use the CA certificate file for proper TLS verification
// - In development with SSL in connection string: allow self-signed certs to avoid cert issues
// - Otherwise: only enable TLS in production
const mongoOptions: MongoClientOptions = hasTlsInConnectionString
  ? (isProduction 
      ? { tlsCAFile: '/app/global-bundle.pem' }
      : { tlsAllowInvalidCertificates: true })
  : {
      tls: isProduction,
      tlsCAFile: isProduction ? '/app/global-bundle.pem' : undefined,
    };

const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // These parameters help prevent the disallowed_useragent error
          include_granted_scopes: "true",
          scope: "openid email profile",
        }
      },
      // Additional configuration to handle user agent issues
      httpOptions: {
        timeout: 10000,
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow UofM email addresses
      if (user.email && user.email.endsWith('@umich.edu')) {
        let mongoClient;
        try {
          console.log('GOOGLE SIGN-IN ATTEMPT:', {
            email: user.email,
            name: user.name,
            provider: account?.provider,
            timestamp: new Date().toISOString()
          });

          mongoClient = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
          await mongoClient.connect();
          const db = mongoClient.db();
          const usersCollection = db.collection('users');
          
          // Check if user exists
          let dbUser = await usersCollection.findOne({
            email: user.email
          });

          // If user doesn't exist, create them with default role (can be updated later via admin panel)
          if (!dbUser) {
            const newUser = {
              email: user.email,
              name: user.name || '',
              image: user.image || null,
              googleId: account?.providerAccountId, // Store Google sub ID for lookup
              roles: isAdminEmail(user.email) ? ['ADMIN'] : ['USER'],
              profile: {
                major: null,
                school: null,
                graduationYear: null,
                phone: null
              },
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const result = await usersCollection.insertOne(newUser);
            console.log('NEW USER CREATED:', {
              email: user.email,
              name: user.name,
              roles: newUser.roles,
              userId: result.insertedId,
              timestamp: new Date().toISOString()
            });

            // Create audit log for new user creation
            try {
              const auditCollection = db.collection('AuditLog');
              await auditCollection.insertOne({
                userId: result.insertedId.toString(),
                userEmail: user.email,
                action: 'user.created',
                targetType: 'User',
                targetId: result.insertedId.toString(),
                meta: {
                  name: user.name,
                  email: user.email,
                  roles: newUser.roles,
                  createdVia: 'Google Sign-in',
                  isAdmin: isAdminEmail(user.email)
                },
                ip: 'google-oauth',
                userAgent: 'Google OAuth Provider',
                timestamp: new Date()
              });
            } catch (auditError) {
              console.error('Failed to create audit log for new user:', auditError);
              // Don't fail the sign-in if audit logging fails
            }
          } else {
            // Update user info if it has changed
            const updates: any = {};
            let hasUpdates = false;

            if (user.name && user.name !== dbUser.name) {
              updates.name = user.name;
              hasUpdates = true;
            }
            
            if (user.image && user.image !== dbUser.image) {
              updates.image = user.image;
              hasUpdates = true;
            }
            
            // Store Google sub ID if not already stored
            if (account?.providerAccountId && !dbUser.googleId) {
              updates.googleId = account.providerAccountId;
              hasUpdates = true;
              console.log('ADDING GOOGLE ID TO USER:', {
                email: user.email,
                googleId: account.providerAccountId
              });
            }

            // Migrate existing users from role to roles array
            if (dbUser.role && !dbUser.roles) {
              updates.roles = [dbUser.role];
              hasUpdates = true;
              console.log('MIGRATING USER ROLE:', {
                email: user.email,
                oldRole: dbUser.role,
                newRoles: updates.roles
              });
            }

            if (hasUpdates) {
              updates.updatedAt = new Date();
              
              await usersCollection.updateOne(
                { email: user.email },
                {
                  $set: updates,
                  ...(dbUser.role && !dbUser.roles && { $unset: { role: "" } })
                }
              );

              console.log('USER UPDATED ON SIGN-IN:', {
                email: user.email,
                updates: Object.keys(updates),
                timestamp: new Date().toISOString()
              });
            }

            // Refetch user after updates to get current state
            dbUser = await usersCollection.findOne({ email: user.email });
          }

          // Auto-create TeamMember for PROJECT_TEAM_MEMBER users without one
          const userRoles = dbUser?.roles || [];
          if (userRoles.includes('PROJECT_TEAM_MEMBER') && !dbUser?.teamMemberId) {
            try {
              const teamMemberCollection = db.collection('TeamMember');
              
              // Check if a TeamMember with this email already exists
              let teamMember = await teamMemberCollection.findOne({ email: user.email });
              
              if (!teamMember) {
                // Create new TeamMember record
                const newTeamMember = {
                  name: user.name || user.email?.split('@')[0] || 'Team Member',
                  email: user.email,
                  role: 'Project Team Member',
                  year: new Date().getFullYear().toString(),
                  major: null,
                  bio: null,
                  linkedIn: null,
                  github: null,
                  imageUrl: user.image || null,
                  featured: false,
                  active: true,
                  memberType: 'analyst',
                  project: null,
                  sortOrder: 100,
                  joinDate: new Date(),
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                const teamMemberResult = await teamMemberCollection.insertOne(newTeamMember);
                teamMember = { ...newTeamMember, _id: teamMemberResult.insertedId };
                
                console.log('AUTO-CREATED TEAM MEMBER:', {
                  email: user.email,
                  teamMemberId: teamMemberResult.insertedId,
                  timestamp: new Date().toISOString()
                });
              }
              
              // Link user to TeamMember
              await usersCollection.updateOne(
                { email: user.email },
                { 
                  $set: { 
                    teamMemberId: teamMember._id.toString(),
                    updatedAt: new Date()
                  }
                }
              );
              
              console.log('AUTO-LINKED USER TO TEAM MEMBER:', {
                email: user.email,
                teamMemberId: teamMember._id.toString(),
                timestamp: new Date().toISOString()
              });
            } catch (teamMemberError) {
              console.error('Failed to auto-create/link TeamMember:', teamMemberError);
              // Don't fail sign-in if TeamMember creation fails
            }
          }

          console.log('GOOGLE SIGN-IN SUCCESS:', {
            email: user.email,
            timestamp: new Date().toISOString()
          });
          return true;
        } catch (error) {
          console.error('GOOGLE SIGN-IN ERROR:', {
            email: user.email,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
          return false;
        } finally {
          if (mongoClient) {
            await mongoClient.close();
          }
        }
      } else {
        console.log('GOOGLE SIGN-IN REJECTED - Invalid email domain:', {
          email: user.email,
          required: '@umich.edu',
          timestamp: new Date().toISOString()
        });
      }
      return false;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // Add user ID and roles to session from token
        session.user.id = token.sub || '';
        session.user.roles = token.roles || ['USER'];
        // Add access token for Google API calls
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        // Store the access token for Google API calls
        token.accessToken = account.access_token;
      }
      
      // Always fetch the latest roles from database (both for new logins and existing tokens)
      if (token.email) {
        let mongoClient;
        try {
          mongoClient = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
          await mongoClient.connect();
          const db = mongoClient.db();
          const usersCollection = db.collection('users');
          const dbUser = await usersCollection.findOne({ email: token.email });
          
          if (dbUser && dbUser.roles) {
            // Use roles from database (highest priority)
            token.roles = dbUser.roles;
          } else if (dbUser && dbUser.role) {
            // Fallback to single role field for legacy users
            token.roles = [dbUser.role];
          } else if (user && account && token.email && isAdminEmail(token.email)) {
            // Fallback to environment variable check only for new users not in database
            token.roles = ['ADMIN'];
          } else {
            // Default role for new users
            token.roles = ['USER'];
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
          // Fallback logic if database is unavailable
          if (user && account && token.email && isAdminEmail(token.email)) {
            token.roles = ['ADMIN'];
          } else {
            token.roles = token.roles || ['USER'];
          }
        } finally {
          if (mongoClient) {
            await mongoClient.close();
          }
        }
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log('Auth redirect called with:', { url, baseUrl });
      
      // Handle same-origin URLs
      if (url.startsWith(baseUrl)) {
        console.log('Redirecting to:', url);
        return url;
      }
      
      // Handle relative URLs (like /recruitment#recruitment-timeline)
      if (url.startsWith('/')) {
        const fullUrl = baseUrl + url;
        console.log('Redirecting to relative URL:', fullUrl);
        return fullUrl;
      }
      
      console.log('Defaulting to baseUrl:', baseUrl);
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};
