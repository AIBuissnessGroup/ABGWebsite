# DocumentDB Import Script
$password = "YOUR_PASSWORD_HERE"
$host = "abgwebdb.cluster-c238eu2kguyx.us-east-1.docdb.amazonaws.com:27017"
$username = "skywlkr"
$database = "abg-website"
$dumpPath = "C:\Users\marsh\server-backup\mongo_exports_abg-website"
$certFile = "C:\Users\marsh\OneDrive - Umich\Documents\GitHub\ABGWebsite\global-bundle.pem"

Write-Host "Starting DocumentDB import..." -ForegroundColor Green
$files = Get-ChildItem $dumpPath -Filter "*.json"
$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $collectionName = $file.BaseName
    Write-Host "Importing $collectionName..." -ForegroundColor Yellow
    
    mongoimport --host $host --ssl --sslCAFile $certFile --username $username --password $password --authenticationDatabase admin --db $database --collection $collectionName --file $file.FullName --jsonArray
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: $collectionName" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "Failed: $collectionName" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "Complete! Success: $successCount, Failed: $failCount" -ForegroundColor Cyan
