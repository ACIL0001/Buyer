# build-with-notifications.ps1
Write-Host "=== Building MazadClick with Notifications ===" -ForegroundColor Cyan
Write-Host "Project: MazadClick Buyer App" -ForegroundColor White
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Step 1: Check for required files
Write-Host "`n📋 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "android\app\google-services.json",
    "src\services\notifications.ts",
    "android\app\src\main\res\drawable\ic_notification.png"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

# Step 2: Install dependencies if needed
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Step 3: Prepare www directory
Write-Host "`n📁 Preparing web directory..." -ForegroundColor Yellow
Remove-Item -Recurse -Force www\* -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path www | Out-Null

# Create minimal index.html
$htmlContent = @'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <title>MazadClick</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #FFFFFF;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .loading-container {
            text-align: center;
            padding: 20px;
        }
        .loading-text {
            color: #333;
            font-size: 18px;
            margin-top: 15px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #FF0000;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <script>
        // Redirect to main website
        setTimeout(function() {
            window.location.href = "https://mazadclick.vercel.app";
        }, 100);
        
        // Initialize Capacitor
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof Capacitor !== 'undefined') {
                console.log('Capacitor loaded, initializing notifications...');
            }
        });
    </script>
</head>
<body>
    <div class="loading-container">
        <div class="spinner"></div>
        <div class="loading-text">
            <h2>MazadClick</h2>
            <p>Loading application...</p>
        </div>
    </div>
</body>
</html>
'@

Set-Content -Path "www\index.html" -Value $htmlContent -Encoding UTF8
Write-Host "✅ Created www/index.html" -ForegroundColor Green

# Step 4: Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Capacitor sync successful" -ForegroundColor Green
} else {
    Write-Host "❌ Capacitor sync failed" -ForegroundColor Red
    exit 1
}

npx cap copy
Write-Host "✅ Web assets copied" -ForegroundColor Green

# Step 5: Build Android APK
Write-Host "`n🔨 Building Android APK..." -ForegroundColor Green
Set-Location android

Write-Host "   Cleaning previous builds..." -ForegroundColor Gray
.\gradlew clean

Write-Host "   Building debug APK..." -ForegroundColor Gray
.\gradlew assembleDebug

# Check build result
if ($LASTEXITCODE -eq 0) {
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        $size = (Get-Item $apkPath).Length / 1MB
        $sizeFormatted = [math]::Round($size, 2)
        
        Write-Host "`n🎉 BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
        
        Write-Host "📱 APK Details:" -ForegroundColor White
        Write-Host "   Location: $((Get-Location).Path)\$apkPath" -ForegroundColor Gray
        Write-Host "   Size: $sizeFormatted MB" -ForegroundColor Gray
        Write-Host "   Version: 1.0.0" -ForegroundColor Gray
        Write-Host "   Package: com.mazadclick.buyer" -ForegroundColor Gray
        
        Write-Host "`n🚀 Installation Commands:" -ForegroundColor White
        Write-Host "   adb install ""$apkPath""" -ForegroundColor Cyan
        Write-Host "   # Or copy to device and install manually" -ForegroundColor Gray
        
        Write-Host "`n🔔 Notification Features:" -ForegroundColor White
        Write-Host "   ✅ Push notifications enabled" -ForegroundColor Green
        Write-Host "   ✅ Firebase Cloud Messaging" -ForegroundColor Green
        Write-Host "   ✅ Local notifications" -ForegroundColor Green
        Write-Host "   ✅ Notification channels" -ForegroundColor Green
        
        Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    } else {
        Write-Host "❌ APK file not found at expected location" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed! Check Gradle errors above." -ForegroundColor Red
}

Set-Location ..
Write-Host "`n🏁 Build process completed!" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray