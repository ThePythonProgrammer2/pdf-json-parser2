const fs = require('fs');
const path = require('path');

// Target the public frontend asset directory
const publicDir = path.join(__dirname, 'public');

function cleanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      cleanDirectory(filePath);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.json')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // If the file contains the broken local development URL, scrub it completely
      if (content.includes('http://localhost:3001')) {
        console.log(`🧹 Automated Compiler: Cleaning hardcoded localhost from ${file}`);
        content = content.replace(/http:\/\/localhost:3001/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  });
}

console.log('🚀 Starting automated frontend asset sanitization...');
cleanDirectory(publicDir);
console.log('✅ Frontend assets successfully prepared for production production deployment.');
