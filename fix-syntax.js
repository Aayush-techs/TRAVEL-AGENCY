const fs = require('fs');

// Read the file
let content = fs.readFileSync('index.html', 'utf8');

// Split into lines
let lines = content.split('\n');

// Find and remove the problematic line
let newLines = [];
for (let i = 0; i < lines.length; i++) {
    // Skip the line with just "        }" that's causing the syntax error
    if (lines[i].trim() === '}' && lines[i].length === 9) {
        // Check if the previous line is also a closing brace
        if (i > 0 && lines[i - 1].trim() === '}') {
            // Skip this line
            continue;
        }
    }
    newLines.push(lines[i]);
}

// Join the lines back together
let newContent = newLines.join('\n');

// Write the file back
fs.writeFileSync('index.html', newContent);

console.log('Syntax error fixed!');