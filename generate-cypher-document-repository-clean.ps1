# PowerShell script to generate CYPHER DOCUMENT REPOSITORY with HTML-styled tables
$PandocPath = "C:\Program Files\Pandoc\pandoc.exe"
$WkhtmltopdfPath = "C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
$RepoFile = "CYPHER DOCUMENT REPOSITORY.md"
$OutputPDF = "CYPHER DOCUMENT REPOSITORY - HTML Enhanced.pdf"

Write-Host "Generating CYPHER DOCUMENT REPOSITORY with HTML tables..." -ForegroundColor Cyan

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

# Function to create HTML table rows
function Create-HtmlTableRows {
    param($files, $sectionName)
    
    $rows = ""
    foreach ($file in $files) {
        $section = if ($file.Directory.Name -ne $sectionName -and $file.Directory.Name -ne "docs-pdf-final" -and $file.Directory.Name -ne "CYPHER_DOCS_PDF") { 
            $file.Directory.Name 
        } else { 
            $sectionName 
        }
        $title = ($file.BaseName -replace '_', ' ' -replace '-', ' ').Trim()
        $purpose = Get-DocumentPurpose -fileName $file.Name -directory $section
        
        $rows += "<tr>`n"
        $rows += "<td style='padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;'>$section</td>`n"
        $rows += "<td style='padding: 8px; border: 1px solid #ddd;'>$title</td>`n"
        $rows += "<td style='padding: 8px; border: 1px solid #ddd;'>$purpose</td>`n"
        $rows += "</tr>`n"
    }
    return $rows
}

# Count total documents
$docsCount = (Get-ChildItem -Path ".\docs-pdf-final" -Filter "*.pdf" -Recurse -ErrorAction SilentlyContinue).Count
$cypherCount = (Get-ChildItem -Path ".\CYPHER_DOCS_PDF" -Filter "*.pdf" -Recurse -ErrorAction SilentlyContinue).Count
$totalDocs = $docsCount + $cypherCount

# Create markdown content with HTML tables
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

The following tables provide a complete inventory of all documents in the CYPHER repository, organized by section with detailed descriptions of content and purpose.

---

## Section 1: Core System Documentation

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<thead>
<tr style="background-color: #4472C4; color: white;">
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 25%;">Document Section</th>
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 35%;">Document Title</th>
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 40%;">Purpose & Overview</th>
</tr>
</thead>
<tbody>
"@

# Process docs-pdf-final directory (Original /docs)
if (Test-Path ".\docs-pdf-final") {
    $docsPdfFiles = Get-ChildItem -Path ".\docs-pdf-final" -Filter "*.pdf" -Recurse | Sort-Object Name
    $content += Create-HtmlTableRows -files $docsPdfFiles -sectionName "Core Documentation"
}

$content += @"
</tbody>
</table>

---

## Section 2: Extended Technical Documentation

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<thead>
<tr style="background-color: #4472C4; color: white;">
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 25%;">Document Section</th>
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 35%;">Document Title</th>
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 40%;">Purpose & Overview</th>
</tr>
</thead>
<tbody>
"@

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
        
        $content += "<tr>`n"
        $content += "<td style='padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;'>$section</td>`n"
        $content += "<td style='padding: 8px; border: 1px solid #ddd;'>$title</td>`n"
        $content += "<td style='padding: 8px; border: 1px solid #ddd;'>$purpose</td>`n"
        $content += "</tr>`n"
    }
}

$content += @"
</tbody>
</table>

---

## Document Categories Overview

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<thead>
<tr style="background-color: #70AD47; color: white;">
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 30%;">Category</th>
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 70%;">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">System Administration & Configuration</td>
<td style="padding: 8px; border: 1px solid #ddd;">Documentation covering system setup, configuration, user management, and administrative procedures for the CYPHER platform.</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Security & Compliance</td>
<td style="padding: 8px; border: 1px solid #ddd;">Comprehensive security documentation including STIG compliance, vulnerability management, zero-trust architecture, and security frameworks.</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Development & Integration</td>
<td style="padding: 8px; border: 1px solid #ddd;">Technical guides for developers including API documentation, database schemas, integration procedures, and development best practices.</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Deployment & Infrastructure</td>
<td style="padding: 8px; border: 1px solid #ddd;">Infrastructure deployment guides covering AWS, Docker, GitLab CI/CD, and various deployment scenarios and environments.</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">AI & Advanced Features</td>
<td style="padding: 8px; border: 1px solid #ddd;">Documentation for artificial intelligence implementations, natural language processing, automated workflows, and advanced system capabilities.</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Asset & Risk Management</td>
<td style="padding: 8px; border: 1px solid #ddd;">Asset discovery, classification, vulnerability assessment, risk analysis, and compliance management documentation.</td>
</tr>
</tbody>
</table>

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

## Quality Standards

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<thead>
<tr style="background-color: #C55A11; color: white;">
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 30%;">Standard</th>
<th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 70%;">Implementation</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Professional PDF Formatting</td>
<td style="padding: 8px; border: 1px solid #ddd;">Consistent styling across all documents with optimized readability</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Searchable Content</td>
<td style="padding: 8px; border: 1px solid #ddd;">Full text search capability for easy information retrieval</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Preserved Links</td>
<td style="padding: 8px; border: 1px solid #ddd;">Hyperlinks and cross-references maintained where applicable</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Print Optimization</td>
<td style="padding: 8px; border: 1px solid #ddd;">Formatted for both digital viewing and high-quality printing</td>
</tr>
<tr>
<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Directory Structure</td>
<td style="padding: 8px; border: 1px solid #ddd;">Complete preservation of original markdown file organization</td>
</tr>
</tbody>
</table>

---

*CYPHER Document Repository - Comprehensive System Documentation*  
*Generated by automated documentation system with HTML-enhanced formatting*  
*For technical support or documentation updates, contact the system administration team*
"@

# Write markdown file
$content | Out-File -FilePath $RepoFile -Encoding UTF8

Write-Host "Generated enhanced HTML-formatted: $RepoFile" -ForegroundColor Green

# Convert to PDF with enhanced options for better HTML table rendering
Write-Host "Converting repository document to PDF with HTML table optimization..." -ForegroundColor Yellow

& $PandocPath -f markdown -t pdf --pdf-engine="$WkhtmltopdfPath" -o $OutputPDF $RepoFile --toc --toc-depth=2 --metadata title="CYPHER Document Repository" --variable geometry:margin=0.8in

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Enhanced PDF repository generated: $OutputPDF" -ForegroundColor Green
    
    # Get file sizes
    $pdfSize = [math]::Round((Get-Item $OutputPDF).Length / 1KB, 1)
    $mdSize = [math]::Round((Get-Item $RepoFile).Length / 1KB, 1)
    
    Write-Host ""
    Write-Host "REPOSITORY SUMMARY:" -ForegroundColor Cyan
    Write-Host "Markdown Source: $RepoFile ($mdSize KB)" -ForegroundColor White
    Write-Host "PDF Repository: $OutputPDF ($pdfSize KB)" -ForegroundColor White
    Write-Host "Total Documents Catalogued: $totalDocs" -ForegroundColor White
    Write-Host "Enhanced with HTML-styled tables for professional presentation" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to generate PDF repository" -ForegroundColor Red
}