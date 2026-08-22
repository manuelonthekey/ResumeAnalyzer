const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/app');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if not containing localhost:8081
  if (!content.includes('localhost:8081')) return;

  // Add environment import if not exists
  if (!content.includes('environment')) {
    // Find how many directories up to go to src
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'environments', 'environment'));
    const importPath = relativePath.replace(/\\/g, '/');
    
    // Add import statement after other imports
    const importRegex = /(import .* from '.*';\n)+/m;
    const match = content.match(importRegex);
    if (match) {
        content = content.replace(match[0], `${match[0]}import { environment } from '${importPath}';\n`);
    } else {
        content = `import { environment } from '${importPath}';\n` + content;
    }
  }

  // Replace 'http://localhost:8081/api/v1/...' with `${environment.apiUrl}/...`
  // Handle string literals and template literals
  content = content.replace(/'http:\/\/localhost:8081\/api\/v1([^']*)'/g, '`${environment.apiUrl}$1`');
  content = content.replace(/`http:\/\/localhost:8081\/api\/v1([^`]*)`/g, '`${environment.apiUrl}$1`');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(srcDir);
console.log('API URLs replaced with environment variable.');
