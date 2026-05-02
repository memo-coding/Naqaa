const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./client');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/\btracking-[a-zA-Z0-9_\[\].-]+\b/g, '')
                              .replace(/letter-spacing:\s*[^;]+;/g, '');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
    }
});
console.log(`Updated ${count} files.`);
