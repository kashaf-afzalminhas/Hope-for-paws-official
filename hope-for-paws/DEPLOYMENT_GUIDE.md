# Deployment Guide - Fix CORS and Environment Variables

## Current Issues
1. **CORS Errors**: Frontend can't access backend API
2. **Environment Variables**: Frontend using localhost URLs in production

## Solution Steps

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel dashboard for the frontend project and set these environment variables:

```bash
# Production Environment Variables
VITE_API_URL=https://hope-for-paws-official-backend.vercel.app/api
```

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project (`hope-for-paws`)
3. Go to Settings → Environment Variables
4. Add the variables above
5. Redeploy the project

### 2. Update Vercel Configuration

The current `vercel.json` is trying to proxy API requests, which can cause CORS issues. Update it to:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3. Test the Fix

After updating the environment variables and redeploying:

1. **Test API Connection:**
   ```javascript
   // In browser console
   fetch('https://hope-for-paws-official-backend.vercel.app/api/test-cors')
     .then(res => res.json())
     .then(data => console.log('API Test:', data))
     .catch(err => console.error('API Error:', err));
   ```



### 4. Alternative: Update Frontend Code

If you can't access Vercel dashboard, you can temporarily hardcode the URLs in `src/config.js`:

```javascript
// Temporary fix - replace with environment variables later
export const API_BASE_URL = 'https://hope-for-paws-official-backend.vercel.app/api';
export const AUTH_BASE_URL = 'https://hope-for-paws-official-backend.vercel.app/auth';
export const ADMIN_BASE_URL = 'https://hope-for-paws-official-backend.vercel.app/api/admin';
```

### 5. Verify Backend CORS

The backend CORS configuration has been updated. To verify it's working:

```bash
# Test from command line
curl -H "Origin: https://www.hopeforpaws.club" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     https://hope-for-paws-official-backend.vercel.app/api/test-cors
```

## Expected Results

After fixing:

1. ✅ No more CORS errors in browser console
2. ✅ API requests work (posts, etc.)

## Troubleshooting

### If CORS still fails:
1. Check browser console for specific error messages
2. Verify environment variables are set correctly in Vercel
3. Clear browser cache and try again
4. Check if backend is responding to OPTIONS requests


### If API requests fail:
1. Test the API endpoint directly in browser
2. Check if authentication token is valid
3. Verify the API URL is correct

## Next Steps

1. Set environment variables in Vercel dashboard
2. Redeploy frontend
3. Test the application
4. If issues persist, check the debug scripts in the backend folder 