# Simple PowerShell script untuk check deployment MyHome
param([switch]$TestBuild = $false)

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "MyHome Deployment Check (Windows)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Checking required files for Dockploy deployment..." -ForegroundColor Cyan

$requiredFiles = @("Dockerfile", "docker-compose.yml", ".dockerignore", ".env.dockploy.example", "next.config.js", "package.json")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "[SUCCESS] ✅ $file found" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] ❌ $file missing" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "[ERROR] Missing required files. Please create them before deployment." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] Checking environment configuration..." -ForegroundColor Cyan

if (Test-Path ".env.production") {
    Write-Host "[SUCCESS] ✅ .env.production found" -ForegroundColor Green
    
    $requiredVars = @("AUTH_SECRET", "DATABASE_URL", "NEXTAUTH_URL", "CLOUDINARY_API_SECRET")
    $envContent = Get-Content ".env.production" -Raw
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "(?m)^$var\s*=\s*[`"']?([^`"'\r\n]+)[`"']?") {
            $value = $matches[1].Trim()
            if ($value -and $value -notmatch "^\[.*\]$" -and $value -notmatch "placeholder" -and $value -ne "your-" -and $value.Length -gt 5) {
                Write-Host "[SUCCESS] ✅ $var is set" -ForegroundColor Green
            } else {
                Write-Host "[WARNING] ⚠️  $var is set but appears to be placeholder" -ForegroundColor Yellow
                $missingVars += $var
            }
        } else {
            Write-Host "[ERROR] ❌ $var not found" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "[WARNING] Some required environment variables are missing or have placeholder values." -ForegroundColor Yellow
        Write-Host "[INFO] Please update these variables in .env.production:" -ForegroundColor Cyan
        foreach ($var in $missingVars) {
            Write-Host "  - $var"
        }
    }
} else {
    Write-Host "[WARNING] ⚠️  .env.production not found" -ForegroundColor Yellow
    Write-Host "[INFO] You can copy from .env.dockploy.example and customize it" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "[INFO] Checking Next.js configuration..." -ForegroundColor Cyan

$nextConfigContent = Get-Content "next.config.js" -Raw
if ($nextConfigContent -match "output.*standalone") {
    Write-Host "[SUCCESS] ✅ Next.js standalone output is configured" -ForegroundColor Green
} else {
    Write-Host "[WARNING] ⚠️  Next.js standalone output not found in next.config.js" -ForegroundColor Yellow
    Write-Host "[INFO] This is required for optimal Docker deployment" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "[INFO] Checking package.json scripts..." -ForegroundColor Cyan

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$requiredScripts = @("build", "start", "prisma:generate", "prisma:migrate:deploy")

foreach ($script in $requiredScripts) {
    if ($packageJson.scripts.$script) {
        Write-Host "[SUCCESS] ✅ $script script found" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] ⚠️  $script script not found" -ForegroundColor Yellow
    }
}

if ($TestBuild) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host ""
        Write-Host "[INFO] Testing Docker build..." -ForegroundColor Cyan
        
        try {
            $buildResult = docker build -t myhome-test . 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[SUCCESS] ✅ Docker build successful" -ForegroundColor Green
                docker rmi myhome-test --force > $null 2>&1
            } else {
                Write-Host "[ERROR] ❌ Docker build failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "[ERROR] ❌ Docker build failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "[WARNING] ⚠️  Docker not found. Cannot test build" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Repository Information:" -ForegroundColor Cyan
$gitRemote = ""
$gitBranch = ""

try {
    $gitRemote = git config --get remote.origin.url 2>$null
    if (-not $gitRemote) { $gitRemote = "Not configured" }
} catch { $gitRemote = "Not configured" }

try {
    $gitBranch = git branch --show-current 2>$null
    if (-not $gitBranch) { $gitBranch = "Not in git repository" }
} catch { $gitBranch = "Not in git repository" }

Write-Host "  Repository: $gitRemote"
Write-Host "  Current Branch: $gitBranch"

Write-Host ""
Write-Host "[INFO] Required Environment Variables for Dockploy:" -ForegroundColor Cyan
Write-Host "  AUTH_SECRET: 32+ character secret"
Write-Host "  NEXTAUTH_URL: https://myhome.co.id"
Write-Host "  DATABASE_URL: PostgreSQL connection string"
Write-Host "  CLOUDINARY_API_SECRET: For image uploads"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Next Steps for Dockploy Deployment" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Copy environment variables:"
Write-Host "   - Use .env.dockploy.example as template"
Write-Host "   - Set all required variables in Dockploy dashboard"
Write-Host ""
Write-Host "2. Connect repository to Dockploy:"
Write-Host "   - Repository URL: $gitRemote"
Write-Host "   - Branch: main"
Write-Host "   - Build Context: /"
Write-Host "   - Dockerfile Path: Dockerfile"
Write-Host ""
Write-Host "3. Configure Dockploy settings:"
Write-Host "   - Port: 3000"
Write-Host "   - Health Check: /api/health"
Write-Host "   - Domain: myhome.co.id"
Write-Host ""
Write-Host "4. Deploy:"
Write-Host "   - Click Deploy in Dockploy dashboard"
Write-Host "   - Monitor build logs"
Write-Host "   - Test health endpoint: https://myhome.co.id/api/health"

Write-Host ""
Write-Host "[SUCCESS] Your project is ready for Dockploy deployment!" -ForegroundColor Green

Write-Host ""
Write-Host "[INFO] For troubleshooting, check:" -ForegroundColor Cyan
Write-Host "  docs/DOCKPLOY_DEPLOYMENT.md"
Write-Host "  docs/DOCKER_BUILD_GUIDE.md"
Write-Host "  docs/DOCKER_DEPLOYMENT.md"

Write-Host ""
Write-Host "[INFO] To run this script with Docker build test:" -ForegroundColor Cyan
Write-Host "  PowerShell: .\scripts\check-deployment.ps1 -TestBuild"
Write-Host "  Git Bash: bash scripts/deploy-dockploy.sh"
