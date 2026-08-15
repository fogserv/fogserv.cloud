# TLS Configuration - Modern Web Server Security

**Resource Navigation:** [README](README) | [Certificate Fundamentals](certificate-fundamentals) | [Let's Encrypt Automation](letsencrypt-automation) | [Network Segmentation](network-segmentation)

---

## Summary

Transport Layer Security (TLS) is the cryptographic protocol securing communications across networks, replacing the deprecated SSL. This comprehensive guide covers modern TLS configuration for Nginx, Apache, and HAProxy, TLS protocol versions (deprecating TLS 1.0/1.1, embracing TLS 1.3), cipher suite selection and ordering, perfect forward secrecy (PFS), OCSP stapling, HSTS and security headers, certificate chain optimization, TLS session resumption and caching, HTTP/2 and HTTP/3 (QUIC) configuration, performance tuning, security best practices against downgrade attacks, BEAST, CRIME, and Heartbleed, and complete production-ready configurations. Learn A+ SSL Labs ratings, compliance requirements, troubleshooting handshake failures, and automated security hardening.

**The Golden Rule:** Security and performance can coexist - use modern TLS correctly.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Configure modern TLS on Nginx, Apache, and HAProxy
- ✅ Select secure cipher suites and protocols
- ✅ Implement perfect forward secrecy (PFS)
- ✅ Enable OCSP stapling for performance
- ✅ Configure HTTP security headers (HSTS, CSP, etc.)
- ✅ Optimize TLS for performance (session resumption, caching)
- ✅ Enable HTTP/2 and HTTP/3 (QUIC)
- ✅ Achieve SSL Labs A+ rating
- ✅ Troubleshoot TLS handshake issues
- ✅ Meet compliance requirements (PCI-DSS, HIPAA)

---

## Prerequisites

Before configuring TLS, you should have:

- **Certificates**: [Certificate Fundamentals](certificate-fundamentals) and [Let's Encrypt](letsencrypt-automation) completed
- **Web server**: Nginx, Apache, or HAProxy installed
- **Valid certificate**: SSL/TLS certificate from Let's Encrypt or CA
- **Basic networking**: Understanding of TCP/IP and ports

---

## TLS Protocol Versions

### Protocol Evolution

```
┌──────────────────────────────────────────────────────┐
│            TLS Protocol History                       │
└──────────────────────────────────────────────────────┘

SSL 2.0 (1995)  ❌ INSECURE - Never use
SSL 3.0 (1996)  ❌ INSECURE - POODLE vulnerability
TLS 1.0 (1999)  ❌ DEPRECATED - Weak ciphers, BEAST attack
TLS 1.1 (2006)  ❌ DEPRECATED - Limited improvements
TLS 1.2 (2008)  ✅ SECURE - Current standard, widely supported
TLS 1.3 (2018)  ✅ RECOMMENDED - Faster, more secure

Modern Configuration (2026):
- TLS 1.2: Minimum requirement
- TLS 1.3: Preferred (30% faster handshake)
- Disable: SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1

Compliance:
- PCI-DSS 4.0: TLS 1.2+ required (as of 2024)
- NIST: TLS 1.2+ recommended
- Browsers: Dropping TLS 1.0/1.1 support
```

### TLS 1.3 Benefits

```
TLS 1.2 Handshake (2-RTT):
Client ──────────────→ Server
        ClientHello
                      
Client ←────────────── Server
        ServerHello, Certificate, Done
        
Client ──────────────→ Server
        KeyExchange, Finished
        
Client ←────────────── Server
        Finished
        
[Now encrypted communication starts]

TLS 1.3 Handshake (1-RTT):
Client ──────────────→ Server
        ClientHello + KeyShare
        
Client ←────────────── Server
        ServerHello + KeyShare, Certificate, Finished
        
[Encrypted communication starts immediately!]

Benefits:
✅ 30% faster connection setup
✅ Removed weak ciphers (RC4, MD5, SHA-1)
✅ Perfect forward secrecy mandatory
✅ Encrypted certificate exchange
✅ 0-RTT resumption (even faster reconnects)
```

---

## Nginx TLS Configuration

### Modern Nginx Configuration

```nginx
# /etc/nginx/sites-available/example.com

server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    
    # ===== TLS Protocol Configuration =====
    
    # TLS Versions (disable 1.0 and 1.1)
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Cipher Suites (prioritize modern, secure ciphers)
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    
    # Prefer server cipher order
    ssl_prefer_server_ciphers off;  # Let client choose for TLS 1.3
    
    # ===== Perfect Forward Secrecy =====
    
    # DH parameters for DHE ciphers (2048-bit minimum)
    ssl_dhparam /etc/nginx/dhparam.pem;
    
    # ===== Session Resumption =====
    
    # Session cache (shared across workers)
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Session tickets (TLS 1.2)
    ssl_session_tickets on;
    
    # ===== OCSP Stapling =====
    
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 1.0.0.1 valid=300s;
    resolver_timeout 5s;
    
    # ===== Security Headers =====
    
    # HSTS (HTTP Strict Transport Security)
    # Tell browsers to always use HTTPS (max-age = 2 years)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # X-Frame-Options (prevent clickjacking)
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # X-Content-Type-Options (prevent MIME sniffing)
    add_header X-Content-Type-Options "nosniff" always;
    
    # X-XSS-Protection (legacy, but still useful)
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Referrer-Policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy (CSP)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" always;
    
    # Permissions-Policy (formerly Feature-Policy)
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # ===== Application Configuration =====
    
    root /var/www/html;
    index index.html index.php;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # PHP-FPM (if using PHP)
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Generate DH Parameters

```bash
# Generate strong DH parameters (takes several minutes)
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048

# Or use 4096-bit (even stronger, but slower)
# sudo openssl dhparam -out /etc/nginx/dhparam.pem 4096

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### TLS 1.3 Only (Modern)

```nginx
# Ultra-modern configuration (TLS 1.3 only)
# Only use if you don't need to support older clients

server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # TLS 1.3 only
    ssl_protocols TLSv1.3;
    
    # TLS 1.3 ciphersuites (different syntax)
    ssl_conf_command Ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;
    
    # Early data (0-RTT) - be careful, can enable replay attacks
    ssl_early_data on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Rest of configuration...
}
```

---

## Apache TLS Configuration

### Modern Apache Configuration

```apache
# /etc/apache2/sites-available/example.com-ssl.conf

<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com
    DocumentRoot /var/www/html
    
    # ===== SSL Engine =====
    SSLEngine on
    
    # ===== Certificate Configuration =====
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    
    # ===== TLS Protocol Configuration =====
    
    # TLS versions
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    
    # Cipher suites
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
    
    SSLHonorCipherOrder off
    
    # ===== Perfect Forward Secrecy =====
    
    # OpenSSL 1.0.2+
    SSLOpenSSLConfCmd DHParameters /etc/apache2/dhparam.pem
    
    # ===== Session Configuration =====
    
    # Session cache
    SSLSessionCache "shmcb:/var/run/apache2/ssl_scache(512000)"
    SSLSessionCacheTimeout 300
    
    # ===== OCSP Stapling =====
    
    SSLUseStapling on
    SSLStaplingCache "shmcb:/var/run/apache2/ssl_stapling(32768)"
    
    # ===== Security Headers =====
    
    # HSTS
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self';"
    
    # ===== HTTP/2 =====
    
    Protocols h2 http/1.1
    
    # ===== Directory Configuration =====
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### Enable Required Modules

```bash
# Enable SSL and HTTP/2 modules
sudo a2enmod ssl
sudo a2enmod http2
sudo a2enmod headers
sudo a2enmod socache_shmcb

# Generate DH parameters
sudo openssl dhparam -out /etc/apache2/dhparam.pem 2048

# Test configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

---

## HAProxy TLS Configuration

### HAProxy with TLS Termination

```haproxy
# /etc/haproxy/haproxy.cfg

global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon
    
    # TLS configuration
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets
    
    ssl-default-server-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-server-options ssl-min-ver TLSv1.2
    
    tune.ssl.default-dh-param 2048

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000
    timeout client 50000
    timeout server 50000

# Frontend (HTTPS)
frontend https_frontend
    bind *:443 ssl crt /etc/haproxy/certs/ alpn h2,http/1.1
    mode http
    
    # HSTS
    http-response set-header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Security headers
    http-response set-header X-Frame-Options "SAMEORIGIN"
    http-response set-header X-Content-Type-Options "nosniff"
    http-response set-header X-XSS-Protection "1; mode=block"
    
    # Routing
    default_backend web_backend

# Backend (web servers)
backend web_backend
    mode http
    balance roundrobin
    option httpchk GET /health
    
    server web1 10.0.1.10:80 check
    server web2 10.0.1.11:80 check
    server web3 10.0.1.12:80 check
```

---

## Cipher Suite Selection

### Cipher Suite Explained

```
Cipher Suite Format:
ECDHE-RSA-AES128-GCM-SHA256
  │     │    │       │   │
  │     │    │       │   └─ Hash function (SHA256)
  │     │    │       └───── MAC algorithm (GCM)
  │     │    └───────────── Encryption (AES 128-bit)
  │     └────────────────── Authentication (RSA)
  └──────────────────────── Key exchange (ECDHE - Elliptic Curve)

Recommended Ciphers (2026):
✅ ECDHE-ECDSA-AES128-GCM-SHA256  (ECDSA + AES-GCM)
✅ ECDHE-RSA-AES128-GCM-SHA256    (RSA + AES-GCM)
✅ ECDHE-ECDSA-AES256-GCM-SHA384  (Stronger AES)
✅ ECDHE-RSA-AES256-GCM-SHA384    (Stronger AES)
✅ ECDHE-ECDSA-CHACHA20-POLY1305  (ChaCha20 for mobile)
✅ ECDHE-RSA-CHACHA20-POLY1305    (ChaCha20)

Avoid:
❌ RC4 (broken)
❌ MD5 (weak hash)
❌ DES/3DES (weak encryption)
❌ Export ciphers (intentionally weak)
❌ NULL ciphers (no encryption!)
❌ Anonymous ciphers (no authentication)

Perfect Forward Secrecy (PFS):
- Use ECDHE or DHE key exchange
- Ensures past sessions stay secure even if private key compromised
```

### Mozilla SSL Configuration Generator

```bash
# Use Mozilla's tool for recommended configurations
# https://ssl-config.mozilla.org/

# Three profiles:

1. Modern (TLS 1.3 only):
   - For modern browsers only
   - Maximum security
   - May break older clients

2. Intermediate (TLS 1.2+):
   - Recommended for most sites
   - Balance of security and compatibility
   - Supports 99.4% of clients

3. Old (TLS 1.0+):
   - Maximum compatibility
   - Lower security
   - Only if you must support ancient clients
```

---

## Security Headers in Depth

### HSTS (HTTP Strict Transport Security)

```nginx
# Basic HSTS
add_header Strict-Transport-Security "max-age=31536000" always;

# Include subdomains
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Preload (submit to browser preload list)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Preload submission: https://hstspreload.org/
```

### Content Security Policy (CSP)

```nginx
# Strict CSP
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

# Moderate CSP (allows CDNs)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline' https://cdn.example.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'self';" always;

# Report violations
add_header Content-Security-Policy "default-src 'self'; report-uri /csp-report;" always;
```

---

## OCSP Stapling

### Why OCSP Stapling?

```
Without OCSP Stapling:
1. Client connects to server
2. Server sends certificate
3. Client checks if certificate revoked
   → Contacts CA's OCSP responder
   → Adds latency (200-500ms)
   → Privacy leak (CA knows who visited)

With OCSP Stapling:
1. Server periodically fetches OCSP response from CA
2. Client connects to server
3. Server sends certificate + cached OCSP response
4. Client validates immediately
   ✅ No extra request to CA
   ✅ Faster (no latency)
   ✅ Better privacy
```

### Verify OCSP Stapling

```bash
# Test OCSP stapling
openssl s_client -connect example.com:443 -status -tlsextdebug

# Look for:
# OCSP Response Status: successful (0x0)
# OCSP Response Data:
#     OCSP Response Status: successful (0x0)
#     Response Type: Basic OCSP Response
#     ...
#     Cert Status: good

# Or use external tool
curl -I https://www.ssllabs.com/ssltest/analyze.html?d=example.com
```

---

## Performance Optimization

### Session Resumption

```nginx
# Session ID resumption (TLS 1.2)
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Session tickets (TLS 1.2)
ssl_session_tickets on;

# Rotate session ticket keys (for multi-server setup)
ssl_session_ticket_key /etc/nginx/ticket.key;

# TLS 1.3: 0-RTT resumption
ssl_early_data on;
```

### HTTP/2 Configuration

```nginx
# Enable HTTP/2
listen 443 ssl http2;

# HTTP/2 push (optional - can improve page load)
http2_push_preload on;

location / {
    root /var/www/html;
    
    # Push critical resources
    http2_push /css/style.css;
    http2_push /js/app.js;
}
```

### HTTP/3 (QUIC) Configuration

```bash
# Install Nginx with QUIC support
# (requires Nginx 1.25+ with --with-http_v3_module)

# Check if HTTP/3 is available
nginx -V 2>&1 | grep http_v3
```

```nginx
# Enable HTTP/3
server {
    listen 443 ssl http2;
    listen 443 quic reuseport;  # HTTP/3
    
    server_name example.com;
    
    # Advertise HTTP/3
    add_header Alt-Svc 'h3=":443"; ma=86400' always;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # QUIC-specific settings
    ssl_early_data on;
    quic_retry on;
}
```

---

## Testing and Validation

### SSL Labs Test

```bash
# Test your site: https://www.ssllabs.com/ssltest/

# Target: A+ rating

Requirements for A+:
✅ TLS 1.2+ only
✅ Strong ciphers (no weak/deprecated)
✅ Perfect Forward Secrecy
✅ HSTS with long max-age
✅ No mixed content
✅ Valid certificate chain
✅ OCSP stapling working
```

### Command-Line Testing

```bash
# Test TLS protocols
for version in tls1 tls1_1 tls1_2 tls1_3; do
    echo -n "Testing $version: "
    openssl s_client -connect example.com:443 -$version < /dev/null 2>&1 | grep -q "Cipher is" && echo "✅ Supported" || echo "❌ Not supported"
done

# Test specific cipher
openssl s_client -connect example.com:443 -cipher 'ECDHE-RSA-AES128-GCM-SHA256'

# View all supported ciphers
nmap --script ssl-enum-ciphers -p 443 example.com

# Test with testssl.sh (comprehensive)
git clone https://github.com/drwetter/testssl.sh.git
cd testssl.sh
./testssl.sh https://example.com
```

---

## Troubleshooting

### Common TLS Errors

```bash
# Error: SSL handshake failed
# Check certificate validity
openssl s_client -connect example.com:443 -servername example.com

# Error: Certificate name mismatch
# Verify certificate CN/SAN matches domain
openssl x509 -in /etc/letsencrypt/live/example.com/cert.pem -noout -text | grep -A1 "Subject Alternative Name"

# Error: Unable to get local issuer certificate
# Missing intermediate certificate
# Use fullchain.pem instead of cert.pem

# Error: DH key too small
# Generate stronger DH parameters
openssl dhparam -out /etc/nginx/dhparam.pem 2048

# Error: Protocol version alert
# Client doesn't support server's TLS version
# Check ssl_protocols configuration

# Debug TLS connection
openssl s_client -connect example.com:443 -debug -state -showcerts
```

---

## Compliance Requirements

### PCI-DSS 4.0

```
Requirements:
✅ TLS 1.2 or higher
✅ Strong cryptography (AES, RSA 2048+)
✅ Disable SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1
✅ Regular vulnerability scanning
✅ Certificate expiration monitoring

Configuration:
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
```

### HIPAA Compliance

```
Requirements:
✅ Encryption in transit (TLS 1.2+)
✅ Strong authentication
✅ Access control
✅ Audit logging
✅ Regular security assessments

Implementation:
- Enable TLS 1.2+
- Mutual TLS for API access
- Log all TLS connections
- Monitor certificate expiration
```

---

## Automated Security Scanning

```bash
#!/bin/bash
# /usr/local/bin/tls-security-scan.sh

DOMAIN="example.com"
EMAIL="admin@example.com"

echo "=== TLS Security Scan for $DOMAIN ==="

# Check TLS protocols
echo "Checking TLS protocols..."
for version in tls1 tls1_1 tls1_2 tls1_3; do
    if timeout 5 openssl s_client -connect $DOMAIN:443 -$version < /dev/null 2>&1 | grep -q "Cipher is"; then
        if [[ "$version" == "tls1" || "$version" == "tls1_1" ]]; then
            echo "⚠️  $version supported (should be disabled!)"
        else
            echo "✅ $version supported"
        fi
    fi
done

# Check certificate expiration
echo -e "\nChecking certificate expiration..."
EXPIRY=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "⚠️  Certificate expires in $DAYS_UNTIL_EXPIRY days!"
    echo "Certificate expiring soon for $DOMAIN" | mail -s "TLS Alert" $EMAIL
else
    echo "✅ Certificate valid for $DAYS_UNTIL_EXPIRY days"
fi

# Check OCSP stapling
echo -e "\nChecking OCSP stapling..."
if echo | openssl s_client -connect $DOMAIN:443 -status 2>/dev/null | grep -q "OCSP Response Status: successful"; then
    echo "✅ OCSP stapling enabled"
else
    echo "⚠️  OCSP stapling not enabled"
fi

# Check HSTS
echo -e "\nChecking HSTS..."
if curl -sI https://$DOMAIN | grep -qi "Strict-Transport-Security"; then
    echo "✅ HSTS enabled"
else
    echo "⚠️  HSTS not enabled"
fi

echo -e "\nScan complete!"
```

---

## What's Next?

After mastering TLS configuration:

**Encryption:**
- [Disk Encryption (LUKS)](disk-encryption-luks) - Encrypt data at rest
- [Encrypted Backups](encrypted-backups) - Secure backup encryption

**Advanced Security:**
- [Zero Trust Principles](zero-trust-principles) - mTLS everywhere
- [Service Mesh Security](service-mesh-security) - Istio automatic TLS

**Monitoring:**
- [Certificate Monitoring](../observability/README) - Track certificate health
- [Security Monitoring](../observability/README) - TLS handshake monitoring

---

## Additional Resources

### Official Documentation
- [Nginx SSL Module](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [Apache mod_ssl](https://httpd.apache.org/docs/current/mod/mod_ssl.html)
- [HAProxy SSL/TLS](https://www.haproxy.com/documentation/haproxy-configuration-manual/latest/#5.2-ssl)

### Tools & Testing
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Comprehensive SSL/TLS testing
- [Mozilla SSL Config Generator](https://ssl-config.mozilla.org/) - Generate secure configs
- [testssl.sh](https://testssl.sh/) - Command-line TLS testing
- [CipherScan](https://github.com/mozilla/cipherscan) - Analyze cipher support

### Security Resources
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [RFC 8446 (TLS 1.3)](https://datatracker.ietf.org/doc/html/rfc8446)

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive TLS configuration guide covering modern protocol selection (TLS 1.2/1.3), cipher suite selection and ordering for security and performance, perfect forward secrecy with ECDHE/DHE, complete Nginx/Apache/HAProxy configurations, OCSP stapling implementation, HTTP security headers (HSTS, CSP, X-Frame-Options), session resumption and caching, HTTP/2 and HTTP/3 (QUIC) enablement, performance optimization techniques, SSL Labs A+ rating requirements, troubleshooting TLS handshake failures, PCI-DSS and HIPAA compliance, automated security scanning, and production-ready configurations for enterprise web server deployments.

