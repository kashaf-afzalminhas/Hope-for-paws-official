# API Optimization Guide - Resolving Multiple Fetch Requests

## Problem
The admin dashboard was experiencing issues due to too many simultaneous API requests, particularly when loading user statistics. This caused:
- Server overload
- Slow page loading
- Potential timeout errors
- Poor user experience

## Solutions Implemented

### 1. **Centralized API Service with Request Queue**
**File**: `src/Main/api.js`

**Features**:
- **Request Batching**: Queues multiple requests and processes them sequentially
- **Rate Limiting**: Adds 100ms delay between requests to prevent server overload
- **Caching**: 5-minute cache for frequently accessed data
- **Error Handling**: Centralized error handling for all API calls

**Key Benefits**:
- Prevents request flooding 
- Reduces server load
- Improves response times through caching
- Consistent error handling

### 2. **Bulk Data Fetching**
**Backend**: `backend/controllers/adminController.js`
**Route**: `backend/routes/adminRoutes.js`

**New Endpoint**: `/admin/users-with-stats`
- Fetches all users and their statistics in a single request
- Replaces multiple individual API calls
- Processes stats in parallel on the server side
- Returns structured data with user categories and stats

**Before**: 
```javascript
// Multiple requests for each user
users.forEach(user => fetchUserStats(user.id));
```

**After**:
```javascript
// Single request for all users with stats
const data = await adminAPI.getAllUsersWithStats();
```

### 3. **Component Optimization**
**Files Updated**:
- `src/Main/AdminManageUsers.jsx`
- `src/Main/AdminAdoptions.jsx`
- `src/Main/AdminPosts.jsx`
- `src/Main/AdminComments.jsx`
- `src/main.jsx`

**Changes**:
- Replaced individual fetch calls with centralized API service
- Implemented bulk data loading
- Added loading states for better UX
- Removed redundant API calls

### 4. **Linter Error Fixes**
**File**: `src/Components/UserBadge.jsx`
- Removed unused React import
- Added PropTypes validation
- Fixed component structure

## Performance Improvements

### Request Reduction
- **Before**: 1 + N requests (1 for users, N for individual stats)
- **After**: 1 request for all data

### Example Scenario
**Before**: 50 users = 51 API requests
**After**: 50 users = 1 API request

### Caching Benefits
- First load: Full API request
- Subsequent loads: Cached data (instant)
- Cache invalidation: On data changes only

## Implementation Details

### API Service Structure
```javascript
export const adminAPI = {
  getAllUsersWithStats(),    // Bulk user data
  getAllAdoptions(),         // All adoptions
  getAllPosts(),            // All posts with comments
  getAllComments(),         // All comments
  deleteUser(),             // Delete operations
  deleteAdoption(),
  deletePost(),
  deleteComment(),
  clearCache()              // Cache management
};
```

### Request Queue System
```javascript
// Queues requests and processes them sequentially
const processQueue = async () => {
  while (requestQueue.length > 0) {
    const { url, options, resolve, reject } = requestQueue.shift();
    await rateLimit(); // 100ms delay
    // Process request...
  }
};
```

### Cache Management
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};
```

## Usage Examples

### Loading User Data
```javascript
// Old way - multiple requests
useEffect(() => {
  currentUsers.forEach(u => {
    if (!userStats[u._id]) fetchUserStats(u._id);
  });
}, [tab, search, currentUsers.length]);

// New way - single request
useEffect(() => {
  const loadAllUserStats = async () => {
    const data = await adminAPI.getAllUsersWithStats();
    if (data.userStats) {
      Object.entries(data.userStats).forEach(([userId, stats]) => {
        fetchUserStats(userId, stats);
      });
    }
  };
  loadAllUserStats();
}, [vets.length, users.length]);
```

### Deleting Data
```javascript
// Old way
const handleDelete = async (userId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/admin/user/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  // Handle response...
};

// New way
const handleDelete = async (userId) => {
  await adminAPI.deleteUser(userId);
  // Cache automatically cleared, UI updated
};
```

## Best Practices

### 1. **Use Bulk Endpoints**
Always prefer bulk data fetching over individual requests when possible.

### 2. **Implement Caching**
Cache frequently accessed data to reduce server load.

### 3. **Rate Limiting**
Add delays between requests to prevent server overload.

### 4. **Error Handling**
Centralize error handling for consistent user experience.

### 5. **Loading States**
Show appropriate loading indicators during data fetching.

## Monitoring and Maintenance

### Cache Management
- Monitor cache hit rates
- Adjust cache duration based on data volatility
- Clear cache when data changes

### Performance Monitoring
- Track API response times
- Monitor server load
- Watch for timeout errors

### Future Improvements
- Implement pagination for large datasets
- Add real-time updates using WebSockets
- Consider server-side rendering for initial data

## Conclusion

These optimizations have significantly improved the admin dashboard performance by:
- Reducing API requests by 90%+
- Implementing intelligent caching
- Adding request queuing and rate limiting
- Centralizing error handling

The solution is scalable and can be extended to other parts of the application that experience similar issues with multiple API requests. 