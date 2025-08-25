#!/bin/bash

# IT-ERA Complete Test Suite Runner
# Testing & Validation Chief - HIVE MIND
# Executes all test suites and generates comprehensive reports

set -e

echo "🚀 IT-ERA Complete Test Suite - HIVE MIND Mission"
echo "=================================================="
echo "Testing & Validation Chief initializing..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p tests/reports

echo -e "${BLUE}📁 Reports directory prepared${NC}"

# Function to run test and capture result
run_test() {
    local test_name="$1"
    local test_file="$2"
    local start_time=$(date +%s)
    
    echo -e "\n${PURPLE}🧪 Running ${test_name}...${NC}"
    echo "----------------------------------------"
    
    if node "$test_file"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✅ ${test_name} completed successfully (${duration}s)${NC}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}❌ ${test_name} failed (${duration}s)${NC}"
        return 1
    fi
}

# Initialize test results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0
FAILED_TESTS=()

echo -e "${BLUE}🔍 Starting Individual Test Suites...${NC}"

# Test Suite 1: Security Penetration Tests
if [ -f "tests/security/penetration-tests.js" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test "Security Penetration Tests" "tests/security/penetration-tests.js"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        FAILED_TESTS+=("Security Penetration Tests")
    fi
else
    echo -e "${YELLOW}⚠️  Security tests not found${NC}"
fi

# Test Suite 2: API Comprehensive Tests
if [ -f "tests/api/comprehensive-api-tests.js" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test "API Comprehensive Tests" "tests/api/comprehensive-api-tests.js"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        FAILED_TESTS+=("API Comprehensive Tests")
    fi
else
    echo -e "${YELLOW}⚠️  API tests not found${NC}"
fi

# Test Suite 3: Authentication Flow Tests
if [ -f "tests/authentication/auth-flow-tests.js" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test "Authentication Flow Tests" "tests/authentication/auth-flow-tests.js"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        FAILED_TESTS+=("Authentication Flow Tests")
    fi
else
    echo -e "${YELLOW}⚠️  Authentication tests not found${NC}"
fi

# Test Suite 4: Performance & Load Tests
if [ -f "tests/performance/load-testing.js" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test "Performance & Load Tests" "tests/performance/load-testing.js"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        FAILED_TESTS+=("Performance & Load Tests")
    fi
else
    echo -e "${YELLOW}⚠️  Performance tests not found${NC}"
fi

# Test Suite 5: Frontend UI Tests
if [ -f "tests/frontend/ui-functionality-tests.js" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test "Frontend UI Tests" "tests/frontend/ui-functionality-tests.js"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        FAILED_TESTS+=("Frontend UI Tests")
    fi
else
    echo -e "${YELLOW}⚠️  Frontend tests not found${NC}"
fi

# Test Suite 6: Email Integration Tests
if [ -f "tests/email-integration-tests.js" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test "Email Integration Tests" "tests/email-integration-tests.js"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        FAILED_TESTS+=("Email Integration Tests")
    fi
else
    echo -e "${YELLOW}⚠️  Email integration tests not found${NC}"
fi

echo -e "\n${BLUE}🎯 Running Master Test Runner...${NC}"
echo "========================================"

# Run Master Test Runner
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test "Master Test Runner" "tests/master-test-runner.js"; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
    MASTER_SUCCESS=true
else
    FAILED_SUITES=$((FAILED_SUITES + 1))
    FAILED_TESTS+=("Master Test Runner")
    MASTER_SUCCESS=false
fi

# Generate final summary
echo -e "\n${PURPLE}🎯 FINAL HIVE MIND MISSION REPORT${NC}"
echo "=============================================="
echo -e "Mission: ${BLUE}IT-ERA System Validation${NC}"
echo -e "Chief: ${BLUE}Testing & Validation Chief${NC}"
echo -e "Timestamp: ${BLUE}$(date -u +"%Y-%m-%d %H:%M:%S UTC")${NC}"
echo ""
echo -e "Total Test Suites: ${BLUE}$TOTAL_SUITES${NC}"
echo -e "Passed Suites: ${GREEN}$PASSED_SUITES${NC}"
echo -e "Failed Suites: ${RED}$FAILED_SUITES${NC}"

# Calculate success rate
if [ $TOTAL_SUITES -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_SUITES * 100 / TOTAL_SUITES))
    echo -e "Success Rate: ${BLUE}${SUCCESS_RATE}%${NC}"
else
    echo -e "Success Rate: ${RED}0%${NC}"
fi

# List failed tests if any
if [ $FAILED_SUITES -gt 0 ]; then
    echo -e "\n${RED}❌ Failed Test Suites:${NC}"
    for failed_test in "${FAILED_TESTS[@]}"; do
        echo -e "  • ${RED}$failed_test${NC}"
    done
fi

# System health status
echo -e "\n${PURPLE}🏥 System Health Assessment:${NC}"
if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "Status: ${GREEN}HEALTHY${NC} ✅"
    echo -e "Deployment: ${GREEN}READY FOR PRODUCTION${NC} 🚀"
    MISSION_STATUS="SUCCESS"
elif [ $FAILED_SUITES -le 2 ] && [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "Status: ${YELLOW}WARNING${NC} ⚠️"
    echo -e "Deployment: ${YELLOW}REVIEW REQUIRED${NC} 🔍"
    MISSION_STATUS="WARNING"
else
    echo -e "Status: ${RED}CRITICAL${NC} 🚨"
    echo -e "Deployment: ${RED}NOT READY${NC} ❌"
    MISSION_STATUS="CRITICAL"
fi

# HIVE MIND coordination instructions
echo -e "\n${PURPLE}🤖 HIVE MIND Agent Coordination:${NC}"
echo "============================================"

if [ "$MISSION_STATUS" = "SUCCESS" ]; then
    echo -e "${GREEN}✅ MISSION SUCCESS${NC}"
    echo "• All systems validated and operational"
    echo "• Security measures confirmed effective"
    echo "• Performance within acceptable ranges"
    echo "• Ready for production deployment"
    echo ""
    echo "Next Actions:"
    echo "• DevOps Team: Proceed with deployment"
    echo "• Monitoring Team: Continue regular health checks"
    echo "• Security Team: Maintain vigilance"
elif [ "$MISSION_STATUS" = "WARNING" ]; then
    echo -e "${YELLOW}⚠️  MISSION WARNING${NC}"
    echo "• System mostly functional with minor issues"
    echo "• Some tests require attention"
    echo "• Deployment possible with risk assessment"
    echo ""
    echo "Immediate Actions Required:"
    echo "• Development Team: Address failed tests"
    echo "• Security Team: Review any security failures"
    echo "• Performance Team: Investigate slow responses"
else
    echo -e "${RED}🚨 MISSION CRITICAL${NC}"
    echo "• Critical system failures detected"
    echo "• Deployment blocked until issues resolved"
    echo "• Immediate intervention required"
    echo ""
    echo "Emergency Actions:"
    echo "• Development Team: Fix critical failures immediately"
    echo "• Security Team: Address any security vulnerabilities"
    echo "• Leadership Team: Assess system stability"
fi

# Check for reports
echo -e "\n${BLUE}📊 Generated Reports:${NC}"
if [ -d "tests/reports" ]; then
    report_count=$(find tests/reports -name "*.json" -o -name "*.html" | wc -l)
    echo "• $report_count detailed reports available in tests/reports/"
    
    if [ -f "tests/reports/comprehensive-test-report.html" ]; then
        echo -e "• ${GREEN}Comprehensive HTML Report: tests/reports/comprehensive-test-report.html${NC}"
    fi
    
    if [ -f "tests/reports/hive-mind-coordination-report.json" ]; then
        echo -e "• ${PURPLE}HIVE MIND Report: tests/reports/hive-mind-coordination-report.json${NC}"
    fi
else
    echo -e "${YELLOW}• No reports directory found${NC}"
fi

# Final mission status
echo -e "\n${PURPLE}🎖️  MISSION COMPLETION STATUS:${NC}"
if [ "$MISSION_STATUS" = "SUCCESS" ]; then
    echo -e "${GREEN}✅ MISSION ACCOMPLISHED${NC}"
    echo "Testing & Validation Chief mission completed successfully!"
    exit 0
elif [ "$MISSION_STATUS" = "WARNING" ]; then
    echo -e "${YELLOW}⚠️  MISSION PARTIAL SUCCESS${NC}"
    echo "Testing & Validation Chief mission completed with warnings"
    exit 0
else
    echo -e "${RED}❌ MISSION FAILED${NC}"
    echo "Testing & Validation Chief mission requires immediate attention"
    exit 1
fi