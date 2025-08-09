# PowerShell script to generate CYPHER DOCUMENT REPOSITORY with comprehensive document matrix
$PandocPath = "C:\Program Files\Pandoc\pandoc.exe"
$WkhtmltopdfPath = "C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
$RepoFile = "CYPHER DOCUMENT REPOSITORY.md"
$OutputPDF = "CYPHER DOCUMENT REPOSITORY.pdf"

Write-Host "Generating CYPHER DOCUMENT REPOSITORY..." -ForegroundColor Cyan

# Function to get document purpose based on filename and directory
function Get-DocumentPurpose {
    param($fileName, $directory)
    
    $fileName = $fileName -replace '\.pdf$', ''
    $lowerFile = $fileName.ToLower()
    $lowerDir = $directory.ToLower()
    
    # Define purposes based on keywords and patterns
    if ($lowerFile -match "api.*endpoint|endpoint") { return "REST API documentation and endpoint specifications" }
    elseif ($lowerFile -match "database.*schema|schema.*database") { return "Database design, structure, and migration documentation" }
    elseif ($lowerFile -match "deployment.*guide|.*deployment.*") { return "System deployment and installation instructions" }
    elseif ($lowerFile -match "aws.*guide|.*aws.*") { return "Amazon Web Services configuration and deployment guide" }
    elseif ($lowerFile -match "docker.*guide|.*docker.*") { return "Docker containerization and deployment documentation" }
    elseif ($lowerFile -match "gitlab.*guide|.*gitlab.*") { return "GitLab CI/CD pipeline and deployment configuration" }
    elseif ($lowerFile -match "stig.*management|.*stig.*") { return "Security Technical Implementation Guide management" }
    elseif ($lowerFile -match "vulnerability.*|.*vulnerability.*") { return "Vulnerability assessment and management documentation" }
    elseif ($lowerFile -match "ai.*implementation|.*ai.*") { return "Artificial Intelligence service integration and implementation" }
    elseif ($lowerFile -match "workflow.*|.*workflow.*") { return "Business process automation and workflow management" }
    elseif ($lowerFile -match "asset.*management|.*asset.*") { return "IT asset discovery, classification, and management" }
    elseif ($lowerFile -match "compliance.*|.*compliance.*") { return "Security compliance framework and requirements" }
    elseif ($lowerFile -match "zero.*trust|.*zero.*trust.*") { return "Zero Trust security architecture implementation" }
    elseif ($lowerFile -match "tenable.*integration|.*tenable.*") { return "Tenable vulnerability scanner integration and configuration" }
    elseif ($lowerFile -match "natural.*language|.*nlq.*") { return "Natural language query interface for database interactions" }
    elseif ($lowerFile -match "dashboard.*|.*dashboard.*") { return "Interactive dashboard creation and metrics visualization" }
    elseif ($lowerFile -match "admin.*|.*admin.*") { return "Administrative interface and system management features" }
    elseif ($lowerFile -match "user.*guide|.*user.*") { return "End-user documentation and operational procedures" }
    elseif ($lowerFile -match "technical.*spec|.*technical.*") { return "Technical specifications and implementation details" }
    elseif ($lowerFile -match "integration.*guide|.*integration.*") { return "Third-party system integration documentation" }
    elseif ($lowerFile -match "security.*guide|.*security.*") { return "Security configuration and hardening procedures" }
    elseif ($lowerFile -match "development.*guide|.*development.*") { return "Developer setup, coding standards, and best practices" }
    else { return "System documentation and operational procedures" }
}

# Count total documents
$docsCount = (Get-ChildItem -Path ".\docs-pdf-final" -Filter "*.pdf" -Recurse -ErrorAction SilentlyContinue).Count
$cypherCount = (Get-ChildItem -Path ".\CYPHER_DOCS_PDF" -Filter "*.pdf" -Recurse -ErrorAction SilentlyContinue).Count
$totalDocs = $docsCount + $cypherCount

# Create markdown content
$content = @"
# CYPHER DOCUMENT REPOSITORY

**Document Version:** 1.0  
**Last Updated:** $(Get-Date -Format "MMMM dd, yyyy")  
**Total Documents:** $totalDocs  
**Repository Status:** Complete

---

## Executive Summary

This comprehensive document repository contains the complete CYPHER system documentation converted from markdown to PDF format. The repository is organized into distinct sections covering all aspects of system design, deployment, administration, security, and operations.

---

## Document Matrix

The following table provides a complete inventory of all documents in the CYPHER repository, organized by section with detailed descriptions of content and purpose.

---

## Section 1: Core System Documentation

| Document Section | Document Title | Purpose & Overview |
|------------------|----------------|-------------------|
"@

# Process docs-pdf-final directory (Original /docs)
if (Test-Path ".\docs-pdf-final") {
    $docsPdfFiles = Get-ChildItem -Path ".\docs-pdf-final" -Filter "*.pdf" -Recurse | Sort-Object Name
    foreach ($file in $docsPdfFiles) {
        $section = if ($file.Directory.Name -ne "docs-pdf-final") { $file.Directory.Name } else { "Core Documentation" }
        $title = ($file.BaseName -replace '_', ' ' -replace '-', ' ').Trim()
        $purpose = Get-DocumentPurpose -fileName $file.Name -directory $section
        $content += "| $section | $title | $purpose |`n"
    }
}

$content += "`n---`n`n"
$content += "## Section 2: Extended Technical Documentation`n`n"
$content += "| Document Section | Document Title | Purpose & Overview |`n"
$content += "|------------------|----------------|-------------------|`n"

# Process CYPHER_DOCS_PDF directory
if (Test-Path ".\CYPHER_DOCS_PDF") {
    $cypherDocsFiles = Get-ChildItem -Path ".\CYPHER_DOCS_PDF" -Filter "*.pdf" -Recurse | Sort-Object DirectoryName, Name
    foreach ($file in $cypherDocsFiles) {
        $relativePath = $file.Directory.FullName.Replace("$PWD\CYPHER_DOCS_PDF\", "").Replace("$PWD\CYPHER_DOCS_PDF", "Root")
        $section = if ($relativePath -ne "Root") { 
            ($relativePath.Split('\')[0] -replace '_', ' ').Trim()
        } else { 
            "Root Documentation" 
        }
        $title = ($file.BaseName -replace '_', ' ' -replace '-', ' ').Trim()
        $purpose = Get-DocumentPurpose -fileName $file.Name -directory $section
        $content += "| $section | $title | $purpose |`n"
    }
}

$content += @"

---

## Document Categories Overview

### 1. System Administration & Configuration
Documentation covering system setup, configuration, user management, and administrative procedures for the CYPHER platform.

### 2. Security & Compliance
Comprehensive security documentation including STIG compliance, vulnerability management, zero-trust architecture, and security frameworks.

### 3. Development & Integration
Technical guides for developers including API documentation, database schemas, integration procedures, and development best practices.

### 4. Deployment & Infrastructure
Infrastructure deployment guides covering AWS, Docker, GitLab CI/CD, and various deployment scenarios and environments.

### 5. AI & Advanced Features
Documentation for artificial intelligence implementations, natural language processing, automated workflows, and advanced system capabilities.

### 6. Asset & Risk Management
Asset discovery, classification, vulnerability assessment, risk analysis, and compliance management documentation.

---

## Usage Guidelines

### For System Administrators
Reference deployment guides, configuration documentation, and administrative procedures for system management and maintenance.

### For Security Teams  
Utilize compliance documentation, security guides, STIG management procedures, and vulnerability assessment resources.

### For Development Teams
Access API documentation, database schemas, integration guides, and technical specifications for system development.

### For End Users
Consult user guides, interface documentation, and operational procedures for daily system usage and workflows.

---

*CYPHER Document Repository - Comprehensive System Documentation*  
*Generated by automated documentation system*
"@

# Write markdown file
$content | Out-File -FilePath $RepoFile -Encoding UTF8

Write-Host "Generated: $RepoFile" -ForegroundColor Green

# Convert to PDF
Write-Host "Converting repository document to PDF..." -ForegroundColor Yellow

& $PandocPath -f markdown -t pdf --pdf-engine="$WkhtmltopdfPath" -o $OutputPDF $RepoFile --toc --toc-depth=2 --metadata title="CYPHER Document Repository" --variable geometry:margin=1in

if ($LASTEXITCODE -eq 0) {
    Write-Host "PDF repository successfully generated: $OutputPDF" -ForegroundColor Green
    
    # Get file sizes
    $pdfSize = [math]::Round((Get-Item $OutputPDF).Length / 1KB, 1)
    $mdSize = [math]::Round((Get-Item $RepoFile).Length / 1KB, 1)
    
    Write-Host ""
    Write-Host "REPOSITORY SUMMARY:" -ForegroundColor Cyan
    Write-Host "Markdown Source: $RepoFile ($mdSize KB)" -ForegroundColor White
    Write-Host "PDF Repository: $OutputPDF ($pdfSize KB)" -ForegroundColor White
    Write-Host "Total Documents Catalogued: $totalDocs" -ForegroundColor White
} else {
    Write-Host "Failed to generate PDF repository" -ForegroundColor Red
}