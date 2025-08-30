# PowerShell Installation Script for Clerk + Convex Login
# Run this script in PowerShell with execution policy: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "🚀 Setting up Clerk + Convex Login Project" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Install additional required packages
Write-Host "📦 Installing additional packages..." -ForegroundColor Yellow
npm install tailwindcss-animate

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "🔧 Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "✅ .env.local created. Please update it with your Clerk and Convex credentials." -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Check if Convex is configured
if (Test-Path "convex/convex.json") {
    Write-Host "✅ Convex configuration found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Convex configuration not found. Please run 'npx convex dev' to set up Convex." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env.local with your Clerk and Convex credentials" -ForegroundColor White
Write-Host "2. Run 'npx convex dev' to set up your Convex backend" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see README.md" -ForegroundColor Cyan
