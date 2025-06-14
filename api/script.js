const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const jsPath = path.join(process.cwd(), 'public', 'script.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    return res.status(200).send(jsContent);
  } catch (error) {
    console.error('Error serving JS:', error);
    return res.status(404).send('JavaScript not found');
  }
}; 