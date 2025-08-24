/**
 * Performance Benchmark Tests for IT-ERA Admin Panel
 * Tests response times, throughput, and resource usage
 */

const testData = require('../fixtures/testData');

describe('Performance Benchmarks', () => {
  let authToken;
  let performanceMetrics = {
    api: {},
    database: {},
    memory: {},
    concurrent: {}
  };

  beforeAll(async () => {
    const loginResponse = await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
    authToken = loginResponse.data.token;
    console.log('🚀 Starting Performance Benchmarks for IT-ERA Admin Panel');
  });

  afterAll(() => {
    console.log('\n📊 Performance Benchmark Results:');
    console.table(performanceMetrics);
  });

  describe('API Response Time Benchmarks', () => {
    test('should measure authentication endpoint performance', async () => {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        try {
          await testUtils.apiRequest('POST', '/auth/login', testData.validCredentials);
          const end = performance.now();
          times.push(end - start);
        } catch (error) {
          // May fail due to rate limiting - that's expected
          if (!error.message.includes('429')) {
            throw error;
          }
        }
        
        await testUtils.waitFor(100); // Avoid rate limiting
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      performanceMetrics.api.authLogin = {
        average: `${avgTime.toFixed(2)}ms`,
        min: `${minTime.toFixed(2)}ms`,
        max: `${maxTime.toFixed(2)}ms`,
        samples: times.length
      };

      console.log(`🔐 Authentication Performance: Avg ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE);
      expect(maxTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE * 2);
    }, 30000);

    test('should measure posts listing endpoint performance', async () => {
      const iterations = 20;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await testUtils.apiRequest('GET', '/api/posts', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      performanceMetrics.api.postsList = {
        average: `${avgTime.toFixed(2)}ms`,
        p95: `${p95Time.toFixed(2)}ms`,
        samples: times.length
      };

      console.log(`📝 Posts Listing Performance: Avg ${avgTime.toFixed(2)}ms, P95 ${p95Time.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE);
    });

    test('should measure dashboard stats endpoint performance', async () => {
      const iterations = 15;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await testUtils.apiRequest('GET', '/api/dashboard/stats', null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      performanceMetrics.api.dashboardStats = {
        average: `${avgTime.toFixed(2)}ms`,
        samples: times.length
      };

      console.log(`📊 Dashboard Stats Performance: Avg ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE);
    });
  });

  describe('CRUD Operations Performance', () => {
    test('should benchmark post creation performance', async () => {
      const iterations = 10;
      const times = [];
      const createdPosts = [];

      for (let i = 0; i < iterations; i++) {
        const postData = {
          title: `Performance Test Post ${i}`,
          content: `Content for performance test post ${i}. This is a longer content to simulate real-world usage patterns and ensure the performance test is realistic.`,
          status: 'draft'
        };

        const start = performance.now();
        
        const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        const end = performance.now();
        times.push(end - start);
        createdPosts.push(response.data.id);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      performanceMetrics.database.postCreation = {
        average: `${avgTime.toFixed(2)}ms`,
        samples: times.length
      };

      console.log(`➕ Post Creation Performance: Avg ${avgTime.toFixed(2)}ms`);

      // Cleanup
      for (const postId of createdPosts) {
        try {
          await testUtils.apiRequest('DELETE', `/api/posts/${postId}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        } catch (error) {
          console.warn(`Failed to cleanup post ${postId}`);
        }
      }

      expect(avgTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE * 2);
    });

    test('should benchmark post update performance', async () => {
      // Create a test post first
      const postResponse = await testUtils.apiRequest('POST', '/api/posts', {
        title: 'Update Performance Test Post',
        content: 'Initial content for update performance test'
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      const postId = postResponse.data.id;
      const iterations = 15;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const updateData = {
          title: `Updated Performance Test Post ${i}`,
          content: `Updated content iteration ${i} with more details to test update performance.`
        };

        const start = performance.now();
        
        await testUtils.apiRequest('PUT', `/api/posts/${postId}`, updateData, {
          'Authorization': `Bearer ${authToken}`
        });
        
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      performanceMetrics.database.postUpdate = {
        average: `${avgTime.toFixed(2)}ms`,
        samples: times.length
      };

      console.log(`✏️ Post Update Performance: Avg ${avgTime.toFixed(2)}ms`);

      // Cleanup
      await testUtils.apiRequest('DELETE', `/api/posts/${postId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });

      expect(avgTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE * 1.5);
    });
  });

  describe('Pagination Performance', () => {
    test('should measure pagination performance with different page sizes', async () => {
      const pageSizes = [10, 25, 50, 100];
      const results = {};

      for (const pageSize of pageSizes) {
        const times = [];

        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          
          await testUtils.apiRequest('GET', `/api/posts?page=1&limit=${pageSize}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
          
          const end = performance.now();
          times.push(end - start);
        }

        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        results[`pageSize${pageSize}`] = `${avgTime.toFixed(2)}ms`;
      }

      performanceMetrics.database.pagination = results;
      console.log('📄 Pagination Performance:', results);

      // Larger page sizes should not be dramatically slower
      const smallPageTime = parseFloat(results.pageSize10);
      const largePageTime = parseFloat(results.pageSize100);
      expect(largePageTime / smallPageTime).toBeLessThan(3);
    });
  });

  describe('Search Performance', () => {
    test('should benchmark search functionality performance', async () => {
      const searchTerms = ['IT', 'Milano', 'assistenza', 'test', 'sicurezza'];
      const times = [];

      for (const term of searchTerms) {
        const start = performance.now();
        
        await testUtils.apiRequest('GET', `/api/posts?search=${encodeURIComponent(term)}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      performanceMetrics.database.search = {
        average: `${avgTime.toFixed(2)}ms`,
        samples: times.length
      };

      console.log(`🔍 Search Performance: Avg ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE * 2);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent read requests', async () => {
      const concurrency = 10;
      const promises = [];
      
      const start = performance.now();

      for (let i = 0; i < concurrency; i++) {
        promises.push(
          testUtils.apiRequest('GET', '/api/posts', null, {
            'Authorization': `Bearer ${authToken}`
          })
        );
      }

      const results = await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const avgTimePerRequest = totalTime / concurrency;

      performanceMetrics.concurrent.readRequests = {
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgPerRequest: `${avgTimePerRequest.toFixed(2)}ms`,
        concurrency: concurrency,
        successfulRequests: results.length
      };

      console.log(`🔄 Concurrent Reads: ${concurrency} requests in ${totalTime.toFixed(2)}ms`);

      expect(results.every(result => result.status === 200)).toBe(true);
      expect(totalTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE * 3);
    });

    test('should handle concurrent write requests', async () => {
      const concurrency = 5;
      const promises = [];
      const start = performance.now();

      for (let i = 0; i < concurrency; i++) {
        const postData = {
          title: `Concurrent Test Post ${i}`,
          content: `Content for concurrent test post ${i}`
        };

        promises.push(
          testUtils.apiRequest('POST', '/api/posts', postData, {
            'Authorization': `Bearer ${authToken}`
          })
        );
      }

      const results = await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const successfulCreations = results.filter(result => result.status === 201);

      performanceMetrics.concurrent.writeRequests = {
        totalTime: `${totalTime.toFixed(2)}ms`,
        concurrency: concurrency,
        successfulCreations: successfulCreations.length
      };

      console.log(`✍️ Concurrent Writes: ${successfulCreations.length}/${concurrency} successful in ${totalTime.toFixed(2)}ms`);

      // Cleanup
      for (const result of successfulCreations) {
        try {
          await testUtils.apiRequest('DELETE', `/api/posts/${result.data.id}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        } catch (error) {
          console.warn(`Failed to cleanup post ${result.data.id}`);
        }
      }

      expect(successfulCreations.length).toBeGreaterThanOrEqual(concurrency * 0.8); // Allow some failures
    });
  });

  describe('Memory Usage Performance', () => {
    test('should monitor memory usage during bulk operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create bulk data
      const bulkData = testData.performanceData.bulkPosts.slice(0, 20);
      const createdPosts = [];

      for (const postData of bulkData) {
        try {
          const response = await testUtils.apiRequest('POST', '/api/posts', postData, {
            'Authorization': `Bearer ${authToken}`
          });
          createdPosts.push(response.data.id);
        } catch (error) {
          console.warn('Bulk creation failed:', error.message);
        }
      }

      const peakMemory = process.memoryUsage();
      
      // Cleanup
      for (const postId of createdPosts) {
        try {
          await testUtils.apiRequest('DELETE', `/api/posts/${postId}`, null, {
            'Authorization': `Bearer ${authToken}`
          });
        } catch (error) {
          console.warn(`Failed to cleanup post ${postId}`);
        }
      }

      const finalMemory = process.memoryUsage();
      
      performanceMetrics.memory.bulkOperations = {
        initialHeap: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        peakHeap: `${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        finalHeap: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
        operations: bulkData.length
      };

      console.log('💾 Memory Usage:', performanceMetrics.memory.bulkOperations);

      // Memory should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    }, 60000);
  });

  describe('Cache Performance', () => {
    test('should measure cache effectiveness for repeated requests', async () => {
      const endpoint = '/api/categories';
      const iterations = 10;

      // First request (cold)
      const coldStart = performance.now();
      await testUtils.apiRequest('GET', endpoint, null, {
        'Authorization': `Bearer ${authToken}`
      });
      const coldEnd = performance.now();
      const coldTime = coldEnd - coldStart;

      // Subsequent requests (potentially cached)
      const warmTimes = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await testUtils.apiRequest('GET', endpoint, null, {
          'Authorization': `Bearer ${authToken}`
        });
        const end = performance.now();
        warmTimes.push(end - start);
      }

      const avgWarmTime = warmTimes.reduce((sum, time) => sum + time, 0) / warmTimes.length;
      
      performanceMetrics.api.caching = {
        coldRequest: `${coldTime.toFixed(2)}ms`,
        avgWarmRequest: `${avgWarmTime.toFixed(2)}ms`,
        improvement: `${((coldTime - avgWarmTime) / coldTime * 100).toFixed(1)}%`
      };

      console.log(`🗄️ Cache Performance: Cold ${coldTime.toFixed(2)}ms, Warm ${avgWarmTime.toFixed(2)}ms`);

      // Warm requests should generally be faster (though not always due to network variability)
      expect(avgWarmTime).toBeLessThan(TEST_CONFIG.TIMEOUTS.PERFORMANCE);
    });
  });

  describe('Load Testing Simulation', () => {
    test('should simulate realistic load patterns', async () => {
      const operations = [
        { method: 'GET', endpoint: '/api/posts', weight: 60 },
        { method: 'GET', endpoint: '/api/dashboard/stats', weight: 20 },
        { method: 'GET', endpoint: '/api/categories', weight: 15 },
        { method: 'GET', endpoint: '/api/tags', weight: 5 }
      ];

      const totalOperations = 50;
      const promises = [];
      const results = [];

      const loadTestStart = performance.now();

      for (let i = 0; i < totalOperations; i++) {
        // Select operation based on weight
        const rand = Math.random() * 100;
        let cumWeight = 0;
        let selectedOp = operations[0];

        for (const op of operations) {
          cumWeight += op.weight;
          if (rand <= cumWeight) {
            selectedOp = op;
            break;
          }
        }

        const promise = testUtils.apiRequest(selectedOp.method, selectedOp.endpoint, null, {
          'Authorization': `Bearer ${authToken}`
        }).then(response => {
          results.push({ operation: selectedOp.endpoint, status: response.status });
        }).catch(error => {
          results.push({ operation: selectedOp.endpoint, error: error.message });
        });

        promises.push(promise);

        // Stagger requests to simulate real usage
        if (i % 5 === 0) {
          await testUtils.waitFor(10);
        }
      }

      await Promise.all(promises);
      const loadTestEnd = performance.now();

      const totalTime = loadTestEnd - loadTestStart;
      const successfulOperations = results.filter(r => r.status === 200).length;
      const throughput = (successfulOperations / totalTime * 1000).toFixed(2);

      performanceMetrics.concurrent.loadTest = {
        totalOperations: totalOperations,
        successfulOperations: successfulOperations,
        totalTime: `${totalTime.toFixed(2)}ms`,
        throughput: `${throughput} ops/sec`,
        successRate: `${(successfulOperations / totalOperations * 100).toFixed(1)}%`
      };

      console.log(`🔥 Load Test: ${successfulOperations}/${totalOperations} ops in ${totalTime.toFixed(2)}ms (${throughput} ops/sec)`);

      expect(successfulOperations / totalOperations).toBeGreaterThan(0.95); // 95% success rate
    }, 120000);
  });
});