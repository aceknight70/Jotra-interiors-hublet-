const fs = require('fs');

const files = ['src/components/GoodsHub.tsx', 'src/components/StaffDashboard.tsx', 'src/components/PhotoGallery.tsx', 'src/components/DisplayFloor.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Remove the bad onError
    code = code.replace(/<img(.*?) \/ onError=\{\(e\) => \{ e\.currentTarget\.style\.display = 'none'; e\.currentTarget\.nextElementSibling\?\.classList\.remove\('hidden'\); \}\} \/>/g, "<img$1 />");
    code = code.replace(/<img(.*?)\/ onError=\{\(e\) => \{ e\.currentTarget\.style\.display = 'none'; e\.currentTarget\.nextElementSibling\?\.classList\.remove\('hidden'\); \}\} \/>/g, "<img$1/>");
    fs.writeFileSync(file, code);
  }
});
