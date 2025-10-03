#!/usr/bin/env node

/**
 * Update Contact Forms Across All Branches
 * Automatically updates contact form configuration in all branches
 */

const { execSync } = require('child_process');
const fs = require('fs');

const CONTACT_API_PATH = 'pages/api/contact.ts';
const FROM_DOMAIN = 'it-era.it';
const TO_DOMAIN = 'bulltech.it';

/**
 * Execute git command
 */
function git(command) {
    try {
        return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
    } catch (error) {
        throw new Error(`Git command failed: ${command}\n${error.message}`);
    }
}

/**
 * Get all branches except remote tracking
 */
function getAllBranches() {
    const output = git('branch');
    return output
        .split('\n')
        .map(b => b.trim().replace(/^\* /, ''))
        .filter(b => b && !b.includes('->'));
}

/**
 * Update contact form in a branch
 */
function updateContactForm(branch) {
    const currentBranch = git('branch --show-current');

    try {
        console.log(`\n📝 Processing ${branch}...`);

        // Checkout branch
        git(`checkout ${branch}`);

        // Check if file exists
        if (!fs.existsSync(CONTACT_API_PATH)) {
            console.log(`   ⚠️  Contact API not found, skipping`);
            return { branch, status: 'skipped', reason: 'File not found' };
        }

        // Read current content
        let content = fs.readFileSync(CONTACT_API_PATH, 'utf-8');
        let updated = false;

        // Update FROM domain
        const fromRegex = /'IT-ERA <[^>]+>'/g;
        if (content.match(fromRegex)) {
            content = content.replace(
                fromRegex,
                `'IT-ERA <info@${FROM_DOMAIN}>'`
            );
            updated = true;
            console.log(`   ✅ Updated FROM domain to ${FROM_DOMAIN}`);
        }

        // Update TO recipients
        const toRegexEmergency = /\['info@[^']+', 'emergenze@[^']+'\]/g;
        const toRegexNormal = /: \['info@[^']+'\]/g;

        if (content.match(toRegexEmergency)) {
            content = content.replace(
                toRegexEmergency,
                `['info@${TO_DOMAIN}', 'emergenze@${TO_DOMAIN}']`
            );
            updated = true;
            console.log(`   ✅ Updated emergency recipients to ${TO_DOMAIN}`);
        }

        if (content.match(toRegexNormal)) {
            content = content.replace(
                toRegexNormal,
                `: ['info@${TO_DOMAIN}']`
            );
            updated = true;
            console.log(`   ✅ Updated normal recipients to ${TO_DOMAIN}`);
        }

        // Update comment
        const commentRegex = /\/\/ (Using|Send TO:|Send FROM:).*/g;
        content = content.replace(
            /\/\/ Using .*/,
            `// Send TO: info@${TO_DOMAIN} (destination)\n    // Send FROM: ${FROM_DOMAIN} (verified domain on Resend)`
        );

        if (updated) {
            // Write updated content
            fs.writeFileSync(CONTACT_API_PATH, content);

            // Commit changes
            git('add pages/api/contact.ts');
            const commitMessage = `fix: Update contact form to use ${FROM_DOMAIN} → ${TO_DOMAIN}

- FROM: info@${FROM_DOMAIN} (verified Resend domain)
- TO: info@${TO_DOMAIN} (destination)
- Emergency: info@${TO_DOMAIN} + emergenze@${TO_DOMAIN}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

            git(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
            console.log(`   ✅ Changes committed`);

            return { branch, status: 'updated' };
        } else {
            console.log(`   ℹ️  No changes needed`);
            return { branch, status: 'already-correct' };
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { branch, status: 'error', error: error.message };
    } finally {
        // Return to original branch
        git(`checkout ${currentBranch}`);
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Contact Form Bulk Update Tool\n');
    console.log('='.repeat(80));
    console.log(`FROM domain: ${FROM_DOMAIN} (verified on Resend)`);
    console.log(`TO domain: ${TO_DOMAIN} (email destination)`);
    console.log('='.repeat(80));

    const currentBranch = git('branch --show-current');
    console.log(`\nCurrent branch: ${currentBranch}`);
    console.log('Checking working directory...');

    // Check for uncommitted changes
    const status = git('status --porcelain');
    if (status) {
        console.log('\n⚠️  You have uncommitted changes. Please commit or stash them first.\n');
        process.exit(1);
    }

    const branches = getAllBranches();
    console.log(`\nFound ${branches.length} local branches to process`);

    // Ask for confirmation
    console.log('\n⚠️  This will update contact forms in all branches.');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const results = {
        updated: [],
        alreadyCorrect: [],
        skipped: [],
        errors: []
    };

    // Process each branch
    for (const branch of branches) {
        const result = updateContactForm(branch);

        if (result.status === 'updated') results.updated.push(result);
        else if (result.status === 'already-correct') results.alreadyCorrect.push(result);
        else if (result.status === 'skipped') results.skipped.push(result);
        else results.errors.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Update Summary\n');
    console.log(`   ✅ Updated: ${results.updated.length}`);
    console.log(`   ℹ️  Already Correct: ${results.alreadyCorrect.length}`);
    console.log(`   ⚠️  Skipped: ${results.skipped.length}`);
    console.log(`   ❌ Errors: ${results.errors.length}\n`);

    if (results.updated.length > 0) {
        console.log('Updated branches:');
        results.updated.forEach(r => console.log(`   - ${r.branch}`));
        console.log('');
    }

    if (results.errors.length > 0) {
        console.log('Errors:');
        results.errors.forEach(r => console.log(`   - ${r.branch}: ${r.error}`));
        console.log('');
    }

    console.log('💡 Next steps:');
    console.log('   1. Review the changes: git log --oneline -10');
    console.log('   2. Push updates: git push origin --all');
    console.log('   3. Test forms: node scripts/test-contact-form.js\n');

    // Return to original branch
    git(`checkout ${currentBranch}`);
    console.log(`Returned to ${currentBranch}\n`);
}

// Run
main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});
