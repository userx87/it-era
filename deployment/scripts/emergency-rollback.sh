#!/bin/bash

# IT-ERA Admin Panel Emergency Rollback Script
# GitHub Deployment Master Agent
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Function to display help
show_help() {
    echo "IT-ERA Admin Panel Emergency Rollback Script"
    echo ""
    echo "Usage: $0 [OPTIONS] [TARGET]"
    echo ""
    echo "OPTIONS:"
    echo "  --environment, -e    Environment (production|staging) [default: production]"
    echo "  --method, -m         Rollback method (github|cloudflare|manual) [default: github]"
    echo "  --list, -l           List available rollback targets"
    echo "  --dry-run, -d        Show what would be done without executing"
    echo "  --confirm, -c        Skip confirmation prompts"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "TARGET:"
    echo "  commit-sha           Specific commit to rollback to"
    echo "  release-tag          Specific release tag to rollback to"
    echo "  last-known-good      Rollback to last successful deployment"
    echo "  previous-release     Rollback to previous release"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 --list                                    # List available targets"
    echo "  $0 last-known-good                          # Quick rollback to last good"
    echo "  $0 --environment staging previous-release   # Rollback staging to previous"
    echo "  $0 --method cloudflare abc1234              # Rollback using Cloudflare to commit"
    echo "  $0 --dry-run last-known-good               # See what rollback would do"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking rollback prerequisites..."
    
    # Check git
    if ! command -v git &> /dev/null; then
        error "Git is required for rollback operations"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi
    
    # Check wrangler for Cloudflare rollbacks
    if [ "$ROLLBACK_METHOD" = "cloudflare" ] && ! command -v wrangler &> /dev/null; then
        warning "Wrangler CLI not found. Installing..."
        npm install -g wrangler || {
            error "Failed to install Wrangler CLI"
            exit 1
        }
    fi
    
    success "Prerequisites check passed"
}

# Function to list available rollback targets
list_rollback_targets() {
    log "Available rollback targets:"
    echo ""
    
    info "Recent commits (last 10):"
    git log --oneline -10 --format="%C(yellow)%h%C(reset) %C(blue)%ad%C(reset) %s" --date=short
    echo ""
    
    info "Recent releases:"
    git tag --sort=-version:refname | head -10 | while read -r tag; do
        commit_date=$(git log -1 --format="%ad" --date=short "$tag" 2>/dev/null || echo "N/A")
        commit_msg=$(git log -1 --format="%s" "$tag" 2>/dev/null | cut -c1-50)
        echo "  $tag ($commit_date) - $commit_msg"
    done
    echo ""
    
    info "Deployment history (from GitHub Actions):"
    if command -v gh &> /dev/null; then
        gh run list --workflow=deploy-admin-panel.yml --limit 10 --json conclusion,displayTitle,createdAt,headSha | \
        jq -r '.[] | select(.conclusion == "success") | "\(.headSha[0:7]) \(.createdAt[0:10]) \(.displayTitle)"' | \
        while read -r sha date title; do
            echo "  $sha ($date) - $title"
        done
    else
        warning "GitHub CLI not available. Install 'gh' for deployment history."
    fi
}

# Function to get target commit
get_target_commit() {
    local target="$1"
    
    case "$target" in
        "last-known-good")
            # Find the last successful deployment commit
            if command -v gh &> /dev/null; then
                COMMIT=$(gh run list --workflow=deploy-admin-panel.yml --limit 50 --json conclusion,headSha | \
                        jq -r '.[] | select(.conclusion == "success") | .headSha' | head -1)
                if [ -n "$COMMIT" ]; then
                    echo "$COMMIT"
                    return 0
                fi
            fi
            # Fallback to previous commit
            git rev-parse HEAD~1
            ;;
        "previous-release")
            # Get the previous release tag
            git tag --sort=-version:refname | head -2 | tail -1
            ;;
        *)
            # Assume it's a commit SHA or tag
            if git rev-parse --verify "$target" >/dev/null 2>&1; then
                git rev-parse "$target"
            else
                error "Invalid target: $target"
                exit 1
            fi
            ;;
    esac
}

# Function to perform GitHub rollback
github_rollback() {
    local commit="$1"
    log "Performing GitHub-based rollback to $commit..."
    
    # Create rollback branch
    local rollback_branch="rollback-$(date +%Y%m%d-%H%M%S)"
    
    if [ "$DRY_RUN" = "true" ]; then
        info "[DRY RUN] Would create branch: $rollback_branch"
        info "[DRY RUN] Would reset to commit: $commit"
        info "[DRY RUN] Would push and create PR for rollback"
        return 0
    fi
    
    # Create and checkout rollback branch
    git checkout -b "$rollback_branch"
    git reset --hard "$commit"
    
    # Push rollback branch
    git push origin "$rollback_branch"
    
    # Create pull request if gh CLI is available
    if command -v gh &> /dev/null; then
        gh pr create \
            --title "Emergency Rollback - Admin Panel" \
            --body "Emergency rollback of IT-ERA Admin Panel to commit $commit

**Rollback Details:**
- Target commit: $commit
- Environment: $ENVIRONMENT
- Initiated by: $(git config user.name)
- Timestamp: $(date)

**Next Steps:**
1. Review changes in this PR
2. Merge to trigger deployment
3. Verify rollback success
4. Investigate original issue

**Emergency Contact:**
Contact IT-ERA technical team for assistance." \
            --base main
        
        success "Rollback PR created. Merge to complete rollback."
    else
        success "Rollback branch pushed: $rollback_branch"
        info "Create a pull request manually to complete the rollback"
    fi
}

# Function to perform Cloudflare rollback
cloudflare_rollback() {
    local commit="$1"
    log "Performing Cloudflare rollback to $commit..."
    
    if [ "$DRY_RUN" = "true" ]; then
        info "[DRY RUN] Would checkout commit: $commit"
        info "[DRY RUN] Would rebuild and deploy to Cloudflare"
        return 0
    fi
    
    # Create temporary rollback directory
    local rollback_dir="/tmp/it-era-rollback-$(date +%Y%m%d-%H%M%S)"
    git clone . "$rollback_dir"
    cd "$rollback_dir"
    
    # Checkout target commit
    git checkout "$commit"
    
    # Build and deploy
    cd deployment/cloudflare
    npm install
    
    # Set environment variables
    export ENVIRONMENT="$ENVIRONMENT"
    if [ "$ENVIRONMENT" = "production" ]; then
        export API_BASE_URL="https://it-era-admin-auth-production.bulltech.workers.dev"
    else
        export API_BASE_URL="https://it-era-admin-auth-staging.bulltech.workers.dev"
    fi
    
    # Build
    npm run build
    
    # Deploy
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler pages deploy dist --env production
    else
        wrangler pages deploy dist --env staging
    fi
    
    # Clean up
    cd "$PROJECT_ROOT"
    rm -rf "$rollback_dir"
    
    success "Cloudflare rollback completed"
}

# Function to perform manual rollback
manual_rollback() {
    local commit="$1"
    log "Preparing manual rollback package for $commit..."
    
    # Create rollback package directory
    local package_dir="$PROJECT_ROOT/deployment/rollback/rollback-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$package_dir"
    
    if [ "$DRY_RUN" = "true" ]; then
        info "[DRY RUN] Would create rollback package at: $package_dir"
        info "[DRY RUN] Would include commit: $commit"
        return 0
    fi
    
    # Create temporary build directory
    local build_dir="/tmp/it-era-rollback-build-$(date +%Y%m%d-%H%M%S)"
    git clone . "$build_dir"
    cd "$build_dir"
    
    # Checkout target commit
    git checkout "$commit"
    
    # Build the project
    cd deployment/cloudflare
    npm install
    
    export ENVIRONMENT="$ENVIRONMENT"
    if [ "$ENVIRONMENT" = "production" ]; then
        export API_BASE_URL="https://it-era-admin-auth-production.bulltech.workers.dev"
    else
        export API_BASE_URL="https://it-era-admin-auth-staging.bulltech.workers.dev"
    fi
    
    npm run build
    
    # Copy built files to package directory
    cp -r dist/* "$package_dir/"
    
    # Create rollback instructions
    cat > "$package_dir/ROLLBACK_INSTRUCTIONS.txt" << EOF
IT-ERA Admin Panel - Emergency Rollback Package
Generated: $(date)
Target Commit: $commit
Environment: $ENVIRONMENT

EMERGENCY ROLLBACK INSTRUCTIONS:

1. IMMEDIATE DEPLOYMENT (Cloudflare Pages):
   - Login to Cloudflare Dashboard
   - Go to Pages > it-era-admin-panel-$ENVIRONMENT
   - Click "Create deployment"
   - Upload all files from this directory
   - Wait for deployment completion

2. ALTERNATIVE DEPLOYMENT (Manual Upload):
   - Upload all files to your web server
   - Ensure proper file permissions
   - Test admin panel functionality

3. VERIFICATION:
   - Access admin panel at deployed URL
   - Test login functionality
   - Check all admin sections
   - Monitor for any errors

4. POST-ROLLBACK:
   - Document the incident
   - Investigate original issue
   - Plan proper fix and deployment

EMERGENCY CONTACT: IT-ERA Technical Team
Generated by Emergency Rollback Script
EOF
    
    # Clean up build directory
    rm -rf "$build_dir"
    
    # Create ZIP package
    cd "$PROJECT_ROOT/deployment/rollback"
    zip -r "$(basename "$package_dir").zip" "$(basename "$package_dir")"
    
    success "Manual rollback package created:"
    echo "  📁 Directory: $package_dir"
    echo "  📦 ZIP file: $package_dir.zip"
    echo "  📋 Instructions: $package_dir/ROLLBACK_INSTRUCTIONS.txt"
}

# Function to verify rollback
verify_rollback() {
    log "Verifying rollback deployment..."
    
    # Wait for deployment to propagate
    sleep 30
    
    if [ "$DRY_RUN" = "true" ]; then
        info "[DRY RUN] Would verify deployment at appropriate URL"
        return 0
    fi
    
    # Run verification script
    if [ -f "$SCRIPT_DIR/verify-deployment.js" ]; then
        node "$SCRIPT_DIR/verify-deployment.js" "$ENVIRONMENT"
    else
        warning "Verification script not found. Manual verification recommended."
    fi
}

# Main rollback function
main() {
    local target="${1:-last-known-good}"
    
    log "🚨 IT-ERA Admin Panel Emergency Rollback"
    log "Environment: $ENVIRONMENT"
    log "Method: $ROLLBACK_METHOD"
    log "Target: $target"
    log "Dry Run: $DRY_RUN"
    echo ""
    
    # List targets if requested
    if [ "$LIST_TARGETS" = "true" ]; then
        list_rollback_targets
        exit 0
    fi
    
    # Confirm rollback unless auto-confirmed
    if [ "$AUTO_CONFIRM" != "true" ] && [ "$DRY_RUN" != "true" ]; then
        echo ""
        warning "⚠️  EMERGENCY ROLLBACK CONFIRMATION ⚠️"
        echo ""
        echo "This will rollback the IT-ERA Admin Panel deployment."
        echo "Environment: $ENVIRONMENT"
        echo "Method: $ROLLBACK_METHOD"
        echo "Target: $target"
        echo ""
        read -p "Are you sure you want to proceed? (type 'ROLLBACK' to confirm): " confirmation
        
        if [ "$confirmation" != "ROLLBACK" ]; then
            error "Rollback cancelled by user"
            exit 1
        fi
        echo ""
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Get target commit
    log "Resolving rollback target..."
    COMMIT=$(get_target_commit "$target")
    success "Target resolved to commit: $COMMIT"
    
    # Get commit details
    COMMIT_MSG=$(git log -1 --format="%s" "$COMMIT")
    COMMIT_DATE=$(git log -1 --format="%ad" --date=short "$COMMIT")
    info "Commit details: $COMMIT_DATE - $COMMIT_MSG"
    
    # Perform rollback based on method
    case "$ROLLBACK_METHOD" in
        "github")
            github_rollback "$COMMIT"
            ;;
        "cloudflare")
            cloudflare_rollback "$COMMIT"
            ;;
        "manual")
            manual_rollback "$COMMIT"
            ;;
        *)
            error "Unknown rollback method: $ROLLBACK_METHOD"
            exit 1
            ;;
    esac
    
    # Verify rollback if not manual method
    if [ "$ROLLBACK_METHOD" != "manual" ]; then
        verify_rollback
    fi
    
    success "🎉 Emergency rollback completed!"
    echo ""
    info "Next steps:"
    echo "1. Verify admin panel functionality"
    echo "2. Monitor for any issues"
    echo "3. Document the incident"
    echo "4. Investigate and fix the original problem"
    echo "5. Plan proper deployment of the fix"
}

# Parse command line arguments
ENVIRONMENT="production"
ROLLBACK_METHOD="github"
LIST_TARGETS="false"
DRY_RUN="false"
AUTO_CONFIRM="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -m|--method)
            ROLLBACK_METHOD="$2"
            shift 2
            ;;
        -l|--list)
            LIST_TARGETS="true"
            shift
            ;;
        -d|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        -c|--confirm)
            AUTO_CONFIRM="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            ROLLBACK_TARGET="$1"
            shift
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
    error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: production, staging"
    exit 1
fi

# Validate rollback method
if [[ ! "$ROLLBACK_METHOD" =~ ^(github|cloudflare|manual)$ ]]; then
    error "Invalid rollback method: $ROLLBACK_METHOD"
    echo "Valid methods: github, cloudflare, manual"
    exit 1
fi

# Run main function
main "${ROLLBACK_TARGET:-last-known-good}"