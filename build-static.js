const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const movedFiles = [];

// Function to find all route files recursively
function findRouteFiles(dir, baseDir = dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath, baseDir));
    } else if (item === 'route.ts' || item === 'route.js' || item === 'route.tsx' || item === 'route.jsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

console.log('Preparing for static export build...');

// Find and move all route files
const routeFiles = findRouteFiles(apiDir);

if (routeFiles.length > 0) {
  console.log(`Found ${routeFiles.length} route file(s). Temporarily moving them...`);
  
  for (const routeFile of routeFiles) {
    const backupPath = routeFile + '.backup';
    if (fs.existsSync(routeFile)) {
      fs.renameSync(routeFile, backupPath);
      movedFiles.push({ original: routeFile, backup: backupPath });
    }
  }
  
  console.log('Route files moved to backup location.');
}

try {
  console.log('Running Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exitCode = 1;
} finally {
  // Restore all route files
  if (movedFiles.length > 0) {
    console.log('Restoring route files...');
    for (const { original, backup } of movedFiles) {
      if (fs.existsSync(backup)) {
        if (fs.existsSync(original)) {
          fs.unlinkSync(original);
        }
        fs.renameSync(backup, original);
      }
    }
    console.log('Route files restored.');
  }
}

