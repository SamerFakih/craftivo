# Craftivo CI/CD Pipeline Documentation

This repository uses GitHub Actions for Continuous Integration and Continuous Deployment. The CI/CD pipeline is designed to ensure code quality, run comprehensive tests, and prepare deployments for the Craftivo full-stack application.

## 🏗️ Architecture Overview

Craftivo consists of two main components:

- **Backend**: NestJS server with TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: Angular client with SSR, Material UI, and standalone components

## 🔄 Workflow Files

### 1. Main CI Pipeline (`ci.yml`)

**Triggers**: Push to `main`, `dev`, `develop` branches; Pull requests to these branches

**Jobs**:

- **Setup**: Install and cache dependencies for both frontend and backend
- **Backend**: Run tests, linting, build, and coverage for NestJS server
- **Frontend**: Run tests, linting, and builds for Angular client (matrix strategy with multiple browsers)
- **Security**: Run security audits and dependency checks
- **Integration**: Test frontend and backend integration
- **Deploy Prep**: Prepare deployment artifacts (main branch only)
- **Summary**: Provide overall pipeline status

**Features**:

- ✅ Dependency caching with pnpm
- ✅ PostgreSQL service for database tests
- ✅ Matrix testing (Chrome/Firefox headless)
- ✅ Test coverage collection
- ✅ Build artifact management
- ✅ Integration testing

### 2. Security Scan (`security.yml`)

**Triggers**: Daily at 2 AM UTC; Manual dispatch

**Purpose**:

- Run comprehensive security audits
- Generate security reports
- Monitor for vulnerabilities

### 3. Dependency Updates (`dependency-check.yml`)

**Triggers**: Weekly on Mondays at 9 AM UTC; Manual dispatch

**Purpose**:

- Check for outdated packages
- Generate dependency update reports
- Maintain project health

### 4. Code Quality (`code-quality.yml`)

**Triggers**: Push/PR to main branches

**Purpose**:

- Code formatting checks
- ESLint analysis
- TypeScript compilation verification
- Bundle size analysis

## 🛠️ Required Environment Variables

### For GitHub Secrets

```bash
# Database (for testing)
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/craftivo_test
NODE_ENV=test
JWT_SECRET=your-jwt-secret-for-testing

# Optional: for deployment
DEPLOY_HOST=your-deployment-host
DEPLOY_USER=deployment-user
DEPLOY_KEY=your-ssh-private-key
```

## 📦 Package Manager

The pipeline uses **pnpm** for faster dependency installation and better disk space efficiency. Make sure your projects have `pnpm-lock.yaml` files.

To migrate from npm:

```bash
# In both craftivo-client and craftivo server directories
npm install -g pnpm
pnpm import  # Convert package-lock.json to pnpm-lock.yaml
pnpm install
```

## 🧪 Testing Strategy

### Backend Tests

- **Unit Tests**: Jest with coverage reporting
- **E2E Tests**: Supertest with real database
- **Linting**: ESLint with TypeScript rules
- **Database**: PostgreSQL 15 service container

### Frontend Tests

- **Unit Tests**: Karma + Jasmine
- **Component Tests**: Angular Testing Library
- **E2E Tests**: Angular builds
- **Browser Matrix**: Chrome Headless, Firefox Headless

## 📊 Artifacts and Reports

The pipeline generates several artifacts:

- `backend-coverage/`: Backend test coverage reports
- `frontend-coverage-{browser}/`: Frontend test coverage per browser
- `backend-build/`: Compiled NestJS application
- `frontend-build/`: Built Angular application
- `security-audit-reports/`: Security vulnerability reports
- `dependency-report.md`: Outdated package analysis
- `quality-summary.md`: Code quality metrics

## 🚀 Deployment Preparation

The pipeline automatically prepares deployment packages when pushing to the `main` branch:

- Combines backend and frontend builds
- Creates deployment-ready artifacts
- Retains packages for 30 days

## 🔧 Local Development Setup

To replicate CI environment locally:

```bash
# Install pnpm globally
npm install -g pnpm

# Backend setup
cd "craftivo server"
pnpm install
pnpm prisma:gen
pnpm db:push
pnpm test
pnpm build

# Frontend setup
cd ../craftivo-client
pnpm install
pnpm test --browsers=ChromeHeadless --watch=false
pnpm build --configuration=production
```

## 📈 Performance Optimization

The CI pipeline includes several optimizations:

- **Dependency Caching**: Uses GitHub Actions cache for node_modules
- **Parallel Jobs**: Backend and frontend tests run simultaneously
- **Matrix Strategy**: Multiple browser testing in parallel
- **Conditional Steps**: Only runs when necessary (cache hits)
- **Artifact Management**: Efficient storage and retrieval

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failures**

   - Ensure PostgreSQL service is healthy
   - Check DATABASE_URL format
   - Verify database schema migrations

2. **Frontend Test Failures**

   - Check browser compatibility
   - Verify Angular configuration
   - Review component dependencies

3. **Cache Issues**

   - Clear GitHub Actions cache
   - Update cache keys
   - Verify pnpm-lock.yaml consistency

4. **Build Failures**
   - Check TypeScript compilation
   - Verify environment variables
   - Review dependency versions

### Debug Commands

```bash
# Check CI locally with act (GitHub Actions local runner)
act -j backend

# Test specific workflow
act -j frontend -e .github/events/push.json

# Validate workflow syntax
actionlint .github/workflows/ci.yml
```

## 🔐 Security Considerations

- Secrets are never logged or exposed
- Database credentials are test-only
- Dependencies are audited regularly
- Vulnerability scanning is automated
- Access is restricted to repository collaborators

## 📋 Maintenance

### Weekly Tasks

- Review dependency update reports
- Check security audit results
- Monitor pipeline performance
- Update workflow versions

### Monthly Tasks

- Review and update Node.js versions
- Check for GitHub Actions updates
- Analyze build performance metrics
- Update documentation

## 🤝 Contributing

When contributing to the pipeline:

1. Test changes in a fork first
2. Update documentation for new features
3. Ensure backward compatibility
4. Follow semantic versioning for workflows

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Prisma CI/CD Guide](https://www.prisma.io/docs/guides/deployment/ci-cd)
