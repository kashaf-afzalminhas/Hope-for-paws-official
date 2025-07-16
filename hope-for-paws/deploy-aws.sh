#!/bin/bash

# AWS Deployment Script for Hope for Paws
# This script automates the deployment process to AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hope-for-paws"
REGION="us-east-1"
ECR_REPOSITORY="hope-for-paws"
CLUSTER_NAME="hope-for-paws-cluster"
SERVICE_NAME="hope-for-paws-service"

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists jq; then
        print_warning "jq is not installed. Some features may not work properly."
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to build the application
build_application() {
    print_status "Building application..."
    
    # Build frontend
    print_status "Building frontend..."
    cd hope-for-paws
    npm install
    npm run build
    cd ..
    
    # Build backend
    print_status "Building backend..."
    cd backend
    npm install --production
    cd ..
    
    print_success "Application built successfully"
}

# Function to create ECR repository
create_ecr_repository() {
    print_status "Creating ECR repository..."
    
    # Check if repository exists
    if aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$REGION" >/dev/null 2>&1; then
        print_status "ECR repository already exists"
    else
        aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$REGION"
        print_success "ECR repository created"
    fi
}

# Function to build and push Docker image
build_and_push_image() {
    print_status "Building and pushing Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com"
    
    # Build Docker image
    docker build -t "$ECR_REPOSITORY" .
    
    # Tag image
    docker tag "$ECR_REPOSITORY:latest" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    
    # Push image
    docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    
    print_success "Docker image built and pushed successfully"
}

# Function to create ECS cluster
create_ecs_cluster() {
    print_status "Creating ECS cluster..."
    
    # Check if cluster exists
    if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
        print_status "ECS cluster already exists"
    else
        aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$REGION"
        print_success "ECS cluster created"
    fi
}

# Function to create task definition
create_task_definition() {
    print_status "Creating ECS task definition..."
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Create task definition JSON
    cat > task-definition.json << EOF
{
  "family": "$APP_NAME",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "$APP_NAME",
      "image": "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest",
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
          "valueFrom": "arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$APP_NAME",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
    
    # Register task definition
    aws ecs register-task-definition --cli-input-json file://task-definition.json --region "$REGION"
    
    print_success "Task definition created"
}

# Function to create ECS service
create_ecs_service() {
    print_status "Creating ECS service..."
    
    # Get default VPC and subnets
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region "$REGION")
    SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region "$REGION" | tr '\t' ',' | sed 's/,$//')
    
    # Create security group if it doesn't exist
    SG_NAME="$APP_NAME-sg"
    SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null || echo "")
    
    if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
        SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "Security group for $APP_NAME" --vpc-id "$VPC_ID" --region "$REGION" --query 'GroupId' --output text)
        
        # Add inbound rules
        aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region "$REGION"
        aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
        aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"
    fi
    
    # Check if service exists
    if aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
        print_status "ECS service already exists, updating..."
        aws ecs update-service --cluster "$CLUSTER_NAME" --service "$SERVICE_NAME" --task-definition "$APP_NAME" --region "$REGION"
    else
        aws ecs create-service \
            --cluster "$CLUSTER_NAME" \
            --service-name "$SERVICE_NAME" \
            --task-definition "$APP_NAME" \
            --desired-count 2 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
            --region "$REGION"
    fi
    
    print_success "ECS service created/updated"
}

# Function to create CloudWatch log group
create_log_group() {
    print_status "Creating CloudWatch log group..."
    
    if ! aws logs describe-log-groups --log-group-name-prefix "/ecs/$APP_NAME" --region "$REGION" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "/ecs/$APP_NAME"; then
        aws logs create-log-group --log-group-name "/ecs/$APP_NAME" --region "$REGION"
        print_success "CloudWatch log group created"
    else
        print_status "CloudWatch log group already exists"
    fi
}

# Function to create Application Load Balancer (optional)
create_load_balancer() {
    print_status "Creating Application Load Balancer..."
    
    # This is optional and requires additional setup
    print_warning "Load balancer creation is not implemented in this script"
    print_warning "You may want to set up an ALB manually for better traffic management"
}

# Function to display deployment information
display_deployment_info() {
    print_success "Deployment completed successfully!"
    echo ""
    echo "Deployment Information:"
    echo "======================"
    echo "Application Name: $APP_NAME"
    echo "Region: $REGION"
    echo "ECS Cluster: $CLUSTER_NAME"
    echo "ECS Service: $SERVICE_NAME"
    echo "ECR Repository: $ECR_REPOSITORY"
    echo ""
    echo "Next Steps:"
    echo "==========="
    echo "1. Set up your environment variables in AWS Systems Manager Parameter Store"
    echo "2. Configure your domain name and SSL certificate"
    echo "3. Set up monitoring and alerts in CloudWatch"
    echo "4. Configure auto-scaling policies if needed"
    echo ""
    echo "To view your application logs:"
    echo "aws logs tail /ecs/$APP_NAME --follow --region $REGION"
    echo ""
    echo "To check service status:"
    echo "aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
}

# Main deployment function
main() {
    echo "🚀 Starting AWS deployment for Hope for Paws..."
    echo ""
    
    check_prerequisites
    build_application
    create_ecr_repository
    build_and_push_image
    create_ecs_cluster
    create_log_group
    create_task_definition
    create_ecs_service
    
    display_deployment_info
}

# Run main function
main "$@" 