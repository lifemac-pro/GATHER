const fs = require('fs');
const path = require('path');

try {
  const adminPath = path.join(__dirname, 'src', 'app', 'admin');
  const exists = fs.existsSync(adminPath);
  console.log(`Admin directory exists: ${exists}`);
  
  if (exists) {
    const items = fs.readdirSync(adminPath);
    console.log('Contents of admin directory:');
    items.forEach(item => {
      const itemPath = path.join(adminPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      console.log(`- ${item} ${isDirectory ? '(directory)' : '(file)'}`);
    });
  }
} catch (error) {
  console.error('Error:', error);
}
