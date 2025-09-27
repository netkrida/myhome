// Test untuk validasi step 3 images
console.log('Testing Step 3 validation logic...');

// Mock data sesuai dengan struktur ImageUpload
const mockUploads = {
  buildingPhotos: [
    { file: new File([], 'test1.jpg'), preview: '', uploading: false, uploaded: true, url: 'https://test1.jpg' }
  ],
  sharedFacilitiesPhotos: [
    { file: new File([], 'test2.jpg'), preview: '', uploading: false, uploaded: true, url: 'https://test2.jpg' }
  ],
  floorPlanPhotos: [
    { file: new File([], 'test3.jpg'), preview: '', uploading: false, uploaded: true, url: 'https://test3.jpg' }
  ]
};

// Simulasi logika validasi
const uploadedUrls = {
  buildingPhotos: mockUploads.buildingPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
  sharedFacilitiesPhotos: mockUploads.sharedFacilitiesPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
  floorPlanPhotos: mockUploads.floorPlanPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
};

const hasRequiredImages = 
  uploadedUrls.buildingPhotos.length >= 1 &&
  uploadedUrls.sharedFacilitiesPhotos.length >= 1 &&
  uploadedUrls.floorPlanPhotos.length >= 1;

console.log('Uploaded URLs:', uploadedUrls);
console.log('Has required images:', hasRequiredImages);
console.log('Building photos count:', uploadedUrls.buildingPhotos.length);
console.log('Shared facilities count:', uploadedUrls.sharedFacilitiesPhotos.length);
console.log('Floor plan count:', uploadedUrls.floorPlanPhotos.length);

// Test case 2: Missing floor plan
const mockUploads2 = {
  buildingPhotos: [
    { file: new File([], 'test1.jpg'), preview: '', uploading: false, uploaded: true, url: 'https://test1.jpg' }
  ],
  sharedFacilitiesPhotos: [
    { file: new File([], 'test2.jpg'), preview: '', uploading: false, uploaded: true, url: 'https://test2.jpg' }
  ],
  floorPlanPhotos: []
};

const uploadedUrls2 = {
  buildingPhotos: mockUploads2.buildingPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
  sharedFacilitiesPhotos: mockUploads2.sharedFacilitiesPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
  floorPlanPhotos: mockUploads2.floorPlanPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
};

const hasRequiredImages2 = 
  uploadedUrls2.buildingPhotos.length >= 1 &&
  uploadedUrls2.sharedFacilitiesPhotos.length >= 1 &&
  uploadedUrls2.floorPlanPhotos.length >= 1;

console.log('\n--- Test Case 2: Missing floor plan ---');
console.log('Has required images:', hasRequiredImages2);
console.log('Should be false because floor plan is missing');