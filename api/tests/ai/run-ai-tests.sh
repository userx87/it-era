#!/bin/bash

# IT-ERA AI Chatbot Test Suite Runner
# Comprehensive testing script for all AI integration components
# Author: Testing Specialist
# Date: 2025-08-24

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV=${NODE_ENV:-development}
API_ENDPOINT=${CHATBOT_API_ENDPOINT:-http://localhost:8788/api/chat}
REPORT_DIR="./tests/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PARALLEL_TESTS=${PARALLEL_TESTS:-false}
VERBOSE=${VERBOSE:-false}

# Test suite files
TEST_SUITES=(
    "comprehensive-ai-chatbot-tests.js"
    "italian-conversation-tests.js"
    "failover-fallback-tests.js" 
    "performance-benchmark-tests.js"
)

# Success criteria
MIN_SUCCESS_RATE=80
MAX_RESPONSE_TIME=10000
MIN_AI_SUCCESS_RATE=95
MAX_COST_PER_CONVERSATION=0.10

echo -e "${BLUE}🚀 IT-ERA AI CHATBOT COMPREHENSIVE TEST SUITE${NC}"
echo "=" | tr ' ' '=' | head -c 80; echo
echo -e "${CYAN}Environment: ${TEST_ENV}${NC}"
echo -e "${CYAN}API Endpoint: ${API_ENDPOINT}${NC}"
echo -e "${CYAN}Test Directory: $(pwd)/tests/ai${NC}"
echo -e "${CYAN}Report Directory: ${REPORT_DIR}${NC}"
echo -e "${CYAN}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${CYAN}Parallel Execution: ${PARALLEL_TESTS}${NC}"
echo "=" | tr ' ' '=' | head -c 80; echo

# Function to print colored status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ ${message}${NC}" ;;
        "ERROR") echo -e "${RED}❌ ${message}${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  ${message}${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  ${message}${NC}" ;;
        "RUNNING") echo -e "${PURPLE}🔄 ${message}${NC}" ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_status "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    if ! node -p "require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION')" 2>/dev/null; then
        print_status "WARNING" "Node.js version $NODE_VERSION may be too old (recommended: $REQUIRED_VERSION+)"
    fi
    
    # Check if test files exist
    for test_file in "${TEST_SUITES[@]}"; do
        if [[ ! -f "./tests/ai/$test_file" ]]; then
            print_status "ERROR" "Test file not found: ./tests/ai/$test_file"
            exit 1
        fi
    done
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    
    print_status "SUCCESS" "Prerequisites check completed"
}

# Function to check API availability
check_api_availability() {
    print_status "INFO" "Checking API availability..."
    
    local health_endpoint="${API_ENDPOINT/\/api\/chat/\/health}"
    
    if curl -s --max-time 5 "$health_endpoint" > /dev/null 2>&1; then
        print_status "SUCCESS" "API is responding at $health_endpoint"
    else
        print_status "WARNING" "API not responding at $health_endpoint"
        print_status "INFO" "Tests will continue but may fail if API is unavailable"
    fi
}

# Function to run a single test suite
run_test_suite() {
    local test_file=$1
    local test_name=${test_file%%.js}
    
    print_status "RUNNING" "Starting $test_name..."
    
    local start_time=$(date +%s)
    local log_file="$REPORT_DIR/test-log-${test_name}-${TIMESTAMP}.log"
    local result_file="$REPORT_DIR/test-result-${test_name}-${TIMESTAMP}.json"
    
    # Set environment variables
    export NODE_ENV=$TEST_ENV
    export CHATBOT_API_ENDPOINT=$API_ENDPOINT
    export TEST_VERBOSE=$VERBOSE
    
    # Run the test suite
    local exit_code=0
    if [[ "$VERBOSE" == "true" ]]; then
        node "./tests/ai/$test_file" 2>&1 | tee "$log_file"
        exit_code=${PIPESTATUS[0]}
    else
        node "./tests/ai/$test_file" > "$log_file" 2>&1
        exit_code=$?
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Create result summary
    cat > "$result_file" << EOF
{
    "testSuite": "$test_name",
    "file": "$test_file",
    "timestamp": "$(date -Iseconds)",
    "duration": $duration,
    "exitCode": $exit_code,
    "success": $([ $exit_code -eq 0 ] && echo "true" || echo "false"),
    "logFile": "$log_file"
}
EOF
    
    if [[ $exit_code -eq 0 ]]; then
        print_status "SUCCESS" "$test_name completed successfully (${duration}s)"
    else
        print_status "ERROR" "$test_name failed with exit code $exit_code (${duration}s)"
        if [[ "$VERBOSE" == "false" ]]; then
            echo -e "${YELLOW}Last 10 lines of log:${NC}"
            tail -10 "$log_file"
        fi
    fi
    
    return $exit_code
}

# Function to run all test suites sequentially
run_tests_sequential() {
    print_status "INFO" "Running test suites sequentially..."
    
    local failed_tests=0
    local total_tests=${#TEST_SUITES[@]}
    
    for test_file in "${TEST_SUITES[@]}"; do
        if ! run_test_suite "$test_file"; then
            ((failed_tests++))
        fi
        echo # Add spacing between tests
    done
    
    return $failed_tests
}

# Function to run all test suites in parallel
run_tests_parallel() {
    print_status "INFO" "Running test suites in parallel..."
    
    local pids=()
    local failed_tests=0
    
    # Start all test suites in background
    for test_file in "${TEST_SUITES[@]}"; do
        run_test_suite "$test_file" &
        pids+=($!)
    done
    
    # Wait for all tests to complete
    for pid in "${pids[@]}"; do
        if ! wait $pid; then
            ((failed_tests++))
        fi
    done
    
    return $failed_tests
}

# Function to generate comprehensive report
generate_comprehensive_report() {
    print_status "INFO" "Generating comprehensive test report..."
    
    local report_file="$REPORT_DIR/comprehensive-test-report-${TIMESTAMP}.html"
    local json_report_file="$REPORT_DIR/comprehensive-test-report-${TIMESTAMP}.json"
    
    # Collect all test results
    local total_tests=${#TEST_SUITES[@]}
    local successful_tests=0
    local total_duration=0
    
    # Count successful tests and calculate total duration
    for test_file in "${TEST_SUITES[@]}"; do
        local test_name=${test_file%%.js}
        local result_file="$REPORT_DIR/test-result-${test_name}-${TIMESTAMP}.json"
        
        if [[ -f "$result_file" ]]; then
            local success=$(jq -r '.success' "$result_file" 2>/dev/null || echo "false")
            local duration=$(jq -r '.duration' "$result_file" 2>/dev/null || echo "0")
            
            if [[ "$success" == "true" ]]; then
                ((successful_tests++))
            fi
            
            total_duration=$((total_duration + duration))
        fi
    done
    
    local success_rate=$((successful_tests * 100 / total_tests))
    
    # Create JSON report
    cat > "$json_report_file" << EOF
{
    "summary": {
        "timestamp": "$(date -Iseconds)",
        "testEnvironment": "$TEST_ENV",
        "apiEndpoint": "$API_ENDPOINT",
        "totalTests": $total_tests,
        "successfulTests": $successful_tests,
        "failedTests": $((total_tests - successful_tests)),
        "successRate": $success_rate,
        "totalDuration": $total_duration,
        "parallelExecution": $PARALLEL_TESTS
    },
    "testSuites": [
EOF

    # Add test suite results
    local first=true
    for test_file in "${TEST_SUITES[@]}"; do
        local test_name=${test_file%%.js}
        local result_file="$REPORT_DIR/test-result-${test_name}-${TIMESTAMP}.json"
        
        if [[ -f "$result_file" ]]; then
            if [[ "$first" == "false" ]]; then
                echo "," >> "$json_report_file"
            fi
            cat "$result_file" >> "$json_report_file"
            first=false
        fi
    done
    
    cat >> "$json_report_file" << EOF
    ],
    "criteria": {
        "minSuccessRate": $MIN_SUCCESS_RATE,
        "maxResponseTime": $MAX_RESPONSE_TIME,
        "minAISuccessRate": $MIN_AI_SUCCESS_RATE,
        "maxCostPerConversation": $MAX_COST_PER_CONVERSATION
    }
}
EOF

    # Create HTML report
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA AI Chatbot Test Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #4caf50; }
        .warning { color: #ff9800; }
        .error { color: #f44336; }
        .test-suite { margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 5px solid #2196f3; background: #f8f9fa; }
        .test-suite.success { border-left-color: #4caf50; background: #e8f5e8; }
        .test-suite.failed { border-left-color: #f44336; background: #ffeaea; }
        .criteria { background: #fff3e0; border: 1px solid #ffcc02; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 IT-ERA AI Chatbot Test Report</h1>
        <p>Comprehensive Testing Results - $TIMESTAMP</p>
    </div>

    <div class="summary">
        <div class="metric-card">
            <div class="metric-value $([ $success_rate -ge $MIN_SUCCESS_RATE ] && echo "success" || echo "error")">$success_rate%</div>
            <div>Success Rate</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">$successful_tests/$total_tests</div>
            <div>Test Suites Passed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${total_duration}s</div>
            <div>Total Duration</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">$(echo $PARALLEL_TESTS | tr '[:lower:]' '[:upper:]')</div>
            <div>Parallel Mode</div>
        </div>
    </div>

    <div class="criteria">
        <h3>📋 Success Criteria</h3>
        <ul>
            <li>Minimum Success Rate: $MIN_SUCCESS_RATE% $([ $success_rate -ge $MIN_SUCCESS_RATE ] && echo "✅" || echo "❌")</li>
            <li>Maximum Response Time: ${MAX_RESPONSE_TIME}ms</li>
            <li>Minimum AI Success Rate: $MIN_AI_SUCCESS_RATE%</li>
            <li>Maximum Cost per Conversation: \$${MAX_COST_PER_CONVERSATION}</li>
        </ul>
    </div>

    <h2>🧪 Test Suite Results</h2>
EOF

    # Add individual test suite results
    for test_file in "${TEST_SUITES[@]}"; do
        local test_name=${test_file%%.js}
        local result_file="$REPORT_DIR/test-result-${test_name}-${TIMESTAMP}.json"
        local log_file="$REPORT_DIR/test-log-${test_name}-${TIMESTAMP}.log"
        
        if [[ -f "$result_file" ]]; then
            local success=$(jq -r '.success' "$result_file" 2>/dev/null || echo "false")
            local duration=$(jq -r '.duration' "$result_file" 2>/dev/null || echo "0")
            local exit_code=$(jq -r '.exitCode' "$result_file" 2>/dev/null || echo "1")
            
            local status_class=$([ "$success" == "true" ] && echo "success" || echo "failed")
            local status_icon=$([ "$success" == "true" ] && echo "✅" || echo "❌")
            
            cat >> "$report_file" << EOF
    <div class="test-suite $status_class">
        <h3>$status_icon ${test_name^}</h3>
        <p><strong>File:</strong> $test_file</p>
        <p><strong>Duration:</strong> ${duration}s</p>
        <p><strong>Exit Code:</strong> $exit_code</p>
        <p><strong>Log File:</strong> <a href="$(basename "$log_file")">$(basename "$log_file")</a></p>
    </div>
EOF
        fi
    done
    
    # Close HTML
    cat >> "$report_file" << EOF
    <div class="footer">
        <p>Generated on $(date) | IT-ERA AI Chatbot Test Suite</p>
        <p>Environment: $TEST_ENV | API: $API_ENDPOINT</p>
    </div>
</body>
</html>
EOF

    print_status "SUCCESS" "Reports generated:"
    print_status "INFO" "  HTML: $report_file"
    print_status "INFO" "  JSON: $json_report_file"
    
    return 0
}

# Function to evaluate overall success
evaluate_overall_success() {
    local successful_tests=$1
    local total_tests=$2
    local success_rate=$((successful_tests * 100 / total_tests))
    
    print_status "INFO" "Evaluating overall test results..."
    
    echo
    echo -e "${CYAN}📊 FINAL TEST RESULTS${NC}"
    echo "=" | tr ' ' '=' | head -c 50; echo
    echo -e "Total Test Suites: $total_tests"
    echo -e "Successful: $successful_tests"
    echo -e "Failed: $((total_tests - successful_tests))"
    echo -e "Success Rate: $success_rate%"
    echo "=" | tr ' ' '=' | head -c 50; echo
    
    if [[ $success_rate -ge $MIN_SUCCESS_RATE ]]; then
        print_status "SUCCESS" "OVERALL RESULT: TESTS PASSED"
        print_status "INFO" "Success rate $success_rate% meets minimum requirement of $MIN_SUCCESS_RATE%"
        
        if [[ $success_rate -eq 100 ]]; then
            echo -e "${GREEN}🎉 Perfect score! All test suites passed successfully.${NC}"
            echo -e "${GREEN}🚀 AI chatbot system is ready for production deployment.${NC}"
        else
            echo -e "${YELLOW}⚠️  Some tests failed, but success criteria are met.${NC}"
            echo -e "${YELLOW}📝 Review failed tests and consider improvements.${NC}"
        fi
        
        return 0
    else
        print_status "ERROR" "OVERALL RESULT: TESTS FAILED"
        print_status "ERROR" "Success rate $success_rate% below minimum requirement of $MIN_SUCCESS_RATE%"
        echo -e "${RED}🚨 Critical issues detected - system not ready for production.${NC}"
        echo -e "${RED}🔧 Address failing test suites before deployment.${NC}"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --parallel     Run tests in parallel (default: sequential)"
    echo "  -v, --verbose      Enable verbose output"
    echo "  -h, --help        Show this help message"
    echo "  -e, --env ENV     Set test environment (development|staging|production)"
    echo "  --api-endpoint URL Set API endpoint URL"
    echo ""
    echo "Environment Variables:"
    echo "  NODE_ENV                 Test environment (default: development)"
    echo "  CHATBOT_API_ENDPOINT     API endpoint URL"
    echo "  PARALLEL_TESTS           Run tests in parallel (true|false)"
    echo "  VERBOSE                  Enable verbose output (true|false)"
    echo ""
    echo "Examples:"
    echo "  $0                       # Run tests sequentially with default settings"
    echo "  $0 --parallel --verbose  # Run tests in parallel with verbose output"
    echo "  $0 --env staging         # Run tests against staging environment"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--parallel)
            PARALLEL_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -e|--env)
            TEST_ENV="$2"
            shift 2
            ;;
        --api-endpoint)
            API_ENDPOINT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    local start_time=$(date +%s)
    
    # Check prerequisites
    check_prerequisites
    
    # Check API availability
    check_api_availability
    
    echo
    print_status "INFO" "Starting comprehensive AI chatbot test suite..."
    echo
    
    # Run tests
    local failed_tests=0
    if [[ "$PARALLEL_TESTS" == "true" ]]; then
        run_tests_parallel || failed_tests=$?
    else
        run_tests_sequential || failed_tests=$?
    fi
    
    local successful_tests=$((${#TEST_SUITES[@]} - failed_tests))
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    echo
    print_status "INFO" "All test suites completed in ${total_duration}s"
    
    # Generate comprehensive report
    generate_comprehensive_report
    
    # Evaluate overall success
    evaluate_overall_success $successful_tests ${#TEST_SUITES[@]}
    local overall_result=$?
    
    echo
    print_status "INFO" "Test suite execution completed!"
    print_status "INFO" "Check the reports directory for detailed results: $REPORT_DIR"
    
    exit $overall_result
}

# Trap signals for cleanup
trap 'print_status "WARNING" "Test execution interrupted"; exit 130' INT TERM

# Execute main function
main "$@"