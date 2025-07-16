#!/bin/bash

# AWS Setup Script for Hope for Paws
# This script helps set up AWS credentials and prerequisites

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 AWS Setup for Hope for Paws"
echo "=============================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed."
    echo ""
    echo "Please install AWS CLI first:"
    echo "1. Visit: https://aws.amazon.com/cli/"
    echo "2. Download and install for your operating system"
    echo "3. Run this script again"
    exit 1
fi

print_success "AWS CLI is installed"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed."
    echo ""
    echo "Please install Docker first:"
    echo "1. Visit: https://www.docker.com/products/docker-desktop"
    echo "2. Download and install Docker Desktop"
    echo "3. Run this script again"
    exit 1
fi

print_success "Docker is installed"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_warning "AWS credentials are not configured."
    echo ""
    echo "Please configure your AWS credentials:"
    echo "1. Go to AWS Console > IAM > Users"
    echo "2. Create a new user or use existing one"
    echo "3. Attach the following policies:"
    echo "   - AmazonEC2ContainerRegistryFullAccess"
    echo "   - AmazonECS-FullAccess"
    echo "   - AmazonEC2FullAccess"
    echo "   - CloudWatchLogsFullAccess"
    echo "   - SecretsManagerReadWrite"
    echo "4. Create access keys"
    echo "5. Run: aws configure"
    echo ""
    read -p "Press Enter when you're ready to continue..."
fi

# Test AWS credentials
print_status "Testing AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    print_success "AWS credentials are working"
    echo "Account ID: $ACCOUNT_ID"
    echo "User ARN: $USER_ARN"
else
    print_error "AWS credentials are not working properly"
    exit 1
fi

# Check if required IAM roles exist
print_status "Checking required IAM roles..."

# Check for ECS Task Execution Role
if ! aws iam get-role --role-name ecsTaskExecutionRole &> /dev/null; then
    print_warning "ECS Task Execution Role does not exist. Creating..."
    
    # Create the role
    aws iam create-role \
        --role-name ecsTaskExecutionRole \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }'
    
    # Attach required policies
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
    
    print_success "ECS Task Execution Role created"
else
    print_success "ECS Task Execution Role exists"
fi

# Create secrets in AWS Secrets Manager
print_status "Setting up AWS Secrets Manager..."

# Function to create secret if it doesn't exist
create_secret_if_not_exists() {
    local secret_name=$1
    local secret_value=$2
    
    if ! aws secretsmanager describe-secret --secret-id "$secret_name" &> /dev/null; then
        echo "$secret_value" | aws secretsmanager create-secret --name "$secret_name" --secret-string file:///dev/stdin
        print_success "Secret '$secret_name' created"
    else
        print_status "Secret '$secret_name' already exists"
    fi
}

echo ""
echo "Please provide the following information for AWS Secrets Manager:"
echo ""

# MongoDB URI
read -p "Enter your MongoDB connection string: " MONGO_URI
if [ -n "$MONGO_URI" ]; then
    create_secret_if_not_exists "mongodb-uri" "$MONGO_URI"
fi

# JWT Secret
read -s -p "Enter your JWT secret (will be hidden): " JWT_SECRET
echo ""
if [ -n "$JWT_SECRET" ]; then
    create_secret_if_not_exists "jwt-secret" "$JWT_SECRET"
fi

# Google OAuth credentials
read -p "Enter your Google Client ID: " GOOGLE_CLIENT_ID
if [ -n "$GOOGLE_CLIENT_ID" ]; then
    create_secret_if_not_exists "google-client-id" "$GOOGLE_CLIENT_ID"
fi

read -s -p "Enter your Google Client Secret (will be hidden): " GOOGLE_CLIENT_SECRET
echo ""
if [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    create_secret_if_not_exists "google-client-secret" "$GOOGLE_CLIENT_SECRET"
fi

# Email credentials
read -p "Enter your email address: " EMAIL_USER
if [ -n "$EMAIL_USER" ]; then
    create_secret_if_not_exists "email-user" "$EMAIL_USER"
fi

read -s -p "Enter your email password/app password (will be hidden): " EMAIL_PASS
echo ""
if [ -n "$EMAIL_PASS" ]; then
    create_secret_if_not_exists "email-pass" "$EMAIL_PASS"
fi

# Cloudinary credentials
read -p "Enter your Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
if [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
    create_secret_if_not_exists "cloudinary-cloud-name" "$CLOUDINARY_CLOUD_NAME"
fi

read -p "Enter your Cloudinary API Key: " CLOUDINARY_API_KEY
if [ -n "$CLOUDINARY_API_KEY" ]; then
    create_secret_if_not_exists "cloudinary-api-key" "$CLOUDINARY_API_KEY"
fi

read -s -p "Enter your Cloudinary API Secret (will be hidden): " CLOUDINARY_API_SECRET
echo ""
if [ -n "$CLOUDINARY_API_SECRET" ]; then
    create_secret_if_not_exists "cloudinary-api-secret" "$CLOUDINARY_API_SECRET"
fi

print_success "AWS setup completed!"
echo ""
echo "Next steps:"
echo "==========="
echo "1. Make sure your application is ready for deployment"
echo "2. Run: chmod +x deploy-aws.sh"
echo "3. Run: ./deploy-aws.sh"
echo ""
echo "Your application will be deployed to AWS ECS with Fargate!" 