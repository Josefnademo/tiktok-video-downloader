param(
    [ValidateSet("install", "dev", "build", "build-installer", "clean", "full-setup")]
    [string]$Command = "dev",
    
    [switch]$SkipNodeCheck,
    [switch]$Verbose
)

# ============================================================================
# TIKTOK VIDEO DOWNLOADER - ELECTRON DEPLOYMENT SCRIPT
# ============================================================================

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# Colors for output
$Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [ValidateSet("Success", "Error", "Warning", "Info")]
        [string]$Level = "Info"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $icon = @{
        Success = "[OK]"
        Error   = "[ERROR]"
        Warning = "[WARNING]"
        Info    = "[INFO]"
    }
    
    Write-Host "[$timestamp] $($icon[$Level]) $Message" -ForegroundColor $Colors[$Level]
}

function Check-Prerequisites {
    Write-Log "Checking prerequisites..." "Info"
    
    # Check Node.js
    if (-not $SkipNodeCheck) {
        try {
            $nodeVersion = node -v
            Write-Log "Node.js found: $nodeVersion" "Success"
        }
        catch {
            Write-Log "Node.js is not installed or not in PATH" "Error"
            Write-Log "Please install Node.js from https://nodejs.org/" "Warning"
            exit 1
        }
    }
    
    # Check npm
    try {
        $npmVersion = npm -v
        Write-Log "npm found: $npmVersion" "Success"
    }
    catch {
        Write-Log "npm is not installed or not in PATH" "Error"
        exit 1
    }
    
    Write-Log "All prerequisites met!" "Success"
}

function Install-Dependencies {
    Write-Log "Installing npm dependencies..." "Info"
    
    try {
        npm install
        Write-Log "Dependencies installed successfully" "Success"
    }
    catch {
        Write-Log "Failed to install dependencies: $_" "Error"
        exit 1
    }
}

function Start-Development {
    Write-Log "Starting Electron app in development mode..." "Info"
    Write-Log "Press Ctrl+C to stop the application" "Warning"
    
    try {
        npm start
    }
    catch {
        Write-Log "Failed to start application: $_" "Error"
        exit 1
    }
}

function Build-App {
    Write-Log "Building Electron application..." "Info"
    
    # Create build directory
    if (-not (Test-Path ".\dist")) {
        New-Item -ItemType Directory -Path ".\dist" | Out-Null
        Write-Log "Created dist directory" "Success"
    }
    
    # Copy essential files to dist
    $filesToCopy = @(
        "main.js",
        "index.html",
        "src",
        "package.json"
    )
    
    foreach ($file in $filesToCopy) {
        if (Test-Path $file) {
            if ((Get-Item $file) -is [System.IO.DirectoryInfo]) {
                Copy-Item -Path $file -Destination ".\dist\$file" -Recurse -Force
                Write-Log "Copied directory: $file" "Success"
            }
            else {
                Copy-Item -Path $file -Destination ".\dist\$file" -Force
                Write-Log "Copied file: $file" "Success"
            }
        }
    }
    
    Write-Log "Build completed. Output in ./dist directory" "Success"
}

function Build-Installer {
    Write-Log "Building installer with electron-builder..." "Info"
    
    # Check if electron-builder is installed
    if (-not (Test-Path ".\node_modules\electron-builder")) {
        Write-Log "Installing electron-builder..." "Info"
        npm install --save-dev electron-builder
    }
    
    # Ensure dist folder exists
    if (-not (Test-Path ".\dist")) {
        Build-App
    }
    
    # Create config if it doesn't exist
    $configPath = ".\electron-builder.json"
    if (-not (Test-Path $configPath)) {
        Write-Log "Creating electron-builder configuration..." "Info"
        $config = @{
            appId       = "com.tiktok-downloader.app"
            productName = "TikTok Video Downloader"
            directories = @{
                buildResources = "src"
                output          = "release"
            }
            files       = @(
                "main.js",
                "index.html",
                "src/**/*",
                "node_modules/**/*",
                "package.json"
            )
            win         = @{
                target = @("nsis", "portable")
            }
            nsis        = @{
                oneClick            = $false
                allowToChangeInstallationDirectory = $true
                createDesktopShortcut = $true
                createStartMenuShortcut = $true
            }
        } | ConvertTo-Json -Depth 5
        
        Set-Content -Path $configPath -Value $config
        Write-Log "Configuration created: $configPath" "Success"
    }
    
    try {
        npx electron-builder --win
        Write-Log "Installer build completed. Check ./release directory" "Success"
    }
    catch {
        Write-Log "Failed to build installer: $_" "Error"
        exit 1
    }
}

function Clean-Build {
    Write-Log "Cleaning build artifacts..." "Info"
    
    $dirsToRemove = @("dist", "release", ".output")
    
    foreach ($dir in $dirsToRemove) {
        if (Test-Path $dir) {
            Remove-Item -Path $dir -Recurse -Force
            Write-Log "Removed: $dir" "Success"
        }
    }
    
    Write-Log "Cleanup completed" "Success"
}

function Full-Setup {
    Write-Log "Running full setup..." "Info"
    
    Check-Prerequisites
    Install-Dependencies
    Write-Log "Setup complete! Run with -Command dev to start development" "Success"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TIKTOK VIDEO DOWNLOADER - ELECTRON DEPLOYMENT SCRIPT       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    switch ($Command) {
        "install" {
            Check-Prerequisites
            Install-Dependencies
        }
        "dev" {
            Check-Prerequisites
            if (-not (Test-Path ".\node_modules")) {
                Install-Dependencies
            }
            Start-Development
        }
        "build" {
            Check-Prerequisites
            if (-not (Test-Path ".\node_modules")) {
                Install-Dependencies
            }
            Build-App
        }
        "build-installer" {
            Check-Prerequisites
            if (-not (Test-Path ".\node_modules")) {
                Install-Dependencies
            }
            Build-Installer
        }
        "clean" {
            Clean-Build
        }
        "full-setup" {
            Full-Setup
        }
        default {
            Write-Log "Unknown command: $Command" "Error"
            Write-Host ""
            Write-Host "Usage: .\script.ps1 -Command [command]" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Available commands:" -ForegroundColor Yellow
            Write-Host "  install           - Install dependencies" -ForegroundColor Gray
            Write-Host "  dev               - Start development mode (default)" -ForegroundColor Gray
            Write-Host "  build             - Build the application" -ForegroundColor Gray
            Write-Host "  build-installer   - Create Windows installer (.exe)" -ForegroundColor Gray
            Write-Host "  clean             - Clean build artifacts" -ForegroundColor Gray
            Write-Host "  full-setup        - Complete setup (install + dependencies)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Examples:" -ForegroundColor Yellow
            Write-Host "  .\script.ps1 -Command dev" -ForegroundColor Gray
            Write-Host "  .\script.ps1 -Command build-installer" -ForegroundColor Gray
            Write-Host "  .\script.ps1 -Command clean -Verbose" -ForegroundColor Gray
            Write-Host ""
            exit 1
        }
    }
    
    Write-Host ""
    Write-Log "Operation completed successfully!" "Success"
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Log "Fatal error: $_" "Error"
    Write-Host ""
    exit 1
}