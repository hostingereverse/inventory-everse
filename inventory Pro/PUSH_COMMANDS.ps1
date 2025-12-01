# Push Code to GitHub - PowerShell Script
# Replace YOUR_TOKEN_HERE with your actual GitHub Personal Access Token

cd "D:\Inventory eVerse"

# Check current status
Write-Host "Current commit:" -ForegroundColor Cyan
git log --oneline -1

Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow

# Method 1: Push with token (replace YOUR_TOKEN_HERE)
# Uncomment and replace YOUR_TOKEN_HERE with your actual token:
# git push https://YOUR_TOKEN_HERE@github.com/hostingereverse/inventory-everse.git main --force

# Method 2: Normal push (will prompt for credentials)
git push origin main --force

Write-Host "`nPush complete! Check GitHub: https://github.com/hostingereverse/inventory-everse" -ForegroundColor Green

