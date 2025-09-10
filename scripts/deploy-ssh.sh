#!/bin/bash
# IT-ERA SSH Deployment Script
# Deploy Node.js application via SSH

set -e  # Exit on any error

# Configuration
SERVER_IP="65.109.30.171"
SSH_PORT="45222"
USERNAME="it-era.it_jk05qj1z25"
REMOTE_PATH="/var/www/vhosts/it-era.it/httpdocs"
LOCAL_PATH="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 IT-ERA SSH Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if SSH key exists or use password
SSH_CMD="ssh -p $SSH_PORT $USERNAME@$SERVER_IP"
SCP_CMD="scp -P $SSH_PORT"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "   Server: $SERVER_IP:$SSH_PORT"
echo "   User: $USERNAME"
echo "   Remote Path: $REMOTE_PATH"
echo ""

# Test SSH connection
echo -e "${BLUE}🔐 Testing SSH connection...${NC}"
if $SSH_CMD "echo 'SSH connection successful'" 2>/dev/null; then
    print_status "SSH connection established"
else
    print_error "SSH connection failed. Please check credentials and network."
    exit 1
fi

# Create backup of current deployment
echo -e "${BLUE}💾 Creating backup...${NC}"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
$SSH_CMD "cd $REMOTE_PATH && mkdir -p ../backups && tar -czf ../backups/$BACKUP_NAME.tar.gz . 2>/dev/null || true"
print_status "Backup created: $BACKUP_NAME.tar.gz"

# Prepare local files for deployment
echo -e "${BLUE}📦 Preparing deployment files...${NC}"

# Create temporary deployment directory
TEMP_DIR=$(mktemp -d)
echo "   Temp directory: $TEMP_DIR"

# Copy files to temp directory
cp -r server.js package*.json views/ data/ web/ scripts/ "$TEMP_DIR/" 2>/dev/null || true

# Copy environment file if exists
if [ -f ".env.production" ]; then
    cp .env.production "$TEMP_DIR/.env"
    print_status "Production environment file copied"
fi

# Upload files to server
echo -e "${BLUE}📁 Uploading files to server...${NC}"
$SCP_CMD -r "$TEMP_DIR"/* "$USERNAME@$SERVER_IP:$REMOTE_PATH/"
print_status "Files uploaded successfully"

# Clean up temp directory
rm -rf "$TEMP_DIR"

# Install dependencies on server
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
$SSH_CMD "cd $REMOTE_PATH && npm install --production" || {
    print_warning "npm install failed, trying with --force"
    $SSH_CMD "cd $REMOTE_PATH && npm install --production --force"
}
print_status "Dependencies installed"

# Set correct file permissions
echo -e "${BLUE}🔐 Setting file permissions...${NC}"
$SSH_CMD "cd $REMOTE_PATH && chmod 644 *.js *.json && chmod 755 scripts/ && chmod -R 644 views/ data/ web/ 2>/dev/null || true"
print_status "File permissions set"

# Restart Node.js application
echo -e "${BLUE}🔄 Restarting Node.js application...${NC}"
$SSH_CMD "cd $REMOTE_PATH && pkill -f 'node server.js' 2>/dev/null || true"
sleep 2
$SSH_CMD "cd $REMOTE_PATH && nohup node server.js > app.log 2>&1 &"
print_status "Node.js application restarted"

# Wait a moment for the application to start
echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
sleep 5

# Test the deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
if curl -s -I https://it-era.it | grep -q "200 OK"; then
    print_status "Website is responding correctly"
else
    print_warning "Website test failed, checking logs..."
    $SSH_CMD "cd $REMOTE_PATH && tail -10 app.log"
fi

# Show final status
echo -e "${BLUE}📊 Deployment Status:${NC}"
$SSH_CMD "cd $REMOTE_PATH && ps aux | grep 'node server.js' | grep -v grep || echo 'No Node.js process found'"

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "   1. Test website: https://it-era.it"
echo "   2. Check logs: ssh -p $SSH_PORT $USERNAME@$SERVER_IP 'cd $REMOTE_PATH && tail -f app.log'"
echo "   3. Monitor application: ssh -p $SSH_PORT $USERNAME@$SERVER_IP 'cd $REMOTE_PATH && ps aux | grep node'"
echo ""
echo -e "${YELLOW}💡 Backup location: $REMOTE_PATH/../backups/$BACKUP_NAME.tar.gz${NC}"
