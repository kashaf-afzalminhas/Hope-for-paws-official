# Multiple Image Uploads for Adoption Posts - Testing Guide

## Prerequisites
- Backend server running on configured API_BASE_URL
- Frontend development server running
- User logged in to a test account
- Test images available (various sizes and formats)

## Quick Test Checklist

### Part 1: Frontend Image Selection & Validation

#### Test 1.1: Single Image Upload
1. Navigate to Create Adoption Post form
2. Click on image upload area
3. Select 1 image (JPEG, PNG, or WebP, <2MB)
4. **Expected:** Image preview appears in grid
5. **Expected:** Counter shows "1/20"
6. Click "Create Adoption Post" button
7. **Expected:** Form submits and redirects to /my-adoptions

#### Test 1.2: Multiple Images Upload (Valid)
1. On Create Adoption Post form
2. Click image upload area
3. Select 5 images at once (all valid)
4. **Expected:** All 5 previews appear
5. **Expected:** Counter shows "5/20"
6. Click "Create Adoption Post"
7. **Expected:** Form submits successfully

#### Test 1.3: Adding Images in Multiple Batches
1. On Create Adoption Post form
2. Select 3 images
3. **Expected:** "3/20" shown
4. Click "Add more photos" button
5. Select 2 more images
6. **Expected:** Counter updates to "5/20"
7. All 5 images should be visible in grid
8. Submit form
9. **Expected:** All 5 images saved

#### Test 1.4: Individual Image Removal
1. On Create Adoption Post form
2. Select 5 images
3. Hover over 3rd image preview
4. **Expected:** Red "X" button appears
5. Click the "X" button
6. **Expected:** 3rd image removed, counter shows "4/20"
7. Verify other images still present

#### Test 1.5: Remove All Images
1. On Create Adoption Post form
2. Select 5 images
3. Click "Remove all" button (should appear)
4. **Expected:** All images removed, counter shows "0/20"
5. Grid shows upload area again

#### Test 1.6: Invalid File Type
1. On Create Adoption Post form
2. Select 1 JPEG (valid) + 1 BMP (invalid) + 1 PNG (valid)
3. **Expected:** Only JPEG and PNG previews appear
4. **Expected:** Error message shows: "BMP: Invalid format..."
5. Counter shows "2/20"
6. **Expected:** Invalid file is NOT included

#### Test 1.7: File Size Validation
1. On Create Adoption Post form
2. Try to select an image >2MB
3. **Expected:** Error message shows file size exceeded
4. **Expected:** Large file is NOT included in previews
5. Counter remains at 0

#### Test 1.8: Duplicate File Detection
1. On Create Adoption Post form
2. Select same image file twice
3. **Expected:** Only one preview appears
4. **Expected:** Error message: "This file is already selected"
5. Counter shows "1/20"

#### Test 1.9: Max Images Limit (20)
1. On Create Adoption Post form
2. Try to select 25 images
3. **Expected:** Only first 20 are accepted
4. **Expected:** Error message: "Cannot add more than 20 images total"
5. Counter shows "20/20"
6. "Add more photos" button should be disabled or hidden

#### Test 1.10: Responsive Grid Layout
1. On Create Adoption Post form
2. Select 20 images
3. **Expected:** Images display in responsive grid (2-5 columns)
4. **Expected:** No images overflow or break layout
5. Resize browser window
6. **Expected:** Grid adapts to new screen size

#### Test 1.11: Submit Without Images
1. Fill out adoption form (name, age, type, breed, location, description)
2. Do NOT select any images
3. Try to click "Create Adoption Post" button
4. **Expected:** Button is disabled (grayed out)
5. **Expected:** Tooltip or form validation prevents submission

#### Test 1.12: Mix of Valid and Invalid Files
1. Select: 3 valid JPEGs + 1 invalid BMP + 2 valid PNGs + 1 oversized file
2. **Expected:** Only 5 valid images included
3. **Expected:** Two error messages shown
4. Counter shows "5/20"

### Part 2: Backend Upload & Storage

#### Test 2.1: Verify Database Schema
1. Create adoption post with 3 images
2. Check MongoDB adoption document
3. **Expected:** Document contains `imageUrls: [url1, url2, url3]`
4. **Expected:** `imageUrl` field still present for backward compatibility
5. **Expected:** `imageUrl` equals `imageUrls[0]`

#### Test 2.2: Verify Cloudinary Storage
1. Create adoption post with 5 images
2. Go to Cloudinary dashboard
3. **Expected:** 5 new images uploaded
4. **Expected:** All images are in correct folder/format
5. Verify URLs match what's in MongoDB

#### Test 2.3: Server-Side Validation
1. Using Postman/curl, create malicious request:
   - Send POST /adoptions with non-image files
   - Send files >5MB (backend limit)
   - Send wrong MIME type
2. **Expected:** Backend rejects request
3. **Expected:** Error message returned
4. **Expected:** No broken references in database

#### Test 2.4: Partial Upload Failure
1. Send request with 5 images, where 3rd image fails upload
2. **Expected:** All uploaded images cleaned up from Cloudinary
3. **Expected:** No adoption post created in database
4. **Expected:** Clear error message: "Failed to upload one or more images"

### Part 3: Display & Backward Compatibility

#### Test 3.1: Display in Adoption Card
1. Create adoption post with 3 images
2. Navigate to adoption list page
3. Find your post in the card list
4. **Expected:** First image (from imageUrls[0]) displays
5. **Expected:** Card layout not broken

#### Test 3.2: Display in Details Modal
1. On adoption list, click on your multi-image post
2. Details modal opens
3. **Expected:** First image displays in modal
4. **Expected:** Modal layout looks correct
5. Close modal, verify it closes properly

#### Test 3.3: Backward Compatibility - Old Posts
1. Query database for old adoption posts (with `imageUrl` only)
2. Navigate to adoption list
3. **Expected:** Old posts display correctly
4. **Expected:** First image displays (from imageUrl field)
5. Click on old post
6. **Expected:** Details modal shows image correctly

#### Test 3.4: Adoption History
1. Create adoption post with 3 images
2. Make an adoption request for that post
3. Check adoption history
4. **Expected:** Post displays with first image
5. **Expected:** History entry shows petImage correctly

### Part 4: Edge Cases & Error Handling

#### Test 4.1: Network Timeout
1. Create adoption post with 5 images
2. Simulate slow network (DevTools -> Throttle)
3. Click submit
4. **Expected:** Loading spinner shows
5. **Expected:** Form not submitted twice
6. Wait for completion
7. **Expected:** Either success or error message

#### Test 4.2: Browser Back Button During Upload
1. Create adoption post with 3 images
2. Click submit
3. Immediately click browser back button
4. **Expected:** Request may still complete on server
5. Check /my-adoptions
6. **Expected:** Post might be created or not (depends on timing)
7. No duplicate posts

#### Test 4.3: Cancel File Picker
1. On Create Adoption Post form
2. Click to open file picker
3. Select 3 images
4. **Don't** confirm, just cancel/close picker
5. **Expected:** No change to form state
6. Click again to open file picker
7. **Expected:** Can select different images

#### Test 4.4: Very Large Number of Images (20)
1. Select exactly 20 images
2. Submit form
3. **Expected:** No browser freezing
4. **Expected:** No excessive memory usage
5. **Expected:** All 20 images upload successfully
6. **Expected:** List displays all images correctly

#### Test 4.5: Image Data URLs Cleanup
1. Select 10 images
2. Remove all images
3. Select new 10 images
4. **Expected:** Browser memory doesn't accumulate
5. Open browser DevTools -> Memory
6. Take heap snapshot
7. Select/remove images multiple times
8. **Expected:** No significant memory leak

### Part 5: Mobile & Responsive Tests

#### Test 5.1: Mobile Image Upload
1. Open form on mobile/tablet
2. Select multiple images
3. **Expected:** Upload area responsive
4. **Expected:** Preview grid adapts (2 columns on mobile)
5. **Expected:** Touch/swipe works for removing images

#### Test 5.2: Landscape/Portrait Switching
1. Open form on tablet in portrait
2. Select 5 images
3. Rotate to landscape
4. **Expected:** Grid reflows properly
5. Rotate back to portrait
6. **Expected:** Grid reflows back

### Part 6: Performance Tests

#### Test 6.1: Upload Speed - 20 Images
1. Create adoption post with 20 images
2. Time how long it takes to upload
3. **Expected:** Should complete in reasonable time (depends on network)
4. **Expected:** No timeout errors

#### Test 6.2: Memory Usage During Selection
1. Open DevTools -> Performance tab
2. Start recording
3. Select 20 images rapidly
4. Stop recording
5. **Expected:** No major performance dips
6. **Expected:** Memory usage stays reasonable

#### Test 6.3: List Page Performance
1. Load adoption list with 50 posts (mix of 1-5 images each)
2. Scroll down
3. **Expected:** Smooth scrolling
4. **Expected:** Images lazy load
5. **Expected:** No UI lag

## Manual Testing Scenarios

### Scenario 1: Complete Happy Path
```
1. Go to Create Adoption Post
2. Fill in details (name: "Buddy", age: 2, type: "Dog", breed: "Labrador")
3. Select 5 images
4. Verify previews show all 5
5. Click Create Adoption Post
6. Verify success message
7. Check My Adoptions
8. Verify post shows first image
9. Click to view details
10. Verify first image in modal
```

### Scenario 2: Mixed Valid/Invalid Files
```
1. Prepare: 2 valid JPEGs, 1 BMP (invalid), 1 PNG (valid), 1 file >5MB
2. Select all 5 files
3. Verify: 3 valid images show, 2 errors shown
4. Submit form
5. Verify: Post created with 3 images
6. Check MongoDB: imageUrls array has 3 entries
```

### Scenario 3: Backward Compatibility
```
1. Manually insert old adoption document: {imageUrl: "...", name: "OldPost"}
2. Go to adoption list
3. Verify old post displays correctly
4. Click on old post
5. Verify details modal works
6. Check adoption history if applicable
7. Verify everything works without imageUrls field
```

### Scenario 4: Error Recovery
```
1. Simulate server error by stopping backend
2. Create adoption post with 3 images
3. Click submit (should fail)
4. Verify error message: "Failed to submit form"
5. Restart backend
6. Try again
7. Verify submission succeeds
8. Verify no duplicate posts created
```

## Automated Test Code

### Jest/React Testing Library Example
```javascript
describe('AdoptionForm Multiple Images', () => {
  test('should accept multiple valid images', () => {
    // Implementation
  });
  
  test('should reject invalid file types', () => {
    // Implementation
  });
  
  test('should prevent duplicate files', () => {
    // Implementation
  });
  
  test('should enforce max file size', () => {
    // Implementation
  });
  
  test('should enforce max image count', () => {
    // Implementation
  });
});
```

## Debugging Tips

### Frontend Debugging
- Open DevTools Console
- Check for 'FormData entry:' logs showing images being sent
- Check Network tab -> POST /adoptions request
- Verify FormData includes all images
- Check imagePreviewsto see expected data URLs

### Backend Debugging
- Check console logs for '=== ADOPTION POST ROUTE HIT ==='
- Verify 'Number of images received: X'
- Check Cloudinary upload success/failure logs
- Check MongoDB document after successful creation
- Verify imageUrls array and imageUrl field both present

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Images not uploading | Network issue | Check network tab, retry |
| "Image is required" error | No FormData.append | Verify frontend sends 'images' field |
| Validation error on valid image | Wrong MIME type | Check browser MIME type, try different format |
| Cloudinary upload fails | API key issue | Verify Cloudinary credentials in backend |
| Old posts don't show | Query doesn't include imageUrl | Check adoption routes select clause |
| Memory leak | Data URLs not cleaned up | Verify cleanup on component unmount |

## Sign-Off Checklist

- [ ] All Part 1 tests (Frontend) passed
- [ ] All Part 2 tests (Backend) passed
- [ ] All Part 3 tests (Display) passed
- [ ] All Part 4 tests (Edge Cases) passed
- [ ] All Part 5 tests (Mobile) passed
- [ ] All Part 6 tests (Performance) passed
- [ ] At least one complete scenario passed
- [ ] Backward compatibility verified
- [ ] No console errors
- [ ] No database issues
- [ ] Ready for production

## Notes for Future Enhancements

1. **Image Gallery/Carousel** in details modal
2. **Edit multiple images** functionality
3. **Image reordering** via drag-and-drop
4. **Thumbnail generation** for better performance
5. **Image compression** before upload
6. **Batch image editing** (crop, rotate, filter)
7. **Copy images from previous post** feature
