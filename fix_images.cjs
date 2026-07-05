const fs = require('fs');

const files = ['src/components/GoodsHub.tsx', 'src/components/StaffDashboard.tsx', 'src/components/PhotoGallery.tsx', 'src/components/DisplayFloor.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Add onError handler to img tags to prevent broken image icon
    code = code.replace(/<img([^>]*)>/g, (match, attrs) => {
      if (attrs.includes('onError')) return match;
      return `<img${attrs} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />`;
    });
    fs.writeFileSync(file, code);
  }
});
