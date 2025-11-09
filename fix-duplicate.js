const fs = require('fs');

// Read the file
let content = fs.readFileSync('index.html', 'utf8');

// Remove the duplicate subscribeNewsletter function
const lines = content.split('\n');
const newLines = [];
let inDuplicateFunction = false;
let functionEndCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're at the start of the duplicate function
    if (line.includes('event.preventDefault();') &&
        line.includes('const email = event.target.querySelector') &&
        i > 0 && lines[i - 1].includes('}')) {
        inDuplicateFunction = true;
        functionEndCount = 0;
        // Skip this line and the previous closing brace
        continue;
    }

    // If we're in the duplicate function, count closing braces
    if (inDuplicateFunction) {
        if (line.trim() === '}' || line.trim() === '};') {
            functionEndCount++;
            if (functionEndCount >= 2) {
                inDuplicateFunction = false;
            }
        }
        continue;
    }

    // Add the line to our new content
    newLines.push(line);
}

// Join the lines back together
let newContent = newLines.join('\n');

// Write the file back
fs.writeFileSync('index.html', newContent);

console.log('Duplicate function removed!');