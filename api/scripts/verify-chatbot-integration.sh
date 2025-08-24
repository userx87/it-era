#!/bin/bash

# IT-ERA API Gateway Chatbot Integration Verification Script
# This script verifies that the chatbot integration is working properly

echo "🚀 IT-ERA API Gateway Chatbot Integration Verification"
echo "===================================================="
echo ""

# Configuration
API_BASE_URL="${API_BASE_URL:-https://api.it-era.it}"
CHATBOT_BASE_URL="${CHATBOT_BASE_URL:-https://it-era-chatbot.bulltech.workers.dev}"

echo "🔧 Configuration:"
echo "   API Gateway: $API_BASE_URL"
echo "   Chatbot Service: $CHATBOT_BASE_URL"
echo ""

# Test functions
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local headers="$4"
    local data="$5"
    
    echo -n "Testing $name... "
    
    local curl_cmd="curl -s -w '%{http_code}' -o /tmp/response.body"
    
    if [ ! -z "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST"
        if [ ! -z "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    elif [ "$method" = "OPTIONS" ]; then
        curl_cmd="$curl_cmd -X OPTIONS"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local status_code=$(eval $curl_cmd)
    local response_body=$(cat /tmp/response.body 2>/dev/null || echo "")
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 400 ]; then
        echo "✅ $status_code"
        return 0
    else
        echo "❌ $status_code"
        if [ ! -z "$response_body" ] && [ ${#response_body} -lt 200 ]; then
            echo "   Response: $response_body"
        fi
        return 1
    fi
}

# Cleanup function
cleanup() {
    rm -f /tmp/response.body
}
trap cleanup EXIT

# Run tests
echo "📋 Running Integration Tests:"
echo ""

# 1. Test main API health check
test_endpoint "Main API Health Check" "$API_BASE_URL/api/health"
main_health_result=$?

# 2. Test chatbot health through gateway
test_endpoint "Chatbot Health via Gateway" "$API_BASE_URL/health" "GET" "-H 'User-Agent: chatbot-health-check'"
chatbot_health_result=$?

# 3. Test CORS preflight
test_endpoint "CORS Preflight for Chatbot" "$API_BASE_URL/api/chat" "OPTIONS" "-H 'Origin: https://it-era.it' -H 'Access-Control-Request-Method: POST'"
cors_result=$?

# 4. Test API documentation
test_endpoint "API Documentation" "$API_BASE_URL/api"
docs_result=$?

# 5. Test chatbot endpoint routing
test_endpoint "Chatbot Chat Endpoint" "$API_BASE_URL/api/chat" "POST" "-H 'Content-Type: application/json'" '{"action":"start"}'
chat_result=$?

# 6. Test chatbot analytics routing
test_endpoint "Chatbot Analytics Routing" "$API_BASE_URL/analytics" "GET" "-H 'X-Chatbot-Request: true'"
analytics_result=$?

echo ""

# Check specific integration points
echo "🔍 Integration Point Verification:"
echo ""

# Check if API documentation includes chatbot endpoints
echo -n "Checking API documentation for chatbot endpoints... "
if curl -s "$API_BASE_URL/api" | grep -q '"chatbot"'; then
    echo "✅ Found"
else
    echo "❌ Missing"
fi

# Check if health check includes chatbot status
echo -n "Checking health response for chatbot service status... "
if curl -s "$API_BASE_URL/api/health" | grep -q '"chatbot"'; then
    echo "✅ Found"
else
    echo "❌ Missing"
fi

echo ""

# Calculate results
total_tests=6
passed_tests=0

[ $main_health_result -eq 0 ] && ((passed_tests++))
[ $chatbot_health_result -eq 0 ] && ((passed_tests++))
[ $cors_result -eq 0 ] && ((passed_tests++))
[ $docs_result -eq 0 ] && ((passed_tests++))
[ $chat_result -eq 0 ] && ((passed_tests++))
[ $analytics_result -eq 0 ] && ((passed_tests++))

echo "📊 Test Summary:"
echo "   Passed: $passed_tests/$total_tests"

if [ $passed_tests -eq $total_tests ]; then
    echo "   Status: ✅ All tests passed - Integration successful!"
    exit 0
else
    echo "   Status: ❌ Some tests failed - Check configuration"
    
    echo ""
    echo "🛠️  Troubleshooting Tips:"
    
    if [ $main_health_result -ne 0 ]; then
        echo "   - Main API health check failed: Check API Gateway deployment"
    fi
    
    if [ $chatbot_health_result -ne 0 ]; then
        echo "   - Chatbot health check failed: Verify chatbot handler import and KV bindings"
    fi
    
    if [ $cors_result -ne 0 ]; then
        echo "   - CORS preflight failed: Check CORS headers configuration in API Gateway"
    fi
    
    if [ $docs_result -ne 0 ]; then
        echo "   - API documentation failed: Check API Gateway endpoint documentation"
    fi
    
    if [ $chat_result -ne 0 ]; then
        echo "   - Chatbot chat endpoint failed: Verify routing and chatbot handler"
    fi
    
    if [ $analytics_result -ne 0 ]; then
        echo "   - Analytics routing failed: Check routing priority and header handling"
    fi
    
    exit 1
fi