// Test manual untuk step 3 validation
console.log('Testing basic step 3 validation logic...');

// Simulasi uploads state dengan berbagai kondisi
const testCases = [
  {
    name: 'Empty uploads',
    uploads: {
      buildingPhotos: [],
      sharedFacilitiesPhotos: [],
      floorPlanPhotos: []
    }
  },
  {
    name: 'Only building photos uploaded',
    uploads: {
      buildingPhotos: [
        { file: {}, preview: '', uploading: false, uploaded: true, url: 'https://test1.jpg' }
      ],
      sharedFacilitiesPhotos: [],
      floorPlanPhotos: []
    }
  },
  {
    name: 'All categories uploaded',
    uploads: {
      buildingPhotos: [
        { file: {}, preview: '', uploading: false, uploaded: true, url: 'https://test1.jpg' }
      ],
      sharedFacilitiesPhotos: [
        { file: {}, preview: '', uploading: false, uploaded: true, url: 'https://test2.jpg' }
      ],
      floorPlanPhotos: [
        { file: {}, preview: '', uploading: false, uploaded: true, url: 'https://test3.jpg' }
      ]
    }
  }
];

testCases.forEach(testCase => {
  console.log(`\n--- Testing: ${testCase.name} ---`);
  
  // Simulasi logic dari component
  const uploadedUrls = {
    buildingPhotos: testCase.uploads.buildingPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
    sharedFacilitiesPhotos: testCase.uploads.sharedFacilitiesPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
    floorPlanPhotos: testCase.uploads.floorPlanPhotos?.filter(upload => upload.uploaded && upload.url).map(upload => upload.url) || [],
  };

  // Relaxed validation (hanya butuh building photos)
  const hasRequiredImagesRelaxed = uploadedUrls.buildingPhotos.length >= 1;
  
  // Strict validation (butuh semua kategori)
  const hasRequiredImagesStrict = 
    uploadedUrls.buildingPhotos.length >= 1 &&
    uploadedUrls.sharedFacilitiesPhotos.length >= 1 &&
    uploadedUrls.floorPlanPhotos.length >= 1;

  console.log('  Uploaded URLs:', uploadedUrls);
  console.log('  Building photos count:', uploadedUrls.buildingPhotos.length);
  console.log('  Shared facilities count:', uploadedUrls.sharedFacilitiesPhotos.length);
  console.log('  Floor plan count:', uploadedUrls.floorPlanPhotos.length);
  console.log('  Valid (relaxed):', hasRequiredImagesRelaxed);
  console.log('  Valid (strict):', hasRequiredImagesStrict);
});