# ==========================================
# FIXED BUILDER FOR TIKTOK DOWNLOADER (.EXE)
# ==========================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting application build..." -ForegroundColor Cyan

# 1. Check and install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing libraries (npm install)..." -ForegroundColor Yellow
    npm install
}

# 2. Create configuration
# We fixed the structure to remove warnings
$config = @{
    appId = "com.tiktok-downloader.app"
    productName = "TikTok Video Downloader"
    # "directories" moved inside configuration properly usually, 
    # but strictly speaking for electron-builder config file:
    directories = @{
        output = "release"
        buildResources = "assets"
    }
    files = @(
        "main.js",
        "server.js",       
        "public/**/*",    
        "src/**/*",       
        "package.json",
        "node_modules/**/*" 
    )
    win = @{
        target = "nsis"
        icon = "public/assets/tdd-icon_type2,1.svg" 
    }
    asar = $true
    asarUnpack = @(
        "node_modules/ffmpeg-static/**",
        "node_modules/ffprobe-static/**"
    )
    nsis = @{
        oneClick = $false
        allowToChangeInstallationDirectory = $true
        createDesktopShortcut = $true
        runAfterFinish = $true
    }
} | ConvertTo-Json -Depth 10

# Save config to file
Set-Content -Path "electron-builder.json" -Value $config
Write-Host "✅ Config updated." -ForegroundColor Green

# 3. Run build
Write-Host "🔨 Running electron-builder..." -ForegroundColor Cyan

try {
    # Using npx ensures we use the local version we just fixed
    npx electron-builder --win --config electron-builder.json
    
    Write-Host ""
    Write-Host "🎉 SUCCESS!" -ForegroundColor Green
    Write-Host "Check the 'release' folder for your .exe file" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "❌ BUILD ERROR:" -ForegroundColor Red
    Write-Host $_
    exit 1
}