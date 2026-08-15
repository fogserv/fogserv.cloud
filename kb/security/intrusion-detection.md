# Intrusion Detection Systems (IDS) - Snort and Suricata

**Resource Navigation:** [README](README) | [Firewall Basics](firewall-basics) | [fail2ban Setup](fail2ban-setup) | [Network Segmentation](network-segmentation)

---

## Summary

Intrusion Detection Systems (IDS) monitor network traffic and system activities for malicious behavior and policy violations. This comprehensive guide covers Snort and Suricata installation and configuration, signature-based detection with community and commercial rulesets, behavioral analysis and anomaly detection, IDS vs IPS (Intrusion Prevention), inline mode deployment with NFQueue, monitoring multiple network segments, integrating with SIEM systems, alert management with Barnyard2 and Elasticsearch, performance tuning for high-traffic networks, and complete SOC workflows. Learn production IDS architectures, threat intelligence integration, automated response with fail2ban, false positive reduction, and security operations best practices.

**The Golden Rule:** Log everything, alert on anomalies, respond to threats.

---

## Learning Objectives

By the end of this guide, you will be able to:

- ✅ Install and configure Snort and Suricata IDS
- ✅ Deploy IDS in IDS (passive) and IPS (active) modes
- ✅ Manage and update threat detection rules
- ✅ Implement signature-based and behavioral detection
- ✅ Monitor multiple network segments
- ✅ Integrate IDS with SIEM platforms
- ✅ Configure automated alerting and response
- ✅ Tune IDS performance for high traffic
- ✅ Reduce false positives effectively
- ✅ Build complete SOC monitoring workflows

---

## Prerequisites

Before implementing IDS, you should have:

- **Network fundamentals**: [Basics](../basics/linux-fundamentals) networking section
- **Firewall knowledge**: [Firewall Basics](firewall-basics) completed
- **Network segmentation**: [Network Segmentation](network-segmentation) recommended
- **Log management**: Basic understanding of syslog
- **Linux administration**: Comfortable with systemd services

---

## IDS vs IPS Overview

### Detection vs Prevention

```
┌─────────────────────────────────────────────────────┐
│         IDS (Intrusion Detection System)             │
│              "Passive Monitoring"                     │
└─────────────────────────────────────────────────────┘

       Internet ──→ [Router] ──→ [Switch] ──→ Servers
                                    │
                                    │ (Mirror/SPAN port)
                                    ↓
                              ┌──────────┐
                              │   IDS    │
                              │ (Snort)  │
                              └────┬─────┘
                                   │
                              Alerts/Logs

Pros:
✅ No performance impact on network
✅ Cannot be bypassed by attacker
✅ Safe to deploy (no blocking)

Cons:
❌ Cannot stop attacks in real-time
❌ Requires manual response
❌ Attack may succeed before detection

---

┌─────────────────────────────────────────────────────┐
│        IPS (Intrusion Prevention System)             │
│               "Inline Blocking"                       │
└─────────────────────────────────────────────────────┘

    Internet ──→ [Router] ──→ ┌────────┐ ──→ Servers
                               │  IPS   │
                               │(Inline)│
                               └────┬───┘
                                    │
                               Blocks + Logs

Pros:
✅ Stops attacks in real-time
✅ Automatic threat prevention
✅ No manual intervention needed

Cons:
❌ Performance overhead (in traffic path)
❌ False positives can block legitimate traffic
❌ Single point of failure
```

### When to Use Each

**IDS (Detection):**
- High-traffic networks (monitoring)
- Initial deployment (testing rules)
- Forensics and compliance
- Can't risk blocking legitimate traffic

**IPS (Prevention):**
- Security-critical environments
- Known attack patterns
- Complement to firewall
- After IDS tuning (low false positives)

---

## Snort Installation and Configuration

### Install Snort 3

```bash
# Install dependencies
sudo apt update
sudo apt install -y build-essential libpcap-dev libpcre3-dev \
                    libnet1-dev zlib1g-dev luajit hwloc \
                    libdnet-dev cmake liblzma-dev openssl \
                    libssl-dev pkg-config libhwloc-dev \
                    liblua5.3-dev libsqlite3-dev uuid-dev

# Download Snort 3 (check for latest version)
cd /tmp
wget https://github.com/snort3/snort3/archive/refs/tags/3.1.75.0.tar.gz
tar -xvzf 3.1.75.0.tar.gz
cd snort3-3.1.75.0

# Install LibDAQ (Data Acquisition library)
cd /tmp
wget https://github.com/snort3/libdaq/archive/refs/tags/v3.0.13.tar.gz
tar -xvzf v3.0.13.tar.gz
cd libdaq-3.0.13
./bootstrap
./configure
make
sudo make install
sudo ldconfig

# Build and install Snort 3
cd /tmp/snort3-3.1.75.0
./configure_cmake.sh --prefix=/usr/local --enable-tcmalloc
cd build
make -j$(nproc)
sudo make install
sudo ldconfig

# Verify installation
snort -V
# Snort++ 3.1.75.0
```

### Basic Snort Configuration

```lua
-- /usr/local/etc/snort/snort.lua
-- Snort 3 configuration

---------------------------------------------------------------------------
-- 1. Variables
---------------------------------------------------------------------------
HOME_NET = '10.0.0.0/8'
EXTERNAL_NET = '!$HOME_NET'

---------------------------------------------------------------------------
-- 2. Configure detection
---------------------------------------------------------------------------
ips = {
    -- Enable inline mode (IPS) or tap mode (IDS)
    mode = tap,
    
    -- Inspection limits
    max_aux_ip = 16,
    max_sessions = 1024,
    
    -- Rules
    variables = default_variables,
    rules = [[
        include $RULE_PATH/local.rules
        include $RULE_PATH/snort3-community.rules
    ]]
}

---------------------------------------------------------------------------
-- 3. Configure outputs
---------------------------------------------------------------------------
alert_fast = {
    file = true,
    packet = false
}

alert_full = {
    file = true,
}

-- Log to syslog
alert_syslog = {
    level = 'info',
}

---------------------------------------------------------------------------
-- 4. Network configuration
---------------------------------------------------------------------------
stream = {
    tcp_cache = {
        idle_timeout = 3600,
        max_sessions = 65535
    },
    udp_cache = {
        idle_timeout = 180,
        max_sessions = 65535
    }
}

stream_tcp = {
    policy = 'linux',
    small_segments = {
        count = 0,
        maximum_size = 0
    },
    session_timeout = 180
}

---------------------------------------------------------------------------
-- 5. Performance tuning
---------------------------------------------------------------------------
detection = {
    max_queue_events = 8,
    search_method = 'ac_full',
}

memory = {
    cap = 4096  -- MB
}

---------------------------------------------------------------------------
-- 6. Preprocessors
---------------------------------------------------------------------------
normalizer = {
    tcp = {
        ips = true
    }
}

http_inspect = {
    enable = true,
    decompress_pdf = true,
    decompress_swf = true,
    normalize_javascript = true
}

---------------------------------------------------------------------------
-- 7. Logging
---------------------------------------------------------------------------
output = {
    logdir = '/var/log/snort'
}
```

### Create Local Rules

```bash
# Create rules directory
sudo mkdir -p /usr/local/etc/snort/rules
cd /usr/local/etc/snort/rules

# Create local.rules
sudo nano local.rules
```

```
# /usr/local/etc/snort/rules/local.rules
# Custom Snort rules

# Detect ICMP ping
alert icmp any any -> $HOME_NET any (msg:"ICMP Ping Detected"; icode:0; itype:8; sid:1000001; rev:1;)

# Detect SSH brute force (many connections)
alert tcp any any -> $HOME_NET 22 (msg:"Possible SSH Brute Force"; flags:S; threshold:type both, track by_src, count 5, seconds 60; sid:1000002; rev:1;)

# Detect SQL injection attempt
alert tcp any any -> $HOME_NET 80 (msg:"Possible SQL Injection"; content:"UNION"; nocase; content:"SELECT"; nocase; sid:1000003; rev:1;)

# Detect directory traversal
alert tcp any any -> $HOME_NET 80 (msg:"Directory Traversal Attempt"; content:"../"; sid:1000004; rev:1;)

# Detect Nmap scan
alert tcp any any -> $HOME_NET any (msg:"Nmap XMAS Scan"; flags:FPU; sid:1000005; rev:1;)
alert tcp any any -> $HOME_NET any (msg:"Nmap NULL Scan"; flags:0; sid:1000006; rev:1;)
alert tcp any any -> $HOME_NET any (msg:"Nmap FIN Scan"; flags:F; sid:1000007; rev:1;)

# Detect RDP brute force
alert tcp any any -> $HOME_NET 3389 (msg:"RDP Brute Force Attempt"; threshold:type both, track by_src, count 5, seconds 60; sid:1000008; rev:1;)

# Detect malware callback (example C2 domain)
alert tcp $HOME_NET any -> any any (msg:"Malware C2 Communication"; content:"evil-domain.com"; nocase; sid:1000009; rev:1;)

# Detect data exfiltration (large outbound transfer)
alert tcp $HOME_NET any -> $EXTERNAL_NET any (msg:"Possible Data Exfiltration"; dsize:>100000; threshold:type both, track by_src, count 10, seconds 60; sid:1000010; rev:1;)
```

### Download Community Rules

```bash
# Register at Snort.org for Oinkcode
# https://www.snort.org/users/sign_up

# Install PulledPork3 (rule management)
sudo apt install -y python3-pip
sudo pip3 install pulledpork3

# Configure PulledPork
sudo mkdir -p /usr/local/etc/pulledpork3
cat << EOF | sudo tee /usr/local/etc/pulledpork3/pulledpork.conf
[snort]
oinkcode = YOUR_OINKCODE_HERE
snort_version = 3.1.75.0
blocklist_path = /usr/local/etc/snort/rules/blocklist.rules
rule_path = /usr/local/etc/snort/rules
community_ruleset = true
EOF

# Download and update rules
sudo pulledpork3 -c /usr/local/etc/pulledpork3/pulledpork.conf

# Verify rules downloaded
ls -lh /usr/local/etc/snort/rules/
```

### Run Snort

```bash
# Test configuration
sudo snort -c /usr/local/etc/snort/snort.lua -T

# Run in IDS mode (tap/passive)
sudo snort -c /usr/local/etc/snort/snort.lua -i eth0 -A fast -l /var/log/snort

# Run as daemon
sudo snort -c /usr/local/etc/snort/snort.lua -i eth0 -D -l /var/log/snort

# Check alerts
sudo tail -f /var/log/snort/alert_fast.txt
```

### Systemd Service

```ini
# /etc/systemd/system/snort3.service

[Unit]
Description=Snort 3 NIDS
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/snort -c /usr/local/etc/snort/snort.lua -i eth0 -l /var/log/snort -D
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable snort3
sudo systemctl start snort3
sudo systemctl status snort3
```

---

## Suricata Installation and Configuration

### Install Suricata

```bash
# Add Suricata repository
sudo add-apt-repository ppa:oisf/suricata-stable
sudo apt update

# Install Suricata
sudo apt install -y suricata

# Verify installation
suricata --build-info
```

### Configure Suricata

```yaml
# /etc/suricata/suricata.yaml

%YAML 1.1
---

vars:
  address-groups:
    HOME_NET: "[10.0.0.0/8,192.168.0.0/16,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"
    HTTP_SERVERS: "$HOME_NET"
    SMTP_SERVERS: "$HOME_NET"
    SQL_SERVERS: "$HOME_NET"
    DNS_SERVERS: "$HOME_NET"
  
  port-groups:
    HTTP_PORTS: "80"
    SHELLCODE_PORTS: "!80"
    ORACLE_PORTS: 1521
    SSH_PORTS: 22

# Network interface
af-packet:
  - interface: eth0
    threads: 4
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes

# Detection engine
detect:
  profile: medium
  custom-values:
    toclient-groups: 3
    toserver-groups: 25

# Stream engine
stream:
  memcap: 64mb
  checksum-validation: yes
  inline: auto
  reassembly:
    memcap: 256mb
    depth: 1mb
    toserver-chunk-size: 2560
    toclient-chunk-size: 2560

# Logging
outputs:
  - fast:
      enabled: yes
      filename: fast.log
      append: yes
  
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert:
            tagged-packets: yes
        - http:
            extended: yes
        - dns:
            query: yes
            answer: yes
        - tls:
            extended: yes
        - files:
            force-magic: no
        - ssh
        - stats:
            totals: yes
            threads: yes
  
  - syslog:
      enabled: yes
      facility: local5
      level: Info

# Application layer protocols
app-layer:
  protocols:
    http:
      enabled: yes
      memcap: 64mb
    tls:
      enabled: yes
      detection-ports:
        dp: 443
    ssh:
      enabled: yes
    dns:
      tcp:
        enabled: yes
      udp:
        enabled: yes

# Rules
default-rule-path: /var/lib/suricata/rules
rule-files:
  - suricata.rules
  - /etc/suricata/rules/local.rules

# Performance
threading:
  set-cpu-affinity: no
  cpu-affinity:
    - management-cpu-set:
        cpu: [ 0 ]
    - receive-cpu-set:
        cpu: [ 0 ]
    - worker-cpu-set:
        cpu: [ "all" ]

max-pending-packets: 1024

# Host OS policy
host-os-policy:
  linux: [10.0.0.0/8]
  windows: [192.168.1.0/24]
```

### Create Local Rules (Suricata)

```bash
# Create local rules
sudo mkdir -p /etc/suricata/rules
sudo nano /etc/suricata/rules/local.rules
```

```
# /etc/suricata/rules/local.rules
# Custom Suricata rules

# Detect SSH brute force
alert ssh any any -> $HOME_NET 22 (msg:"SSH Brute Force Attempt"; flow:to_server; threshold:type both, track by_src, count 5, seconds 60; sid:2000001; rev:1;)

# Detect TLS certificate issues
alert tls any any -> any any (msg:"Invalid TLS Certificate"; tls.cert_expired; sid:2000002; rev:1;)

# Detect DNS tunneling (large TXT records)
alert dns any any -> any any (msg:"Possible DNS Tunneling"; dns.query; content:"|00 10|"; depth:2; byte_extract:2,0,txtlen,relative; byte_test:2,>,100,0,relative; sid:2000003; rev:1;)

# Detect HTTP POST to suspicious paths
alert http any any -> $HOME_NET any (msg:"Suspicious HTTP POST"; http.method; content:"POST"; http.uri; content:"/admin/upload"; sid:2000004; rev:1;)

# Detect outbound SMTP (possible spam)
alert smtp $HOME_NET any -> $EXTERNAL_NET 25 (msg:"Outbound SMTP from Internal Host"; flow:to_server; sid:2000005; rev:1;)

# Detect cryptocurrency mining
alert http any any -> any any (msg:"Cryptocurrency Mining Script"; http.uri; content:"/coinhive"; nocase; sid:2000006; rev:1;)

# Detect ransomware C2
alert tls $HOME_NET any -> $EXTERNAL_NET any (msg:"Possible Ransomware C2"; tls.sni; content:".onion"; endswith; sid:2000007; rev:1;)

# Detect SQL injection in HTTP
alert http any any -> $HOME_NET any (msg:"SQL Injection Attempt"; flow:to_server; http.uri; pcre:"/(\%27)|(\')|(\-\-)|(\%23)|(#)/i"; sid:2000008; rev:1;)

# Detect XSS attempts
alert http any any -> $HOME_NET any (msg:"Cross-Site Scripting (XSS) Attempt"; flow:to_server; http.uri; content:"<script>"; nocase; sid:2000009; rev:1;)

# Detect file download from suspicious TLD
alert http any any -> any any (msg:"File Download from Suspicious TLD"; flow:established,to_client; http.host; content:".ru"; endswith; http.content_type; content:"application/"; sid:2000010; rev:1;)
```

### Update Suricata Rules

```bash
# Update rules with suricata-update
sudo suricata-update

# Add Emerging Threats Open rules
sudo suricata-update update-sources
sudo suricata-update enable-source et/open
sudo suricata-update

# List available rule sources
sudo suricata-update list-sources

# Add specific sources
sudo suricata-update enable-source tgreen/hunting
sudo suricata-update

# Update and reload
sudo suricata-update && sudo systemctl reload suricata
```

### Run Suricata

```bash
# Test configuration
sudo suricata -T -c /etc/suricata/suricata.yaml

# Run Suricata
sudo suricata -c /etc/suricata/suricata.yaml -i eth0

# Check alerts
sudo tail -f /var/log/suricata/fast.log

# Check EVE JSON (structured logs)
sudo tail -f /var/log/suricata/eve.json | jq '.alert'
```

---

## IPS Mode (Inline Prevention)

### NFQueue Setup (Linux)

```bash
# Install NFQueue library
sudo apt install -y libnfnetlink-dev libnetfilter-queue-dev

# Suricata with NFQueue support (check during install)
suricata --build-info | grep "NFQueue support"

# Configure iptables to send traffic to Suricata
sudo iptables -I FORWARD -j NFQUEUE --queue-num 0

# Run Suricata in IPS mode
sudo suricata -c /etc/suricata/suricata.yaml -q 0

# Suricata will now drop malicious packets
```

### Suricata IPS Configuration

```yaml
# /etc/suricata/suricata.yaml
# IPS mode configuration

# Change mode to IPS
nfq:
  - mode: accept  # Can also be: drop, repeat
    repeat-mark: 1
    repeat-mask: 1
    route-queue: 2
    batchcount: 20
    fail-open: yes  # Allow traffic if Suricata crashes

# Add drop rules
# Change "alert" to "drop" in rules
```

```bash
# Example drop rule
# /etc/suricata/rules/local.rules

drop ssh any any -> $HOME_NET 22 (msg:"Block SSH Brute Force"; flow:to_server; threshold:type both, track by_src, count 10, seconds 60; sid:3000001; rev:1;)

drop http any any -> $HOME_NET any (msg:"Block SQL Injection"; flow:to_server; http.uri; pcre:"/(\%27)|(\')|(\-\-)|(\%23)|(#)/i"; sid:3000002; rev:1;)
```

### Systemd Service for IPS Mode

```ini
# /etc/systemd/system/suricata-ips.service

[Unit]
Description=Suricata IPS (Inline Mode)
After=network.target

[Service]
Type=simple
ExecStartPre=/sbin/iptables -I FORWARD -j NFQUEUE --queue-num 0
ExecStart=/usr/bin/suricata -c /etc/suricata/suricata.yaml -q 0 --pidfile /var/run/suricata.pid
ExecStopPost=/sbin/iptables -D FORWARD -j NFQUEUE --queue-num 0
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```

---

## Alert Management and SIEM Integration

### Barnyard2 (Snort to Database)

```bash
# Install Barnyard2
sudo apt install -y barnyard2

# Configure Barnyard2
sudo nano /etc/barnyard2.conf
```

```
# /etc/barnyard2.conf

config reference_file:      /etc/snort/reference.config
config classification_file: /etc/snort/classification.config
config gen_file:            /etc/snort/gen-msg.map
config sid_file:            /etc/snort/sid-msg.map

config hostname:   ids-sensor-01
config interface:  eth0
config waldo_file: /var/log/snort/barnyard2.waldo

# Log to MySQL
output database: log, mysql, user=snort password=snortpass dbname=snort host=localhost

# Log to syslog
output alert_syslog: LOG_AUTH LOG_ALERT

# Log to unified2 file
output unified2: filename merged.log, limit 128
```

### Elasticsearch Integration

```bash
# Install Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-amd64.deb
sudo dpkg -i filebeat-8.11.0-amd64.deb

# Configure Filebeat for Suricata
sudo nano /etc/filebeat/filebeat.yml
```

```yaml
# /etc/filebeat/filebeat.yml

filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/suricata/eve.json
  json.keys_under_root: true
  json.add_error_key: true
  fields:
    type: suricata

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "suricata-%{+yyyy.MM.dd}"

setup.template.name: "suricata"
setup.template.pattern: "suricata-*"

# Enable Suricata module
# sudo filebeat modules enable suricata
```

```bash
# Start Filebeat
sudo systemctl enable filebeat
sudo systemctl start filebeat

# View in Kibana (http://localhost:5601)
# Create index pattern: suricata-*
```

### Splunk Integration

```bash
# Install Splunk Universal Forwarder
wget -O splunkforwarder.tgz 'https://download.splunk.com/products/universalforwarder/releases/9.1.2/linux/splunkforwarder-9.1.2-<hash>-Linux-x86_64.tgz'
tar -xvzf splunkforwarder.tgz -C /opt
cd /opt/splunkforwarder/bin

# Configure forwarder
./splunk add forward-server splunk.example.com:9997
./splunk add monitor /var/log/suricata/eve.json -sourcetype suricata:json
./splunk start
```

---

## Monitoring Multiple Network Segments

### Multi-Interface Monitoring

```yaml
# /etc/suricata/suricata.yaml
# Monitor multiple VLANs

af-packet:
  - interface: eth0.10  # DMZ VLAN
    threads: 2
    cluster-id: 10
    cluster-type: cluster_flow
  
  - interface: eth0.20  # Internal VLAN
    threads: 2
    cluster-id: 20
    cluster-type: cluster_flow
  
  - interface: eth0.30  # Management VLAN
    threads: 1
    cluster-id: 30
    cluster-type: cluster_flow
```

### SPAN Port Configuration

```
Switch Configuration:
--------------------
# Cisco switch

! Create SPAN session
monitor session 1 source interface Gi1/0/1 - 24
monitor session 1 destination interface Gi1/0/48

# IDS sensor connects to Gi1/0/48 (receives all traffic)

# Linux equivalent (bridge mode)
sudo apt install bridge-utils

# Create bridge
sudo brctl addbr br0
sudo brctl addif br0 eth0
sudo brctl addif br0 eth1
sudo ip link set br0 up

# Run Suricata on bridge
sudo suricata -c /etc/suricata/suricata.yaml -i br0
```

---

## Performance Tuning

### Optimize Suricata Performance

```yaml
# /etc/suricata/suricata.yaml
# Performance optimizations

# Increase memory
stream:
  memcap: 1gb
  reassembly:
    memcap: 2gb
    depth: 2mb

# Increase threads
threading:
  set-cpu-affinity: yes
  cpu-affinity:
    - management-cpu-set:
        cpu: [ 0 ]
    - receive-cpu-set:
        cpu: [ 1, 2 ]
    - worker-cpu-set:
        cpu: [ 3, 4, 5, 6, 7, 8 ]

# Optimize packet capture
af-packet:
  - interface: eth0
    threads: auto  # Match number of queues
    cluster-id: 99
    cluster-type: cluster_qm  # PACKET_FANOUT_QM
    use-mmap: yes
    ring-size: 100000
```

### Monitor Performance

```bash
# Check Suricata stats
sudo suricatasc -c stats

# Check dropped packets
sudo suricatasc -c dump-counters | grep -E 'capture.(kernel_drops|kernel_packets)'

# Real-time stats
watch -n 1 'suricatasc -c uptime && suricatasc -c dump-counters | grep -E "capture.(kernel|decoder|flow)"'
```

---

## Automated Response

### Integrate with fail2ban

```ini
# /etc/fail2ban/filter.d/suricata.conf

[Definition]
failregex = ^\{"timestamp":"[^"]+","flow_id":\d+,"in_iface":"[^"]+","event_type":"alert".*"src_ip":"<HOST>".*"signature":"SSH Brute Force"

# /etc/fail2ban/jail.d/suricata.conf

[suricata]
enabled = true
filter = suricata
logpath = /var/log/suricata/eve.json
maxretry = 3
findtime = 600
bantime = 3600
action = iptables-allports[name=suricata]
```

### Custom Alert Response Script

```bash
#!/bin/bash
# /usr/local/bin/ids-response.sh

# Monitor Suricata alerts and respond
tail -F /var/log/suricata/eve.json | while read line; do
    EVENT_TYPE=$(echo $line | jq -r '.event_type')
    
    if [ "$EVENT_TYPE" == "alert" ]; then
        SRC_IP=$(echo $line | jq -r '.src_ip')
        SIGNATURE=$(echo $line | jq -r '.alert.signature')
        SEVERITY=$(echo $line | jq -r '.alert.severity')
        
        echo "[ALERT] $SIGNATURE from $SRC_IP (Severity: $SEVERITY)"
        
        # High severity = automatic block
        if [ "$SEVERITY" -eq 1 ]; then
            echo "Blocking $SRC_IP due to high severity alert"
            sudo iptables -A INPUT -s $SRC_IP -j DROP
            
            # Send notification
            echo "High severity IDS alert: $SIGNATURE from $SRC_IP" | \
                mail -s "IDS Alert" security@example.com
        fi
    fi
done
```

---

## Production Deployment

### Complete IDS Architecture

```
                    ┌─────────────┐
                    │  Internet   │
                    └──────┬──────┘
                           │
                  ┌────────▼────────┐
                  │ Border Firewall │
                  └────────┬────────┘
                           │
                    ┌──────▼──────┐
                    │   Switch    │
                    │ (SPAN port) │
                    └──┬───────┬──┘
                       │       │
          ┌────────────┘       └─────────────────┐
          │                                      │
   ┌──────▼──────┐                      ┌───────▼────────┐
   │ IDS Sensor  │                      │ Protected      │
   │ (Suricata)  │                      │ Network        │
   │             │                      │                │
   │ - Monitors  │                      │ - Web servers  │
   │   all       │                      │ - App servers  │
   │   traffic   │                      │ - Databases    │
   │             │                      │                │
   └──────┬──────┘                      └────────────────┘
          │
          │ Alerts
          │
   ┌──────▼──────────────┐
   │  SIEM Platform      │
   │  (ELK/Splunk)       │
   │                     │
   │  ┌──────────────┐   │
   │  │ Kibana/Web   │   │
   │  │ Dashboard    │   │
   │  └──────────────┘   │
   │                     │
   │  ┌──────────────┐   │
   │  │ Alerting     │   │
   │  │ Engine       │   │
   │  └──────────────┘   │
   └─────────────────────┘
```

### High Availability IDS

```bash
# /etc/keepalived/keepalived.conf
# Active/Passive IDS cluster

vrrp_instance IDS_HA {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    
    authentication {
        auth_type PASS
        auth_pass secretpass
    }
    
    virtual_ipaddress {
        10.0.0.100/24
    }
    
    track_script {
        chk_suricata
    }
}

vrrp_script chk_suricata {
    script "/usr/bin/systemctl is-active suricata"
    interval 2
    fall 2
    rise 2
}
```

---

## What's Next?

After implementing IDS/IPS:

**Advanced Threat Detection:**
- [fail2ban Setup](fail2ban-setup) - Automated response integration
- [Security Information and Event Management](../observability/README) - Centralized logging
- [Threat Intelligence](../security/README) - Threat feed integration

**Network Security:**
- [Firewall Basics](firewall-basics) - Firewall + IDS combination
- [Network Segmentation](network-segmentation) - IDS per segment
- [Zero Trust Principles](zero-trust-principles) - Microsegmentation

**Container Security:**
- [Container Security](container-security) - Falco runtime detection
- [Service Mesh Security](service-mesh-security) - Istio telemetry

---

## Additional Resources

### Official Documentation
- [Snort 3 Documentation](https://www.snort.org/snort3)
- [Suricata User Guide](https://suricata.readthedocs.io/)
- [Emerging Threats Rules](https://rules.emergingthreats.net/)

### Rule Management
- [PulledPork](https://github.com/shirkdog/pulledpork) - Snort rule management
- [Suricata-Update](https://suricata-update.readthedocs.io/) - Suricata rule updates

### SIEM Integration
- [ELK Stack](https://www.elastic.co/elastic-stack) - Elasticsearch, Logstash, Kibana
- [Splunk](https://www.splunk.com/) - Commercial SIEM
- [Wazuh](https://wazuh.com/) - Open source SIEM

### Threat Intelligence
- [AlienVault OTX](https://otx.alienvault.com/) - Open Threat Exchange
- [Abuse.ch](https://abuse.ch/) - Malware threat feeds
- [MISP](https://www.misp-project.org/) - Threat intelligence sharing platform

---

## Change Log

- **2026-01-30**: Initial creation - Comprehensive IDS/IPS guide covering Snort 3 and Suricata installation/configuration, signature-based and behavioral detection, IDS vs IPS deployment modes, custom rule creation, community ruleset management with PulledPork and suricata-update, inline prevention with NFQueue, multi-interface monitoring for segmented networks, SIEM integration (ELK, Splunk), alert management with Barnyard2, automated response with fail2ban integration, performance tuning for high-traffic networks, production architectures with SPAN ports and HA clustering, complete SOC workflows, and security operations best practices.

