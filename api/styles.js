const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const cssPath = path.join(process.cwd(), 'public', 'styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    return res.status(200).send(cssContent);
  } catch (error) {
    console.error('Error serving CSS:', error);
    return res.status(404).send('CSS not found');
  }
}; 