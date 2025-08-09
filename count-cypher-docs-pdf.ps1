# PowerShell script to count PDF files in CYPHER_DOCS_PDF directory breakdown
Write-Host "CYPHER_DOCS_PDF Directory Breakdown:" -ForegroundColor Cyan
Write-Host ""

$total = 0
$directories = Get-ChildItem -Path ".\CYPHER_DOCS_PDF" -Recurse -Directory | Sort-Object Name

foreach ($dir in $directories) {
    $count = (Get-ChildItem -Path $dir.FullName -Filter "*.pdf" | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "$($dir.Name): $count PDFs"
        $total += $count
    }
}

# Also count PDFs in root directory
$rootCount = (Get-ChildItem -Path ".\CYPHER_DOCS_PDF" -Filter "*.pdf" | Measure-Object).Count
if ($rootCount -gt 0) {
    Write-Host "Root Directory: $rootCount PDFs"
    $total += $rootCount
}

Write-Host ""
Write-Host "TOTAL PDF DOCUMENTS: $total" -ForegroundColor Green