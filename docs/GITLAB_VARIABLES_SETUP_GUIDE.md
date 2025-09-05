# GitLab CI/CD Variables Setup Guide

## 🎯 **Overview**

This guide provides step-by-step instructions for setting up all required GitLab CI/CD variables for the CYPHER Windows EC2 deployment pipeline.

## 📍 **How to Access GitLab Variables**

1. **Navigate to your GitLab project**: `https://gitlab.com/rasdash-group/cypher`
2. Click **Settings** in the left sidebar (bottom section)
3. Click **CI/CD** from the Settings submenu
4. Scroll down to the **Variables** section
5. Click **Expand** to open the Variables configuration

## 🔧 **Required Variables Setup**

### **Step 1: AWS Credentials**

#### **Variable 1: AWS_ACCESS_KEY_ID**
```
Key: AWS_ACCESS_KEY_ID
Value: [Your AWS Access Key ID from IAM]
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

#### **Variable 2: AWS_SECRET_ACCESS_KEY**
```
Key: AWS_SECRET_ACCESS_KEY
Value: [Your AWS Secret Access Key from IAM]
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

### **Step 2: EC2 SSH Access**

#### **Variable 3: EC2_PRIVATE_KEY**
```
Key: EC2_PRIVATE_KEY
Value: [Copy the entire content below, including BEGIN/END lines]
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

**Private Key Content (jaharrison-keypair.pem):**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAkKfTo5n0taMdtXaGtzlWWPvs3T1lfI0d0Qnmu5TTiSGPbJ0N
7igq5B5Pxkvua78ji5nfgsLVJe+x1Klc7GQoJ2sfNKZSYnWB7FAlQnnUUK0dVtkC
INBdzUFzU7/Wx98dlbwAflUS8qrCyWjw68UhBaMz0jyxbqRibm2xFn9MlIZYfWA6
Ar+Mmbeu6mGZz1AJWG53IBy5lVei+kj/nGsWKVEIIksviNzIsCFqgHtho0JYXSWm
UmDG54wLFTqZ4BLCWIZuNuKUcoZYLvzOyzD4w1VI+PGu4cUOCT5orPW5RLLM+lKg
MiGdi+o+l3GIJuCYz3F2cEE+lRs09y2oFTtoiwIDAQABAoIBAQCIwzMz5RXYOLyY
2NOrHPmHLb+WuDpgFGcRQKQ1yxJn/yPDk4UdGjra69GOcDGdCtxHWxZXYW716/Wc
Uvd4w4S3J+8b7vfLAL/yNR/VBqv2DoXDm24IqhdVPMEVeDVPSKGG9HUe+73rUgjR
NXc54WlEFDWlWh6CtcYeE3UvCPHVJPdZ0djJ0ZQ0Q3PABa7v6mDf3+Vh1iRmIraG
8QvgqNJxwZ1ilw4y9YqqVFMwzM+ifdUJDylQ7i3UjWR30R97rxab0oFRQ03yrKkB
/oAH2d3HUUFAnPtFZGj1+i9+IYzV956IpaJvOJ5qshSsQbaHuLaQrPeCdbyGeo2Q
cCcW9XGJAoGBAMCR5geGcez6K/Anu+hNlNH2Y9ueDNL18Rh2DYSMFMhy9a9SReK6
wCkeW6OPF7h1LHHWixysQ1WbfQUIiSBZ0c3b3wEpMhC02s5dO4NLgmSSsimtAfqB
X2FBmIr74kFYvgKpryQgp6id+cghyKH3quFt6VHgpdRJR076UYJg8IRXAoGBAMBN
o9M0CQvvQTXhrqjA5PaU2Ey178wQOgc9UI2DRJhPiF1V+57XvVU6wZ5ZYNl8XZpP
Xwc7yy/ZWvzbGD9vOtwS0EQ/DkkFsbyzqpqY7kca+qLYG/aOM6XN2EHumZkNFfxi
mA9ywnKd0y4qxKojOzGVsyCmkuVW5FRn1lpBB7ztAoGBAL4gDk3FtrtzMGhWwpaT
6mf2bRcLD7xFaHlvLN998pMJtXoYr7kwCsNOHsn4YEIVJgFrAkQX7A8cii2rBMA1
DgjCmYWq56xI83Ml57k0lxO3JkIxdy+eBc6fFf26vOMpu8gjQjFYMFAxUMkAWfdX
8JXLj73wH6ndg5L9X/ZqwWzXAoGAdHqSkIskL6ZryUc5k93C0di2a0CITwJFI71v
3Ud1dQw3fNFn536ln8pHHLLmhtVdnOoWlTsSh5kQE7hhp4qoDEUZAT1wWaqpTbNF
0v5u1YLx7VEZHu5jOjrEkqsDPkE+3/CYSkMopGQUVhJxrNxKLm6OYWiD8YYAJ1/9
5g0dssECgYAZGag+3TPugp2JtZOEIRyuCAEhSTLan+6Oppv5dY8DjibNOfHJJ/Dw
YdN+h0mv2HO6KG61C7/JfAG/CQrK41r4NVlMSlH9uN5BBXZFw/mIPhw+8kJ38GT3
4fgwjlgMpKe59vMxAJ8GXs8lMIgOHeBZAQOu2ECEsLfeyrVnH271ag==
-----END RSA PRIVATE KEY-----
```

### **Step 3: Database Configuration**

#### **Variable 4: DB_HOST**
```
Key: DB_HOST
Value: rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable
```

#### **Variable 5: DB_PORT**
```
Key: DB_PORT
Value: 5432
Type: Variable
Environment scope: All (default)
Flags: (none needed)
```

#### **Variable 6: DB_NAME**
```
Key: DB_NAME
Value: rasdashdev01
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable
```

#### **Variable 7: DB_USER**
```
Key: DB_USER
Value: rasdashadmin
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable
```

#### **Variable 8: DB_PASSWORD**
```
Key: DB_PASSWORD
Value: RasDash2025$
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

### **Step 4: Application Secrets**

#### **Variable 9: JWT_SECRET**
```
Key: JWT_SECRET
Value: a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg==
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

#### **Variable 10: OPENAI_API_KEY**
```
Key: OPENAI_API_KEY
Value: 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
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

#### **Variable 11: ANTHROPIC_API_KEY**
```
Key: ANTHROPIC_API_KEY
Value: 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
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

#### **Variable 12: NVD_API_KEY**
```
Key: NVD_API_KEY
Value: 4edc77ed-d681-4472-8713-b24913590364
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

#### **Variable 13: MAILERSEND_API_KEY**
```
Key: MAILERSEND_API_KEY
Value: mlsn.716a734f75dfaa5bd7656ceadc4e0308c51695a6831763e9290eb650b303585d
Type: Variable
Environment scope: All (default)
Flags: ✅ Protect variable ✅ Mask variable
```

### **Step 5: Email Configuration**

#### **Variable 14: EMAIL_FROM**
```
Key: EMAIL_FROM
Value: noreply@rasdash.com
Type: Variable
Environment scope: All (default)
Flags: (none needed)
```

## 🔒 **Variable Security Settings Explained**

### **Protect Variable** ✅
- **Purpose**: Only available in protected branches (main, master)
- **Use for**: Production secrets, database credentials, API keys
- **Recommendation**: Enable for all sensitive data

### **Mask Variable** ✅
- **Purpose**: Hides the value in job logs and console output
- **Use for**: Passwords, private keys, API tokens
- **Recommendation**: Enable for any secret that shouldn't appear in logs

### **Environment Scope**
- **All (default)**: Variable available in all environments
- **Specific environment**: Limit to staging, production, etc.
- **Recommendation**: Use "All" unless you have environment-specific values

## ✅ **Verification Checklist**

After adding all variables, verify you have:

- [ ] **AWS_ACCESS_KEY_ID** - Protected, Masked
- [ ] **AWS_SECRET_ACCESS_KEY** - Protected, Masked  
- [ ] **EC2_PRIVATE_KEY** - Protected, Masked
- [ ] **DB_HOST** - Protected
- [ ] **DB_PORT** - No flags needed
- [ ] **DB_NAME** - Protected
- [ ] **DB_USER** - Protected
- [ ] **DB_PASSWORD** - Protected, Masked
- [ ] **JWT_SECRET** - Protected, Masked
- [ ] **OPENAI_API_KEY** - Protected, Masked
- [ ] **ANTHROPIC_API_KEY** - Protected, Masked
- [ ] **NVD_API_KEY** - Protected, Masked
- [ ] **MAILERSEND_API_KEY** - Protected, Masked
- [ ] **EMAIL_FROM** - No flags needed

## 🚀 **Testing the Setup**

Once all variables are configured:

1. **Go to CI/CD > Pipelines**
2. **Click "Run pipeline"** or push a commit to main branch
3. **Monitor the pipeline stages**:
   - Test ✅ (should pass)
   - Build ✅ (should pass) 
   - Deploy ✅ (should work with proper variables)
   - Health Check ✅ (should verify deployment)

## 🔧 **Troubleshooting**

### **Common Issues:**

**"Variable not found" errors:**
- Check variable name spelling (case-sensitive)
- Ensure variable is not scoped to wrong environment

**"Access denied" errors:**
- Verify AWS credentials are correct
- Check IAM permissions for S3 and EC2

**"Authentication failed" SSH errors:**
- Verify EC2_PRIVATE_KEY includes BEGIN/END lines
- Check that key corresponds to EC2 instance key pair

**Pipeline fails at Deploy stage:**
- Ensure S3 bucket `rasdash-deployments` exists
- Verify EC2 instance `i-04a41343a3f51559a` is accessible
- Check Windows Server is properly configured

## 📞 **Support**

If you encounter issues:
1. Check GitLab pipeline logs for specific error messages
2. Verify all variables are properly masked and protected
3. Test AWS credentials locally if possible
4. Ensure EC2 instance security groups allow SSH access

---

**Your GitLab CI/CD variables are now configured for automated Windows EC2 deployment! 🚀**
