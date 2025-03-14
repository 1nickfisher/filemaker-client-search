const fs = require('fs');
const path = require('path');

// Create the data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

// Define the CSV files to be imported
const csvFiles = [
  'File+Client Name.csv',
  'Intake Form.csv',
  'Client+Counselor Assignment.csv',
  'Session History.csv'
];

// Check if the CSV files exist in the current directory
let filesFound = 0;
let filesMissing = 0;

csvFiles.forEach(file => {
  const sourcePath = path.join(process.cwd(), file);
  const destPath = path.join(dataDir, file);
  
  if (fs.existsSync(sourcePath)) {
    // Copy the file to the data directory
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to data directory`);
    filesFound++;
  } else {
    console.error(`❌ Error: Could not find ${file} in the current directory`);
    filesMissing++;
  }
});

console.log(`\nImport Summary:`);
console.log(`Files imported: ${filesFound}`);
console.log(`Files missing: ${filesMissing}`);

if (filesFound === csvFiles.length) {
  console.log('\n✨ All files imported successfully! The application is ready to use.');
} else {
  console.log('\n⚠️ Warning: Not all required CSV files were found.');
  console.log('Make sure all CSV files are in the project root directory, then run this script again.');
}