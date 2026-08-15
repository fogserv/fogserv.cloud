# Secrets Management with dotenvx

fogserv.cloud uses **dotenvx** for unified secrets management across development, production, and CI/CD environments.

## Overview

- **dotenvx** provides a secure way to manage environment variables
- All sensitive data (database URLs, API keys, Git tokens) are centralized
- Supports encryption for production environments
- Works seamlessly with Prisma Accelerate, PostgreSQL, and custom integrations

## Files

- `.env` - **Local development only** (never commit)
- `.env.example` - Template showing required variables (safe to commit)
- `.env.production` - Production configuration (encrypted values or CI/CD injection)
- `.env.keys` - Encryption keys for dotenvx (never commit, store in CI/CD)
- `.dotenvx` - Configuration file for dotenvx behavior

## Setup

### 1. Install dotenvx
```bash
bun install @dotenvx/dotenvx --save-dev
```

### 2. Copy the example
```bash
cp .env.example .env
```

### 3. Fill in your secrets
Edit `.env` with your actual Prisma credentials:
```dotenv
DATABASE_URL="file:./dev.db"  # or use .env.production for cloud DB
PRISMA_ORM=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY
PRISMA_ANY=postgres://user:pass@host/db?sslmode=require
```

## Usage

### Development
All npm scripts automatically load from `.env`:
```bash
bun run dev        # dotenvx run -- tanstack-start dev
bun run db:push    # dotenvx run -- prisma db push
bun run db:studio  # dotenvx run -- prisma studio
```

### Manual Secret Operations
```bash
# Get a specific secret
bun run secrets:get PRISMA_ORM

# Encrypt secrets for production
bun run secrets:encrypt

# Decrypt secrets
bun run secrets:decrypt
```

## Production Deployment

### Option A: Environment Variable Injection (Recommended)
In your CI/CD pipeline (GitHub Actions, Forgejo Actions, etc.):
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  PRISMA_ORM: ${{ secrets.PRISMA_ORM }}
  PRISMA_ANY: ${{ secrets.PRISMA_ANY }}
```

### Option B: Encrypted .env Files
For added security, encrypt production secrets:
```bash
# Generate encryption key
dotenvx encrypt

# Commit the encrypted .env.production
git add .env.production .env.keys
```
Then in production, provide the decryption key via CI/CD secret.

## AI Agent Integration

When fogserv-ai agents need to:
1. **Deploy code**: Secrets are injected via CI/CD at deploy time
2. **Manage infrastructure**: Access credentials from encrypted files or CI/CD
3. **Update configs**: Changes are committed to Git with all secrets properly masked

## Ticketing Integration

When creating issues for infrastructure changes:
- Never paste actual secret values in tickets
- Reference secrets by variable name: `PRISMA_ORM`, `GIT_TOKEN`, etc.
- Link to this documentation if clarification is needed

## Knowledge Base Updates

After adding new secrets:
1. Update `.env.example` with the new variable and description
2. Document the purpose in `/KB/secrets.md`
3. Create a ticket linking to the change
4. Agents will sync this during their next session

## Security Checklist

✅ `.env` is in `.gitignore`  
✅ `.env.example` shows structure without secrets  
✅ Secrets are encrypted for production  
✅ CI/CD has secure access to decryption keys  
✅ All scripts use `dotenvx run --` wrapper  
✅ No secrets logged in stdout or error messages  

## Troubleshooting

### Variables not loading
```bash
# Check if dotenvx is installed
bun list @dotenvx/dotenvx

# Verify .env exists
ls -la .env

# Test manually
bun run secrets:get DATABASE_URL
```

### Permission denied on .env
```bash
# Ensure .env is readable
chmod 600 .env
```

### Prisma connection errors
- Verify `PRISMA_ORM` or `PRISMA_ANY` are correct
- Test with `bun run db:studio`
- Check network connectivity to db.prisma.io or your PostgreSQL host
