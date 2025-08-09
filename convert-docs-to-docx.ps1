# PowerShell script to convert all .md files in /docs to .docx using Pandoc
# Author: Generated for CYPHER project

$PandocPath = "C:\Program Files\Pandoc\pandoc.exe"
$DocsPath = ".\docs"
$OutputPath = ".\docs-docx"

# Create output directory if it doesn't exist
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
    Write-Host "Created output directory: $OutputPath" -ForegroundColor Green
}

# Function to convert a single markdown file
function Convert-MarkdownToDocx {
    param(
        [string]$InputFile,
        [string]$OutputFile
    )
    
    try {
        # Create output directory if needed
        $outputDir = Split-Path $OutputFile -Parent
        if (!(Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        # Run Pandoc conversion
        & $PandocPath -f markdown -t docx -o $OutputFile $InputFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully converted: $InputFile -> $OutputFile" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Failed to convert: $InputFile" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Error converting $InputFile : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check if Pandoc exists
if (!(Test-Path $PandocPath)) {
    Write-Host "Error: Pandoc not found at $PandocPath" -ForegroundColor Red
    exit 1
}

# Check if docs directory exists
if (!(Test-Path $DocsPath)) {
    Write-Host "Error: Docs directory not found at $DocsPath" -ForegroundColor Red
    exit 1
}

Write-Host "Starting conversion of markdown files to Word documents..." -ForegroundColor Cyan
Write-Host "Source: $DocsPath" -ForegroundColor Yellow
Write-Host "Output: $OutputPath" -ForegroundColor Yellow
Write-Host "Pandoc: $PandocPath" -ForegroundColor Yellow
Write-Host ""

# Get all .md files recursively
$markdownFiles = Get-ChildItem -Path $DocsPath -Filter "*.md" -Recurse

Write-Host "Found $($markdownFiles.Count) markdown files to convert" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failureCount = 0

# Convert each file
foreach ($file in $markdownFiles) {
    # Calculate relative path from docs directory
    $relativePath = $file.FullName.Substring($DocsPath.Length + 1)
    $outputFile = Join-Path $OutputPath ($relativePath -replace '\.md$', '.docx')
    
    Write-Host "Converting: $relativePath"
    
    if (Convert-MarkdownToDocx -InputFile $file.FullName -OutputFile $outputFile) {
        $successCount++
    } else {
        $failureCount++
    }
}

Write-Host ""
Write-Host "Conversion Summary:" -ForegroundColor Cyan
Write-Host "Successfully converted: $successCount files" -ForegroundColor Green
if ($failureCount -gt 0) {
    Write-Host "Failed to convert: $failureCount files" -ForegroundColor Red
} else {
    Write-Host "All files converted successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Word documents saved to: $OutputPath" -ForegroundColor Yellow