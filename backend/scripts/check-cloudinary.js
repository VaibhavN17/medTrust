const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;

console.log('CLOUDINARY_CLOUD_NAME=[%s]', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY present? %s', !!process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET present? %s', !!process.env.CLOUDINARY_API_SECRET);

(async () => {
  try {
    const res = await cloudinary.api.resources({ max_results: 1 });
    console.log('Cloudinary API OK — resources returned:', (res.resources || []).length);
  } catch (err) {
    console.error('Cloudinary API error:', err.message);
    if (err.http_code) console.error('HTTP code:', err.http_code);
  }
})();
