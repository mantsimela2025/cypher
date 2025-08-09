# PowerShell script to convert all .md files in /docs to .pdf using Pandoc (HTML method)
# Author: Generated for CYPHER project

$PandocPath = "C:\Program Files\Pandoc\pandoc.exe"
$DocsPath = ".\docs"
$OutputPath = ".\docs-pdf"

# Create output directory if it doesn't exist
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
    Write-Host "Created output directory: $OutputPath" -ForegroundColor Green
}

# Function to convert a single markdown file to PDF via HTML
function Convert-MarkdownToPdfViaHtml {
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
        
        # Try different PDF engines in order of preference
        $engines = @("wkhtmltopdf", "weasyprint", "prince", "pagedjs-cli")
        $success = $false
        
        foreach ($engine in $engines) {
            try {
                # Run Pandoc conversion with current PDF engine
                & $PandocPath -f markdown -t pdf --pdf-engine=$engine -o $OutputFile $InputFile
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Successfully converted: $InputFile -> $OutputFile (using $engine)" -ForegroundColor Green
                    return $true
                }
            }
            catch {
                # Continue to next engine
            }
        }
        
        # If all PDF engines fail, try HTML intermediate approach
        try {
            $htmlFile = $OutputFile -replace '\.pdf$', '.html'
            & $PandocPath -f markdown -t html5 --standalone --css="https://cdn.jsdelivr.net/gh/sindresorhus/github-markdown-css@4/github-markdown.css" -o $htmlFile $InputFile
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Converted to HTML: $InputFile -> $htmlFile" -ForegroundColor Yellow
                Write-Host "Note: PDF conversion failed, HTML version created instead" -ForegroundColor Yellow
                return $true
            }
        }
        catch {
            # Final fallback failed
        }
        
        Write-Host "Failed to convert: $InputFile (no suitable PDF engine found)" -ForegroundColor Red
        return $false
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

Write-Host "Starting conversion of markdown files to PDF documents..." -ForegroundColor Cyan
Write-Host "Source: $DocsPath" -ForegroundColor Yellow
Write-Host "Output: $OutputPath" -ForegroundColor Yellow
Write-Host "Pandoc: $PandocPath" -ForegroundColor Yellow
Write-Host "Fallback: HTML if PDF engines not available" -ForegroundColor Yellow
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
    $relativePath = $file.FullName.Substring((Resolve-Path $DocsPath).Path.Length + 1)
    $outputFile = Join-Path $OutputPath ($relativePath -replace '\.md$', '.pdf')
    
    Write-Host "Converting: $relativePath"
    
    if (Convert-MarkdownToPdfViaHtml -InputFile $file.FullName -OutputFile $outputFile) {
        $successCount++
    } else {
        $failureCount++
    }
}

Write-Host ""
Write-Host "Conversion Summary:" -ForegroundColor Cyan
Write-Host "Successfully processed: $successCount files" -ForegroundColor Green
if ($failureCount -gt 0) {
    Write-Host "Failed to convert: $failureCount files" -ForegroundColor Red
}

Write-Host ""
Write-Host "Files saved to: $OutputPath" -ForegroundColor Yellow
Write-Host "Note: Install wkhtmltopdf, weasyprint, or LaTeX for full PDF support" -ForegroundColor Cyan