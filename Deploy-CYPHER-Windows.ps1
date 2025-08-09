# CYPHER Deployment Script for Windows Server
# Run this script from PowerShell as Administrator

param(
    [Parameter(Mandatory=$false)]
    [string]$InstanceId = "i-04a41343a3f51559a",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseSSM = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$UseSSH = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Monitor = $false
)

# Color functions for better output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
function Write-Progress { param($Message) Write-Host "🔄 $Message" -ForegroundColor Blue }

# Header
Write-Host @"
🚀 CYPHER Deployment Script for Windows Server
===============================================
Instance ID: $InstanceId
Region: $Region
Method: $(if($UseSSM){"AWS Systems Manager"}else{"SSH"})
"@ -ForegroundColor Magenta

# Function to check prerequisites
function Test-Prerequisites {
    Write-Progress "Checking prerequisites..."
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>$null
        if ($awsVersion) {
            Write-Success "AWS CLI found: $($awsVersion.Split()[0])"
        } else {
            throw "AWS CLI not found"
        }
    } catch {
        Write-Error "AWS CLI not found. Please install AWS CLI v2 from: https://awscli.amazonaws.com/AWSCLIV2.msi"
        return $false
    }
    
    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
        if ($identity) {
            Write-Success "AWS credentials configured for: $($identity.Arn)"
        } else {
            throw "No AWS credentials"
        }
    } catch {
        Write-Error "AWS credentials not configured. Please run: aws configure"
        return $false
    }
    
    # Check if instance exists
    try {
        $instance = aws ec2 describe-instances --instance-ids $InstanceId --region $Region 2>$null | ConvertFrom-Json
        if ($instance.Reservations.Count -gt 0) {
            $state = $instance.Reservations[0].Instances[0].State.Name
            Write-Success "Instance found. State: $state"
            if ($state -ne "running") {
                Write-Warning "Instance is not running. Current state: $state"
            }
        } else {
            throw "Instance not found"
        }
    } catch {
        Write-Error "Instance $InstanceId not found or not accessible"
        return $false
    }
    
    return $true
}

# Function to deploy via SSM
function Deploy-ViaSSM {
    Write-Progress "Deploying via AWS Systems Manager..."
    
    # Check if instance is SSM-managed
    try {
        $ssmInfo = aws ssm describe-instance-information --filters "Key=InstanceIds,Values=$InstanceId" --region $Region | ConvertFrom-Json
        if ($ssmInfo.InstanceInformationList.Count -eq 0) {
            Write-Warning "Instance not found in SSM. It may need SSM agent installed."
            Write-Info "The setup script will install SSM agent. Proceeding..."
        } else {
            Write-Success "Instance is SSM-managed"
        }
    } catch {
        Write-Warning "Could not check SSM status. Proceeding anyway..."
    }
    
    # Send setup command
    $setupCommand = 'curl -s https://cypher-deployment.s3.amazonaws.com/complete-cypher-setup.sh | bash'
    
    try {
        Write-Progress "Sending setup command to EC2 instance..."
        $commandResult = aws ssm send-command `
            --instance-ids $InstanceId `
            --document-name "AWS-RunShellScript" `
            --parameters "commands=[`"$setupCommand`"]" `
            --region $Region | ConvertFrom-Json
        
        $commandId = $commandResult.Command.CommandId
        Write-Success "Command sent successfully. Command ID: $commandId"
        
        # Monitor execution
        Write-Progress "Monitoring execution (this may take 10-15 minutes)..."
        $timeout = 1200 # 20 minutes timeout
        $elapsed = 0
        
        do {
            Start-Sleep -Seconds 15
            $elapsed += 15
            
            $invocation = aws ssm get-command-invocation --command-id $commandId --instance-id $InstanceId --region $Region | ConvertFrom-Json
            $status = $invocation.Status
            
            Write-Host "📊 Status: $status (${elapsed}s elapsed)" -ForegroundColor Cyan
            
            if ($status -eq "Failed") {
                Write-Error "Command failed!"
                Write-Host "Error Output:" -ForegroundColor Red
                Write-Host $invocation.StandardErrorContent
                return $false
            }
            
        } while ($status -eq "InProgress" -and $elapsed -lt $timeout)
        
        if ($elapsed -ge $timeout) {
            Write-Warning "Command timed out after $timeout seconds"
            return $false
        }
        
        # Get final output
        $finalInvocation = aws ssm get-command-invocation --command-id $commandId --instance-id $InstanceId --region $Region | ConvertFrom-Json
        
        if ($finalInvocation.Status -eq "Success") {
            Write-Success "Setup completed successfully!"
            Write-Host "📄 Setup Output (last 50 lines):" -ForegroundColor Yellow
            $output = $finalInvocation.StandardOutputContent
            $lines = $output -split "`n"
            $lines[-50..-1] | ForEach-Object { Write-Host $_ }
            return $true
        } else {
            Write-Error "Setup failed with status: $($finalInvocation.Status)"
            Write-Host "Error Output:" -ForegroundColor Red
            Write-Host $finalInvocation.StandardErrorContent
            return $false
        }
        
    } catch {
        Write-Error "Failed to send SSM command: $($_.Exception.Message)"
        return $false
    }
}

# Function to deploy via SSH
function Deploy-ViaSSH {
    Write-Progress "Deploying via SSH..."
    
    if (-not $KeyPath -or -not (Test-Path $KeyPath)) {
        Write-Error "SSH key path not provided or file not found: $KeyPath"
        Write-Info "Please provide the path to your EC2 key pair (.pem file) using -KeyPath parameter"
        return $false
    }
    
    # Get public IP
    try {
        $instance = aws ec2 describe-instances --instance-ids $InstanceId --region $Region | ConvertFrom-Json
        $publicIp = $instance.Reservations[0].Instances[0].PublicIpAddress
        
        if (-not $publicIp) {
            Write-Error "Instance does not have a public IP address"
            return $false
        }
        
        Write-Success "Instance public IP: $publicIp"
    } catch {
        Write-Error "Failed to get instance public IP"
        return $false
    }
    
    # Set key permissions (Windows)
    try {
        icacls $KeyPath /inheritance:r | Out-Null
        icacls $KeyPath /grant:r "$env:USERNAME:R" | Out-Null
        Write-Success "Set proper permissions on SSH key"
    } catch {
        Write-Warning "Could not set SSH key permissions. This may cause connection issues."
    }
    
    # Connect and run setup
    try {
        Write-Progress "Connecting to EC2 instance via SSH..."
        $sshCommand = "curl -s https://cypher-deployment.s3.amazonaws.com/complete-cypher-setup.sh | bash"
        
        ssh -i $KeyPath -o StrictHostKeyChecking=no ec2-user@$publicIp $sshCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "SSH deployment completed successfully!"
            return $true
        } else {
            Write-Error "SSH deployment failed with exit code: $LASTEXITCODE"
            return $false
        }
        
    } catch {
        Write-Error "SSH connection failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to monitor application
function Start-Monitoring {
    Write-Progress "Starting application monitoring..."
    
    # Get public IP
    try {
        $instance = aws ec2 describe-instances --instance-ids $InstanceId --region $Region | ConvertFrom-Json
        $publicIp = $instance.Reservations[0].Instances[0].PublicIpAddress
        
        if (-not $publicIp) {
            Write-Warning "Instance does not have a public IP address"
            return
        }
    } catch {
        Write-Error "Failed to get instance information for monitoring"
        return
    }
    
    Write-Info "Application URLs:"
    Write-Host "🌐 Main Application: http://$publicIp" -ForegroundColor Cyan
    Write-Host "🏥 Health Check: http://$publicIp/health" -ForegroundColor Cyan
    Write-Host "🔌 API Endpoint: http://$publicIp/api/v1/" -ForegroundColor Cyan
    
    # Test application health
    Write-Progress "Testing application health..."
    
    $maxRetries = 12
    $retryCount = 0
    $healthCheckPassed = $false
    
    while ($retryCount -lt $maxRetries -and -not $healthCheckPassed) {
        try {
            $response = Invoke-WebRequest -Uri "http://$publicIp/health" -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "Application health check passed!"
                $healthCheckPassed = $true
            }
        } catch {
            $retryCount++
            Write-Host "🔄 Health check attempt $retryCount/$maxRetries failed. Retrying in 10 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    }
    
    if ($healthCheckPassed) {
        # Test main application
        try {
            $response = Invoke-WebRequest -Uri "http://$publicIp" -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "Main application is accessible!"
            }
        } catch {
            Write-Warning "Main application may still be starting up"
        }
        
        Write-Success "🎉 CYPHER deployment completed successfully!"
        Write-Host @"

🎯 Next Steps:
1. Configure AWS credentials on EC2: aws configure
2. Deploy your application: ./deploy-cypher.sh
3. Access your application at: http://$publicIp

📊 Useful Commands:
- Check system status: ./system-status.sh
- View application logs: pm2 logs cypher-api
- Restart application: pm2 restart cypher-api
"@ -ForegroundColor Green
        
    } else {
        Write-Warning "Application health check failed after $maxRetries attempts"
        Write-Info "The setup may still be completing. Please check manually in a few minutes."
    }
}

# Main execution
try {
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    $deploymentSuccess = $false
    
    if ($UseSSM) {
        $deploymentSuccess = Deploy-ViaSSM
    } elseif ($UseSSH) {
        $deploymentSuccess = Deploy-ViaSSH
    } else {
        Write-Error "Please specify either -UseSSM or -UseSSH"
        exit 1
    }
    
    if ($deploymentSuccess -or $Monitor) {
        Start-Monitoring
    }
    
    if ($deploymentSuccess) {
        Write-Success "🎉 CYPHER deployment process completed!"
        exit 0
    } else {
        Write-Error "❌ Deployment failed"
        exit 1
    }
    
} catch {
    Write-Error "Unexpected error: $($_.Exception.Message)"
    exit 1
}
