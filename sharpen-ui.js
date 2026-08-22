const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages');
const componentsDir = path.join(__dirname, 'frontend/src/components');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Sharpen Corners
  content = content.replace(/rounded-\[40px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[36px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[28px\]/g, 'rounded-xl');
  content = content.replace(/rounded-4xl/g, 'rounded-2xl');
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  
  // 2. Add Dark Mode classes to common light backgrounds and text
  // We don't want to replace inside string literals if it breaks, but for React className strings it works fine.
  content = content.replace(/\bbg-white\b(?!\/)/g, 'bg-white dark:bg-[#100818] dark:text-gray-100');
  content = content.replace(/\bbg-white\/(90|95|80)\b/g, 'bg-white/$1 dark:bg-[#100818]/$1');
  content = content.replace(/\bbg-purple-100\/40\b/g, 'bg-purple-100/40 dark:bg-purple-900/20');
  content = content.replace(/\bbg-purple-100\b(?!\/)/g, 'bg-purple-100 dark:bg-purple-900/40');
  content = content.replace(/\bbg-purple-50\b(?!\/)/g, 'bg-purple-50 dark:bg-purple-900/20');
  content = content.replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-slate-800/50');
  content = content.replace(/\btext-slate-900\b/g, 'text-slate-900 dark:text-slate-100');
  content = content.replace(/\btext-slate-800\b/g, 'text-slate-800 dark:text-slate-200');
  content = content.replace(/\btext-gray-800\b/g, 'text-gray-800 dark:text-gray-200');
  content = content.replace(/\btext-gray-700\b/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/\btext-slate-500\b/g, 'text-slate-500 dark:text-slate-400');
  
  // Fix text-purple-700 and text-purple-600 on dark mode to be more visible (lighter)
  content = content.replace(/\btext-purple-700\b/g, 'text-purple-700 dark:text-purple-300');
  content = content.replace(/\btext-purple-600\b/g, 'text-purple-600 dark:text-purple-400');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(pagesDir);
walkDir(componentsDir);
console.log('UI Sharpened and Dark Mode classes applied successfully.');
