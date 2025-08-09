<powershell>
# Windows Password Reset Script for EC2
# This script will reset the Administrator password

# Set new password (change this to your desired password)
$NewPassword = "CypherAdmin2025!"

# Convert to secure string
$SecurePassword = ConvertTo-SecureString $NewPassword -AsPlainText -Force

# Reset Administrator password
try {
    $AdminUser = Get-LocalUser -Name "Administrator"
    $AdminUser | Set-LocalUser -Password $SecurePassword
    Write-Output "Administrator password has been reset successfully"
    
    # Enable Administrator account if disabled
    Enable-LocalUser -Name "Administrator"
    Write-Output "Administrator account enabled"
    
    # Log success to Windows Event Log
    Write-EventLog -LogName Application -Source "EC2Config" -EventId 1001 -Message "Administrator password reset completed successfully" -EntryType Information
    
} catch {
    Write-Output "Error resetting password: $($_.Exception.Message)"
    Write-EventLog -LogName Application -Source "EC2Config" -EventId 1002 -Message "Administrator password reset failed: $($_.Exception.Message)" -EntryType Error
}

# Create a flag file to indicate script ran
New-Item -Path "C:\password-reset-complete.txt" -ItemType File -Force
Write-Output "Password reset script completed"
</powershell>
