# Windows Deployment Guide for Hope for Paws

## Quick Fix for Current Issues

### 1. Rate Limiting Issue
The backend is currently hitting rate limits. I've increased the limit to 5000 requests per 15 minutes and created a slower test script.

### 2. Windows Environment
Since you're on Windows, use the `.bat` file instead of the `.sh` file.

## Step-by-Step Deployment

### Step 1: Deploy Backend (Windows)

1. **Open Command Prompt or PowerShell in the backend directory:**
   ```cmd
   cd "C:\Users\Kashaf A.Minhas\Desktop\Git\Hope-for-paws-official\backend"
   ```

2. **Deploy using the Windows batch file:**
   ```cmd
   deploy.bat
   ```

3. **Or deploy manually:**
   ```cmd
   vercel --prod
   ```

### Step 2: Test Backend (Avoid Rate Limiting)

1. **Use the slower test script:**
   ```cmd
   node test-deployment-slow.js
   ```

2. **Or test manually with delays:**
   - Open browser and go to: `https://hope-for-paws-official-backend.vercel.app/health`
   - Wait 2 seconds, then go to: `https://hope-for-paws-official-backend.vercel.app/api/notifications/test`

### Step 3: Deploy Frontend

1. **Navigate to frontend directory:**
   ```cmd
   cd "C:\Users\Kashaf A.Minhas\Desktop\Git\Hope-for-paws-official\hope-for-paws"
   ```

2. **Deploy to Vercel:**
   ```cmd
   vercel --prod
   ```

## Testing After Deployment

### 1. Test Backend Health
```cmd
node test-deployment-slow.js
```

### 2. Test Frontend
1. Open your deployed frontend URL
2. Sign in to the application
3. Open browser console (F12)
4. Run: `window.debugNotificationSystem()`

### 3. Manual Testing
1. **Click the notification bell** - should show dropdown
2. **Check connection status** - should show colored dot
3. **Create test notifications** by liking/commenting on posts

## Troubleshooting

### If you get "vercel command not found":
```cmd
npm install -g vercel
```

### If you get rate limiting errors:
- Wait 15 minutes before testing again
- Use the slower test script: `node test-deployment-slow.js`

### If notification bell doesn't work:
- Check browser console for errors
- Run: `window.debugNotificationSystem()`

## Expected Results

After successful deployment:

✅ **Backend**: All health checks should pass  
✅ **Frontend**: Notification bell should be clickable  
✅ **Notifications**: Should work via polling (yellow dot)  
✅ **No more 404 errors**: All endpoints should be available  
✅ **No more 429 errors**: Rate limiting should be reasonable  

## File Changes Made

### Backend
- `app.js`: Increased rate limit to 5000 requests per 15 minutes
- `deploy.bat`: Windows deployment script
- `test-deployment-slow.js`: Slower test script to avoid rate limiting

### Frontend
- `NotificationContext.jsx`: Increased polling interval to 60 seconds
- Better rate limiting handling with 5-minute cooldown

## Next Steps

1. **Deploy backend** using `deploy.bat`
2. **Test backend** using `node test-deployment-slow.js`
3. **Deploy frontend** using `vercel --prod`
4. **Test frontend** by clicking notification bell

Let me know if you encounter any issues during deployment! 