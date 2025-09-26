# PowerShell Script για εκτέλεση των Combination Paspartu Tests
# Χρήση: .\run-combination-tests.ps1

Write-Host "🧪 ΕΚΚΙΝΗΣΗ COMBINATION PASPARTU SIMULATION TESTS" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

# Έλεγχος αν υπάρχει το Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js βρέθηκε: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js δεν βρέθηκε. Παρακαλώ εγκαταστήστε το Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Εκτέλεση των simulation tests..." -ForegroundColor Yellow
Write-Host ""

# Εκτέλεση των tests
try {
    node test-combination-paspartu-simulation.js
    Write-Host ""
    Write-Host "✅ Tests ολοκληρώθηκαν επιτυχώς!" -ForegroundColor Green
} catch {
    Write-Host "❌ Σφάλμα κατά την εκτέλεση των tests: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Για περισσότερες πληροφορίες, δείτε το αρχείο test-combination-paspartu-simulation.js" -ForegroundColor Cyan
Write-Host "🔧 Αν χρειάζεστε διορθώσεις, επεξεργαστείτε το src/pages/AdminPanel.tsx" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Simulation completed!" -ForegroundColor Magenta
