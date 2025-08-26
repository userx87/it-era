#!/bin/bash

# IT-ERA Cloudflare Configuration Validation Script
# Tests all critical redirects and SEO configurations

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="it-era.it"
PAGES_DOMAIN="it-era.pages.dev"
TEST_PAGES=(
    ""
    "assistenza-it-milano.html"
    "cloud-storage-bergamo.html"
    "sicurezza-informatica-monza.html"
    "assistenza-it-como.html"
    "cloud-storage-lecco.html"
)

echo -e "${BLUE}=== IT-ERA Cloudflare Configuration Validation ===${NC}"
echo "Testing production domain: $DOMAIN"
echo "Testing pages domain: $PAGES_DOMAIN"
echo ""

# Function to test HTTP status
test_redirect() {
    local url="$1"
    local expected_location="$2"
    local description="$3"
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "URL: $url"
    
    # Get HTTP status and location header
    response=$(curl -s -I -w "%{http_code}|%{redirect_url}" -o /dev/null "$url")
    status_code=$(echo "$response" | cut -d'|' -f1)
    redirect_url=$(echo "$response" | cut -d'|' -f2)
    
    if [ "$status_code" = "301" ] || [ "$status_code" = "302" ]; then
        echo -e "${GREEN}✓ Status: $status_code (Redirect)${NC}"
        echo "Redirect URL: $redirect_url"
        
        if [[ "$redirect_url" == *"$expected_location"* ]]; then
            echo -e "${GREEN}✓ Redirect target correct${NC}"
        else
            echo -e "${RED}✗ Redirect target incorrect${NC}"
            echo "Expected: $expected_location"
            echo "Got: $redirect_url"
        fi
    elif [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ Status: $status_code (OK)${NC}"
    else
        echo -e "${RED}✗ Status: $status_code${NC}"
    fi
    echo ""
}

# Function to test SSL/TLS
test_ssl() {
    local domain="$1"
    echo -e "${YELLOW}Testing SSL/TLS for: $domain${NC}"
    
    # Test SSL certificate
    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SSL Certificate valid${NC}"
        echo "$ssl_info"
    else
        echo -e "${RED}✗ SSL Certificate error${NC}"
    fi
    
    # Test TLS version
    tls_version=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep "Protocol" | head -1)
    echo "TLS Protocol: $tls_version"
    echo ""
}

# Function to test DNS
test_dns() {
    local domain="$1"
    echo -e "${YELLOW}Testing DNS for: $domain${NC}"
    
    # Test A/AAAA records
    a_record=$(dig +short A "$domain")
    aaaa_record=$(dig +short AAAA "$domain")
    cname_record=$(dig +short CNAME "$domain")
    
    echo "A Record: $a_record"
    echo "AAAA Record: $aaaa_record"
    echo "CNAME Record: $cname_record"
    
    # Test MX record
    mx_record=$(dig +short MX "$domain")
    echo "MX Record: $mx_record"
    
    # Test SPF record
    spf_record=$(dig +short TXT "$domain" | grep "v=spf1")
    echo "SPF Record: $spf_record"
    echo ""
}

# Function to test page performance
test_performance() {
    local url="$1"
    echo -e "${YELLOW}Testing performance for: $url${NC}"
    
    # Test response time and compression
    perf_data=$(curl -s -w "@-" -o /dev/null "$url" <<'EOF'
{
  "time_total": %{time_total},
  "time_connect": %{time_connect},
  "time_starttransfer": %{time_starttransfer},
  "size_download": %{size_download},
  "speed_download": %{speed_download},
  "content_type": "%{content_type}",
  "response_code": %{response_code}
}
EOF
)
    
    echo "$perf_data" | jq '.'
    echo ""
}

# Main validation tests
echo -e "${BLUE}1. DNS Configuration Test${NC}"
test_dns "$DOMAIN"

echo -e "${BLUE}2. SSL/TLS Configuration Test${NC}"
test_ssl "$DOMAIN"

echo -e "${BLUE}3. Page Rules Redirect Test${NC}"

# Test pages.dev to production redirect
for page in "${TEST_PAGES[@]}"; do
    if [ -z "$page" ]; then
        test_redirect "https://$PAGES_DOMAIN/" "https://$DOMAIN/" "Pages domain root redirect"
    else
        test_redirect "https://$PAGES_DOMAIN/$page" "https://$DOMAIN/$page" "Pages domain $page redirect"
    fi
done

# Test www to non-www redirect
test_redirect "https://www.$DOMAIN/" "https://$DOMAIN/" "WWW to non-WWW redirect"

# Test HTTP to HTTPS redirect
test_redirect "http://$DOMAIN/" "https://$DOMAIN/" "HTTP to HTTPS redirect"

echo -e "${BLUE}4. Performance Test${NC}"
test_performance "https://$DOMAIN/"

echo -e "${BLUE}5. Security Headers Test${NC}"
echo "Testing security headers..."
security_headers=$(curl -s -I "https://$DOMAIN/" | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)")
echo "$security_headers"
echo ""

echo -e "${BLUE}6. Cache Test${NC}"
echo "Testing cache headers..."
cache_headers=$(curl -s -I "https://$DOMAIN/" | grep -E "(Cache-Control|ETag|Last-Modified|Expires)")
echo "$cache_headers"
echo ""

echo -e "${GREEN}=== Validation Complete ===${NC}"
echo ""
echo "Additional validation URLs:"
echo "SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "Security Headers: https://securityheaders.com/?q=https%3A%2F%2F$DOMAIN"
echo "GTmetrix: https://gtmetrix.com/?url=https%3A%2F%2F$DOMAIN"
echo "PageSpeed Insights: https://pagespeed.web.dev/?url=https%3A%2F%2F$DOMAIN"