const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..', 'backend');
const backendDist = path.join(backendRoot, 'dist');
const backendPackageJson = path.join(backendRoot, 'package.json');
const backendNodeModules = path.join(backendRoot, 'node_modules');

const targetResources = path.join(__dirname, 'dist', 'win-unpacked', 'resources');
const targetBackend = path.join(targetResources, 'backend');
const targetBackendDist = path.join(targetBackend, 'dist');
const targetBackendNodeModules = path.join(targetBackend, 'node_modules');

console.log('📦 Copying backend to Electron resources...');
console.log('  From:', backendRoot);
console.log('  To:', targetBackend);

// Create target directory
if (!fs.existsSync(targetResources)) {
  console.error('❌ Resources directory not found:', targetResources);
  console.error('   Make sure you run this after electron-builder --dir or --win');
  process.exit(1);
}

if (!fs.existsSync(targetBackend)) {
  fs.mkdirSync(targetBackend, { recursive: true });
}

// Copy dist folder
if (fs.existsSync(backendDist)) {
  console.log('  Copying dist/...');
  copyRecursiveSync(backendDist, targetBackendDist);
} else {
  console.error('❌ Backend dist not found:', backendDist);
  process.exit(1);
}

// Copy package.json
if (fs.existsSync(backendPackageJson)) {
  console.log('  Copying package.json...');
  fs.copyFileSync(backendPackageJson, path.join(targetBackend, 'package.json'));
} else {
  console.error('❌ Backend package.json not found:', backendPackageJson);
  process.exit(1);
}

// Copy node_modules
if (fs.existsSync(backendNodeModules)) {
  console.log('  Copying node_modules/... (this may take a while)');
  copyRecursiveSync(backendNodeModules, targetBackendNodeModules);
} else {
  console.error('❌ Backend node_modules not found:', backendNodeModules);
  process.exit(1);
}

// Copy .env file if it exists, otherwise copy .env.example
const backendEnv = path.join(backendRoot, '.env');
const backendEnvExample = path.join(backendRoot, '.env.example');
const targetEnv = path.join(targetBackend, '.env');

if (fs.existsSync(backendEnv)) {
  console.log('  Copying .env...');
  fs.copyFileSync(backendEnv, targetEnv);
} else if (fs.existsSync(backendEnvExample)) {
  console.log('  Copying .env.example as .env...');
  fs.copyFileSync(backendEnvExample, targetEnv);
  console.log('  ⚠️  WARNING: Using .env.example. Please configure .env with your database credentials!');
} else {
  console.log('  ⚠️  WARNING: No .env or .env.example found. Creating default .env...');
  // Create a default .env file
  const defaultEnv = `# Database Configuration
# For local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=awesome_invoice_db
DB_USER=postgres
DB_PASSWORD=

# OR use DATABASE_URL for cloud databases (e.g., Neon)
# DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=3001
NODE_ENV=production
`;
  fs.writeFileSync(targetEnv, defaultEnv);
  console.log('  ⚠️  Created default .env file. Please configure with your database credentials!');
}

console.log('✅ Backend copied successfully!');
console.log('  Location:', targetBackend);

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

