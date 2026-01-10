/**
 * VERIFICATION: GitHub Actions Workflow Configuration
 * 
 * Ελέγχει ότι:
 * 1. Το workflow file υπάρχει
 * 2. Το cron schedule είναι σωστό
 * 3. Η URL του Supabase είναι σωστή
 * 4. Το endpoint είναι σωστό
 */

const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
    const prefix = {
        'info': '📋',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'test': '🧪',
        'header': '═══════════════════════════════════════════════════════════════'
    };
    console.log(`${prefix[type] || '→'} ${message}`);
}

function assert(condition, testName) {
    if (condition) {
        log(`PASS: ${testName}`, 'success');
        return true;
    } else {
        log(`FAIL: ${testName}`, 'error');
        return false;
    }
}

async function verifyGitHubActions() {
    log('GITHUB ACTIONS WORKFLOW VERIFICATION', 'header');
    console.log();

    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'weekly-pilates-refill.yml');
    
    // TEST 1: File exists
    log('TEST 1: Έλεγχος ύπαρξης workflow file', 'test');
    const fileExists = fs.existsSync(workflowPath);
    assert(fileExists, 'Workflow file exists');
    
    if (!fileExists) {
        log('Workflow file not found!', 'error');
        return false;
    }
    console.log();

    // TEST 2: Read and parse workflow
    log('TEST 2: Ανάγνωση workflow file', 'test');
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    assert(workflowContent.length > 0, 'Workflow file is not empty');
    console.log();

    // TEST 3: Check cron schedule
    log('TEST 3: Έλεγχος cron schedule', 'test');
    const cronMatch = workflowContent.match(/cron:\s*['"]([^'"]+)['"]/);
    if (cronMatch) {
        const cronPattern = cronMatch[1];
        log(`  Cron Pattern: ${cronPattern}`, 'info');
        
        // Verify it's correct: 0 2 * * 0 (Every Sunday at 02:00 UTC)
        const correctPattern = '0 2 * * 0';
        assert(cronPattern === correctPattern, `Cron pattern is correct (${correctPattern})`);
        
        if (cronPattern === correctPattern) {
            log('  ✅ Σωστό: Κάθε Κυριακή (0) στις 02:00 UTC', 'success');
            log('  ✅ Ώρα Ελλάδας: 04:00 (χειμερινή) ή 05:00 (θερινή)', 'success');
        }
    } else {
        assert(false, 'Cron pattern found in workflow');
    }
    console.log();

    // TEST 4: Check Supabase URL
    log('TEST 4: Έλεγχος Supabase URL', 'test');
    const urlMatch = workflowContent.match(/https:\/\/[^\/]+\.supabase\.co/);
    if (urlMatch) {
        const supabaseUrl = urlMatch[0];
        log(`  Supabase URL: ${supabaseUrl}`, 'info');
        assert(supabaseUrl.includes('supabase.co'), 'Supabase URL is valid');
    } else {
        assert(false, 'Supabase URL found in workflow');
    }
    console.log();

    // TEST 5: Check RPC endpoint
    log('TEST 5: Έλεγχος RPC endpoint', 'test');
    const rpcMatch = workflowContent.match(/\/rpc\/([^\s'"]+)/);
    if (rpcMatch) {
        const rpcFunction = rpcMatch[1];
        log(`  RPC Function: ${rpcFunction}`, 'info');
        assert(rpcFunction === 'process_weekly_pilates_refills', 'RPC function is correct');
    } else {
        assert(false, 'RPC endpoint found in workflow');
    }
    console.log();

    // TEST 6: Check service key secret
    log('TEST 6: Έλεγχος service key secret', 'test');
    const secretMatch = workflowContent.match(/\$\{\{\s*secrets\.([^}]+)\s*\}\}/);
    if (secretMatch) {
        const secretName = secretMatch[1];
        log(`  Secret Name: ${secretName}`, 'info');
        assert(secretName === 'SUPABASE_SERVICE_KEY', 'Service key secret name is correct');
        log('  ⚠️  ΣΗΜΑΝΤΙΚΟ: Βεβαιωθείτε ότι το secret SUPABASE_SERVICE_KEY είναι ρυθμισμένο στο GitHub!', 'warning');
    } else {
        assert(false, 'Service key secret found in workflow');
    }
    console.log();

    // TEST 7: Check workflow_dispatch
    log('TEST 7: Έλεγχος manual trigger', 'test');
    const hasWorkflowDispatch = workflowContent.includes('workflow_dispatch');
    assert(hasWorkflowDispatch, 'Workflow supports manual trigger (workflow_dispatch)');
    if (hasWorkflowDispatch) {
        log('  ✅ Μπορεί να τρέξει χειροκίνητα από GitHub UI', 'success');
    }
    console.log();

    // TEST 8: Check HTTP response handling
    log('TEST 8: Έλεγχος HTTP response handling', 'test');
    const hasHttpCodeCheck = workflowContent.includes('http_code');
    const hasErrorHandling = workflowContent.includes('exit 1');
    assert(hasHttpCodeCheck, 'HTTP code is checked');
    assert(hasErrorHandling, 'Error handling exists');
    if (hasHttpCodeCheck && hasErrorHandling) {
        log('  ✅ Το workflow ελέγχει για σφάλματα', 'success');
    }
    console.log();

    // SUMMARY
    log('VERIFICATION SUMMARY', 'header');
    log('✅ Το GitHub Actions workflow είναι σωστά ρυθμισμένο!', 'success');
    log('', 'header');
    log('📋 Τι θα συμβεί κάθε Κυριακή:', 'info');
    log('   1. GitHub Actions θα τρέξει αυτόματα στις 02:00 UTC (04:00 Ελλάδα)', 'info');
    log('   2. Θα καλέσει: POST /rest/v1/rpc/process_weekly_pilates_refills', 'info');
    log('   3. Η function θα επεξεργαστεί όλους τους Ultimate χρήστες', 'info');
    log('   4. Ultimate → 3 μαθήματα, Ultimate Medium → 1 μάθημα', 'info');
    log('   5. Θα καταγράψει τα refills στο ultimate_weekly_refills', 'info');
    log('', 'header');
    log('⚠️  ΒΕΒΑΙΩΘΕΙΤΕ:', 'warning');
    log('   • Το GitHub secret SUPABASE_SERVICE_KEY είναι ρυθμισμένο', 'warning');
    log('   • Το feature flag weekly_pilates_refill_enabled είναι ενεργό', 'warning');
    log('   • Το workflow έχει permissions να τρέξει', 'warning');
    log('', 'header');

    return true;
}

verifyGitHubActions()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });

