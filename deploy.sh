echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Go to frontend and build it
cd ~/Hope-for-paws-official/hope-for-paws
npm install
npm run build
sudo cp -r dist/* /var/www/html/

# Restart backend
cd ~/Hope-for-paws-official/backend
npm install
pm2 restart hopeforpaws-backend

echo "Deployment finished."
