# Let's Encrypt Automation - Free SSL/TLS Certificates

**Resource Navigation:** [README](README) | [Certificate Fundamentals](certificate-fundamentals) | [TLS Configuration](tls-configuration) | [Firewall Basics](firewall-basics)

---

## Summary

Let's Encrypt is a free, automated Certificate Authority providing domain-validated SSL/TLS certificates trusted by all major browsers. This comprehensive guide covers Let's Encrypt fundamentals and ACME protocol, Certbot installation and certificate issuance, HTTP-01 and DNS-01 challenge validation methods, wildcard certificate generation, automated renewal with systemd timers and cron, web server integration (Nginx, Apache, HAProxy), DNS provider automation (Cloudflare, Route53, DigitalOcean), certificate deployment for multiple services, monitoring certificate expiration, rate limits and best practices, and production-ready automation patterns. Learn complete workflows for standalone servers, load-balanced architectures, Kubernetes with cert-manager, and multi-domain certificate management.

**The Golden Rule:** Automate everything - certificates should renew themselves.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Obtain free SSL/TLS certificates from Let's Encrypt
- ✅ Automate certificate issuance with Certbot
- ✅ Implement HTTP-01 and DNS-01 validation
- ✅ Generate wildcard certificates
- ✅ Configure automatic certificate renewal
- ✅ Integrate with Nginx, Apache, and other web servers
- ✅ Automate DNS challenges with providers (Cloudflare, AWS)
- ✅ Monitor certificate expiration
- ✅ Handle rate limits effectively
- ✅ Deploy certificates in production environments

---

## Prerequisites

Before implementing Let's Encrypt automation, you should have:

- **Certificate basics**: [Certificate Fundamentals](certificate-fundamentals) completed
- **Web server**: Nginx, Apache, or similar installed
- **Domain name**: Publicly accessible domain with DNS configured
- **Port 80/443**: Open for HTTP-01 validation (or DNS API access for DNS-01)
- **Linux fundamentals**: [Linux Fundamentals](../basics/linux-fundamentals)

---

## Let's Encrypt Overview

### How Let's Encrypt Works

```
┌──────────────────────────────────────────────────────┐
│         Let's Encrypt Certificate Lifecycle           │
└──────────────────────────────────────────────────────┘

1. Request Certificate:
   Your Server ──→ Let's Encrypt CA
   "I want a certificate for example.com"
   
2. Challenge:
   Let's Encrypt CA ──→ Your Server
   "Prove you control example.com"
   
   HTTP-01 Challenge:
   "Place this token at http://example.com/.well-known/acme-challenge/TOKEN"
   
   DNS-01 Challenge:
   "Create TXT record: _acme-challenge.example.com = TOKEN"
   
3. Validation:
   Let's Encrypt CA ──→ example.com
   Checks if token/DNS record exists
   
4. Certificate Issued:
   Let's Encrypt CA ──→ Your Server
   ✅ "Here's your certificate!" (Valid 90 days)
   
5. Auto-Renewal (after 60 days):
   Certbot ──→ Let's Encrypt CA
   Repeats process automatically

Benefits:
✅ Free certificates
✅ Trusted by all browsers
✅ Automated issuance and renewal
✅ No manual intervention required
✅ API-driven (ACME protocol)
```

### Certificate Limits

```
Rate Limits (as of 2026):
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 300 new accounts per IP per 3 hours
- 10 accounts per IP address per 3 hours
- 500 accounts per IP range per 3 hours
- 300 pending authorizations per account

Certificate Validity:
- 90 days (recommend renewing at 60 days)
- Max 100 names per certificate

Best Practices:
✅ Use staging for testing
✅ Request certificates for multiple subdomains together
✅ Cache certificates, don't re-request unnecessarily
✅ Monitor renewal status
```

---

## Certbot Installation

### Install Certbot (Ubuntu/Debian)

```bash
# Install snapd (if not already installed)
sudo apt update
sudo apt install -y snapd
sudo snap install core
sudo snap refresh core

# Install Certbot via snap (recommended method)
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Verify installation
certbot --version
# certbot 2.8.0
```

### Install Certbot (RHEL/CentOS)

```bash
# Install EPEL repository
sudo dnf install -y epel-release

# Install Certbot
sudo dnf install -y certbot

# Verify
certbot --version
```

### Install Certbot (Alternative: pip)

```bash
# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Create virtual environment
python3 -m venv /opt/certbot
/opt/certbot/bin/pip install --upgrade pip

# Install Certbot
/opt/certbot/bin/pip install certbot

# Create symlink
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
```

---

## HTTP-01 Challenge (Webroot)

### Nginx with Webroot

```bash
# Ensure Nginx is serving HTTP on port 80
sudo systemctl status nginx

# Obtain certificate (webroot mode)
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d example.com \
  -d www.example.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email

# Certificate files created:
# /etc/letsencrypt/live/example.com/fullchain.pem  (certificate + intermediate)
# /etc/letsencrypt/live/example.com/privkey.pem    (private key)
# /etc/letsencrypt/live/example.com/cert.pem       (certificate only)
# /etc/letsencrypt/live/example.com/chain.pem      (intermediate only)
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/example.com

# HTTP (port 80) - for ACME challenges
server {
    listen 80;
    server_name example.com www.example.com;
    
    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS (port 443) - secure site
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    # SSL certificate
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL configuration (see TLS Configuration guide)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        root /var/www/html;
        index index.html;
    }
}
```

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test certificate
curl -I https://example.com
openssl s_client -connect example.com:443 -servername example.com
```

---

## Standalone Mode (No Web Server Running)

```bash
# Stop web server temporarily
sudo systemctl stop nginx

# Obtain certificate (Certbot runs temporary web server)
sudo certbot certonly --standalone \
  -d example.com \
  -d www.example.com \
  --email admin@example.com \
  --agree-tos

# Start web server again
sudo systemctl start nginx

# Configure Nginx to use certificates (same as above)
```

---

## Apache Integration

```bash
# Install Apache plugin
sudo apt install -y python3-certbot-apache

# Automatic certificate + Apache configuration
sudo certbot --apache \
  -d example.com \
  -d www.example.com \
  --email admin@example.com \
  --agree-tos

# Certbot will:
# 1. Obtain certificate
# 2. Modify Apache configuration automatically
# 3. Enable SSL module
# 4. Set up HTTPS virtual host
# 5. Configure HTTP → HTTPS redirect

# Manual certificate only (no auto-config)
sudo certbot certonly --apache -d example.com
```

### Manual Apache Configuration

```apache
# /etc/apache2/sites-available/example.com.conf

<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com
    
    # ACME challenge
    Alias /.well-known/acme-challenge/ /var/www/html/.well-known/acme-challenge/
    <Directory "/var/www/html/.well-known/acme-challenge/">
        Options None
        AllowOverride None
        Require all granted
    </Directory>
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com
    DocumentRoot /var/www/html
    
    # SSL Engine
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    
    # Modern SSL configuration
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    SSLCipherSuite HIGH:!aNULL:!MD5
    SSLHonorCipherOrder off
    
    # HSTS
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

```bash
# Enable SSL module and site
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2ensite example.com
sudo systemctl reload apache2
```

---

## DNS-01 Challenge (Wildcard Certificates)

### Why DNS-01?

```
HTTP-01 Challenge:
✅ Simple, works with any web server
❌ Requires port 80 open
❌ Cannot issue wildcard certificates
❌ Requires public web server

DNS-01 Challenge:
✅ Works without public web server
✅ Can issue wildcard certificates (*.example.com)
✅ No open ports required
❌ Requires DNS API access
❌ More complex setup
```

### Manual DNS Challenge

```bash
# Request wildcard certificate
sudo certbot certonly --manual \
  --preferred-challenges dns \
  -d example.com \
  -d "*.example.com" \
  --email admin@example.com \
  --agree-tos

# Certbot will display:
# "Please deploy a DNS TXT record under the name:
#  _acme-challenge.example.com
#  with the following value:
#  abc123def456ghi789..."

# Add TXT record in your DNS provider:
# Name: _acme-challenge.example.com
# Type: TXT
# Value: abc123def456ghi789...
# TTL: 300

# Verify DNS propagation
dig _acme-challenge.example.com TXT +short

# Press Enter in Certbot when ready
# Certificate issued!
```

---

## Automated DNS Challenges

### Cloudflare

```bash
# Install Cloudflare DNS plugin
sudo snap install certbot-dns-cloudflare

# Or with pip
/opt/certbot/bin/pip install certbot-dns-cloudflare

# Create API token in Cloudflare:
# 1. Go to https://dash.cloudflare.com/profile/api-tokens
# 2. Create Token → Edit zone DNS template
# 3. Permissions: Zone / DNS / Edit
# 4. Zone Resources: Include / Specific zone / example.com
# 5. Create Token → Copy token

# Create credentials file
sudo mkdir -p /etc/letsencrypt
cat << EOF | sudo tee /etc/letsencrypt/cloudflare.ini
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
EOF

sudo chmod 600 /etc/letsencrypt/cloudflare.ini

# Obtain wildcard certificate
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d example.com \
  -d "*.example.com" \
  --email admin@example.com \
  --agree-tos

# Certificate obtained!
# Works for any subdomain: www, api, blog, etc.
```

### AWS Route53

```bash
# Install Route53 plugin
sudo snap install certbot-dns-route53

# Or with pip
/opt/certbot/bin/pip install certbot-dns-route53

# Create IAM policy for Route53 (AWS Console):
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:GetChange"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/*"
    }
  ]
}

# Create IAM user, attach policy, get credentials

# Configure AWS credentials
sudo mkdir -p ~/.aws
cat << EOF | sudo tee ~/.aws/credentials
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
EOF

sudo chmod 600 ~/.aws/credentials

# Obtain certificate
sudo certbot certonly \
  --dns-route53 \
  -d example.com \
  -d "*.example.com" \
  --email admin@example.com \
  --agree-tos
```

### DigitalOcean

```bash
# Install DigitalOcean plugin
/opt/certbot/bin/pip install certbot-dns-digitalocean

# Create API token in DigitalOcean:
# Account → API → Generate New Token
# Scopes: Read + Write

# Create credentials file
cat << EOF | sudo tee /etc/letsencrypt/digitalocean.ini
dns_digitalocean_token = YOUR_DO_API_TOKEN
EOF

sudo chmod 600 /etc/letsencrypt/digitalocean.ini

# Obtain certificate
sudo certbot certonly \
  --dns-digitalocean \
  --dns-digitalocean-credentials /etc/letsencrypt/digitalocean.ini \
  -d example.com \
  -d "*.example.com"
```

---

## Automated Renewal

### Certbot Automatic Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Actual renewal (run automatically)
sudo certbot renew

# Certbot automatically:
# - Checks all certificates
# - Renews certificates expiring within 30 days
# - Reloads web server if needed
```

### Systemd Timer (Automatic)

```bash
# Certbot snap automatically creates systemd timer

# Check timer status
sudo systemctl status snap.certbot.renew.timer

# View timer schedule
sudo systemctl list-timers snap.certbot.renew.timer

# Timer runs twice daily automatically
```

### Custom Renewal Script

```bash
# /etc/letsencrypt/renewal-hooks/deploy/reload-services.sh
# Runs after successful renewal

#!/bin/bash

# Reload Nginx
systemctl reload nginx

# Reload HAProxy (if using)
# systemctl reload haproxy

# Reload Postfix (if using)
# systemctl reload postfix

# Send notification
echo "Certificates renewed on $(hostname)" | \
    mail -s "Certificate Renewal Success" admin@example.com

# Make executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-services.sh
```

### Cron Job (Alternative)

```bash
# Add to crontab
sudo crontab -e

# Run twice daily (at 2:30 AM and 2:30 PM)
30 2,14 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"

# Run weekly
0 3 * * 0 /usr/bin/certbot renew --quiet
```

---

## Multi-Domain Management

### Multiple Domains, Single Certificate

```bash
# Request certificate for multiple domains
sudo certbot certonly --webroot \
  -w /var/www/example1 \
  -d example1.com \
  -d www.example1.com \
  -w /var/www/example2 \
  -d example2.com \
  -d www.example2.com \
  --email admin@example.com \
  --agree-tos

# All domains in same certificate
# Certificate name: example1.com (first domain)
```

### Separate Certificates per Domain

```bash
# Example 1
sudo certbot certonly --webroot \
  -w /var/www/example1 \
  -d example1.com \
  -d www.example1.com

# Example 2
sudo certbot certonly --webroot \
  -w /var/www/example2 \
  -d example2.com \
  -d www.example2.com

# Certificates stored separately:
# /etc/letsencrypt/live/example1.com/
# /etc/letsencrypt/live/example2.com/
```

### List Certificates

```bash
# List all certificates
sudo certbot certificates

# Output:
# Certificate Name: example1.com
#   Domains: example1.com www.example1.com
#   Expiry Date: 2026-04-30
#   Certificate Path: /etc/letsencrypt/live/example1.com/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/example1.com/privkey.pem
```

---

## Certificate Deployment

### HAProxy

```bash
# HAProxy requires combined certificate + key
sudo cat /etc/letsencrypt/live/example.com/fullchain.pem \
         /etc/letsencrypt/live/example.com/privkey.pem \
         > /etc/haproxy/certs/example.com.pem

sudo chmod 600 /etc/haproxy/certs/example.com.pem
```

```haproxy
# /etc/haproxy/haproxy.cfg

frontend https_frontend
    bind *:443 ssl crt /etc/haproxy/certs/example.com.pem
    mode http
    
    # Redirect to www
    redirect prefix https://www.example.com code 301 if { hdr(host) -i example.com }
    
    default_backend web_backend

backend web_backend
    mode http
    server web1 10.0.1.10:80 check
    server web2 10.0.1.11:80 check
```

### Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./www:/var/www/html:ro
    restart: unless-stopped
  
  certbot:
    image: certbot/certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - ./www:/var/www/html
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

---

## Monitoring and Alerts

### Certificate Expiration Monitor

```bash
#!/bin/bash
# /usr/local/bin/check-cert-expiration.sh

CERT_DIR="/etc/letsencrypt/live"
WARN_DAYS=30
ALERT_EMAIL="admin@example.com"

for domain_dir in "$CERT_DIR"/*/; do
    domain=$(basename "$domain_dir")
    cert_file="$domain_dir/cert.pem"
    
    if [ ! -f "$cert_file" ]; then
        continue
    fi
    
    # Get expiration date
    expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry_date" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    echo "Certificate: $domain"
    echo "Expires: $expiry_date"
    echo "Days remaining: $days_until_expiry"
    
    if [ $days_until_expiry -lt $WARN_DAYS ]; then
        echo "⚠️  WARNING: Certificate expires in $days_until_expiry days!"
        
        # Send alert
        echo "Certificate for $domain expires in $days_until_expiry days!" | \
            mail -s "Certificate Expiration Warning" "$ALERT_EMAIL"
    else
        echo "✅ Certificate valid"
    fi
    
    echo
done
```

```bash
# Add to crontab (check daily at 8 AM)
0 8 * * * /usr/local/bin/check-cert-expiration.sh
```

### Prometheus Exporter

```bash
# Install ssl_exporter
wget https://github.com/ribbybibby/ssl_exporter/releases/download/v2.4.2/ssl_exporter-2.4.2.linux-amd64.tar.gz
tar -xzf ssl_exporter-*.tar.gz
sudo mv ssl_exporter-*/ssl_exporter /usr/local/bin/

# Create systemd service
cat << EOF | sudo tee /etc/systemd/system/ssl_exporter.service
[Unit]
Description=SSL Certificate Exporter
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/ssl_exporter --web.listen-address=:9219
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ssl_exporter
sudo systemctl start ssl_exporter

# Prometheus scrape config
# scrape_configs:
#   - job_name: 'ssl'
#     static_configs:
#       - targets:
#           - example.com:443
#           - api.example.com:443
#     metrics_path: /probe
#     relabel_configs:
#       - source_labels: [__address__]
#         target_label: __param_target
#       - target_label: __address__
#         replacement: localhost:9219
```

---

## Staging Environment (Testing)

```bash
# Use Let's Encrypt staging for testing
# (no rate limits, but certificates not trusted)

sudo certbot certonly --webroot \
  --staging \
  -w /var/www/html \
  -d test.example.com \
  --email admin@example.com \
  --agree-tos

# Test renewal
sudo certbot renew --staging --dry-run

# When ready for production, remove --staging flag
```

---

## Troubleshooting

### Common Errors

```bash
# Error: Port 80 not available
# Check if another service is using port 80
sudo netstat -tulpn | grep :80
sudo systemctl stop apache2  # or nginx

# Error: DNS resolution failed
# Check DNS records
dig example.com +short
nslookup example.com

# Error: Connection refused
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Error: Certificate not found
# List certificates
sudo certbot certificates

# Error: Rate limit exceeded
# Use staging environment for testing
sudo certbot certonly --staging ...

# Force renewal (even if not due)
sudo certbot renew --force-renewal

# Delete certificate
sudo certbot delete --cert-name example.com

# View Certbot logs
sudo journalctl -u snap.certbot.renew.service
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Production Architecture

### Load Balanced Setup

```
                    ┌─────────────┐
                    │  Cloudflare │
                    │  (DNS+Proxy)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Load Balancer│
                    │  (HAProxy)   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼─────┐           ┌──────▼─────┐
       │  Web 1     │           │  Web 2     │
       │  (Nginx)   │           │  (Nginx)   │
       │            │           │            │
       │ Certbot    │           │ Shares     │
       │ Primary    │           │ Certs via  │
       │            │           │ NFS/rsync  │
       └────────────┘           └────────────┘

Setup:
1. Obtain certificate on Web 1
2. Sync to Web 2 via NFS or rsync
3. Both servers use same certificate
4. Renewal runs on Web 1 only
5. Post-renewal hook syncs to Web 2
```

---

## What's Next?

After mastering Let's Encrypt:

**Advanced TLS:**
- [TLS Configuration](tls-configuration) - Optimize TLS settings
- [Certificate Fundamentals](certificate-fundamentals) - Deep dive into PKI

**Kubernetes:**
- [Container Security](container-security) - cert-manager for K8s
- [Service Mesh Security](service-mesh-security) - Istio automatic mTLS

**Automation:**
- [Infrastructure as Code](../infrastructure/terraform-basics) - Terraform certificate automation
- [Ansible Basics](../infrastructure/ansible-basics) - Ansible certificate deployment

---

## Additional Resources

### Official Documentation
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://eff-certbot.readthedocs.io/)
- [ACME Protocol (RFC 8555)](https://datatracker.ietf.org/doc/html/rfc8555)

### Tools
- [acme.sh](https://github.com/acmesh-official/acme.sh) - Alternative ACME client
- [Traefik](https://doc.traefik.io/traefik/https/acme/) - Automatic Let's Encrypt for containers
- [cert-manager](https://cert-manager.io/) - Kubernetes certificate automation

### Testing
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Test certificate configuration
- [Let's Debug](https://letsdebug.net/) - Troubleshoot Let's Encrypt issues

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive Let's Encrypt automation guide covering ACME protocol fundamentals, Certbot installation and configuration, HTTP-01 challenge validation with webroot and standalone modes, DNS-01 challenge for wildcard certificates, automated DNS challenges with Cloudflare/Route53/DigitalOcean plugins, web server integration (Nginx, Apache, HAProxy), automated renewal with systemd timers and custom hooks, multi-domain certificate management, certificate deployment in Docker and load-balanced architectures, monitoring expiration with scripts and Prometheus, staging environment testing, troubleshooting common issues, and production-ready patterns for enterprise certificate automation.

