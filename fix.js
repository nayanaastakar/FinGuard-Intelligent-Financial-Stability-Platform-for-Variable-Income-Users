const fs = require('fs');
const path = require('path');

const replacements = {
  'ðŸ’°': '💰',
  'ðŸ“ˆ': '📈',
  'ðŸ“…': '📅',
  'ðŸ¤ ': '🤝',
  'ðŸ›¡ï¸ ': '🛡️',
  'ðŸ›¡ï¸': '🛡️',
  'âš ï¸ ': '⚠️',
  'âš ï¸': '⚠️',
  'â€”': '—',
  'Â·': '·',
  'â€¦': '…',
  'â‚¹': '₹',
  'ðŸ’»': '💻',
  'ðŸŒŸ': '🌟',
  'ðŸ“‚': '📂',
  'ðŸš€': '🚀',
  'ðŸ”‘': '🔑',
  'ðŸ›¢ï¸ ': '🛢️',
  'ðŸ› ï¸ ': '🛠️'
};

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            fixFile(fullPath);
        }
    }
}

function fixFile(fullPath) {
    if (!fullPath.match(/\.(js|jsx|json|md|html)$/)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    for (const [bad, good] of Object.entries(replacements)) {
        content = content.split(bad).join(good);
    }
    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed ' + fullPath);
    }
}

walkDir('frontend/src');
fixFile('README.md');
