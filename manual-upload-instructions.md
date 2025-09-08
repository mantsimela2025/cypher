# Manual Upload Instructions for GitHub CI/CD Pipeline

Since git push is having connectivity issues, here's how to manually upload the CI/CD pipeline files:

## 🔧 Option 1: Try Git Push Again Later
Sometimes network issues resolve themselves. Try this command again:
```bash
git push origin main
```

## 📁 Option 2: Manual File Upload via GitHub Web Interface

If git push continues to fail, you can manually upload the key files:

### 1. GitHub Actions Workflow
- Go to: https://github.com/mantsimela2025/cypher
- Click "Create new file"
- Path: `.github/workflows/deploy-to-ec2.yml`
- Copy content from: `C:\CYPHER\cypher\.github\workflows\deploy-to-ec2.yml`

### 2. AWS Secrets Manager Files
Upload these files to your repository:

**API Files:**
- `api/src/utils/secretsManager.js`
- `api/src/startup.js`
- `api/test-secrets-integration.js`
- `api/audit-production-secrets.js`

**Client Files:**
- `client/src/utils/secretsConfig.js`

**Root Files:**
- `test-full-integration.js`
- `verify-production-ready.js`

**Documentation:**
- `docs/GITHUB_ACTIONS_SETUP_GUIDE.md`

### 3. Updated Configuration Files
Make sure these files are updated in your repository:
- `api/server.js`
- `api/src/config/index.js`
- `client/src/utils/config.js`
- `ecosystem.config.js`

## 🚀 Option 3: Alternative Git Methods

### Try HTTPS with Personal Access Token
1. Generate a Personal Access Token at: https://github.com/settings/tokens
2. Use it instead of password when prompted

### Try SSH (if configured)
```bash
git remote set-url origin git@github.com:mantsimela2025/cypher.git
git push origin main
```

## ✅ After Files Are Uploaded

1. **Set up the 3 GitHub secrets** (already opened in browser)
2. **Go to Actions tab**: https://github.com/mantsimela2025/cypher/actions
3. **Trigger deployment** by pushing any change or manual trigger
4. **Monitor deployment** progress
5. **Access your app** at: http://54.91.127.123:3000

## 🔍 Key Files to Verify Are Uploaded

Most important files for CI/CD:
- ✅ `.github/workflows/deploy-to-ec2.yml` (GitHub Actions workflow)
- ✅ `api/src/utils/secretsManager.js` (AWS Secrets Manager integration)
- ✅ `api/src/startup.js` (Application startup with secrets)
- ✅ Updated `api/server.js` (Uses new startup script)

## 📞 Next Steps

Once the files are uploaded and secrets are set:
1. Check GitHub Actions tab for workflow runs
2. Monitor deployment to EC2
3. Verify application is accessible
4. Test AWS Secrets Manager integration
