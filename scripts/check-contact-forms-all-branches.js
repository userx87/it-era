#!/usr/bin/env node

/**
 * Check Contact Forms Across All Branches
 * Verifies that all branches have correct contact form configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTACT_API_PATH = 'pages/api/contact.ts';
const EXPECTED_FROM_DOMAIN = 'it-era.it';
const EXPECTED_TO_DOMAIN = 'bulltech.it';

/**
 * Execute git command
 */
function git(command) {
    try {
        return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
    } catch (error) {
        return null;
    }
}

/**
 * Get all branches
 */
function getAllBranches() {
    const output = git('branch -a');
    if (!output) return [];

    return output
        .split('\n')
        .map(b => b.trim().replace(/^\* /, '').replace(/^remotes\/origin\//, ''))
        .filter(b => b && !b.includes('->') && !b.startsWith('remotes/'))
        .filter((v, i, a) => a.indexOf(v) === i); // unique
}

/**
 * Check contact form configuration in a branch
 */
function checkBranch(branch) {
    const currentBranch = git('branch --show-current');

    try {
        // Checkout branch quietly
        git(`checkout ${branch} --quiet`);

        // Check if contact API exists
        if (!fs.existsSync(CONTACT_API_PATH)) {
            return {
                branch,
                status: 'missing',
                message: 'Contact API file not found'
            };
        }

        // Read file content
        const content = fs.readFileSync(CONTACT_API_PATH, 'utf-8');

        // Check configuration
        const hasCorrectFrom = content.includes(`@${EXPECTED_FROM_DOMAIN}`);
        const hasCorrectTo = content.includes(`@${EXPECTED_TO_DOMAIN}`);
        const hasResendInit = content.includes('new Resend');

        // Extract email addresses for verification
        const fromMatch = content.match(/from:\s*.*?<([^>]+)>/);
        const toMatch = content.match(/\['([^']+@[^']+)'\]/);

        return {
            branch,
            status: hasCorrectFrom && hasCorrectTo && hasResendInit ? 'ok' : 'needs-update',
            hasCorrectFrom,
            hasCorrectTo,
            hasResendInit,
            fromEmail: fromMatch ? fromMatch[1] : 'not found',
            toEmail: toMatch ? toMatch[1] : 'not found',
            message: hasCorrectFrom && hasCorrectTo && hasResendInit
                ? 'Configuration correct'
                : 'Needs configuration update'
        };
    } catch (error) {
        return {
            branch,
            status: 'error',
            message: error.message
        };
    } finally {
        // Return to original branch
        if (currentBranch) {
            git(`checkout ${currentBranch} --quiet`);
        }
    }
}

/**
 * Format branch status
 */
function formatStatus(result) {
    const icons = {
        'ok': '✅',
        'missing': '❌',
        'needs-update': '⚠️',
        'error': '🔴'
    };

    return `${icons[result.status]} ${result.branch.padEnd(40)} ${result.message}`;
}

/**
 * Main function
 */
async function main() {
    console.log('🔍 Contact Form Configuration Check Across All Branches\n');
    console.log('='.repeat(80));
    console.log(`Expected FROM domain: ${EXPECTED_FROM_DOMAIN}`);
    console.log(`Expected TO domain: ${EXPECTED_TO_DOMAIN}`);
    console.log('='.repeat(80) + '\n');

    const branches = getAllBranches();
    console.log(`Found ${branches.length} branches to check\n`);

    const results = {
        ok: [],
        missing: [],
        needsUpdate: [],
        error: []
    };

    // Check each branch
    for (const branch of branches) {
        process.stdout.write(`Checking ${branch}... `);
        const result = checkBranch(branch);
        console.log(result.status);

        if (result.status === 'ok') results.ok.push(result);
        else if (result.status === 'missing') results.missing.push(result);
        else if (result.status === 'needs-update') results.needsUpdate.push(result);
        else results.error.push(result);
    }

    // Summary report
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary Report\n');

    if (results.ok.length > 0) {
        console.log(`✅ Correctly Configured (${results.ok.length}):`);
        results.ok.forEach(r => {
            console.log(`   ${r.branch}`);
            console.log(`      FROM: ${r.fromEmail}`);
            console.log(`      TO: ${r.toEmail}`);
        });
        console.log('');
    }

    if (results.needsUpdate.length > 0) {
        console.log(`⚠️  Need Configuration Update (${results.needsUpdate.length}):`);
        results.needsUpdate.forEach(r => {
            console.log(`   ${r.branch}`);
            console.log(`      FROM correct: ${r.hasCorrectFrom ? '✅' : '❌'} (${r.fromEmail})`);
            console.log(`      TO correct: ${r.hasCorrectTo ? '✅' : '❌'} (${r.toEmail})`);
            console.log(`      Resend init: ${r.hasResendInit ? '✅' : '❌'}`);
        });
        console.log('');
    }

    if (results.missing.length > 0) {
        console.log(`❌ Missing Contact API (${results.missing.length}):`);
        results.missing.forEach(r => console.log(`   ${r.branch}`));
        console.log('');
    }

    if (results.error.length > 0) {
        console.log(`🔴 Errors (${results.error.length}):`);
        results.error.forEach(r => console.log(`   ${r.branch}: ${r.message}`));
        console.log('');
    }

    // Statistics
    console.log('='.repeat(80));
    console.log('\n📈 Statistics:\n');
    console.log(`   Total Branches: ${branches.length}`);
    console.log(`   ✅ OK: ${results.ok.length}`);
    console.log(`   ⚠️  Needs Update: ${results.needsUpdate.length}`);
    console.log(`   ❌ Missing: ${results.missing.length}`);
    console.log(`   🔴 Errors: ${results.error.length}`);
    console.log(`   Coverage: ${((results.ok.length / branches.length) * 100).toFixed(1)}%\n`);

    // Recommendations
    if (results.needsUpdate.length > 0 || results.missing.length > 0) {
        console.log('💡 Recommendations:\n');
        console.log('   Run the following to update all branches:');
        console.log('   node scripts/update-contact-forms-all-branches.js\n');
    } else {
        console.log('🎉 All branches are correctly configured!\n');
    }
}

// Run
main().catch(console.error);
