# Command Line Essentials - Text Processing Power Tools

**Status**: Active  
**Last Updated**: 2026-01-30  
**Session**: KB Infrastructure Expansion  
**Category**: Basics  
**Prerequisites**: [linux-fundamentals](linux-fundamentals), [bash-scripting](bash-scripting)  
**Tags**: grep, awk, sed, find, pipes, redirection, text-processing, command-line

## Summary

Master essential command-line tools for text processing, searching, and data manipulation. Covers grep (pattern matching), awk (data extraction), sed (stream editing), find (file discovery), pipes, and redirection - the core Unix philosophy in action.

## Context

Unix's power comes from combining simple tools that do one thing well. This tutorial teaches the essential text-processing commands that system administrators, developers, and DevOps engineers use daily. These tools process log files, extract data, transform text, and automate workflows.

**What You'll Learn**:
- Find text with grep (pattern matching)
- Extract columns with awk (data processing)
- Transform text with sed (stream editing)
- Locate files with find (file system search)
- Combine tools with pipes (`|`)
- Redirect input/output (`>`, `>>`, `<`, `2>`)
- Build real-world one-liners

**Time Investment**: 8-12 hours for basics, weeks to master  
**Difficulty**: `[█████░░░░░]` 50% - Practice makes perfect  
**Prerequisites**: Linux basics, bash fundamentals

## Implementation

### 🔍 grep - Search for Patterns

**Basic Pattern Matching**:

```bash
# Find lines containing "error" in a file
grep "error" /var/log/syslog

# Case-insensitive search
grep -i "error" /var/log/syslog

# Count matches
grep -c "error" /var/log/syslog

# Show line numbers
grep -n "error" /var/log/syslog

# Invert match (lines NOT containing pattern)
grep -v "info" /var/log/syslog
```

**Recursive Search**:
```bash
# Search all files in directory
grep -r "TODO" /path/to/project

# Search specific file types
grep -r --include="*.js" "function" .

# Exclude directories
grep -r --exclude-dir=node_modules "import" .
```

**Regular Expressions**:
```bash
# Lines starting with "Error"
grep "^Error" logfile.txt

# Lines ending with "failed"
grep "failed$" logfile.txt

# Lines containing numbers
grep "[0-9]" file.txt

# Email addresses
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" file.txt

# IP addresses
grep -E "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" file.txt
```

**Context Lines**:
```bash
# Show 3 lines after match
grep -A 3 "error" logfile.txt

# Show 3 lines before match
grep -B 3 "error" logfile.txt

# Show 3 lines before AND after
grep -C 3 "error" logfile.txt
```

**Real Example - Find Failed Logins**:
```bash
# Find failed SSH attempts
grep "Failed password" /var/log/auth.log

# With user and IP
grep "Failed password" /var/log/auth.log | grep -oE "from [0-9.]+ "

# Count attempts per IP
grep "Failed password" /var/log/auth.log | \
    grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" | \
    sort | uniq -c | sort -rn
```

---

### ✂️ awk - Extract and Process Data

**Basic Field Extraction**:

```bash
# Print first column
echo "one two three" | awk '{print $1}'
# Output: one

# Print multiple columns
echo "one two three" | awk '{print $1, $3}'
# Output: one three

# Print last column
echo "one two three" | awk '{print $NF}'
# Output: three

# Print all columns
awk '{print $0}' file.txt
```

**Field Separators**:
```bash
# Default separator is whitespace
ps aux | awk '{print $1, $11}'

# Custom separator (colon)
awk -F: '{print $1, $3}' /etc/passwd

# Multiple separators
awk -F'[,:]' '{print $1, $2}' file.txt
```

**Pattern Matching**:
```bash
# Only lines containing "root"
awk '/root/ {print $0}' /etc/passwd

# Lines NOT containing "nologin"
awk '!/nologin/ {print $0}' /etc/passwd

# Lines where column 3 > 1000
awk -F: '$3 > 1000 {print $1, $3}' /etc/passwd
```

**Calculations**:
```bash
# Sum column 3
awk '{sum += $3} END {print sum}' file.txt

# Average
awk '{sum += $1; count++} END {print sum/count}' numbers.txt

# Count lines
awk 'END {print NR}' file.txt

# Count non-empty lines
awk 'NF > 0 {count++} END {print count}' file.txt
```

**Built-in Variables**:
```
$0     # Entire line
$1-$N  # Column number
NF     # Number of fields
NR     # Current line number
FS     # Field separator
```

**Real Example - Parse Apache Log**:
```bash
# Extract IP, status code, bytes
awk '{print $1, $9, $10}' /var/log/apache2/access.log

# Count requests per IP
awk '{print $1}' /var/log/apache2/access.log | \
    sort | uniq -c | sort -rn | head -10

# Sum bytes transferred
awk '{sum += $10} END {print sum/1024/1024 " MB"}' \
    /var/log/apache2/access.log

# 404 errors only
awk '$9 == 404 {print $7}' /var/log/apache2/access.log

# Traffic by hour
awk '{print $4}' /var/log/apache2/access.log | \
    cut -d: -f2 | sort | uniq -c
```

---

### 🔄 sed - Stream Editor

**Basic Substitution**:

```bash
# Replace first occurrence on each line
sed 's/old/new/' file.txt

# Replace all occurrences (global)
sed 's/old/new/g' file.txt

# Replace case-insensitive
sed 's/old/new/gi' file.txt

# Replace only on lines containing "pattern"
sed '/pattern/ s/old/new/g' file.txt
```

**Line Operations**:
```bash
# Delete lines containing "pattern"
sed '/pattern/d' file.txt

# Delete lines 5-10
sed '5,10d' file.txt

# Print only lines 20-30
sed -n '20,30p' file.txt

# Print lines containing "error"
sed -n '/error/p' file.txt
```

**Insert/Append/Change**:
```bash
# Insert line before pattern
sed '/pattern/i\New line before' file.txt

# Append line after pattern
sed '/pattern/a\New line after' file.txt

# Replace entire line
sed '/pattern/c\Replacement line' file.txt

# Insert at line 5
sed '5i\New line' file.txt
```

**In-Place Editing**:
```bash
# Edit file in place (dangerous!)
sed -i 's/old/new/g' file.txt

# With backup
sed -i.bak 's/old/new/g' file.txt
```

**Real Example - Config File Editing**:
```bash
# Change port in config
sed -i 's/^Port 22$/Port 2222/' /etc/ssh/sshd_config

# Uncomment line
sed -i 's/^#\(PermitRootLogin\)/\1/' /etc/ssh/sshd_config

# Add line after pattern
sed -i '/\[mysqld\]/a max_connections = 200' /etc/mysql/my.cnf

# Remove comments and blank lines
sed '/^#/d; /^$/d' config.conf
```

---

### 🗂️ find - Locate Files and Directories

**Basic File Search**:

```bash
# Find all .txt files
find /path -name "*.txt"

# Case-insensitive
find /path -iname "*.TXT"

# Find directories only
find /path -type d -name "logs"

# Find files only
find /path -type f -name "*.log"

# Find symlinks
find /path -type l
```

**Size-Based Search**:
```bash
# Files larger than 100MB
find /var/log -type f -size +100M

# Files smaller than 1KB
find /tmp -type f -size -1k

# Files exactly 50MB
find . -type f -size 50M

# Empty files
find /tmp -type f -empty
```

**Time-Based Search**:
```bash
# Modified in last 7 days
find /var/log -type f -mtime -7

# Modified more than 30 days ago
find /tmp -type f -mtime +30

# Accessed in last 24 hours
find . -type f -atime -1

# Changed in last hour
find /var/log -type f -cmin -60
```

**Permission-Based**:
```bash
# Find setuid files
find / -perm -4000 2>/dev/null

# World-writable directories
find / -type d -perm -002 2>/dev/null

# Files not owned by root
find /etc -not -user root

# Executable files
find . -type f -executable
```

**Executing Commands**:
```bash
# Delete old files
find /tmp -type f -mtime +7 -delete

# Change permissions
find /var/www -type d -exec chmod 755 {} \;
find /var/www -type f -exec chmod 644 {} \;

# Move files
find . -name "*.bak" -exec mv {} /backup/ \;

# Compress old logs
find /var/log -name "*.log" -mtime +30 -exec gzip {} \;

# Show file details
find . -name "*.conf" -exec ls -lh {} \;
```

**Real Example - Cleanup Old Files**:
```bash
# Find and delete logs older than 90 days
find /var/log -name "*.log.gz" -mtime +90 -delete

# Find large files in home directories
find /home -type f -size +1G -exec du -h {} \; | sort -rh

# Find recently modified config files
find /etc -name "*.conf" -mtime -1 -ls

# Remove empty directories
find /tmp -type d -empty -delete

# Find files with suspicious permissions
find / -type f \( -perm -4000 -o -perm -2000 \) -ls 2>/dev/null
```

---

### 🔀 Pipes and Redirection

**Pipes `|`** - Connect commands:

```bash
# Chain commands
ps aux | grep nginx | awk '{print $2}'

# Multi-stage pipeline
cat /var/log/syslog | \
    grep "error" | \
    awk '{print $5}' | \
    sort | \
    uniq -c | \
    sort -rn | \
    head -10
```

**Output Redirection `>` and `>>`**:
```bash
# Overwrite file
echo "Hello" > file.txt

# Append to file
echo "World" >> file.txt

# Redirect command output
ls -la > directory_listing.txt

# Redirect stderr to file
command 2> error.log

# Redirect both stdout and stderr
command > output.log 2>&1

# Redirect stdout and stderr separately
command > output.log 2> error.log

# Discard output
command > /dev/null 2>&1
```

**Input Redirection `<`**:
```bash
# Read from file
sort < unsorted.txt

# Feed file to command
mysql dbname < backup.sql

# Here document
cat << EOF > config.txt
setting1=value1
setting2=value2
EOF

# Here string
grep "pattern" <<< "test pattern matching"
```

**Advanced Redirection**:
```bash
# Tee - write to file AND stdout
command | tee output.txt

# Append with tee
command | tee -a output.txt

# Multiple outputs
command | tee file1.txt file2.txt

# Process substitution
diff <(sort file1.txt) <(sort file2.txt)

# Read from command output
while read line; do
    echo "Processing: $line"
done < <(find . -name "*.txt")
```

---

### 💡 Real-World One-Liners

**System Administration**:

```bash
# Top 10 memory-consuming processes
ps aux | sort -rnk 4 | head -10

# Disk usage by directory (top 10)
du -sh /* 2>/dev/null | sort -rh | head -10

# Count connections per IP
netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn

# Find largest files in /var
find /var -type f -exec du -h {} \; | sort -rh | head -20

# Check which user is using most space
du -sh /home/* | sort -rh

# Monitor log in real-time
tail -f /var/log/syslog | grep --line-buffered "error"
```

**Log Analysis**:

```bash
# Extract unique IPs from log
awk '{print $1}' /var/log/apache2/access.log | sort -u

# Count HTTP status codes
awk '{print $9}' /var/log/apache2/access.log | sort | uniq -c

# Top 10 URLs
awk '{print $7}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -10

# Requests per hour
awk '{print $4}' /var/log/apache2/access.log | cut -d: -f2 | sort | uniq -c

# Find all errors in last hour
find /var/log -type f -name "*.log" -mmin -60 -exec grep -H "ERROR" {} \;

# Parse JSON logs
cat app.log | jq -r '.level + " " + .message' | grep ERROR
```

**Text Processing**:

```bash
# Remove duplicate lines (keeping order)
awk '!seen[$0]++' file.txt

# Remove duplicate lines (sorted)
sort -u file.txt

# Count word frequency
tr -cs 'A-Za-z' '\n' < file.txt | sort | uniq -c | sort -rn

# Convert CSV to TSV
sed 's/,/\t/g' file.csv > file.tsv

# Extract email addresses
grep -oE "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" file.txt

# Remove trailing whitespace
sed 's/[[:space:]]*$//' file.txt
```

**File Operations**:

```bash
# Rename all .txt to .md
find . -name "*.txt" -exec sh -c 'mv "$1" "${1%.txt}.md"' _ {} \;

# Make all scripts executable
find . -name "*.sh" -exec chmod +x {} \;

# Find files modified today
find . -type f -mtime 0

# Copy recent backups
find /backup -name "*.tar.gz" -mtime -7 -exec cp {} /mnt/offsite/ \;

# Count files by extension
find . -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
```

**Network & Security**:

```bash
# Check listening ports
netstat -tulpn | grep LISTEN

# Failed login attempts with IPs
grep "Failed password" /var/log/auth.log | \
    awk '{print $(NF-3)}' | sort | uniq -c | sort -rn

# Block IPs with >10 failed attempts
awk '/Failed password/ {print $(NF-3)}' /var/log/auth.log | \
    sort | uniq -c | awk '$1 > 10 {print $2}' | \
    while read ip; do
        iptables -A INPUT -s $ip -j DROP
    done

# Find files owned by deleted user
find / -nouser -ls 2>/dev/null

# Monitor bandwidth per process
nethogs

# Active connections summary
ss -s
```

---

### 🛠️ Combining Tools - Real Examples

**Example 1: Log Rotation Script**

```bash
#!/bin/bash
# Compress and archive old logs

LOG_DIR="/var/log/myapp"
ARCHIVE_DIR="/var/log/archive"

# Find logs older than 7 days and compress
find "$LOG_DIR" -name "*.log" -mtime +7 | while read log; do
    gzip "$log"
    mv "${log}.gz" "$ARCHIVE_DIR/"
done

# Delete archives older than 90 days
find "$ARCHIVE_DIR" -name "*.gz" -mtime +90 -delete

echo "Log rotation completed: $(date)"
```

**Example 2: Server Health Check**

```bash
#!/bin/bash
# Check server health and alert if issues found

ALERT_FILE="/tmp/health_alert.txt"

# Check CPU
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | cut -d. -f1)
if [ "$CPU_LOAD" -gt 4 ]; then
    echo "HIGH CPU: Load average is $CPU_LOAD" >> "$ALERT_FILE"
fi

# Check disk
df -h | awk '$5 > 90 {print "DISK WARNING: " $6 " is at " $5}' >> "$ALERT_FILE"

# Check memory
MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USED" -gt 90 ]; then
    echo "MEMORY WARNING: ${MEM_USED}% used" >> "$ALERT_FILE"
fi

# Check failed logins
FAILED_LOGINS=$(grep -c "Failed password" /var/log/auth.log)
if [ "$FAILED_LOGINS" -gt 50 ]; then
    echo "SECURITY: $FAILED_LOGINS failed login attempts" >> "$ALERT_FILE"
fi

# Send alert if any issues found
if [ -f "$ALERT_FILE" ]; then
    cat "$ALERT_FILE" | mail -s "Server Health Alert" admin@example.com
    rm "$ALERT_FILE"
fi
```

**Example 3: User Activity Report**

```bash
#!/bin/bash
# Generate user activity report

echo "=== User Activity Report ===" > report.txt
echo "Generated: $(date)" >> report.txt
echo "" >> report.txt

# Currently logged in
echo "Currently Logged In:" >> report.txt
who | awk '{print $1}' | sort -u >> report.txt
echo "" >> report.txt

# Last logins
echo "Last 10 Logins:" >> report.txt
last -n 10 | awk '{print $1, $3, $5, $6, $7}' >> report.txt
echo "" >> report.txt

# Disk usage by user
echo "Disk Usage by User (>1GB):" >> report.txt
du -sh /home/* | awk '$1 ~ /G$/ {print}' >> report.txt

cat report.txt
```

---

## Next Steps

**Practice Exercises**:

1. **Log Parser**: Extract all ERROR entries from a log with timestamp and message
2. **File Renamer**: Batch rename files using patterns
3. **Disk Analyzer**: Find files taking up most space in each directory
4. **Config Validator**: Check config files for specific required settings
5. **Report Generator**: Create system health report with multiple metrics

**Further Learning**:
- **[bash-scripting](bash-scripting)** - Combine these tools in scripts
- **[linux-fundamentals](linux-fundamentals)** - Deeper system understanding
- **[kb/observability/log-aggregation](../observability/log-aggregation)** - Professional log management
- **[kb/sysadmin/performance-tools](../sysadmin/performance-tools)** - System performance analysis

**Advanced Topics** (Future):
- Regular expressions mastery
- Advanced awk programming
- GNU parallel for faster processing
- jq for JSON processing
- xmlstarlet for XML processing
- cut, tr, paste, join utilities

## Community Resources

### 📚 Official Documentation
- [GNU grep Manual](https://www.gnu.org/software/grep/manual/) - Complete grep reference
- [GNU awk Manual](https://www.gnu.org/software/gawk/manual/) - Comprehensive awk guide
- [GNU sed Manual](https://www.gnu.org/software/sed/manual/) - Stream editor documentation

### 🎓 Tutorials & Guides
- **Beginner**: [Grymoire sed Tutorial](https://www.grymoire.com/Unix/Sed.html) - Excellent sed introduction
- **Intermediate**: [AWK Tutorial](https://www.grymoire.com/Unix/Awk.html) - From basics to advanced
- **Advanced**: [The AWK Programming Language](http://awk.dev/) - Comprehensive resource

### 📺 Video Resources
- **Beginner**: [grep, awk, sed Crash Course](https://www.youtube.com/watch?v=hJzqEAf2U4I)
- **Intermediate**: [Advanced Text Processing](https://www.youtube.com/watch?v=j74wL5IfbOM)
- **Advanced**: [Shell One-Liners Explained](https://www.youtube.com/watch?v=0zaYJWz1C8I)

### 📖 Books
- **Beginner**: "The Linux Command Line" by William Shotts
- **Intermediate**: "sed & awk" by Dale Dougherty
- **Advanced**: "Unix Power Tools" by Shelley Powers

### 🛠️ Tools & References
- **ShellCheck** - Lint your shell scripts
- **explain shell** - https://explainshell.com/ - Explains shell commands
- **Command Line Fu** - https://www.commandlinefu.com/ - Share one-liners

## Sources

- GNU grep Manual - https://www.gnu.org/software/grep/manual/
- GNU awk Manual - https://www.gnu.org/software/gawk/manual/
- GNU sed Manual - https://www.gnu.org/software/sed/manual/
- Grymoire Unix Tutorials - https://www.grymoire.com/Unix/
- The AWK Programming Language - Aho, Weinberger, Kernighan
- Linux Documentation Project - https://tldp.org/

## Change Log

### 2026-01-30
- Initial creation with comprehensive command-line essentials
- Covered grep, awk, sed, find in depth with examples
- Added pipes, redirection, and real-world one-liners
- Included system administration examples
- Provided log analysis patterns
- Added complete file operations guide
- Included security/network examples
- Added real combined examples (scripts)
- Organized community resources by skill level

---

**⚡ Master This**: Command-line text processing is the foundation of Unix mastery. These tools process millions of lines in seconds, transform data effortlessly, and automate tedious tasks. Build your one-liner collection!

