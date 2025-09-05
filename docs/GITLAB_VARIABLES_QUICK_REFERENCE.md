# GitLab Variables Quick Reference Card

## 🚀 **Quick Setup Path**
`GitLab Project → Settings → CI/CD → Variables → Expand → Add variable`

## 📋 **Variables Checklist**

### **AWS Credentials** ☁️
```
✅ AWS_ACCESS_KEY_ID          [Protected, Masked]
✅ AWS_SECRET_ACCESS_KEY      [Protected, Masked]
```

### **EC2 Access** 🖥️
```
✅ EC2_PRIVATE_KEY           [Protected, Masked]
   (Include -----BEGIN RSA PRIVATE KEY----- and -----END RSA PRIVATE KEY-----)
```

### **Database** 🗄️
```
✅ DB_HOST                   rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com [Protected]
✅ DB_PORT                   5432
✅ DB_NAME                   rasdashdev01 [Protected]
✅ DB_USER                   rasdashadmin [Protected]
✅ DB_PASSWORD               RasDash2025$ [Protected, Masked]
```

### **Application Secrets** 🔑
```
✅ JWT_SECRET                a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg== [Protected, Masked]
✅ OPENAI_API_KEY            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 [Protected, Masked]
✅ ANTHROPIC_API_KEY         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 [Protected, Masked]
✅ NVD_API_KEY               4edc77ed-d681-4472-8713-b24913590364 [Protected, Masked]
✅ MAILERSEND_API_KEY        mlsn.716a734f75dfaa5bd7656ceadc4e0308c51695a6831763e9290eb650b303585d [Protected, Masked]
```

### **Email** 📧
```
✅ EMAIL_FROM                noreply@rasdash.com
```

## ⚡ **Flag Settings**

| Variable Type | Protect | Mask | Notes |
|---------------|---------|------|-------|
| AWS Keys | ✅ | ✅ | Critical security |
| Private Key | ✅ | ✅ | SSH access |
| Passwords | ✅ | ✅ | Database, JWT |
| API Keys | ✅ | ✅ | External services |
| Hostnames | ✅ | ❌ | Not secret but protected |
| Ports | ❌ | ❌ | Public information |
| Email addresses | ❌ | ❌ | Public information |

## 🎯 **Total Variables: 14**

**Security Level:**
- 🔒 **11 Protected** (sensitive data)
- 🙈 **9 Masked** (hidden in logs)
- 📂 **3 Public** (non-sensitive)

## 🚨 **Critical Notes**

1. **EC2_PRIVATE_KEY** must include the complete key with headers:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   [key content]
   -----END RSA PRIVATE KEY-----
   ```

2. **All API keys** should be masked to prevent exposure in logs

3. **Database credentials** must be protected and masked

4. **Test immediately** after setup with a pipeline run

## ✅ **Verification**
After setup, your Variables page should show:
```
14 variables configured
11 protected variables
9 masked variables
```

## 🔧 **Quick Test**
```bash
# Trigger pipeline test
git commit --allow-empty -m "test: trigger pipeline"
git push origin main
```

---
**Setup Time: ~10 minutes | Security: Maximum | Ready for Production! 🚀**
