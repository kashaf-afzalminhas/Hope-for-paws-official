# AWS Deployment Guide for Hope for Paws

This guide provides multiple deployment options for your Hope for Paws application on AWS, from simple to advanced configurations.

## 🚀 Quick Start Options

### Option 1: AWS Amplify (Recommended for Frontend)
- **Best for**: Frontend deployment with automatic CI/CD
- **Cost**: Free tier available
- **Difficulty**: Easy

### Option 2: AWS Elastic Beanstalk (Recommended for Full Stack)
- **Best for**: Full-stack applications with auto-scaling
- **Cost**: Pay for resources used
- **Difficulty**: Medium

### Option 3: AWS ECS with Fargate (Advanced)
- **Best for**: Containerized applications with high scalability
- **Cost**: Pay for compute resources
- **Difficulty**: Advanced

---

## 📋 Prerequisites

1. **AWS Account**: Create an account at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI**: Install and configure
3. **Docker** (for containerized deployment)
4. **Domain Name** (optional but recommended)

---

## 🎯 Option 1: AWS Amplify (Frontend) + API Gateway + Lambda (Backend)

### Step 1: Deploy Frontend with AWS Amplify

1. **Install AWS Amplify CLI**:
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. **Initialize Amplify in your frontend project**:
```bash
cd hope-for-paws
amplify init
```

3. **Add hosting**:
```bash
amplify add hosting
# Choose "Amazon CloudFront and S3"
```

4. **Deploy**:
```bash
amplify publish
```

### Step 2: Deploy Backend with API Gateway + Lambda

1. **Create deployment package for backend**:
```bash
cd backend
zip -r backend.zip . -x "node_modules/*" "uploads/*" ".git/*"
```

2. **Create Lambda function**:
```bash
aws lambda create-function \
  --function-name hope-for-paws-backend \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler app.handler \
  --zip-file fileb://backend.zip
```

3. **Create API Gateway**:
```bash
aws apigateway create-rest-api \
  --name "Hope for Paws API" \
  --description "Backend API for Hope for Paws"
```

---

## 🎯 Option 2: AWS Elastic Beanstalk (Recommended)

### Step 1: Prepare Your Application

1. **Create deployment package**:
```bash
# Create a deployment directory
mkdir hope-for-paws-deployment
cd hope-for-paws-deployment

# Copy backend files
cp -r ../backend/* .

# Build frontend
cd ../hope-for-paws
npm run build
cp -r dist/* ../hope-for-paws-deployment/public/

# Create Procfile
echo "web: node app.js" > ../hope-for-paws-deployment/Procfile
```

2. **Create `.ebextensions` configuration**:
```bash
mkdir .ebextensions
```

### Step 2: Create Configuration Files

Create `.ebextensions/01_environment.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
    MONGO_URI: your-mongodb-connection-string
    JWT_SECRET: your-jwt-secret
    GOOGLE_CLIENT_ID: your-google-client-id
    GOOGLE_CLIENT_SECRET: your-google-client-secret
    EMAIL_USER: your-email
    EMAIL_PASS: your-email-password
    CLOUDINARY_CLOUD_NAME: your-cloudinary-name
    CLOUDINARY_API_KEY: your-cloudinary-key
    CLOUDINARY_API_SECRET: your-cloudinary-secret
```

Create `.ebextensions/02_nginx.config`:
```yaml
files:
  "/etc/nginx/conf.d/proxy.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      upstream nodejs {
          server 127.0.0.1:8080;
          keepalive 256;
      }

      server {
          listen 80;

          location / {
              proxy_pass http://nodejs;
              proxy_set_header Connection "";
              proxy_http_version 1.1;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
          }

          location /socket.io/ {
              proxy_pass http://nodejs;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection "upgrade";
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
          }
      }
```

### Step 3: Deploy with Elastic Beanstalk

1. **Install EB CLI**:
```bash
pip install awsebcli
```

2. **Initialize EB application**:
```bash
eb init
# Choose your region and create new application
```

3. **Create environment**:
```bash
eb create production
```

4. **Deploy**:
```bash
eb deploy
```

---

## 🎯 Option 3: Docker + ECS Fargate (Advanced)

### Step 1: Create Dockerfile

Create `Dockerfile` in the root directory:
```dockerfile
# Multi-stage build
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY hope-for-paws/package*.json ./
RUN npm ci --only=production
COPY hope-for-paws/ ./
RUN npm run build

FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Install PM2 for process management
RUN npm install -g pm2

# Create PM2 config
COPY ecosystem.config.js ./

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'hope-for-paws',
    script: './backend/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Step 2: Create ECS Task Definition

Create `task-definition.json`:
```json
{
  "family": "hope-for-paws",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "hope-for-paws",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/hope-for-paws:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "MONGO_URI",
          "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hope-for-paws",
          "awslogs-region": "YOUR_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 3: Deploy to ECS

1. **Build and push Docker image**:
```bash
aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com

docker build -t hope-for-paws .
docker tag hope-for-paws:latest YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/hope-for-paws:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/hope-for-paws:latest
```

2. **Create ECS cluster and service**:
```bash
aws ecs create-cluster --cluster-name hope-for-paws-cluster
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster hope-for-paws-cluster --service-name hope-for-paws-service --task-definition hope-for-paws --desired-count 2
```

---

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file for your backend:
```env
NODE_ENV=production
PORT=3000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

### Frontend Configuration

Update `hope-for-paws/src/config.js`:
```javascript
// Production environment
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api'
  : 'http://localhost:3000/api';

export const AUTH_BASE_URL = `${API_BASE_URL.replace('/api', '')}/auth`;
export const ADMIN_BASE_URL = `${API_BASE_URL}/admin`;
```

---

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Recommended)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Add to environment variables

### Option 2: AWS DocumentDB
1. Create DocumentDB cluster in AWS
2. Configure security groups
3. Get connection string
4. Add to environment variables

---

## 🔒 Security Configuration

### 1. AWS IAM Roles
Create necessary IAM roles for your deployment method.

### 2. Security Groups
Configure security groups to allow only necessary traffic:
- HTTP (80)
- HTTPS (443)
- Custom port for your application (if needed)

### 3. SSL Certificate
Use AWS Certificate Manager to get free SSL certificates.

---

## 📊 Monitoring and Logging

### 1. CloudWatch Logs
Configure CloudWatch for application logging.

### 2. Application Monitoring
Consider using AWS X-Ray for distributed tracing.

### 3. Health Checks
Implement health check endpoints:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## 🚀 Deployment Scripts

### Quick Deploy Script
Create `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying Hope for Paws to AWS..."

# Build frontend
echo "📦 Building frontend..."
cd hope-for-paws
npm run build
cd ..

# Deploy to Elastic Beanstalk
echo "☁️ Deploying to Elastic Beanstalk..."
eb deploy production

echo "✅ Deployment complete!"
echo "🌐 Your application is live at: $(eb status | grep CNAME | awk '{print $2}')"
```

Make it executable:
```bash
chmod +x deploy.sh
```

---

## 💰 Cost Optimization

### 1. Use Reserved Instances
For predictable workloads, use reserved instances.

### 2. Auto Scaling
Configure auto scaling to handle traffic spikes.

### 3. CDN
Use CloudFront for static assets.

### 4. Database Optimization
Use appropriate database instance sizes.

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to Elastic Beanstalk
      run: |
        pip install awsebcli
        eb deploy production
```

---

## 🆘 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check AWS Systems Manager Parameter Store
   - Verify environment variable names

2. **Database Connection Issues**
   - Check security groups
   - Verify connection string
   - Test connectivity

3. **Static Files Not Serving**
   - Check nginx configuration
   - Verify file permissions
   - Check build output

4. **Socket.IO Issues**
   - Configure sticky sessions
   - Check load balancer settings
   - Verify WebSocket support

---

## 📞 Support

For AWS-specific issues:
- [AWS Documentation](https://docs.aws.amazon.com/)
- [AWS Support](https://aws.amazon.com/support/)
- [AWS Forums](https://forums.aws.amazon.com/)

For application-specific issues:
- Check the logs in CloudWatch
- Use the debugging tools we created
- Review the notification system fixes

---

## 🎉 Next Steps

1. Choose your deployment option
2. Set up your AWS account and credentials
3. Configure your environment variables
4. Deploy your application
5. Set up monitoring and alerts
6. Configure your domain name
7. Set up SSL certificates

Your Hope for Paws application is now ready for AWS deployment! 🐾 