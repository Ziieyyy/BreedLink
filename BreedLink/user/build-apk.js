const { spawn } = require('child_process');

// Set environment variable
process.env.EAS_NO_VCS = '1';

// Spawn the EAS build process
const buildProcess = spawn('eas', ['build', '-p', 'android', '--profile', 'preview'], {
  cwd: 'c:\\Users\\user\\Documents\\DDT ZHAFIR NOTES\\FINAL YEAR PROJECT\\BREEDLINK 26.10\\BREEDLINK\\BreedLink',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle output
buildProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // If the prompt for keystore generation appears, automatically respond with 'y'
  if (output.includes('Generate a new Android Keystore')) {
    buildProcess.stdin.write('y\n');
  }
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

buildProcess.on('close', (code) => {
  console.log(`\nBuild process exited with code ${code}`);
});