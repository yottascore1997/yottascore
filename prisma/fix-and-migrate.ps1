# Fix P3015: remove old migration folder and mark rolled back, then run new migration
$migrationsPath = Join-Path $PSScriptRoot "migrations"
$oldFolder = Join-Path $migrationsPath "20250107120000_add_category_logo_to_practice_exam"

if (Test-Path $oldFolder) {
    Remove-Item -Recurse -Force $oldFolder
    Write-Host "Removed folder: 20250107120000_add_category_logo_to_practice_exam"
} else {
    Write-Host "Folder already removed."
}

Write-Host "Marking migration as rolled back in database..."
npx prisma migrate resolve --rolled-back "20250107120000_add_category_logo_to_practice_exam"

Write-Host "Running migrate dev..."
npx prisma migrate dev --name add_daily_quote
