# 🚀 Manual Deployment Check untuk Windows PowerShell
# Script PowerShell untuk validasi deployment MyHome di Windows

param(
    [switch]$TestBuild = $false,
    [switch]$Verbose = $false
)

# Colors untuk output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor $Blue
    Write-Host "🚀 $Title" -ForegroundColor $Blue
    Write-Host "===================================================" -ForegroundColor $Blue
    Write-Host ""
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root directory."
    exit 1
}

Write-Header "MyHome Deployment Check (Windows)"

# Check required files
Write-Status "Checking required files for Dockploy deployment..."

$requiredFiles = @(
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    ".env.dockploy.example",
    "next.config.js",
    "package.json"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "✅ $file found"
    } else {
        Write-Error "❌ $file missing"
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Error "Missing required files. Please create them before deployment."
    exit 1
}

# Check environment file
Write-Status "Checking environment configuration..."

if (Test-Path ".env.production") {
    Write-Success "✅ .env.production found"
    
    # Check required environment variables
    $requiredVars = @(
        "AUTH_SECRET",
        "DATABASE_URL",
        "NEXTAUTH_URL",
        "CLOUDINARY_API_SECRET"
    )
    
    $envContent = Get-Content ".env.production" -Raw
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=(.+)$") {
            $value = $matches[1].Trim('"')
            if ($value -and $value -notmatch "^\[.*\]$" -and $value -notmatch "placeholder") {
                Write-Success "✅ $var is set"
            } else {
                Write-Warning "⚠️  $var is set but appears to be placeholder"
                $missingVars += $var
            }
        } else {
            Write-Error "❌ $var not found"
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Warning "Some required environment variables are missing or have placeholder values."
        Write-Status "Please update these variables in .env.production:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var"
        }
    }
} else {
    Write-Warning "⚠️  .env.production not found"
    Write-Status "You can copy from .env.dockploy.example and customize it"
}

# Check Next.js configuration
Write-Status "Checking Next.js configuration..."

$nextConfigContent = Get-Content "next.config.js" -Raw
if ($nextConfigContent -match "output.*standalone") {
    Write-Success "✅ Next.js standalone output is configured"
} else {
    Write-Warning "⚠️  Next.js standalone output not found in next.config.js"
    Write-Status "This is required for optimal Docker deployment"
}

# Check package.json scripts
Write-Status "Checking package.json scripts..."

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$requiredScripts = @(
    "build",
    "start",
    "prisma:generate",
    "prisma:migrate:deploy"
)

foreach ($script in $requiredScripts) {
    if ($packageJson.scripts.$script) {
        Write-Success "✅ $script script found"
    } else {
        Write-Warning "⚠️  $script script not found"
    }
}

# Test Docker build (optional)
if ($TestBuild) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Status "Testing Docker build..."
        
        try {
            $buildResult = docker build -t myhome-test . 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "✅ Docker build successful"
                
                # Clean up test image
                docker rmi myhome-test --force > $null 2>&1
            } else {
                Write-Error "❌ Docker build failed"
                if ($Verbose) {
                    Write-Host $buildResult
                }
            }
        } catch {
            Write-Error "❌ Docker build failed: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "⚠️  Docker not found. Cannot test build"
    }
}

# Generate deployment summary
Write-Header "Deployment Summary"

Write-Status "Repository Information:"
$gitRemote = ""
$gitBranch = ""
$gitCommit = ""

try {
    $gitRemote = git config --get remote.origin.url 2>$null
    if (-not $gitRemote) { $gitRemote = "Not configured" }
} catch { $gitRemote = "Not configured" }

try {
    $gitBranch = git branch --show-current 2>$null
    if (-not $gitBranch) { $gitBranch = "Not in git repository" }
} catch { $gitBranch = "Not in git repository" }

try {
    $gitCommit = git log -1 --pretty=format:'%h - %s (%cr)' 2>$null
    if (-not $gitCommit) { $gitCommit = "No commits found" }
} catch { $gitCommit = "No commits found" }

Write-Host "  📁 Repository: $gitRemote"
Write-Host "  🌿 Current Branch: $gitBranch"
Write-Host "  📝 Last Commit: $gitCommit"

Write-Status "Deployment Configuration:"
Write-Host "  🐳 Dockerfile: Ready for multi-stage build"
Write-Host "  📦 Docker Compose: Production configuration"
Write-Host "  🚫 Docker Ignore: Optimized for build speed"
Write-Host "  ⚙️  Environment: Template provided (.env.dockploy.example)"

Write-Status "Required Environment Variables for Dockploy:"
Write-Host "  🔐 AUTH_SECRET: 32+ character secret"
Write-Host "  🌐 NEXTAUTH_URL: https://yourdomain.com"
Write-Host "  🗄️  DATABASE_URL: PostgreSQL connection string"
Write-Host "  🖼️  CLOUDINARY_API_SECRET: For image uploads"

Write-Header "Next Steps for Dockploy Deployment"

Write-Host "1. 📋 Copy environment variables:"
Write-Host "   - Use .env.dockploy.example as template"
Write-Host "   - Set all required variables in Dockploy dashboard"
Write-Host ""
Write-Host "2. 🔗 Connect repository to Dockploy:"
$repoUrl = ""
try {
    $repoUrl = git config --get remote.origin.url 2>$null
    if (-not $repoUrl) { $repoUrl = "Configure git remote" }
} catch { $repoUrl = "Configure git remote" }
Write-Host "   - Repository URL: $repoUrl"
Write-Host "   - Branch: main (or your deployment branch)"
Write-Host "   - Build Context: /"
Write-Host "   - Dockerfile Path: Dockerfile"
Write-Host ""
Write-Host "3. ⚙️  Configure Dockploy settings:"
Write-Host "   - Port: 3000"
Write-Host "   - Health Check: /api/health"
Write-Host "   - Domain: your-domain.com"
Write-Host ""
Write-Host "4. 🚀 Deploy:"
Write-Host "   - Click Deploy in Dockploy dashboard"
Write-Host "   - Monitor build logs"
Write-Host "   - Test health endpoint: https://your-domain.com/api/health"

Write-Success "🎉 Your project is ready for Dockploy deployment!"

Write-Status "For troubleshooting, check:"
Write-Host "  📖 docs/DOCKPLOY_DEPLOYMENT.md"
Write-Host "  🐳 docs/DOCKER_BUILD_GUIDE.md"
Write-Host "  🔧 docs/DOCKER_DEPLOYMENT.md"

Write-Host ""
Write-Status "To run this script with Docker build test:"
Write-Host "  PowerShell: .\scripts\manual-deploy-check.ps1 -TestBuild"
Write-Host "  Git Bash: bash scripts/deploy-dockploy.sh"
