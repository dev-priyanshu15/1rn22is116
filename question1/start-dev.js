
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Stock Prediction Application...\n');

// Start the backend server
console.log('📡 Starting backend server...');
const backendProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment for backend to start
setTimeout(() => {
  console.log('🌐 Starting frontend development server...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
}, 2000);
