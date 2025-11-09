const fs = require('fs');

// Read the file
const content = fs.readFileSync('index.html', 'utf8');

// Split into lines
const lines = content.split('\n');

// Filter out the problematic line
const newLines = lines.filter(line => line !== '        }');

// Join the lines back together
const newContent = newLines.join('\n');

// Write the file back
fs.writeFileSync('index.html', newContent);

console.log('Syntax error fixed!');