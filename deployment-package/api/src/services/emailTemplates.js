/**
 * Email Templates for common use cases
 */

const emailTemplates = {
  /**
   * Welcome email for new users
   */
  welcome: (userData) => ({
    subject: 'Welcome to RAS Dashboard',
    text: `
Hello ${userData.firstName || userData.username},

Welcome to RAS Dashboard! Your account has been successfully created.

Account Details:
- Username: ${userData.username}
- Email: ${userData.email}
- Role: ${userData.role}

You can now log in to your account and start using the dashboard.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The RAS Dashboard Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to RAS Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .account-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to RAS Dashboard</h1>
        </div>
        <div class="content">
            <h2>Hello ${userData.firstName || userData.username}!</h2>
            <p>Welcome to RAS Dashboard! Your account has been successfully created.</p>
            
            <div class="account-details">
                <h3>Account Details:</h3>
                <ul>
                    <li><strong>Username:</strong> ${userData.username}</li>
                    <li><strong>Email:</strong> ${userData.email}</li>
                    <li><strong>Role:</strong> ${userData.role}</li>
                </ul>
            </div>
            
            <p>You can now log in to your account and start using the dashboard.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The RAS Dashboard Team</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }),

  /**
   * Password reset email
   */
  passwordReset: (userData, resetToken, resetUrl) => ({
    subject: 'Password Reset Request - RAS Dashboard',
    text: `
Hello ${userData.firstName || userData.username},

You have requested to reset your password for your RAS Dashboard account.

To reset your password, please click the following link or copy it to your browser:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The RAS Dashboard Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .reset-button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello ${userData.firstName || userData.username}!</h2>
            <p>You have requested to reset your password for your RAS Dashboard account.</p>
            
            <p>To reset your password, please click the button below:</p>
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
            
            <p>Or copy this link to your browser:<br>
            <code>${resetUrl}</code></p>
            
            <div class="warning">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The RAS Dashboard Team</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }),

  /**
   * Access request notification for admins
   */
  accessRequestNotification: (requestData) => ({
    subject: 'New Access Request - RAS Dashboard',
    text: `
A new access request has been submitted and requires your review.

Request Details:
- Name: ${requestData.firstName} ${requestData.lastName}
- Email: ${requestData.email}
- Reason: ${requestData.reason}
- Submitted: ${new Date(requestData.createdAt).toLocaleString()}

Please log in to the admin dashboard to review and process this request.

Best regards,
RAS Dashboard System
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Access Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffc107; color: #212529; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .request-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Access Request</h1>
        </div>
        <div class="content">
            <p>A new access request has been submitted and requires your review.</p>
            
            <div class="request-details">
                <h3>Request Details:</h3>
                <ul>
                    <li><strong>Name:</strong> ${requestData.firstName} ${requestData.lastName}</li>
                    <li><strong>Email:</strong> ${requestData.email}</li>
                    <li><strong>Reason:</strong> ${requestData.reason}</li>
                    <li><strong>Submitted:</strong> ${new Date(requestData.createdAt).toLocaleString()}</li>
                </ul>
            </div>
            
            <p>Please log in to the admin dashboard to review and process this request.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>RAS Dashboard System</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }),

  /**
   * Access request approved notification
   */
  accessRequestApproved: (requestData, loginUrl) => ({
    subject: 'Access Request Approved - RAS Dashboard',
    text: `
Hello ${requestData.firstName} ${requestData.lastName},

Great news! Your access request for RAS Dashboard has been approved.

You can now log in to your account using the following link:
${loginUrl}

Your account details will be sent in a separate email.

If you have any questions, please contact our support team.

Best regards,
The RAS Dashboard Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Access Request Approved</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .login-button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Access Request Approved</h1>
        </div>
        <div class="content">
            <h2>Hello ${requestData.firstName} ${requestData.lastName}!</h2>
            <p>Great news! Your access request for RAS Dashboard has been approved.</p>
            
            <p>You can now log in to your account:</p>
            <a href="${loginUrl}" class="login-button">Login to Dashboard</a>
            
            <p>Your account details will be sent in a separate email.</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The RAS Dashboard Team</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }),

  /**
   * Access request rejected notification
   */
  accessRequestRejected: (requestData, rejectionReason) => ({
    subject: 'Access Request Update - RAS Dashboard',
    text: `
Hello ${requestData.firstName} ${requestData.lastName},

Thank you for your interest in RAS Dashboard. After careful review, we are unable to approve your access request at this time.

Reason: ${rejectionReason}

If you believe this decision was made in error or if your circumstances have changed, please feel free to submit a new request with additional information.

Thank you for your understanding.

Best regards,
The RAS Dashboard Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Access Request Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6c757d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .reason-box { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Access Request Update</h1>
        </div>
        <div class="content">
            <h2>Hello ${requestData.firstName} ${requestData.lastName}!</h2>
            <p>Thank you for your interest in RAS Dashboard. After careful review, we are unable to approve your access request at this time.</p>
            
            <div class="reason-box">
                <strong>Reason:</strong> ${rejectionReason}
            </div>
            
            <p>If you believe this decision was made in error or if your circumstances have changed, please feel free to submit a new request with additional information.</p>
            <p>Thank you for your understanding.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The RAS Dashboard Team</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  })
};

module.exports = emailTemplates;
