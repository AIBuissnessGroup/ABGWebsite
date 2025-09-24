const fs = require('fs');
const path = require('path');

const correctURI = `mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website`;
const incorrectPattern = /mongodb:\/\/localhost:27017\/abg-website/g;

function updateMongoURIInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('mongodb://localhost:27017/abg-website')) {
      const updatedContent = content.replace(incorrectPattern, correctURI);
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function findAndUpdateFiles(dir) {
  let updatedCount = 0;
  
  function walkDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        if (updateMongoURIInFile(filePath)) {
          updatedCount++;
        }
      }
    }
  }
  
  walkDir(dir);
  return updatedCount;
}

console.log('🔧 Fixing MongoDB URIs in all API files...\n');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const updatedFiles = findAndUpdateFiles(apiDir);

console.log(`\n📊 Summary: Updated ${updatedFiles} files with correct MongoDB URI`);
console.log('🎉 All MongoDB URIs have been fixed!');

if (updatedFiles > 0) {
  console.log('\n⚠️  Remember to restart your server for changes to take effect:');
  console.log('   systemctl restart abg-website.service');
}