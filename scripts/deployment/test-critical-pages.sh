#!/bin/bash

# IT-ERA Critical Pages Testing Script
# Tests core functionality after Cloudflare deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="it-era.it"
TIMEOUT=30
USER_AGENT="Mozilla/5.0 (compatible; IT-ERA-Test/1.0)"

# Critical pages to test
CRITICAL_PAGES=(
    ""  # Homepage
    "assistenza-it-milano.html"
    "assistenza-it-bergamo.html"
    "assistenza-it-monza.html"
    "assistenza-it-como.html"
    "assistenza-it-lecco.html"
    "cloud-storage-milano.html"
    "cloud-storage-bergamo.html"
    "cloud-storage-monza.html"
    "sicurezza-informatica-milano.html"
    "sicurezza-informatica-bergamo.html"
    "sicurezza-informatica-monza.html"
)

# Service-specific tests
SERVICE_PAGES=(
    "assistenza-it-brianza.html"
    "cloud-storage-como.html"
    "sicurezza-informatica-lecco.html"
)

# Initialize results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}IT-ERA Critical Pages Testing${NC}"
echo -e "${BLUE}Domain: $DOMAIN${NC}"
echo -e "${BLUE}Total pages to test: $((${#CRITICAL_PAGES[@]} + ${#SERVICE_PAGES[@]}))${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to test page
test_page() {
    local page="$1"
    local description="$2"
    local url
    
    if [ -z "$page" ]; then
        url="https://$DOMAIN/"
        description="Homepage"
    else
        url="https://$DOMAIN/$page"
    fi
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "URL: $url"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test HTTP response
    response=$(curl -s -w "%{http_code}|%{time_total}|%{size_download}" \
                   -m $TIMEOUT \
                   -H "User-Agent: $USER_AGENT" \
                   -o /dev/null "$url")
    
    if [ $? -eq 0 ]; then
        status_code=$(echo "$response" | cut -d'|' -f1)
        response_time=$(echo "$response" | cut -d'|' -f2)
        size_download=$(echo "$response" | cut -d'|' -f3)
        
        if [ "$status_code" = "200" ]; then
            echo -e "${GREEN}✓ Status: $status_code (OK)${NC}"
            echo -e "${GREEN}✓ Response time: ${response_time}s${NC}"
            echo -e "${GREEN}✓ Size: $size_download bytes${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            
            # Additional content validation
            content_check=$(curl -s -m $TIMEOUT "$url" | grep -i "it-era" | head -1)
            if [ ! -z "$content_check" ]; then
                echo -e "${GREEN}✓ Content validation: IT-ERA branding found${NC}"
            else
                echo -e "${YELLOW}⚠ Content validation: IT-ERA branding not found${NC}"
            fi
            
        else
            echo -e "${RED}✗ Status: $status_code (Error)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}✗ Request failed (timeout or connection error)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Function to test form functionality
test_contact_form() {
    local page="$1"
    echo -e "${YELLOW}Testing contact form functionality on $page${NC}"
    
    url="https://$DOMAIN/$page"
    form_test=$(curl -s "$url" | grep -i "form.*contact\|form.*contatto" | head -1)
    
    if [ ! -z "$form_test" ]; then
        echo -e "${GREEN}✓ Contact form found${NC}"
        
        # Check for required form fields
        fields_check=$(curl -s "$url" | grep -i "email\|telefono\|nome\|messaggio")
        if [ ! -z "$fields_check" ]; then
            echo -e "${GREEN}✓ Required form fields present${NC}"
        else
            echo -e "${YELLOW}⚠ Some form fields may be missing${NC}"
        fi
    else
        echo -e "${RED}✗ Contact form not found${NC}"
    fi
    echo ""
}

# Function to test SEO elements
test_seo_elements() {
    local page="$1"
    local url
    
    if [ -z "$page" ]; then
        url="https://$DOMAIN/"
    else
        url="https://$DOMAIN/$page"
    fi
    
    echo -e "${YELLOW}Testing SEO elements for $page${NC}"
    
    # Get page content
    content=$(curl -s -m $TIMEOUT "$url")
    
    # Test title tag
    title=$(echo "$content" | grep -i "<title>" | head -1)
    if [[ "$title" == *"IT-ERA"* ]]; then
        echo -e "${GREEN}✓ Title tag contains IT-ERA${NC}"
    else
        echo -e "${YELLOW}⚠ Title tag missing or doesn't contain IT-ERA${NC}"
    fi
    
    # Test meta description
    meta_desc=$(echo "$content" | grep -i "meta.*description" | head -1)
    if [ ! -z "$meta_desc" ]; then
        echo -e "${GREEN}✓ Meta description present${NC}"
    else
        echo -e "${YELLOW}⚠ Meta description missing${NC}"
    fi
    
    # Test canonical URL
    canonical=$(echo "$content" | grep -i "rel=\"canonical\"" | head -1)
    if [[ "$canonical" == *"https://it-era.it"* ]]; then
        echo -e "${GREEN}✓ Canonical URL correct${NC}"
    else
        echo -e "${YELLOW}⚠ Canonical URL missing or incorrect${NC}"
    fi
    
    # Test structured data
    structured_data=$(echo "$content" | grep -i "application/ld\+json\|schema.org" | head -1)
    if [ ! -z "$structured_data" ]; then
        echo -e "${GREEN}✓ Structured data present${NC}"
    else
        echo -e "${YELLOW}⚠ Structured data missing${NC}"
    fi
    
    echo ""
}

# Run critical pages tests
echo -e "${BLUE}Testing Critical Pages...${NC}"
echo ""

for page in "${CRITICAL_PAGES[@]}"; do
    if [ -z "$page" ]; then
        test_page "$page" "Homepage"
        test_contact_form ""
        test_seo_elements ""
    else
        test_page "$page" "$(basename "$page" .html)"
        test_seo_elements "$page"
    fi
done

# Run service-specific tests
echo -e "${BLUE}Testing Service-Specific Pages...${NC}"
echo ""

for page in "${SERVICE_PAGES[@]}"; do
    test_page "$page" "$(basename "$page" .html)"
    test_contact_form "$page"
done

# Performance benchmark
echo -e "${BLUE}Performance Benchmark Test...${NC}"
echo ""

benchmark_url="https://$DOMAIN/"
echo "Testing page load performance..."

perf_result=$(curl -s -w "@-" -o /dev/null "$benchmark_url" <<'EOF'
{
  "time_total": %{time_total},
  "time_connect": %{time_connect},
  "time_starttransfer": %{time_starttransfer},
  "time_namelookup": %{time_namelookup},
  "size_download": %{size_download},
  "speed_download": %{speed_download}
}
EOF
)

echo "Performance Results:"
echo "$perf_result" | jq '.'

# Extract specific metrics
time_total=$(echo "$perf_result" | jq -r '.time_total')
time_connect=$(echo "$perf_result" | jq -r '.time_connect')
size_download=$(echo "$perf_result" | jq -r '.size_download')

# Performance evaluation
if (( $(echo "$time_total < 3.0" | bc -l) )); then
    echo -e "${GREEN}✓ Total load time: ${time_total}s (Good)${NC}"
else
    echo -e "${YELLOW}⚠ Total load time: ${time_total}s (Needs improvement)${NC}"
fi

if (( $(echo "$time_connect < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ Connection time: ${time_connect}s (Good)${NC}"
else
    echo -e "${YELLOW}⚠ Connection time: ${time_connect}s (Slow)${NC}"
fi

echo ""

# Security headers test
echo -e "${BLUE}Security Headers Test...${NC}"
echo ""

security_headers=$(curl -s -I "https://$DOMAIN/" | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)")

if echo "$security_headers" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✓ HSTS header present${NC}"
else
    echo -e "${YELLOW}⚠ HSTS header missing${NC}"
fi

if echo "$security_headers" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓ Content-Type-Options header present${NC}"
else
    echo -e "${YELLOW}⚠ Content-Type-Options header missing${NC}"
fi

if echo "$security_headers" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✓ X-Frame-Options header present${NC}"
else
    echo -e "${YELLOW}⚠ X-Frame-Options header missing${NC}"
fi

echo ""

# Final results
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
echo -e "Success Rate: $success_rate%"

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Deployment successful.${NC}"
    exit 0
elif [ $FAILED_TESTS -le 2 ]; then
    echo -e "${YELLOW}⚠ Some tests failed but deployment may be acceptable.${NC}"
    echo -e "${YELLOW}Review failed tests and consider fixes.${NC}"
    exit 1
else
    echo -e "${RED}❌ MULTIPLE TESTS FAILED! Deployment needs attention.${NC}"
    echo -e "${RED}Consider rollback or immediate fixes.${NC}"
    exit 2
fi