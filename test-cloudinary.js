import { v2 as cloudinary } from 'cloudinary';

// Test Cloudinary configuration
cloudinary.config({
  cloud_name: 'dg0ybxdbt',
  api_key: '836543447587342',
  api_secret: 'joI9lZdqjlWNyCEnJ5gh0ugYuzQ'
});

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary configuration...');
    
    // Test with a simple API call
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    // Test upload with a simple image URL
    const uploadResult = await cloudinary.uploader.upload(
      'https://via.placeholder.com/150',
      {
        folder: 'test',
        public_id: 'test-image-' + Date.now()
      }
    );
    
    console.log('✅ Upload test successful:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url
    });
    
    // Clean up test image
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error);
  }
}

testCloudinary();