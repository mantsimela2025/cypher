#!/usr/bin/env node

/**
 * Priority Test Runner Script
 * 
 * Runs the priority test suites and generates coverage reports
 * 
 * Usage: node scripts/run-priority-tests.js [--coverage] [--verbose]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test suites in priority order
const priorityTests = [
  // Priority 1: Critical APIs (Security & Compliance)
  {
    name: 'RBAC Service Tests',
    file: 'rbac.test.js',
    priority: 1,
    description: 'Role-based access control - Security critical'
  },
  {
    name: 'Audit Log Service Tests',
    file: 'auditLog.test.js',
    priority: 1,
    description: 'Audit logging - Compliance critical'
  },
  {
    name: 'Notification Service Tests',
    file: 'notifications.test.js',
    priority: 1,
    description: 'System notifications - System-wide impact'
  },
  
  // Priority 2: Business Logic APIs
  {
    name: 'Asset Management Tests',
    file: 'assetManagement.test.js',
    priority: 2,
    description: 'Asset management - Core business logic'
  },
  {
    name: 'STIG Service Tests',
    file: 'stig.test.js',
    priority: 2,
    description: 'STIG compliance - Core compliance functionality'
  },
  
  // Existing tests
  {
    name: 'Authentication Tests',
    file: 'auth.test.js',
    priority: 1,
    description: 'Authentication & authorization'
  },
  {
    name: 'User Management Tests',
    file: 'users.test.js',
    priority: 1,
    description: 'User management'
  },
  {
    name: 'Scanner Integration Tests',
    file: 'scanner-integration.test.js',
    priority: 2,
    description: 'Security scanner integration'
  },
  {
    name: 'Settings Management Tests',
    file: 'settings.test.js',
    priority: 2,
    description: 'Application settings'
  }
];

class TestRunner {
  constructor() {
    this.args = process.argv.slice(2);
    this.coverage = this.args.includes('--coverage');
    this.verbose = this.args.includes('--verbose');
    this.results = [];
  }

  async run() {
    console.log('🧪 Running Priority Test Suites...\n');
    
    // Display test plan
    this.displayTestPlan();
    
    // Run tests by priority
    await this.runTestsByPriority();
    
    // Generate summary report
    this.generateSummaryReport();
    
    // Generate coverage report if requested
    if (this.coverage) {
      await this.generateCoverageReport();
    }
  }

  displayTestPlan() {
    console.log('📋 Test Execution Plan:');
    console.log('========================\n');
    
    const priority1Tests = priorityTests.filter(t => t.priority === 1);
    const priority2Tests = priorityTests.filter(t => t.priority === 2);
    
    console.log('🔴 Priority 1 - Critical APIs:');
    priority1Tests.forEach(test => {
      console.log(`   ✓ ${test.name} - ${test.description}`);
    });
    
    console.log('\n🟡 Priority 2 - Business Logic APIs:');
    priority2Tests.forEach(test => {
      console.log(`   ✓ ${test.name} - ${test.description}`);
    });
    
    console.log(`\nTotal Test Suites: ${priorityTests.length}`);
    console.log(`Coverage Report: ${this.coverage ? 'Enabled' : 'Disabled'}`);
    console.log(`Verbose Output: ${this.verbose ? 'Enabled' : 'Disabled'}\n`);
  }

  async runTestsByPriority() {
    console.log('🚀 Executing Test Suites...\n');
    
    // Run Priority 1 tests first
    const priority1Tests = priorityTests.filter(t => t.priority === 1);
    console.log('🔴 Running Priority 1 Tests (Critical APIs)...');
    await this.runTestGroup(priority1Tests);
    
    // Run Priority 2 tests
    const priority2Tests = priorityTests.filter(t => t.priority === 2);
    console.log('\n🟡 Running Priority 2 Tests (Business Logic APIs)...');
    await this.runTestGroup(priority2Tests);
  }

  async runTestGroup(tests) {
    for (const test of tests) {
      await this.runSingleTest(test);
    }
  }

  async runSingleTest(test) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      console.log(`\n📝 Running: ${test.name}`);
      
      // Check if test file exists
      const testPath = path.join(__dirname, '..', 'tests', test.file);
      if (!fs.existsSync(testPath)) {
        console.log(`   ⚠️  Test file not found: ${test.file}`);
        this.results.push({
          ...test,
          status: 'skipped',
          duration: 0,
          error: 'Test file not found'
        });
        resolve();
        return;
      }

      const jestArgs = [
        '--testPathPattern=' + test.file,
        '--verbose=' + this.verbose,
        '--silent=' + !this.verbose,
        '--detectOpenHandles',
        '--forceExit'
      ];

      const jestProcess = spawn('npx', ['jest', ...jestArgs], {
        cwd: path.join(__dirname, '..'),
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      let output = '';
      let errorOutput = '';

      if (!this.verbose) {
        jestProcess.stdout?.on('data', (data) => {
          output += data.toString();
        });

        jestProcess.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
      }

      jestProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const status = code === 0 ? 'passed' : 'failed';
        
        if (status === 'passed') {
          console.log(`   ✅ PASSED (${duration}ms)`);
        } else {
          console.log(`   ❌ FAILED (${duration}ms)`);
          if (!this.verbose && errorOutput) {
            console.log(`   Error: ${errorOutput.split('\n')[0]}`);
          }
        }

        this.results.push({
          ...test,
          status,
          duration,
          output: this.verbose ? null : output,
          error: status === 'failed' ? errorOutput : null
        });

        resolve();
      });

      jestProcess.on('error', (error) => {
        console.log(`   ❌ ERROR: ${error.message}`);
        this.results.push({
          ...test,
          status: 'error',
          duration: Date.now() - startTime,
          error: error.message
        });
        resolve();
      });
    });
  }

  generateSummaryReport() {
    console.log('\n📊 Test Execution Summary');
    console.log('==========================\n');

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const total = this.results.length;

    console.log(`Total Test Suites: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`🚫 Errors: ${errors}`);

    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    console.log(`\n📈 Success Rate: ${successRate}%`);

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    // Show failed tests
    const failedTests = this.results.filter(r => r.status === 'failed' || r.status === 'error');
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Test Suites:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.error?.split('\n')[0] || 'Unknown error'}`);
      });
    }

    // Show skipped tests
    const skippedTests = this.results.filter(r => r.status === 'skipped');
    if (skippedTests.length > 0) {
      console.log('\n⚠️  Skipped Test Suites:');
      skippedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.error || 'Test file not found'}`);
      });
    }

    // Priority breakdown
    console.log('\n📊 Results by Priority:');
    const priority1Results = this.results.filter(r => r.priority === 1);
    const priority2Results = this.results.filter(r => r.priority === 2);

    const p1Passed = priority1Results.filter(r => r.status === 'passed').length;
    const p1Total = priority1Results.length;
    const p1Rate = p1Total > 0 ? ((p1Passed / p1Total) * 100).toFixed(1) : 0;

    const p2Passed = priority2Results.filter(r => r.status === 'passed').length;
    const p2Total = priority2Results.length;
    const p2Rate = p2Total > 0 ? ((p2Passed / p2Total) * 100).toFixed(1) : 0;

    console.log(`   🔴 Priority 1 (Critical): ${p1Passed}/${p1Total} (${p1Rate}%)`);
    console.log(`   🟡 Priority 2 (Business): ${p2Passed}/${p2Total} (${p2Rate}%)`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (failed > 0) {
      console.log('   • Fix failing tests before deploying to production');
      console.log('   • Review error messages and update test data/setup');
    }
    if (skipped > 0) {
      console.log('   • Create missing test files for complete coverage');
    }
    if (successRate < 80) {
      console.log('   • Improve test reliability - target 80%+ success rate');
    }
    if (successRate >= 90) {
      console.log('   • Excellent test coverage! Consider adding more edge cases');
    }
  }

  async generateCoverageReport() {
    console.log('\n📈 Generating Coverage Report...');
    
    return new Promise((resolve) => {
      const coverageArgs = [
        '--coverage',
        '--coverageDirectory=coverage',
        '--coverageReporters=text',
        '--coverageReporters=html',
        '--coverageReporters=json-summary',
        '--collectCoverageFrom=src/**/*.js',
        '--collectCoverageFrom=!src/**/*.test.js'
      ];

      const jestProcess = spawn('npx', ['jest', ...coverageArgs], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      jestProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Coverage report generated successfully');
          console.log('   📁 HTML Report: coverage/index.html');
          console.log('   📄 JSON Summary: coverage/coverage-summary.json');
        } else {
          console.log('\n❌ Failed to generate coverage report');
        }
        resolve();
      });

      jestProcess.on('error', (error) => {
        console.log(`\n❌ Coverage generation error: ${error.message}`);
        resolve();
      });
    });
  }
}

// Run the test runner
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().then(() => {
    console.log('\n🎉 Test execution completed!');
    
    const failed = runner.results.filter(r => r.status === 'failed' || r.status === 'error').length;
    process.exit(failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('\n💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
