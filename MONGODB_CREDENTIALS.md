# MongoDB Development Credentials
# Store this securely - these are the updated strong passwords

## Admin User (Full Access)
Username: admin
Password: UBijQhq+4HuDOcdH4LINdqblpgwNGzVjIc1+ABGdAoE=
Connection: mongodb://admin:<password>@159.89.229.112:27017/admin

## Development User (Database Access)
Username: abgdev
Password: 0C1dpfnsCs8ta1lCnT1Fx8ye/z1mP2kMAcCENRQFDfU=
Database: abg-website
Connection: mongodb://abgdev:<password>@159.89.229.112:27017/abg-website

## URL-Encoded Password (for connection strings)
Development Password (URL-encoded): 0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D

## Security Notes
- Passwords are 32-byte base64 encoded (256-bit entropy)
- Contains special characters requiring URL encoding in connection strings
- Admin user has full database access
- Development user limited to abg-website database

## Usage in Environment Files
DATABASE_URL="mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website"