import { v2 as cloudinary } from 'cloudinary';

// Test Cloudinary configuration
cloudinary.config({
  cloud_name: 'dg0ybxdbt',
  api_key: '836543447587342',
  api_secret: 'joI9lZdqjlWNyCEnJ5gh0ugYuzQ'
});

async function testUploadPresets() {
  try {
    console.log('Testing Cloudinary upload presets...');
    
    // List upload presets
    const presets = await cloudinary.api.upload_presets();
    console.log('Available upload presets:', presets.presets.map(p => ({
      name: p.name,
      folder: p.settings?.folder,
      unsigned: p.unsigned
    })));
    
  } catch (error) {
    console.error('❌ Upload presets test failed:', error);
  }
}

testUploadPresets();