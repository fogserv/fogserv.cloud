# Dockerfile Guide - Building Custom Container Images

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Containers - Image Building  
**Prerequisites**: [docker-basics](docker-basics), [docker-concepts](docker-concepts)  
**Time**: 4-5 hours  
**Tags**: docker, dockerfile, images, build, best-practices

## Summary

Master Dockerfile creation to build custom container images. Learn every instruction, layer optimization, multi-stage builds, and production best practices. Transform your applications into portable, reproducible container images.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Write Dockerfiles for any application
- ✅ Understand all Dockerfile instructions
- ✅ Optimize image layers for size and speed
- ✅ Implement multi-stage builds
- ✅ Apply security best practices
- ✅ Build and tag images
- ✅ Troubleshoot build issues

## 📝 What is a Dockerfile?

**Dockerfile**: Text file with instructions to build a Docker image.

**Analogy**: Recipe for creating a container image.

**Basic Structure**:
```dockerfile
# Base image
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN apt-get update && apt-get install -y python3

# Define startup command
CMD ["python3", "app.py"]
```

---

## 🏗️ Your First Dockerfile

### Simple Python App

**1. Create App File** (`app.py`):
```python
print("Hello from Docker!")
```

**2. Create Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY app.py .

CMD ["python", "app.py"]
```

**3. Build Image**:
```bash
docker build -t my-python-app:v1 .
```

**4. Run Container**:
```bash
docker run my-python-app:v1
# Output: Hello from Docker!
```

---

## 📚 Dockerfile Instructions

### FROM - Base Image

**Sets the base image** for your build.

```dockerfile
# Use official image
FROM python:3.11-slim

# Specific version
FROM node:20.10.0

# Alpine (smaller size)
FROM python:3.11-alpine

# Multi-stage build (later)
FROM golang:1.21 AS builder
FROM scratch
```

**Best Practices**:
- Use official images
- Pin specific versions (not `latest`)
- Prefer slim/alpine variants for smaller size

---

### WORKDIR - Set Working Directory

**Sets the working directory** for subsequent instructions.

```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# All commands now run in /app
COPY . .
RUN pip install -r requirements.txt
```

**Without WORKDIR**:
```dockerfile
# Bad - repetitive and error-prone
COPY . /app
RUN cd /app && pip install -r requirements.txt
```

---

### COPY - Copy Files

**Copies files** from build context to image.

```dockerfile
# Copy single file
COPY app.py /app/

# Copy directory
COPY ./src /app/src

# Copy with wildcards
COPY *.py /app/

# Copy and rename
COPY app.py /app/main.py
```

**Best Practice**: Copy only what you need.

```dockerfile
# Bad - copies everything
COPY . .

# Good - specific files
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY ./src ./src
```

---

### ADD - Copy Files (Advanced)

**Like COPY but with extra features**:
- Extracts tar archives
- Downloads from URLs

```dockerfile
# Extract tar file
ADD archive.tar.gz /app/

# Download from URL (not recommended)
ADD https://example.com/file.tar.gz /tmp/
```

**Best Practice**: Use `COPY` unless you specifically need `ADD` features.

---

### RUN - Execute Commands

**Runs commands** during image build.

```dockerfile
# Single command
RUN apt-get update

# Multiple commands (bad - creates multiple layers)
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim

# Multiple commands (good - single layer)
RUN apt-get update && \
    apt-get install -y \
        curl \
        vim \
    && rm -rf /var/lib/apt/lists/*
```

**Common Patterns**:

**Python**:
```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

**Node.js**:
```dockerfile
RUN npm ci --only=production
```

**System Packages**:
```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        package1 \
        package2 \
    && rm -rf /var/lib/apt/lists/*
```

---

### CMD - Default Command

**Sets the default command** to run when container starts.

```dockerfile
# Exec form (preferred)
CMD ["python", "app.py"]

# Shell form
CMD python app.py

# With arguments
CMD ["nginx", "-g", "daemon off;"]
```

**Note**: Only last `CMD` takes effect. Can be overridden at runtime.

```bash
# Uses CMD from Dockerfile
docker run my-app

# Overrides CMD
docker run my-app python debug.py
```

---

### ENTRYPOINT - Container Executable

**Makes container run as an executable**.

```dockerfile
# With ENTRYPOINT
ENTRYPOINT ["python"]
CMD ["app.py"]

# Now you can:
docker run my-app            # Runs: python app.py
docker run my-app debug.py   # Runs: python debug.py
```

**ENTRYPOINT + CMD Pattern**:
```dockerfile
# ENTRYPOINT = executable
ENTRYPOINT ["python"]

# CMD = default arguments
CMD ["app.py"]
```

---

### ENV - Environment Variables

**Sets environment variables**.

```dockerfile
# Single variable
ENV NODE_ENV=production

# Multiple variables
ENV APP_HOME=/app \
    APP_USER=appuser \
    APP_PORT=8080

# Use in subsequent commands
RUN echo "Port: $APP_PORT"
```

**Usage at Runtime**:
```bash
# Override env vars
docker run -e APP_PORT=9000 my-app
```

---

### ARG - Build Arguments

**Variables available during build** (not in final image).

```dockerfile
# Define argument
ARG PYTHON_VERSION=3.11

# Use in FROM
FROM python:${PYTHON_VERSION}-slim

# Can have defaults
ARG APP_ENV=development
RUN echo "Building for $APP_ENV"
```

**Build with Arguments**:
```bash
docker build --build-arg PYTHON_VERSION=3.10 -t my-app .
docker build --build-arg APP_ENV=production -t my-app:prod .
```

**ARG vs ENV**:
- `ARG`: Build-time only
- `ENV`: Build-time AND runtime

---

### EXPOSE - Document Ports

**Documents which ports** the container listens on.

```dockerfile
# Expose single port
EXPOSE 8080

# Multiple ports
EXPOSE 80 443

# With protocol
EXPOSE 8080/tcp
EXPOSE 53/udp
```

**Note**: This is **documentation only**. Still need `-p` to publish ports.

```bash
docker run -p 8080:8080 my-app
```

---

### VOLUME - Define Mount Points

**Creates mount point** for external volumes.

```dockerfile
# Define volume
VOLUME /app/data

# Multiple volumes
VOLUME ["/app/data", "/app/logs"]
```

**Usage**:
```bash
# Docker creates anonymous volume
docker run my-app

# Use named volume
docker run -v my-data:/app/data my-app
```

---

### USER - Set User Context

**Run commands as specific user** (security!).

```dockerfile
# Create user
RUN adduser --disabled-password --gecos '' appuser

# Switch to user
USER appuser

# All subsequent commands run as appuser
CMD ["python", "app.py"]
```

**Security Best Practice**: Don't run as root!

---

### LABEL - Add Metadata

**Add metadata** to image.

```dockerfile
LABEL maintainer="admin@example.com"
LABEL version="1.0"
LABEL description="My awesome application"

# Multi-line
LABEL org.opencontainers.image.title="My App" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="My Company"
```

**View Labels**:
```bash
docker inspect --format='{{json .Config.Labels}}' my-image
```

---

## 🎨 Real-World Examples

### Example 1: Python Flask App

**Project Structure**:
```
my-flask-app/
├── Dockerfile
├── requirements.txt
├── app.py
└── static/
    └── style.css
```

**requirements.txt**:
```
Flask==3.0.0
gunicorn==21.2.0
```

**app.py**:
```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello from Docker Flask!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Dockerfile**:
```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (layer caching!)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

**Build and Run**:
```bash
docker build -t flask-app:v1 .
docker run -d -p 5000:5000 --name my-flask flask-app:v1
curl http://localhost:5000
```

---

### Example 2: Node.js Express App

**Project Structure**:
```
my-node-app/
├── Dockerfile
├── package.json
├── package-lock.json
└── server.js
```

**package.json**:
```json
{
  "name": "my-node-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**server.js**:
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Docker Node!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Dockerfile**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY server.js .

# Non-root user (node user exists in node image)
USER node

EXPOSE 3000

CMD ["node", "server.js"]
```

**Build and Run**:
```bash
docker build -t node-app:v1 .
docker run -d -p 3000:3000 --name my-node node-app:v1
curl http://localhost:3000
```

---

### Example 3: Static Website (Nginx)

**Project Structure**:
```
my-website/
├── Dockerfile
└── html/
    ├── index.html
    └── style.css
```

**html/index.html**:
```html
<!DOCTYPE html>
<html>
<head><title>My Site</title></head>
<body><h1>Hello from Docker Nginx!</h1></body>
</html>
```

**Dockerfile**:
```dockerfile
FROM nginx:1.25-alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy our website
COPY html/ /usr/share/nginx/html/

# nginx runs as nginx user by default

EXPOSE 80

# nginx already has CMD defined
```

**Build and Run**:
```bash
docker build -t my-website:v1 .
docker run -d -p 8080:80 --name my-web my-website:v1
curl http://localhost:8080
```

---

## 🚀 Multi-Stage Builds

**Problem**: Build tools bloat final image.

**Solution**: Multi-stage builds!

### Example: Go Application

**Single-Stage (Bad)**:
```dockerfile
FROM golang:1.21

WORKDIR /app
COPY . .
RUN go build -o myapp

CMD ["./myapp"]

# Final image: ~1GB (includes Go compiler!)
```

**Multi-Stage (Good)**:
```dockerfile
# Stage 1: Build
FROM golang:1.21 AS builder

WORKDIR /app
COPY . .
RUN go build -o myapp

# Stage 2: Runtime
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/myapp .

CMD ["./myapp"]

# Final image: ~15MB!
```

---

### Multi-Stage: Node.js with Build Step

```dockerfile
# Stage 1: Build dependencies
FROM node:20 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build application
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY package.json ./

USER node
CMD ["node", "dist/server.js"]
```

---

## ⚡ Layer Optimization

### Understanding Layers

**Each instruction = New layer**.

```dockerfile
FROM ubuntu:22.04           # Layer 1
RUN apt-get update          # Layer 2
RUN apt-get install curl    # Layer 3
RUN apt-get install vim     # Layer 4
COPY app.py .               # Layer 5
```

**Better**:
```dockerfile
FROM ubuntu:22.04                                   # Layer 1
RUN apt-get update && apt-get install -y curl vim  # Layer 2
COPY app.py .                                       # Layer 3
```

---

### Optimize Build Cache

**Order Matters!** Put changing layers last.

**Bad**:
```dockerfile
FROM python:3.11-slim
COPY . .                        # ← Changes often, invalidates cache
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

**Good**:
```dockerfile
FROM python:3.11-slim
COPY requirements.txt .         # ← Changes rarely
RUN pip install -r requirements.txt  # ← Cached if requirements.txt unchanged
COPY . .                        # ← Changes often, but cache above preserved
CMD ["python", "app.py"]
```

---

### Minimize Layers

**Combine Related Commands**:

**Bad**:
```dockerfile
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim
RUN apt-get clean
```

**Good**:
```dockerfile
RUN apt-get update && \
    apt-get install -y \
        curl \
        vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
```

---

## 🔒 Security Best Practices

### 1. Don't Run as Root

```dockerfile
# Create user
RUN addgroup --gid 1000 appgroup && \
    adduser --uid 1000 --gid 1000 --disabled-password appuser

# Switch to user
USER appuser

# Now container runs as non-root
```

---

### 2. Use Specific Tags

```dockerfile
# Bad
FROM python:latest

# Good
FROM python:3.11.7-slim
```

---

### 3. Scan for Vulnerabilities

```bash
# Use docker scan or trivy
docker scan my-image:v1

# Or trivy
trivy image my-image:v1
```

---

### 4. Don't Store Secrets in Images

**Bad**:
```dockerfile
# DON'T DO THIS!
ENV API_KEY=secret123
```

**Good**:
```bash
# Pass at runtime
docker run -e API_KEY=secret123 my-app

# Or use secrets management
docker run --env-file .env my-app
```

---

### 5. Minimize Attack Surface

```dockerfile
# Use minimal base images
FROM python:3.11-alpine  # Smaller = fewer vulnerabilities

# Remove unnecessary packages
RUN apk add --no-cache curl && \
    # Use curl
    apk del curl  # Remove when done
```

---

## 🏷️ Building and Tagging

### Build with Tag

```bash
# Basic build
docker build -t my-app:v1 .

# Multiple tags
docker build -t my-app:v1 -t my-app:latest .

# Specify Dockerfile
docker build -f Dockerfile.prod -t my-app:prod .

# Build with build args
docker build --build-arg VERSION=1.0 -t my-app:1.0 .
```

---

### Tagging Strategies

```bash
# Version tags
my-app:1.0.0
my-app:1.0
my-app:1
my-app:latest

# Environment tags
my-app:dev
my-app:staging
my-app:prod

# Git commit tags
my-app:abc123
my-app:main-abc123
```

---

## .dockerignore File

**Exclude files from build context** (like `.gitignore`).

**.dockerignore**:
```
# Git
.git
.gitignore

# Dependencies
node_modules/
__pycache__/
*.pyc

# Development
.env
.env.local
*.log

# Documentation
README.md
docs/

# CI/CD
.github/
.gitlab-ci.yml
```

**Benefits**:
- Faster builds (smaller context)
- Avoid copying secrets
- Smaller images

---

## 🚨 Troubleshooting

### Build Fails

**View Build Output**:
```bash
docker build -t my-app:v1 .
```

**Check Specific Layer**:
```bash
# Build fails at layer X
# Run up to that point
docker build --target builder -t debug .
docker run -it debug bash
```

---

### Image Too Large

**Check Layer Sizes**:
```bash
docker history my-app:v1
```

**Common Issues**:
- Not removing package manager cache
- Including build tools in final image
- Copying too many files

**Solutions**:
- Use multi-stage builds
- Clean up in same RUN command
- Use `.dockerignore`

---

### Cache Not Working

**Force rebuild without cache**:
```bash
docker build --no-cache -t my-app:v1 .
```

**Rebuild from specific layer**:
```bash
docker build --no-cache --target builder -t my-app:v1 .
```

---

## 💡 Pro Tips

**1. Use build Healthchecks**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1
```

**2. Set Shell for RUN**:
```dockerfile
# Use bash instead of sh
SHELL ["/bin/bash", "-c"]
```

**3. Use ONBUILD for Base Images**:
```dockerfile
# In base image
ONBUILD COPY . /app
ONBUILD RUN pip install -r requirements.txt

# Child images automatically run these
```

---

## 🔗 What's Next?

Now that you can build images:

**Volumes**:
- **[docker-volumes](docker-volumes)** - Persistent data management

**Networking**:
- **[docker-networking](docker-networking)** - Container networking deep dive

**Multi-Container**:
- **[docker-compose-intro](docker-compose-intro)** - Manage multiple containers

---

## 📚 Resources

**Official Docs**:
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

**Tools**:
- [Dive](https://github.com/wagoodman/dive) - Analyze image layers
- [Hadolint](https://github.com/hadolint/hadolint) - Dockerfile linter

---

## 📝 Change Log

### 2026-01-30
- Created Dockerfile guide
- Covered all Dockerfile instructions
- Included real-world examples (Python, Node, Go)
- Explained multi-stage builds
- Added layer optimization techniques
- Provided security best practices
- Included troubleshooting section

---

**Next Article**: [docker-volumes](docker-volumes) - Master persistent storage!

