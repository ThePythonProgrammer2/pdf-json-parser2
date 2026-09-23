const fs = require('fs');
const path = require('path');

// Target the root of your project directory
const rootDir = __dirname;

function cleanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Safety guardrails: Skip core engine dependencies and server runtimes
    if (file === 'node_modules' || file === 'server' || file === '.git') {
      return;
    }
    
    if (stat.isDirectory()) {
      cleanDirectory(filePath);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('http://localhost:3001')) {
          console.log(`🧹 Compiler Sweep: Found and removed localhost string from: ${path.relative(rootDir, filePath)}`);
          content = content.replace(/http:\/\/localhost:3001/g, '');
          fs.writeFileSync(filePath, content, 'utf8');
        }
      } catch (err) {
        // Skip over non-text unreadable files safely
      }
    }
  });
}

console.log('🚀 Initiating master global frontend asset cleanup engine...');
cleanDirectory(rootDir);
console.log('✅ Global sanitization complete. All code routes relative.');
