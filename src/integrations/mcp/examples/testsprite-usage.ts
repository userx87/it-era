/**
 * TestSprite Integration Usage Examples for IT-ERA
 * Demonstrates how to use TestSprite MCP for automated testing
 */

import { testSpriteClient, TestCase, TestSuite } from '../testsprite';

/**
 * Example: Create and execute tests for IT-ERA's landing pages
 */
export async function testLandingPages() {
  console.log('🧪 Starting IT-ERA Landing Page Tests...\n');

  try {
    // 1. Create test cases for different services
    const testCases: TestCase[] = [];

    // Test case for Assistenza IT page
    const assistenzaTest = await testSpriteClient.createTestCase({
      name: 'Verify Assistenza IT Landing Page',
      description: 'Test the Assistenza IT service landing page functionality',
      steps: [
        'Navigate to /assistenza-it-milano',
        'Verify page title contains "Assistenza IT Milano"',
        'Check if contact form is present',
        'Verify service description is displayed',
        'Check if pricing information is visible',
        'Test contact form submission',
        'Verify response message appears'
      ],
      expectedResult: 'Page loads correctly with all elements functional',
      tags: ['landing-page', 'assistenza-it', 'milano'],
      priority: 'high',
      status: 'ready'
    });
    testCases.push(assistenzaTest);
    console.log(`✅ Created test: ${assistenzaTest.name}`);

    // Test case for Cloud Storage page
    const cloudStorageTest = await testSpriteClient.createTestCase({
      name: 'Verify Cloud Storage Landing Page',
      description: 'Test the Cloud Storage service landing page',
      steps: [
        'Navigate to /cloud-storage-milano',
        'Verify page title contains "Cloud Storage Milano"',
        'Check storage plans are displayed',
        'Verify pricing calculator works',
        'Test plan selection functionality',
        'Check FAQ section is expandable',
        'Submit inquiry form'
      ],
      expectedResult: 'Cloud storage page functions correctly with interactive elements',
      tags: ['landing-page', 'cloud-storage', 'milano'],
      priority: 'high',
      status: 'ready'
    });
    testCases.push(cloudStorageTest);
    console.log(`✅ Created test: ${cloudStorageTest.name}`);

    // Test case for Security page
    const securityTest = await testSpriteClient.createTestCase({
      name: 'Verify Sicurezza Informatica Landing Page',
      description: 'Test the Security service landing page',
      steps: [
        'Navigate to /sicurezza-informatica-milano',
        'Verify security services are listed',
        'Check vulnerability scanner demo',
        'Test security audit request form',
        'Verify testimonials carousel',
        'Check emergency contact button',
        'Test chat widget functionality'
      ],
      expectedResult: 'Security page displays all services and forms work correctly',
      tags: ['landing-page', 'security', 'milano'],
      priority: 'critical',
      status: 'ready'
    });
    testCases.push(securityTest);
    console.log(`✅ Created test: ${securityTest.name}`);

    // 2. Create a test suite
    const landingPageSuite = await testSpriteClient.createTestSuite({
      name: 'IT-ERA Landing Pages Test Suite',
      description: 'Comprehensive testing of all IT-ERA service landing pages',
      testCases: testCases,
      tags: ['regression', 'landing-pages', 'production']
    });
    console.log(`\n📦 Created test suite: ${landingPageSuite.name}`);
    console.log(`   Contains ${testCases.length} test cases\n`);

    // 3. Execute the test suite
    console.log('🚀 Executing test suite...\n');
    const testRun = await testSpriteClient.executeTestSuite(
      landingPageSuite.id!,
      'production',
      {
        parallel: true,
        maxWorkers: 3,
        continueOnFailure: true
      }
    );
    console.log(`⏳ Test run started: ${testRun.id}`);
    console.log(`   Environment: ${testRun.environment}`);
    console.log(`   Status: ${testRun.status}\n`);

    // 4. Wait for completion and get results
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const results = await testSpriteClient.getTestRunResults(testRun.id!);
    console.log('📊 Test Results:');
    console.log(`   Status: ${results.status}`);
    console.log(`   Start: ${results.startTime}`);
    console.log(`   End: ${results.endTime}\n`);

    if (results.results) {
      results.results.forEach((result, index) => {
        const testCase = testCases[index];
        console.log(`   ${result.status === 'passed' ? '✅' : '❌'} ${testCase.name}`);
        console.log(`      Status: ${result.status}`);
        if (result.executionTime) {
          console.log(`      Time: ${result.executionTime}ms`);
        }
        if (result.errorMessage) {
          console.log(`      Error: ${result.errorMessage}`);
        }
        console.log('');
      });
    }

    // 5. Generate test report
    const reportUrl = await testSpriteClient.generateTestReport(testRun.id!, 'html');
    console.log(`📄 Test report generated: ${reportUrl}\n`);

    // 6. Get test metrics
    const metrics = await testSpriteClient.getTestMetrics();
    console.log('📈 Test Metrics:');
    console.log(`   Total Tests: ${metrics.totalTests}`);
    console.log(`   Pass Rate: ${metrics.passRate}%`);
    console.log(`   Fail Rate: ${metrics.failRate}%`);
    console.log(`   Avg Execution: ${metrics.averageExecutionTime}ms\n`);

    return {
      suite: landingPageSuite,
      run: testRun,
      results: results,
      reportUrl: reportUrl,
      metrics: metrics
    };

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  }
}

/**
 * Example: Create visual regression tests
 */
export async function createVisualRegressionTests() {
  console.log('🎨 Creating Visual Regression Tests...\n');

  try {
    // Create a visual test for homepage
    const visualTest = await testSpriteClient.createTestCase({
      name: 'Visual Regression - IT-ERA Homepage',
      description: 'Compare homepage visual appearance against baseline',
      steps: [
        'Navigate to homepage',
        'Wait for all images to load',
        'Take full-page screenshot',
        'Compare with baseline image',
        'Highlight visual differences',
        'Generate diff report'
      ],
      expectedResult: 'Visual differences should be below 1% threshold',
      tags: ['visual-regression', 'homepage'],
      priority: 'medium',
      status: 'ready'
    });

    console.log(`✅ Created visual test: ${visualTest.name}`);

    // Run the visual test
    const visualResult = await testSpriteClient.runVisualTest(visualTest.id!);
    
    console.log('\n📸 Visual Test Results:');
    console.log(`   Passed: ${visualResult.passed}`);
    
    if (visualResult.differences && visualResult.differences.length > 0) {
      console.log('   Differences found:');
      visualResult.differences.forEach(diff => {
        console.log(`   - ${diff.selector}: ${diff.diffPercentage}% difference`);
        console.log(`     Screenshot: ${diff.screenshot}`);
      });
    } else {
      console.log('   No visual differences detected');
    }

    return visualResult;

  } catch (error) {
    console.error('❌ Visual test creation failed:', error);
    throw error;
  }
}

/**
 * Example: Create test from browser recording
 */
export async function createTestFromUserRecording() {
  console.log('🎬 Creating Test from Browser Recording...\n');

  try {
    const recordedTest = await testSpriteClient.createTestFromRecording({
      url: 'https://it-era.com',
      actions: [
        {
          type: 'navigate',
          value: 'https://it-era.com'
        },
        {
          type: 'wait',
          timeout: 2000
        },
        {
          type: 'click',
          selector: '#services-menu'
        },
        {
          type: 'click',
          selector: 'a[href="/assistenza-it"]'
        },
        {
          type: 'type',
          selector: '#contact-name',
          value: 'Test User'
        },
        {
          type: 'type',
          selector: '#contact-email',
          value: 'test@example.com'
        },
        {
          type: 'type',
          selector: '#contact-message',
          value: 'This is a test message'
        },
        {
          type: 'click',
          selector: '#submit-button'
        },
        {
          type: 'assert',
          selector: '.success-message',
          value: 'Grazie per averci contattato'
        }
      ]
    });

    console.log(`✅ Created test from recording: ${recordedTest.name}`);
    console.log(`   Steps: ${recordedTest.steps.length}`);
    console.log(`   Status: ${recordedTest.status}`);

    return recordedTest;

  } catch (error) {
    console.error('❌ Failed to create test from recording:', error);
    throw error;
  }
}

/**
 * Example: Schedule recurring tests
 */
export async function scheduleRecurringTests() {
  console.log('⏰ Scheduling Recurring Tests...\n');

  try {
    // Get or create a test suite
    const suites = await testSpriteClient.listTestCases({
      tags: ['regression']
    });

    if (suites.length === 0) {
      console.log('No regression test suite found. Creating one first...');
      await testLandingPages();
    }

    // Schedule daily regression tests at 2 AM
    const schedule1 = await testSpriteClient.scheduleTestExecution(
      'suite-id-here', // Replace with actual suite ID
      {
        cron: '0 2 * * *', // Every day at 2 AM
        recurring: true
      }
    );
    console.log(`✅ Scheduled daily regression tests: ${schedule1.scheduleId}`);

    // Schedule weekly performance tests on Sunday
    const schedule2 = await testSpriteClient.scheduleTestExecution(
      'suite-id-here', // Replace with actual suite ID
      {
        cron: '0 3 * * 0', // Every Sunday at 3 AM
        recurring: true
      }
    );
    console.log(`✅ Scheduled weekly performance tests: ${schedule2.scheduleId}`);

    return {
      dailySchedule: schedule1,
      weeklySchedule: schedule2
    };

  } catch (error) {
    console.error('❌ Failed to schedule tests:', error);
    throw error;
  }
}

/**
 * Example: Export and import test cases
 */
export async function exportImportTests() {
  console.log('📤 Exporting and Importing Tests...\n');

  try {
    // Export existing tests to JSON
    const testCases = await testSpriteClient.listTestCases({
      tags: ['landing-page']
    });

    const testCaseIds = testCases.map(tc => tc.id!).filter(Boolean);
    
    if (testCaseIds.length > 0) {
      const exportUrl = await testSpriteClient.exportTestCases(testCaseIds, 'json');
      console.log(`✅ Exported ${testCaseIds.length} test cases`);
      console.log(`   Download: ${exportUrl}\n`);
    }

    // Import test cases from Gherkin format
    const gherkinContent = `
Feature: IT-ERA Contact Form
  As a potential customer
  I want to contact IT-ERA through their website
  So that I can inquire about their services

  Scenario: Submit contact form successfully
    Given I am on the IT-ERA homepage
    When I navigate to the contact page
    And I fill in "Name" with "John Doe"
    And I fill in "Email" with "john@example.com"
    And I fill in "Message" with "I need IT support"
    And I click the "Submit" button
    Then I should see "Thank you for contacting us"
    And I should receive a confirmation email
`;

    const importResult = await testSpriteClient.importTestCases(gherkinContent, 'gherkin');
    console.log('📥 Import Results:');
    console.log(`   Imported: ${importResult.imported} test cases`);
    console.log(`   Failed: ${importResult.failed}`);
    
    if (importResult.errors && importResult.errors.length > 0) {
      console.log('   Errors:');
      importResult.errors.forEach(error => console.log(`   - ${error}`));
    }

    return {
      exported: testCaseIds.length,
      imported: importResult.imported
    };

  } catch (error) {
    console.error('❌ Export/Import failed:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
export async function runAllExamples() {
  console.log('🚀 IT-ERA TestSprite Integration Examples\n');
  console.log('='.'repeat(50));
  console.log('\n');

  try {
    // Run landing page tests
    await testLandingPages();
    console.log('='.'repeat(50));
    console.log('\n');

    // Create visual regression tests
    await createVisualRegressionTests();
    console.log('='.'repeat(50));
    console.log('\n');

    // Create test from recording
    await createTestFromUserRecording();
    console.log('='.'repeat(50));
    console.log('\n');

    // Export and import tests
    await exportImportTests();
    console.log('='.'repeat(50));
    console.log('\n');

    console.log('✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Example execution failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}