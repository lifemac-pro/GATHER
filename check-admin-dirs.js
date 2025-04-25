const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'app', 'admin');

try {
  if (fs.existsSync(adminDir)) {
    const items = fs.readdirSync(adminDir);
    console.log('Items in admin directory:');
    items.forEach(item => {
      const itemPath = path.join(adminDir, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      console.log(`- ${item} ${isDirectory ? '(directory)' : '(file)'}`);
    });
  } else {
    console.log('Admin directory does not exist');
  }
} catch (err) {
  console.error('Error:', err);
}
