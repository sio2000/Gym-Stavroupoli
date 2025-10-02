# PowerShell script to run the installment fixing SQL scripts
# This script will execute the SQL scripts to fix the installment locking functionality

Write-Host "Starting installment locking fix..." -ForegroundColor Green

# Set the database URL
$DB_URL = "postgresql://postgres:postgres@localhost:54322/postgres"

# Check if Supabase is running
Write-Host "Checking if Supabase is running..." -ForegroundColor Yellow
$supabaseStatus = npx supabase status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Supabase is not running. Please start it first with: npx supabase start" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase is running. Proceeding with database fixes..." -ForegroundColor Green

# Run the SQL scripts in order
Write-Host "Step 1: Adding installment columns to membership_requests table..." -ForegroundColor Yellow
npx supabase db push --db-url $DB_URL --file database/ADD_INSTALLMENT_COLUMNS.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Columns added successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to add columns" -ForegroundColor Red
    exit 1
}

Write-Host "Step 2: Updating installment functions..." -ForegroundColor Yellow
npx supabase db push --db-url $DB_URL --file database/UPDATE_INSTALLMENT_FUNCTIONS.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Functions updated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to update functions" -ForegroundColor Red
    exit 1
}

Write-Host "Step 3: Updating existing data..." -ForegroundColor Yellow
npx supabase db push --db-url $DB_URL --file database/UPDATE_EXISTING_DATA.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Data updated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to update data" -ForegroundColor Red
    exit 1
}

Write-Host "All steps completed successfully!" -ForegroundColor Green
Write-Host "The installment locking functionality should now work properly." -ForegroundColor Green
Write-Host "Please test the functionality in the admin panel." -ForegroundColor Yellow
