const fs = require('fs');

// Read the file
let content = fs.readFileSync('index.html', 'utf8');

// Remove the duplicate subscribeNewsletter function completely
// Find the start and end of the duplicate function
const startIndex = content.indexOf('            event.preventDefault();');
const endIndex = content.indexOf('            event.target.reset();\n        }', startIndex) + '            event.target.reset();\n        }'.length;

if (startIndex !== -1 && endIndex !== -1) {
    // Remove the duplicate function
    content = content.substring(0, startIndex) + content.substring(endIndex);
}

// Write the file back
fs.writeFileSync('index.html', content);

console.log('All issues fixed!');