# Two-Factor Authentication - Hardware Keys and TOTP

**Resource Navigation:** [README](README) | [Password Management](password-management) | [SSH Security Hardening](ssh-security-hardening) | [User Account Security](user-account-security)

---

## Summary

Two-factor authentication (2FA) adds a critical second layer of security beyond passwords - even if credentials are compromised, attackers cannot access systems without the second factor. This comprehensive guide covers implementing time-based one-time passwords (TOTP) with Google Authenticator, hardware security keys (YubiKey, FIDO2), Universal 2nd Factor (U2F), WebAuthn, SMS-based 2FA, backup codes, 2FA for SSH access, web applications, VPNs, and infrastructure services. Learn production deployment patterns for enforcing 2FA organization-wide, emergency access procedures, recovery workflows, integration with identity providers, and compliance requirements. Every pattern includes security considerations, user enrollment workflows, and troubleshooting guides.

**The Golden Rule:** Something you know (password) + something you have (hardware key/phone) = dramatically increased security.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Understand different 2FA methods and their security trade-offs
- ✅ Implement TOTP (time-based one-time passwords) for services
- ✅ Configure hardware security keys (YubiKey) with FIDO2/U2F
- ✅ Set up 2FA for SSH access with Google Authenticator
- ✅ Enable WebAuthn for passwordless authentication
- ✅ Implement 2FA for web applications and APIs
- ✅ Configure backup authentication methods
- ✅ Create recovery procedures for lost 2FA devices
- ✅ Enforce 2FA organization-wide with policies
- ✅ Integrate 2FA with identity providers (Keycloak, Authelia)

---

## Prerequisites

Before implementing two-factor authentication, you should have:

- **User account security**: [User Account Security](user-account-security) completed
- **Password management**: [Password Management](password-management) understanding
- **SSH knowledge**: [SSH Security Hardening](ssh-security-hardening) for SSH 2FA
- **Web server**: Nginx or Apache for web-based 2FA
- **Mobile device or security key**: For testing 2FA setup

---

## 2FA Methods Comparison

### Authentication Factors

**Something you know:**
- Password
- PIN
- Security question answer

**Something you have:**
- Hardware security key (YubiKey, Titan, SoloKey)
- Mobile phone (TOTP app, SMS)
- Smart card
- USB token

**Something you are:**
- Fingerprint
- Face recognition
- Iris scan
- Voice recognition

### 2FA Methods Ranked by Security

```
🥇 Hardware Security Key (FIDO2/U2F)
   ✅ Phishing resistant
   ✅ No shared secrets
   ✅ Cryptographic proof
   ✅ Works offline
   ❌ Requires physical device
   ❌ Cost ($20-50 per key)
   Examples: YubiKey 5, Titan Security Key, SoloKey

🥈 TOTP (Time-Based One-Time Password)
   ✅ Works offline
   ✅ Open standard
   ✅ Many compatible apps
   ✅ Free
   ❌ Susceptible to phishing
   ❌ Can be intercepted
   Examples: Google Authenticator, Authy, andOTP

🥉 Push Notifications
   ✅ User-friendly
   ✅ Phishing resistant (with number matching)
   ❌ Requires internet
   ❌ Proprietary (vendor lock-in)
   Examples: Duo Push, Microsoft Authenticator

🏅 SMS/Voice
   ✅ Universal (any phone)
   ❌ SIM swapping attacks
   ❌ Interception possible
   ❌ Requires cellular service
   ⚠️  Not recommended for high-security

🚫 Email Codes
   ❌ If email compromised, 2FA bypassed
   ❌ Only slightly better than no 2FA
   ⚠️  Use only as last resort
```

**Recommendation**: Hardware keys for critical accounts, TOTP for everything else.

---

## TOTP (Time-Based One-Time Passwords)

### How TOTP Works

```
┌─────────────────────────────────────────────────┐
│            Initial Setup (Once)                  │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Server generates      │
        │   secret key            │
        │   (random 160-bit)      │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   User scans QR code    │
        │   (contains secret)     │
        │   into authenticator    │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Secret stored in      │
        │   - Server database     │
        │   - Authenticator app   │
        └─────────────────────────┘

┌─────────────────────────────────────────────────┐
│            Each Login                            │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   User enters:          │
        │   1. Username/password  │
        │   2. 6-digit TOTP code  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Server calculates     │
        │   expected TOTP code    │
        │   HMAC(secret, time)    │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Compare codes:        │
        │   Match? → Allow        │
        │   No match? → Deny      │
        └─────────────────────────┘

Time-based: New code every 30 seconds
Algorithm: HMAC-SHA1(secret, floor(unix_time / 30))
```

### TOTP for SSH (Google Authenticator PAM)

```bash
# Install Google Authenticator PAM module
# Debian/Ubuntu
sudo apt install libpam-google-authenticator

# RHEL/CentOS
sudo yum install google-authenticator

# Configure for user (run as the user, not root!)
google-authenticator

# Questions and recommended answers:
# - Time based tokens? YES
# - Update .google_authenticator file? YES
# - Disallow multiple uses? YES (prevents replay attacks)
# - Increase time skew? NO (keep 30-second window tight)
# - Rate limiting? YES (3 attempts per 30 seconds)

# This creates: ~/.google_authenticator
# - Contains secret key
# - Contains emergency backup codes (SAVE THESE!)

# Scan QR code with authenticator app:
# - Google Authenticator
# - Authy
# - Microsoft Authenticator
# - andOTP (open source Android)
# - FreeOTP (open source)
```

### Configure SSH for TOTP

```bash
# Configure PAM
sudo nano /etc/pam.d/sshd

# Add at the top (before @include common-auth)
auth required pam_google_authenticator.so nullok

# nullok = allows users without 2FA to still login
# Remove nullok after all users set up 2FA

# Configure SSH daemon
sudo nano /etc/ssh/sshd_config

# Enable challenge-response and PAM
ChallengeResponseAuthentication yes
UsePAM yes

# For key + TOTP (most secure)
AuthenticationMethods publickey,keyboard-interactive

# For password + TOTP
AuthenticationMethods keyboard-interactive

# Restart SSH
sudo systemctl restart sshd
```

### Test SSH with TOTP

```bash
# From another terminal (keep current session open!)
ssh user@server.example.com

# If using key + TOTP:
# 1. SSH key authenticates automatically
# 2. Then prompted: "Verification code:"
# 3. Enter 6-digit code from authenticator app

# If using password + TOTP:
# 1. Prompted: "Password:"
# 2. Enter password
# 3. Prompted: "Verification code:"
# 4. Enter 6-digit code
```

### TOTP for Sudo

```bash
# Require TOTP for sudo commands
sudo nano /etc/pam.d/sudo

# Add:
auth required pam_google_authenticator.so

# Now sudo requires TOTP code:
sudo systemctl restart nginx
# [sudo] password for alice:
# Verification code:
```

### Backup Codes

```
⚠️  CRITICAL: Save emergency backup codes!

When running google-authenticator, you receive:
- 5 emergency scratch codes
- One-time use only
- Use if phone is lost/broken

Storage recommendations:
1. Print and store in safe
2. Encrypted file in password manager
3. Safety deposit box
4. Give to trusted person (sealed envelope)

NEVER:
- Store on phone running authenticator
- Keep only digital copy
- Share codes
```

---

## Hardware Security Keys (FIDO2/U2F)

### Supported Hardware Keys

**YubiKey Series:**
- YubiKey 5 NFC ($45-50)
- YubiKey 5C (USB-C, $55)
- YubiKey 5Ci (dual Lightning/USB-C, $70)
- Security Key by Yubico ($25, FIDO2 only)

**Google Titan:**
- Titan Security Key ($30)
- Titan Security Key USB-C ($35)

**Open Source:**
- SoloKeys ($20-30)

**Features to look for:**
- FIDO2 / WebAuthn support
- U2F support (legacy)
- NFC (for mobile)
- USB-A or USB-C
- TOTP support (optional)

### YubiKey SSH Authentication

```bash
# Install required packages
sudo apt install libpam-u2f pamu2fcfg

# Create directory for U2F keys
mkdir -p ~/.config/Yubico

# Register YubiKey (run as user)
pamu2fcfg > ~/.config/Yubico/u2f_keys

# Touch YubiKey when it blinks
# This generates and stores public key

# Register additional keys (backup)
pamu2fcfg -n >> ~/.config/Yubico/u2f_keys
# Touch second key

# View registered keys
cat ~/.config/Yubico/u2f_keys
# Format: username:key1,key2...

# Configure PAM
sudo nano /etc/pam.d/sshd

# Add (before common-auth):
auth required pam_u2f.so authfile=/home/%u/.config/Yubico/u2f_keys cue

# cue = prompt "Please touch the device"

# Configure SSH
sudo nano /etc/ssh/sshd_config

# SSH key + YubiKey
AuthenticationMethods publickey,keyboard-interactive:pam

# Restart SSH
sudo systemctl restart sshd
```

### Test YubiKey SSH

```bash
ssh user@server.example.com

# 1. SSH key authenticates
# 2. Prompt: "Please touch the device"
# 3. Touch YubiKey (will blink)
# 4. Authenticated!

# No codes to type, phishing resistant
```

### YubiKey for Sudo

```bash
# Register YubiKey for sudo
mkdir -p ~/.config/Yubico
pamu2fcfg > ~/.config/Yubico/u2f_keys

# Configure sudo PAM
sudo nano /etc/pam.d/sudo

# Add:
auth required pam_u2f.so authfile=/home/%u/.config/Yubico/u2f_keys cue

# Test
sudo systemctl status nginx
# [sudo] password for alice:
# Please touch the device.
# [touch YubiKey]
```

### YubiKey PIV (Smart Card)

```bash
# Install YubiKey manager
sudo apt install yubikey-manager

# Generate SSH key on YubiKey
ykman piv keys generate 9a pubkey.pem

# Create self-signed certificate
ykman piv certificates generate 9a pubkey.pem

# Export SSH public key
ssh-keygen -D /usr/lib/x86_64-linux-gnu/opensc-pkcs11.so > yubikey_ssh.pub

# Add to authorized_keys
cat yubikey_ssh.pub | ssh user@server "cat >> ~/.ssh/authorized_keys"

# SSH with YubiKey PIV
ssh -I /usr/lib/x86_64-linux-gnu/opensc-pkcs11.so user@server

# Touch YubiKey when prompted
# SSH key stored on hardware, cannot be extracted
```

---

## WebAuthn / FIDO2

### WebAuthn for Web Applications

```javascript
// Server-side (Node.js with @simplewebauthn/server)
const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse 
} = require('@simplewebauthn/server');

// Registration (user enrolls key)
app.post('/register/begin', async (req, res) => {
  const user = await getUserFromSession(req);
  
  const options = await generateRegistrationOptions({
    rpName: 'MyApp',
    rpID: 'example.com',
    userID: user.id,
    userName: user.email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // hardware key
      userVerification: 'preferred',
    },
  });
  
  req.session.currentChallenge = options.challenge;
  res.json(options);
});

// Verify registration
app.post('/register/finish', async (req, res) => {
  const user = await getUserFromSession(req);
  const expectedChallenge = req.session.currentChallenge;
  
  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge,
    expectedOrigin: 'https://example.com',
    expectedRPID: 'example.com',
  });
  
  if (verification.verified) {
    // Save credential to database
    await saveCredential(user.id, verification.registrationInfo);
    res.json({ verified: true });
  } else {
    res.status(400).json({ error: 'Verification failed' });
  }
});

// Authentication (user logs in)
app.post('/login/begin', async (req, res) => {
  const user = await getUserByEmail(req.body.email);
  const userCredentials = await getCredentials(user.id);
  
  const options = await generateAuthenticationOptions({
    rpID: 'example.com',
    allowCredentials: userCredentials.map(cred => ({
      id: cred.credentialID,
      type: 'public-key',
      transports: cred.transports,
    })),
    userVerification: 'preferred',
  });
  
  req.session.currentChallenge = options.challenge;
  res.json(options);
});

// Client-side (JavaScript)
// Register hardware key
async function registerKey() {
  // Get options from server
  const optionsResponse = await fetch('/register/begin', {
    method: 'POST',
  });
  const options = await optionsResponse.json();
  
  // Create credential with hardware key
  const credential = await navigator.credentials.create({
    publicKey: options,
  });
  
  // Send to server for verification
  const verificationResponse = await fetch('/register/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential),
  });
  
  const result = await verificationResponse.json();
  console.log('Registration:', result.verified ? 'Success' : 'Failed');
}

// Authenticate with hardware key
async function loginWithKey() {
  // Get challenge from server
  const optionsResponse = await fetch('/login/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' }),
  });
  const options = await optionsResponse.json();
  
  // Get assertion from hardware key
  const assertion = await navigator.credentials.get({
    publicKey: options,
  });
  
  // Verify with server
  const verificationResponse = await fetch('/login/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assertion),
  });
  
  const result = await verificationResponse.json();
  if (result.verified) {
    // Login successful
    window.location.href = '/dashboard';
  }
}
```

### Passwordless Authentication

```
WebAuthn allows completely passwordless authentication:

Registration:
1. User enters email
2. Inserts hardware key
3. Touches key to confirm
4. Public key stored on server
5. Private key stays on hardware (never leaves device)

Login:
1. User enters email
2. Inserts hardware key
3. Touches key to prove possession
4. Server verifies cryptographic signature
5. Logged in - no password needed!

Benefits:
✅ No passwords to remember
✅ No passwords to steal
✅ Phishing impossible (cryptographic binding to domain)
✅ No shared secrets
✅ Meets compliance requirements (NIST, FIDO)
```

---

## Enforcing 2FA Organization-Wide

### 2FA Policy

```
Example 2FA Policy:

1. Required Roles:
   - All administrators: Hardware key mandatory
   - Developers: TOTP minimum, hardware key recommended
   - All users: TOTP minimum

2. Enrollment Timeline:
   - Administrators: Immediate (grace period: 7 days)
   - Others: 30-day grace period

3. Backup Authentication:
   - Minimum 2 registered devices/methods
   - Emergency backup codes (print, secure storage)

4. Recovery Procedure:
   - Managed service: Contact IT helpdesk
   - Self-hosted: Admin can reset 2FA

5. Exceptions:
   - Service accounts: API keys + IP whitelist
   - Emergency access: Break-glass procedure

6. Compliance:
   - Audit 2FA usage quarterly
   - Review and remove unused 2FA registrations
   - Test recovery procedures annually
```

### Ansible Enforcement

```yaml
# enforce-2fa.yml - Ansible playbook

---
- name: Enforce 2FA for all users
  hosts: all
  become: yes
  
  tasks:
    - name: Install Google Authenticator PAM
      apt:
        name: libpam-google-authenticator
        state: present
        update_cache: yes
    
    - name: Configure PAM for SSH
      lineinfile:
        path: /etc/pam.d/sshd
        line: 'auth required pam_google_authenticator.so'
        insertbefore: '^@include common-auth'
        state: present
    
    - name: Configure SSH for 2FA
      blockinfile:
        path: /etc/ssh/sshd_config
        marker: "# {mark} ANSIBLE MANAGED BLOCK - 2FA"
        block: |
          ChallengeResponseAuthentication yes
          AuthenticationMethods publickey,keyboard-interactive
        validate: '/usr/sbin/sshd -t -f %s'
      notify: restart sshd
    
    - name: Remove nullok from PAM (enforce 2FA)
      lineinfile:
        path: /etc/pam.d/sshd
        regexp: '^auth required pam_google_authenticator.so nullok'
        line: 'auth required pam_google_authenticator.so'
        state: present
      when: enforce_2fa | default(false)
  
  handlers:
    - name: restart sshd
      systemd:
        name: sshd
        state: restarted
```

### User Enrollment Workflow

```bash
#!/bin/bash
# enroll-2fa.sh - Automated 2FA enrollment

USERNAME="$1"
EMAIL="$2"

if [ -z "$USERNAME" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <username> <email>"
    exit 1
fi

echo "=== 2FA Enrollment for $USERNAME ==="

# Check if user already has 2FA
if sudo -u "$USERNAME" test -f "/home/$USERNAME/.google_authenticator"; then
    echo "❌ User already has 2FA configured"
    echo "To reconfigure, run: sudo -u $USERNAME google-authenticator"
    exit 1
fi

# Configure 2FA with non-interactive options
sudo -u "$USERNAME" google-authenticator \
    --time-based \
    --disallow-reuse \
    --force \
    --rate-limit=3 \
    --rate-time=30 \
    --window-size=3 \
    -s "/home/$USERNAME/.google_authenticator"

# Extract secret and QR code URL
SECRET=$(sudo grep "^[A-Z2-7]\{16,\}" "/home/$USERNAME/.google_authenticator" | head -1)
QR_URL="https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/$USERNAME@$(hostname -f)?secret=$SECRET"

# Extract backup codes
CODES=$(sudo grep "^[0-9]\{8\}" "/home/$USERNAME/.google_authenticator")

# Send enrollment email
cat <<EOF | mail -s "Two-Factor Authentication Setup Required" "$EMAIL"
Hello $USERNAME,

Two-factor authentication (2FA) has been enabled for your account.

Setup Instructions:
1. Install an authenticator app:
   - Google Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
   - Microsoft Authenticator (iOS/Android)
   - andOTP (Android, open source)

2. Scan this QR code: $QR_URL
   Or manually enter secret: $SECRET

3. Test login with 2FA code

Emergency Backup Codes (one-time use):
$CODES

Store these backup codes securely (print or password manager).

Next SSH login will require your 6-digit authenticator code.

Questions? Contact IT support.
EOF

echo "✓ 2FA configured for $USERNAME"
echo "✓ Enrollment email sent to $EMAIL"
echo ""
echo "Emergency Backup Codes:"
echo "$CODES"
echo ""
echo "⚠️  User must complete enrollment before next login!"
```

---

## Recovery and Emergency Access

### Lost 2FA Device Recovery

```bash
# Admin recovery (server access)

# Option 1: Temporary disable 2FA for user
sudo mv /home/username/.google_authenticator /home/username/.google_authenticator.disabled

# User can now login without 2FA
# Have user re-enroll: google-authenticator

# Option 2: Reset 2FA completely
sudo rm /home/username/.google_authenticator
# User must set up new 2FA device

# Option 3: Use backup codes (if available)
# User provides backup code from secure storage
# Code works once, then is consumed
```

### Break-Glass Access

```bash
# Emergency admin access (when 2FA fails)

# Create emergency account (console access only)
sudo useradd -m -s /bin/bash emergency-admin
sudo passwd emergency-admin
echo "emergency-admin ALL=(ALL) ALL" | sudo tee /etc/sudoers.d/emergency-admin

# Configure SSH to exempt emergency account from 2FA
sudo nano /etc/pam.d/sshd

# Modify 2FA line to exclude emergency account:
auth [success=1 default=ignore] pam_succeed_if.so user = emergency-admin
auth required pam_google_authenticator.so

# Or disable SSH for emergency account (console only)
# This is more secure - requires physical/KVM access
sudo nano /etc/ssh/sshd_config

# Add:
Match User emergency-admin
    PasswordAuthentication no
    PubkeyAuthentication no
```

### Backup YubiKeys

```
Always register multiple hardware keys:

Primary key: On keychain (daily use)
Backup key: In safe at home
Company key: In office safe (managed access)

Registration process:
1. Insert primary key
   pamu2fcfg > ~/.config/Yubico/u2f_keys

2. Insert backup key
   pamu2fcfg -n >> ~/.config/Yubico/u2f_keys

3. Insert company key
   pamu2fcfg -n >> ~/.config/Yubico/u2f_keys

4. Verify all keys registered:
   cat ~/.config/Yubico/u2f_keys
   # Should show 3 entries

All keys work independently - loss of one doesn't lock you out.
```

---

## 2FA for Applications

### Bitwarden/Vaultwarden 2FA

Already covered in [Password Management](password-management):
- TOTP authenticator apps
- YubiKey OTP
- FIDO2 WebAuthn
- Duo (requires account)
- Email (least secure)

### VPN 2FA (WireGuard + TOTP)

```bash
# WireGuard doesn't natively support 2FA
# Use TOTP-protected portal for config distribution

# Install web portal for WireGuard key distribution
# Require 2FA before allowing config download

# Alternative: Use OpenVPN with 2FA
# /etc/openvpn/server.conf
plugin /usr/lib/openvpn/plugins/openvpn-auth-pam.so openvpn

# /etc/pam.d/openvpn
auth required pam_google_authenticator.so
account required pam_unix.so
```

### Keycloak SSO with 2FA

```
Keycloak provides centralized 2FA:

1. Install Keycloak
2. Configure realm
3. Enable OTP policy:
   - Authentication → Required Actions
   - Configure OTP: ON
   - OTP Type: Time-based

4. Configure authentication flow:
   - Authentication → Flows
   - Copy "Browser" flow
   - Add: OTP Form
   - Set: REQUIRED

5. Users must enroll on next login
6. All applications using Keycloak SSO get 2FA

Applications benefit:
- Single 2FA enrollment
- Unified user experience
- Centralized management
- Supports TOTP, WebAuthn, SMS
```

### Authelia for Self-Hosted 2FA

```yaml
# docker-compose.yml - Authelia SSO with 2FA

version: '3.8'

services:
  authelia:
    image: authelia/authelia:latest
    container_name: authelia
    restart: unless-stopped
    
    volumes:
      - ./config:/config
      - ./secrets:/secrets
    
    environment:
      - TZ=America/New_York
    
    ports:
      - "9091:9091"
    
    networks:
      - auth

networks:
  auth:
    name: auth

# config/configuration.yml
server:
  host: 0.0.0.0
  port: 9091

log:
  level: info

totp:
  issuer: authelia.com
  period: 30
  skew: 1

authentication_backend:
  file:
    path: /config/users_database.yml
    password:
      algorithm: argon2id
      iterations: 1
      salt_length: 16
      parallelism: 8
      memory: 64

access_control:
  default_policy: deny
  rules:
    - domain: "app.example.com"
      policy: two_factor

session:
  name: authelia_session
  secret: your_session_secret
  expiration: 3600
  inactivity: 300
  domain: example.com

storage:
  local:
    path: /config/db.sqlite3

notifier:
  smtp:
    host: smtp.example.com
    port: 587
    username: authelia@example.com
    password: your_smtp_password
    sender: authelia@example.com
```

---

## Monitoring and Compliance

### Audit 2FA Usage

```bash
#!/bin/bash
# audit-2fa.sh - Check 2FA enrollment

echo "=== 2FA Enrollment Audit ==="
echo

# Count users with 2FA configured
USERS_WITH_2FA=0
USERS_WITHOUT_2FA=0

for user in $(getent passwd | awk -F: '$3 >= 1000 && $3 < 65534 {print $1}'); do
    if [ -f "/home/$user/.google_authenticator" ]; then
        echo "✓ $user - 2FA configured"
        ((USERS_WITH_2FA++))
    else
        echo "✗ $user - NO 2FA"
        ((USERS_WITHOUT_2FA++))
    fi
done

echo
echo "Summary:"
echo "  Users with 2FA: $USERS_WITH_2FA"
echo "  Users without 2FA: $USERS_WITHOUT_2FA"
echo "  Compliance: $(( USERS_WITH_2FA * 100 / (USERS_WITH_2FA + USERS_WITHOUT_2FA) ))%"
```

### Log 2FA Events

```bash
# Monitor 2FA authentication attempts

# Successful 2FA
sudo grep "pam_google_authenticator" /var/log/auth.log | grep "authentication succeeded"

# Failed 2FA
sudo grep "pam_google_authenticator" /var/log/auth.log | grep "failed"

# Count 2FA failures by user
sudo grep "pam_google_authenticator.*failed" /var/log/auth.log | \
    awk '{print $9}' | sort | uniq -c | sort -nr

# Alert on multiple failures
#!/bin/bash
# alert-2fa-failures.sh

THRESHOLD=5
FAILURES=$(sudo grep "pam_google_authenticator.*failed" /var/log/auth.log | \
    grep "$(date '+%b %e')" | wc -l)

if [ $FAILURES -gt $THRESHOLD ]; then
    echo "⚠️  High 2FA failure rate: $FAILURES today" | \
        mail -s "2FA Alert" security@example.com
fi
```

---

## Troubleshooting

### Time Sync Issues

```bash
# TOTP requires accurate time (±30 seconds)

# Check system time
date

# Check time sync status
timedatectl status

# Enable NTP
sudo timedatectl set-ntp true

# Install and configure NTP
sudo apt install chrony
sudo systemctl enable chrony
sudo systemctl start chrony

# Verify time sync
chronyc tracking

# If time is off, TOTP codes won't work!
# Server and phone must be synchronized
```

### YubiKey Not Recognized

```bash
# Check if YubiKey is detected
lsusb | grep Yubico

# Install YubiKey tools
sudo apt install yubikey-manager

# Check YubiKey info
ykman info

# Test YubiKey OTP
ykman otp info

# Check U2F functionality
ykman fido info

# Update YubiKey firmware (if needed)
# https://www.yubico.com/support/download/yubikey-manager/
```

### Locked Out (No 2FA Device)

```
Recovery options:

1. Use backup codes (if saved)
2. Use backup hardware key
3. Contact administrator for 2FA reset
4. Physical/console access (if self-hosted)
5. Break-glass emergency account

Prevention:
✅ Always register 2+ devices
✅ Save backup codes securely
✅ Test recovery before traveling
✅ Have emergency access procedure
```

---

## Security Best Practices

### 2FA Security Checklist

```
☑ Hardware keys for all administrators
☑ TOTP minimum for all users
☑ Backup authentication methods configured
☑ Emergency backup codes saved securely
☑ Time synchronization (NTP) configured
☑ 2FA enrollment enforced (no nullok)
☑ Recovery procedures documented
☑ Break-glass access available
☑ 2FA usage audited regularly
☑ Failed authentication monitored
☑ SMS 2FA avoided (use TOTP/hardware instead)
☑ Email 2FA only as last resort
☑ WebAuthn/FIDO2 preferred over U2F
☑ Rate limiting on 2FA attempts
☑ User training provided
☑ Compliance requirements met
☑ Regular testing of recovery procedures
```

---

## What's Next?

After implementing two-factor authentication:

**Authentication & Access:**
- [SSH Security Hardening](ssh-security-hardening) - SSH certificates, jump hosts
- [User Account Security](user-account-security) - Least privilege
- [Password Management](password-management) - Centralized vault

**Network Security:**
- [VPN Setup](wireguard-vpn) - Secure remote access with 2FA
- [Zero Trust Principles](zero-trust-principles) - Never trust, always verify
- [Identity Management](identity-management) - Centralized authentication

**Advanced Security:**
- [Certificate Management](certificate-fundamentals) - PKI and mTLS
- [Secrets Management](vault-introduction) - Dynamic credentials
- [Policy as Code](policy-as-code) - Automated compliance

---

## Additional Resources

### Official Documentation
- [Google Authenticator PAM](https://github.com/google/google-authenticator-libpam)
- [YubiKey Documentation](https://docs.yubico.com/)
- [WebAuthn Spec](https://www.w3.org/TR/webauthn/)
- [FIDO Alliance](https://fidoalliance.org/)

### Tutorials & Guides
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - Digital Identity Guidelines
- [YubiKey SSH Guide](https://developers.yubico.com/SSH/)

### Tools
- [SimpleWebAuthn](https://simplewebauthn.dev/) - Easy WebAuthn implementation
- [Authelia](https://www.authelia.com/) - Self-hosted SSO with 2FA
- [Keycloak](https://www.keycloak.org/) - Enterprise identity management
- [Authy](https://authy.com/) - Multi-device TOTP app

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive two-factor authentication guide covering TOTP with Google Authenticator, hardware security keys (YubiKey, FIDO2, U2F), WebAuthn passwordless authentication, SSH 2FA configuration, sudo 2FA, recovery procedures, backup codes, organization-wide enforcement, user enrollment workflows, integration with applications (VPN, Bitwarden, Keycloak, Authelia), monitoring and compliance, troubleshooting time sync and hardware issues, and complete security best practices for production environments.

