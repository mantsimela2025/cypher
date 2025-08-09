# PowerShell script to convert all .md files in /CYPHER_DOCS to .pdf using Pandoc with wkhtmltopdf
# Author: Generated for CYPHER project

$PandocPath = "C:\Program Files\Pandoc\pandoc.exe"
$WkhtmltopdfPath = "C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
$DocsPath = ".\CYPHER_DOCS"
$OutputPath = ".\CYPHER_DOCS_PDF"

# Create output directory if it doesn't exist
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
    Write-Host "Created output directory: $OutputPath" -ForegroundColor Green
}

# Function to convert a single markdown file to PDF
function Convert-MarkdownToPdf {
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
        
        # Run Pandoc conversion with wkhtmltopdf
        & $PandocPath -f markdown -t pdf --pdf-engine="$WkhtmltopdfPath" -o $OutputFile $InputFile 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Success: $(Split-Path $InputFile -Leaf)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Failed: $(Split-Path $InputFile -Leaf)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  Error: $(Split-Path $InputFile -Leaf) - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check if Pandoc exists
if (!(Test-Path $PandocPath)) {
    Write-Host "Error: Pandoc not found at $PandocPath" -ForegroundColor Red
    exit 1
}

# Check if wkhtmltopdf exists
if (!(Test-Path $WkhtmltopdfPath)) {
    Write-Host "Error: wkhtmltopdf not found at $WkhtmltopdfPath" -ForegroundColor Red
    exit 1
}

# Check if CYPHER_DOCS directory exists
if (!(Test-Path $DocsPath)) {
    Write-Host "Error: CYPHER_DOCS directory not found at $DocsPath" -ForegroundColor Red
    exit 1
}

Write-Host "Starting conversion of CYPHER_DOCS markdown files to PDF documents..." -ForegroundColor Cyan
Write-Host "Source: $DocsPath" -ForegroundColor Yellow
Write-Host "Output: $OutputPath" -ForegroundColor Yellow
Write-Host "PDF Engine: wkhtmltopdf" -ForegroundColor Yellow
Write-Host ""

# Get all .md files recursively
$markdownFiles = Get-ChildItem -Path $DocsPath -Filter "*.md" -Recurse

Write-Host "Found $($markdownFiles.Count) markdown files to convert across all subdirectories" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failureCount = 0

# Convert each file
foreach ($file in $markdownFiles) {
    # Calculate relative path from CYPHER_DOCS directory
    $relativePath = $file.FullName.Substring((Resolve-Path $DocsPath).Path.Length + 1)
    $outputFile = Join-Path $OutputPath ($relativePath -replace '\.md$', '.pdf')
    
    # Show current directory being processed
    $currentDir = Split-Path $relativePath -Parent
    if ($currentDir) {
        Write-Host "Processing: $currentDir\$(Split-Path $relativePath -Leaf)"
    } else {
        Write-Host "Processing: $(Split-Path $relativePath -Leaf)"
    }
    
    if (Convert-MarkdownToPdf -InputFile $file.FullName -OutputFile $outputFile) {
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
Write-Host "PDF documents saved to: $OutputPath" -ForegroundColor Yellow

# Show directory structure summary
if (Test-Path $OutputPath) {
    $totalDirectories = (Get-ChildItem -Path $OutputPath -Directory -Recurse).Count + 1
    Write-Host "Created $totalDirectories directories with $successCount PDF files" -ForegroundColor Cyan
}