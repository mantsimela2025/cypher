# CYPHER Application Documentation

## 📚 Documentation Overview

This directory contains comprehensive documentation for the CYPHER application, covering development patterns, API usage, authentication, and troubleshooting.

## 🗂️ Documentation Structure

### 📖 Development Guides

#### **[Developer Setup Guide](./DEVELOPMENT_GUIDE/DEVELOPER_SETUP_GUIDE.md)** ⭐ **NEW**
Complete setup guide for new developers joining the CYPHER project.
- Prerequisites and dependencies installation
- GitLab repository setup and workflow
- NPM commands and development environment
- Troubleshooting and best practices

#### **[Quick Reference Commands](./DEVELOPMENT_GUIDE/QUICK_REFERENCE_COMMANDS.md)** ⭐ **NEW**
Essential commands for daily development workflow.
- Git commands and workflow
- NPM commands for all environments
- Troubleshooting and testing commands
- Emergency fixes and reset procedures

#### **[AWS & Database Integration Guide](./DEVELOPMENT_GUIDE/AWS_DATABASE_INTEGRATION_GUIDE.md)** ⭐ **NEW**
Comprehensive guide for AWS services and PostgreSQL database management.
- AWS CLI setup and configuration
- Production database (RDS) access and management
- EC2 instance management and deployment
- S3 storage, Route53 domains, and security

#### **[Drizzle Schema Management Guide](./DEVELOPMENT_GUIDE/DRIZZLE_SCHEMA_MANAGEMENT_GUIDE.md)** ⭐ **NEW**
Complete guide for managing Drizzle ORM schemas and database coverage.
- Schema coverage checking and analysis
- Auto-generated schema templates
- Best practices for schema design
- Troubleshooting and maintenance procedures

#### **[Authentication System Guide](./DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md)** ⭐ **NEW**
Complete guide to the CYPHER authentication system using simple role-based authorization.
- JWT token authentication
- Role-based access control (admin, user, moderator)
- Implementation patterns and best practices
- Migration from complex RBAC system

#### **[Development Patterns Guide](./DEVELOPMENT_GUIDE/DEVELOPMENT_PATTERNS_GUIDE.md)**
Comprehensive patterns and best practices for CYPHER development.
- Backend architecture patterns
- Frontend component patterns with lazy loading
- Database interaction patterns
- Security and performance guidelines

#### **[Performance Optimization Guide](./DEVELOPMENT_GUIDE/PERFORMANCE_OPTIMIZATION_GUIDE.md)** ⭐ **NEW**
Complete guide to performance optimizations and lazy loading implementations.
- Lazy loading patterns and hooks
- Performance metrics and improvements
- Component optimization strategies
- Load time reduction techniques

#### **[Debugging Guide](./DEVELOPMENT_GUIDE/DEBUGGING_GUIDE.md)**
Troubleshooting guide for common development issues.
- Database connection problems
- Authentication errors
- Module import issues
- Performance debugging

#### **[UI Design Document](./DEVELOPMENT_GUIDE/UI_DESIGN_DOCUMENT.md)**
UI/UX standards and component design patterns.
- Component library usage
- Styling guidelines
- Responsive design patterns

### 🔌 API Documentation

#### **[API Development Guide](./API_DOCUMENTATION/API_DEVELOPMENT_GUIDE.md)**
Complete guide for developing and consuming APIs in CYPHER.
- Backend API development patterns
- Frontend API consumption
- Authentication and authorization
- Error handling and validation

#### **[CYPHER Application Architecture Tutorial](./API_DOCUMENTATION/CYPHER_APPLICATION_ARCHITECTURE_AND_CODING_TUTORIAL.md)**
Comprehensive architecture overview and coding tutorial.
- System architecture
- Database design
- Component structure
- Development workflow

#### **[Swagger and API Testing Guide](./API_DOCUMENTATION/SWAGGER_AND_FULL_API_TESTING_GUIDE.md)**
Complete API testing system documentation.
- Swagger UI integration
- Automated testing utilities
- Authentication testing
- API endpoint examples

### 🚀 Deployment Guides

#### **[EC2 IIS Deployment Guide](./DEPLOYMENT_GUIDE/EC2_IIS_DEPLOYMENT_GUIDE.md)** ⭐ **CURRENT**
Complete deployment guide for AWS EC2 Windows Server 2019 with IIS and PM2.
- GitLab repository cloning and setup
- IIS configuration with reverse proxy
- PM2 process management and Windows service
- Static IP configuration and external access
- Automated deployment and health monitoring scripts

#### **[EC2 Linux Deployment Guide](./DEPLOYMENT_GUIDE/EC2_LINUX_DEPLOYMENT_GUIDE.md)** ⭐ **RECOMMENDED**
Complete deployment guide for AWS EC2 Ubuntu 22.04 LTS with Nginx and PM2.
- Ubuntu 22.04 LTS setup optimized for Node.js v20.16.0
- Nginx high-performance web server configuration
- PM2 cluster mode for multi-core utilization
- SSL/HTTPS with Let's Encrypt automation
- Security hardening and performance optimization
- Windows vs Linux migration comparison

## 🚀 Quick Start

### For New Developers

1. **Start Here**: [Developer Setup Guide](./DEVELOPMENT_GUIDE/DEVELOPER_SETUP_GUIDE.md) - Complete environment setup
2. **AWS & Database**: [AWS & Database Integration Guide](./DEVELOPMENT_GUIDE/AWS_DATABASE_INTEGRATION_GUIDE.md) - AWS CLI & PostgreSQL
3. **Authentication**: [Authentication System Guide](./DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md) - Understanding auth
4. **Development Patterns**: [Development Patterns Guide](./DEVELOPMENT_GUIDE/DEVELOPMENT_PATTERNS_GUIDE.md) - Code patterns
5. **Performance**: [Performance Optimization Guide](./DEVELOPMENT_GUIDE/PERFORMANCE_OPTIMIZATION_GUIDE.md) - Optimization
6. **API Development**: [API Development Guide](./API_DOCUMENTATION/API_DEVELOPMENT_GUIDE.md) - API patterns
7. **Deployment**: [EC2 IIS Deployment Guide](./DEPLOYMENT_GUIDE/EC2_IIS_DEPLOYMENT_GUIDE.md) - Windows deployment
8. **Linux Deployment**: [EC2 Linux Deployment Guide](./DEPLOYMENT_GUIDE/EC2_LINUX_DEPLOYMENT_GUIDE.md) - Linux deployment (recommended)

### For API Integration

1. **Authentication**: [Authentication System Guide](./DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md)
2. **API Patterns**: [API Development Guide](./API_DOCUMENTATION/API_DEVELOPMENT_GUIDE.md)
3. **Testing**: [Swagger and API Testing Guide](./API_DOCUMENTATION/SWAGGER_AND_FULL_API_TESTING_GUIDE.md)

### For Troubleshooting

1. **Common Issues**: [Debugging Guide](./DEVELOPMENT_GUIDE/DEBUGGING_GUIDE.md)
2. **Authentication Problems**: [Authentication System Guide](./DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md#troubleshooting)
3. **API Issues**: [API Development Guide](./API_DOCUMENTATION/API_DEVELOPMENT_GUIDE.md#troubleshooting-guide)

## 🔐 Authentication System (Updated)

**Important**: The CYPHER application has migrated from a complex RBAC (Role-Based Access Control) system to a **simple role-based authentication system**.

### Key Changes

- **Simplified Authorization**: Uses simple roles (admin, user, moderator) instead of granular permissions
- **Better Performance**: No database joins for permission checking
- **Easier Maintenance**: Clear, understandable authorization logic
- **JWT-Based**: Stateless authentication with JWT tokens

### Migration Impact

If you're working with existing code or documentation that references:
- `requirePermission()` → Now uses `requireRole()`
- Complex permission strings → Now uses simple role arrays
- RBAC middleware → Now uses auth middleware

**See**: [Authentication System Guide](./DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md) for complete details.

## 📋 Documentation Standards

### Writing Guidelines

- Use clear, concise language
- Include code examples for all patterns
- Provide both correct and incorrect examples
- Include troubleshooting sections
- Keep documentation up-to-date with code changes

### Code Examples

- Always show complete, working examples
- Include error handling
- Use consistent formatting
- Explain the reasoning behind patterns

### Updates

- Update documentation when making code changes
- Review documentation during code reviews
- Test all code examples before committing
- Keep version information current

## 🔄 Recent Updates

### December 2024 - Performance Optimization & Authentication Migration

- **NEW**: [Performance Optimization Guide](./DEVELOPMENT_GUIDE/PERFORMANCE_OPTIMIZATION_GUIDE.md)
- **NEW**: [Authentication System Guide](./DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md)
- **UPDATED**: All documentation to reflect lazy loading and performance improvements
- **UPDATED**: All documentation to reflect new authentication system
- **REMOVED**: RBAC references and complex permission patterns
- **SIMPLIFIED**: Authorization examples throughout documentation

### Key Documentation Changes

1. **Performance Patterns**: Added lazy loading patterns and optimization strategies
2. **Component Loading**: Updated frontend patterns to use lazy loading
3. **Authentication Patterns**: Updated from RBAC to simple roles
4. **Code Examples**: All examples now use `requireRole()` and lazy loading patterns
5. **Security Sections**: Simplified to reflect new authentication system
6. **Troubleshooting**: Updated with performance and authentication error patterns

## 📞 Support

### Getting Help

1. **Check Documentation**: Start with the relevant guide above
2. **Search Issues**: Look for similar problems in troubleshooting sections
3. **Code Examples**: Use provided patterns as templates
4. **Team Resources**: Consult with development team

### Contributing to Documentation

1. **Follow Standards**: Use established documentation patterns
2. **Test Examples**: Ensure all code examples work
3. **Update Related Docs**: Keep cross-references current
4. **Review Process**: Have documentation reviewed before merging

---

**Last Updated**: December 2024  
**Documentation Version**: 2.0 (Post-RBAC Migration)  
**Application Version**: CYPHER v2.0
