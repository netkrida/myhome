# Generate CRON_SECRET for Vercel & VPS deployment
# Usage: .\generate-cron-secret.ps1

Write-Host '🏠 Generating CRON_SECRET...' -ForegroundColor Cyan
Write-Host ''

# Generate 32 random bytes and convert to Base64
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

Write-Host '✅ Generated CRON_SECRET:' -ForegroundColor Green
Write-Host ''
Write-Host $secret -ForegroundColor Yellow
Write-Host ''

Write-Host '🔧 Next steps:' -ForegroundColor Cyan
Write-Host '1. Copy the secret above'
Write-Host '2. Add to Vercel Dashboard -> Settings -> Environment Variables'
Write-Host '   Variable name: CRON_SECRET'
Write-Host '   Variable value: (paste the secret)'
Write-Host ''
# Tampilkan baris .env dengan konkatenasi agar tidak rawan kutip
Write-Host '3. For VPS, add to .env.production:'
Write-Host ('   CRON_SECRET=' + $secret)
Write-Host ''
Write-Host '⚠️  SECURITY: Never commit this secret to git!' -ForegroundColor Red
Write-Host ''

# Try to copy to clipboard (cek ketersediaan cmdlet dulu)
try {
    if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
        Set-Clipboard -Value $secret
        Write-Host 'Secret copied to clipboard!' -ForegroundColor Green
    } else {
        Write-Host 'WARNING: Set-Clipboard is not available in this environment' -ForegroundColor Yellow
    }
}
catch {
    Write-Host 'WARNING: Could not copy to clipboard (not available in this environment)' -ForegroundColor Yellow
}
