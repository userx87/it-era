/**
 * Network Monitoring Utilities for Puppeteer Tests
 * Comprehensive network diagnostics and API monitoring
 */

class NetworkMonitor {
    constructor(page, options = {}) {
        this.page = page;
        this.options = {
            trackRequests: true,
            trackResponses: true,
            trackFailures: true,
            trackCORS: true,
            trackAPI: true,
            logLevel: options.logLevel || 'info', // 'debug', 'info', 'warn', 'error'
            ...options
        };

        this.requests = [];
        this.responses = [];
        this.failures = [];
        this.apiCalls = [];
        this.corsIssues = [];
        this.performanceMetrics = {};

        this.startTime = Date.now();
        this.setupMonitoring();
    }

    /**
     * Setup all network monitoring listeners
     */
    setupMonitoring() {
        if (this.options.trackRequests) {
            this.page.on('request', this.handleRequest.bind(this));
        }

        if (this.options.trackResponses) {
            this.page.on('response', this.handleResponse.bind(this));
        }

        if (this.options.trackFailures) {
            this.page.on('requestfailed', this.handleRequestFailed.bind(this));
        }

        // Performance metrics
        this.page.on('framenavigated', this.handleNavigation.bind(this));
        
        this.log('debug', 'Network monitoring initialized');
    }

    /**
     * Handle outgoing requests
     */
    handleRequest(request) {
        const requestData = {
            id: this.generateRequestId(),
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            resourceType: request.resourceType(),
            postData: request.postData(),
            timestamp: Date.now(),
            timing: {
                start: Date.now()
            }
        };

        this.requests.push(requestData);

        // Track API calls specifically
        if (this.isAPICall(request.url())) {
            this.apiCalls.push({
                ...requestData,
                type: 'api_request'
            });
            
            this.log('info', `🌐 API Request: ${request.method()} ${request.url()}`);
        }

        // Check for potential CORS preflight
        if (request.method() === 'OPTIONS') {
            this.log('debug', `🔍 CORS Preflight: ${request.url()}`);
        }

        // Log based on resource type
        if (this.options.logLevel === 'debug') {
            this.log('debug', `📤 Request: ${request.method()} ${request.url()} [${request.resourceType()}]`);
        }
    }

    /**
     * Handle incoming responses
     */
    async handleResponse(response) {
        const request = response.request();
        const requestData = this.requests.find(req => req.url === request.url());
        
        const responseData = {
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            timestamp: Date.now(),
            timing: {
                end: Date.now(),
                duration: requestData ? Date.now() - requestData.timing.start : null
            }
        };

        this.responses.push(responseData);

        // Update request data with response timing
        if (requestData) {
            requestData.timing.end = Date.now();
            requestData.timing.duration = responseData.timing.duration;
            requestData.status = response.status();
        }

        // Check for API responses
        if (this.isAPICall(response.url())) {
            const apiResponse = {
                ...responseData,
                type: 'api_response',
                body: null
            };

            try {
                // Try to capture response body for API calls (be careful with large responses)
                if (response.headers()['content-type']?.includes('application/json')) {
                    apiResponse.body = await response.text();
                }
            } catch (error) {
                this.log('warn', `Failed to capture API response body: ${error.message}`);
            }

            const apiCall = this.apiCalls.find(call => call.url === response.url());
            if (apiCall) {
                apiCall.response = apiResponse;
                apiCall.completed = true;
            }

            const statusColor = response.status() >= 400 ? '\x1b[31m' : '\x1b[32m';
            this.log('info', `${statusColor}📡 API Response: ${response.url()} - ${response.status()} (${responseData.timing.duration}ms)\x1b[0m`);
        }

        // CORS issue detection
        if (this.options.trackCORS && this.detectCORSIssue(response)) {
            this.handleCORSIssue(response, requestData);
        }

        // Performance tracking for critical resources
        if (request.resourceType() === 'document') {
            this.performanceMetrics.documentLoad = responseData.timing.duration;
        }
    }

    /**
     * Handle request failures
     */
    handleRequestFailed(request) {
        const failure = request.failure();
        const failureData = {
            url: request.url(),
            method: request.method(),
            error: failure.errorText,
            timestamp: Date.now()
        };

        this.failures.push(failureData);

        // Update original request data
        const requestData = this.requests.find(req => req.url === request.url());
        if (requestData) {
            requestData.failed = true;
            requestData.failure = failure;
        }

        // Special handling for API failures
        if (this.isAPICall(request.url())) {
            const apiCall = this.apiCalls.find(call => call.url === request.url());
            if (apiCall) {
                apiCall.failed = true;
                apiCall.failure = failure;
            }
        }

        // Check if this is a CORS-related failure
        if (this.isCORSFailure(failure)) {
            this.corsIssues.push({
                ...failureData,
                type: 'cors_failure',
                diagnosis: this.diagnoseCORSIssue(request, failure)
            });
        }

        this.log('error', `🔥 Request Failed: ${request.url()} - ${failure.errorText}`);
    }

    /**
     * Handle navigation events for performance tracking
     */
    handleNavigation(frame) {
        if (frame === this.page.mainFrame()) {
            this.performanceMetrics.navigationTime = Date.now();
            this.log('debug', `🧭 Navigation to: ${frame.url()}`);
        }
    }

    /**
     * Check if URL is an API call
     */
    isAPICall(url) {
        const apiPatterns = [
            '/api/',
            '/chat',
            '/bot',
            'chatbot',
            'workers.dev',
            'cloudflare.com',
            '.workers.dev',
            '/webhook',
            '/v1/',
            'openai.com',
            'anthropic.com'
        ];

        return apiPatterns.some(pattern => url.includes(pattern));
    }

    /**
     * Detect CORS issues in responses
     */
    detectCORSIssue(response) {
        const headers = response.headers();
        const status = response.status();
        
        // Check for missing CORS headers on cross-origin requests
        if (this.isCrossOrigin(response.url()) && !headers['access-control-allow-origin']) {
            return true;
        }

        // Check for CORS-related status codes
        if (status === 0) {
            return true;
        }

        return false;
    }

    /**
     * Handle CORS issues
     */
    handleCORSIssue(response, requestData) {
        const corsIssue = {
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
            timestamp: Date.now(),
            type: 'cors_response',
            diagnosis: this.diagnoseCORSIssue(response.request(), null, response)
        };

        this.corsIssues.push(corsIssue);
        this.log('warn', `⚠️ CORS Issue detected: ${response.url()}`);
    }

    /**
     * Check if failure is CORS-related
     */
    isCORSFailure(failure) {
        const corsKeywords = [
            'CORS',
            'Cross-Origin',
            'Access-Control',
            'net::ERR_FAILED',
            'net::ERR_BLOCKED_BY_CLIENT'
        ];

        return corsKeywords.some(keyword => failure.errorText.includes(keyword));
    }

    /**
     * Diagnose CORS issues
     */
    diagnoseCORSIssue(request, failure, response = null) {
        const diagnosis = {
            url: request.url(),
            method: request.method(),
            origin: this.page.url(),
            issues: [],
            recommendations: []
        };

        if (failure) {
            diagnosis.issues.push(`Request failed: ${failure.errorText}`);
            
            if (failure.errorText.includes('CORS')) {
                diagnosis.recommendations.push('Add Access-Control-Allow-Origin header to API response');
                diagnosis.recommendations.push('Check if API supports CORS preflight requests');
            }
        }

        if (response) {
            const headers = response.headers();
            
            if (!headers['access-control-allow-origin']) {
                diagnosis.issues.push('Missing Access-Control-Allow-Origin header');
                diagnosis.recommendations.push('Add CORS headers to API server');
            }

            if (request.method() !== 'GET' && !headers['access-control-allow-methods']) {
                diagnosis.issues.push('Missing Access-Control-Allow-Methods header for non-GET request');
                diagnosis.recommendations.push('Add Access-Control-Allow-Methods header');
            }
        }

        return diagnosis;
    }

    /**
     * Check if request is cross-origin
     */
    isCrossOrigin(url) {
        try {
            const requestUrl = new URL(url);
            const pageUrl = new URL(this.page.url());
            
            return requestUrl.origin !== pageUrl.origin;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Logging utility
     */
    log(level, message) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.options.logLevel);
        const messageLevelIndex = levels.indexOf(level);

        if (messageLevelIndex >= currentLevelIndex) {
            console.log(`[NetworkMonitor] ${message}`);
        }
    }

    /**
     * Get comprehensive network analysis
     */
    getNetworkAnalysis() {
        const analysis = {
            summary: {
                totalRequests: this.requests.length,
                totalResponses: this.responses.length,
                totalFailures: this.failures.length,
                totalAPIRequests: this.apiCalls.length,
                corsIssues: this.corsIssues.length,
                testDuration: Date.now() - this.startTime
            },
            performance: this.getPerformanceAnalysis(),
            api: this.getAPIAnalysis(),
            cors: this.getCORSAnalysis(),
            failures: this.getFailureAnalysis(),
            recommendations: this.getRecommendations()
        };

        return analysis;
    }

    /**
     * Get performance analysis
     */
    getPerformanceAnalysis() {
        const analysis = {
            averageResponseTime: 0,
            slowestRequests: [],
            resourceTypeBreakdown: {},
            cacheEfficiency: {
                cached: 0,
                notCached: 0
            }
        };

        // Calculate average response time
        const requestsWithTiming = this.requests.filter(req => req.timing.duration);
        if (requestsWithTiming.length > 0) {
            analysis.averageResponseTime = Math.round(
                requestsWithTiming.reduce((sum, req) => sum + req.timing.duration, 0) / requestsWithTiming.length
            );
        }

        // Find slowest requests
        analysis.slowestRequests = requestsWithTiming
            .sort((a, b) => b.timing.duration - a.timing.duration)
            .slice(0, 5)
            .map(req => ({
                url: req.url,
                duration: req.timing.duration,
                method: req.method,
                resourceType: req.resourceType
            }));

        // Resource type breakdown
        this.requests.forEach(req => {
            analysis.resourceTypeBreakdown[req.resourceType] = 
                (analysis.resourceTypeBreakdown[req.resourceType] || 0) + 1;
        });

        // Cache analysis
        this.responses.forEach(res => {
            const cacheControl = res.headers['cache-control'];
            if (cacheControl && !cacheControl.includes('no-cache')) {
                analysis.cacheEfficiency.cached++;
            } else {
                analysis.cacheEfficiency.notCached++;
            }
        });

        return analysis;
    }

    /**
     * Get API-specific analysis
     */
    getAPIAnalysis() {
        const analysis = {
            totalCalls: this.apiCalls.length,
            successfulCalls: this.apiCalls.filter(call => call.status >= 200 && call.status < 400).length,
            failedCalls: this.apiCalls.filter(call => call.failed || call.status >= 400).length,
            averageResponseTime: 0,
            endpoints: {}
        };

        // Calculate API average response time
        const completedCalls = this.apiCalls.filter(call => call.timing && call.timing.duration);
        if (completedCalls.length > 0) {
            analysis.averageResponseTime = Math.round(
                completedCalls.reduce((sum, call) => sum + call.timing.duration, 0) / completedCalls.length
            );
        }

        // Endpoint analysis
        this.apiCalls.forEach(call => {
            const endpoint = this.extractEndpoint(call.url);
            if (!analysis.endpoints[endpoint]) {
                analysis.endpoints[endpoint] = {
                    calls: 0,
                    successes: 0,
                    failures: 0,
                    averageTime: 0
                };
            }

            analysis.endpoints[endpoint].calls++;
            
            if (call.failed || (call.status && call.status >= 400)) {
                analysis.endpoints[endpoint].failures++;
            } else if (call.status && call.status >= 200 && call.status < 400) {
                analysis.endpoints[endpoint].successes++;
            }
        });

        return analysis;
    }

    /**
     * Get CORS analysis
     */
    getCORSAnalysis() {
        return {
            totalIssues: this.corsIssues.length,
            issueTypes: this.corsIssues.reduce((types, issue) => {
                types[issue.type] = (types[issue.type] || 0) + 1;
                return types;
            }, {}),
            affectedEndpoints: [...new Set(this.corsIssues.map(issue => issue.url))],
            commonDiagnoses: this.corsIssues.map(issue => issue.diagnosis)
        };
    }

    /**
     * Get failure analysis
     */
    getFailureAnalysis() {
        const analysis = {
            totalFailures: this.failures.length,
            errorTypes: {},
            failedEndpoints: []
        };

        this.failures.forEach(failure => {
            analysis.errorTypes[failure.error] = (analysis.errorTypes[failure.error] || 0) + 1;
            analysis.failedEndpoints.push({
                url: failure.url,
                method: failure.method,
                error: failure.error
            });
        });

        return analysis;
    }

    /**
     * Generate recommendations based on analysis
     */
    getRecommendations() {
        const recommendations = [];

        // Performance recommendations
        if (this.getPerformanceAnalysis().averageResponseTime > 1000) {
            recommendations.push({
                category: 'Performance',
                issue: 'Slow average response time',
                recommendation: 'Optimize API response times and consider caching strategies'
            });
        }

        // API recommendations
        const apiAnalysis = this.getAPIAnalysis();
        if (apiAnalysis.failedCalls > 0) {
            recommendations.push({
                category: 'API',
                issue: `${apiAnalysis.failedCalls} API calls failed`,
                recommendation: 'Review API error handling and implement retry mechanisms'
            });
        }

        // CORS recommendations
        if (this.corsIssues.length > 0) {
            recommendations.push({
                category: 'CORS',
                issue: `${this.corsIssues.length} CORS issues detected`,
                recommendation: 'Configure proper CORS headers on API servers'
            });
        }

        // General failure recommendations
        if (this.failures.length > 0) {
            recommendations.push({
                category: 'Network',
                issue: `${this.failures.length} network requests failed`,
                recommendation: 'Investigate network connectivity and endpoint availability'
            });
        }

        return recommendations;
    }

    /**
     * Extract endpoint from URL for analysis
     */
    extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.origin}${urlObj.pathname}`;
        } catch (error) {
            return url;
        }
    }

    /**
     * Generate network report
     */
    generateReport() {
        const analysis = this.getNetworkAnalysis();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 NETWORK MONITORING REPORT');
        console.log('='.repeat(60));
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Requests: ${analysis.summary.totalRequests}`);
        console.log(`   Total Responses: ${analysis.summary.totalResponses}`);
        console.log(`   Total Failures: ${analysis.summary.totalFailures}`);
        console.log(`   API Requests: ${analysis.summary.totalAPIRequests}`);
        console.log(`   CORS Issues: ${analysis.summary.corsIssues}`);
        console.log(`   Test Duration: ${analysis.summary.testDuration}ms`);
        
        if (analysis.performance.averageResponseTime > 0) {
            console.log(`\n⚡ PERFORMANCE:`);
            console.log(`   Average Response Time: ${analysis.performance.averageResponseTime}ms`);
            
            if (analysis.performance.slowestRequests.length > 0) {
                console.log(`   Slowest Requests:`);
                analysis.performance.slowestRequests.forEach((req, index) => {
                    console.log(`     ${index + 1}. ${req.url} - ${req.duration}ms`);
                });
            }
        }
        
        if (analysis.api.totalCalls > 0) {
            console.log(`\n🌐 API ANALYSIS:`);
            console.log(`   Total API Calls: ${analysis.api.totalCalls}`);
            console.log(`   Successful: ${analysis.api.successfulCalls}`);
            console.log(`   Failed: ${analysis.api.failedCalls}`);
            console.log(`   Average Response Time: ${analysis.api.averageResponseTime}ms`);
        }
        
        if (analysis.recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS:`);
            analysis.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. [${rec.category}] ${rec.issue}`);
                console.log(`      → ${rec.recommendation}`);
            });
        }
        
        console.log('='.repeat(60));
        
        return analysis;
    }
}

module.exports = NetworkMonitor;