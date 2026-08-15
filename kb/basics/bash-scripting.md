# Bash Scripting Fundamentals

**Status**: Active  
**Last Updated**: 2026-01-30  
**Session**: KB Infrastructure Expansion  
**Category**: Basics  
**Prerequisites**: [linux-fundamentals](linux-fundamentals), [command-line-essentials](command-line-essentials), [ssh-basics](ssh-basics)  
**Tags**: bash, shell-scripting, automation, programming, linux

## Summary

Complete introduction to Bash shell scripting from absolute zero, covering script structure, variables, control flow, functions, error handling, and automation patterns. Assumes basic Linux command-line knowledge but no prior programming experience.

## Context

Shell scripting is the glue that holds Linux systems together. While individual commands are powerful, **scripts automate repetitive tasks, orchestrate complex workflows, and make systems manageable at scale**. Bash (Bourne Again SHell) is the default shell on most Linux systems, making it the lingua franca of system administration.

**What You'll Learn**:
- Write executable shell scripts from scratch
- Use variables, loops, and conditional logic
- Create reusable functions
- Handle errors gracefully
- Read user input and process command-line arguments
- Build real automation tools

**Time Investment**: 6-8 hours for basics, 20+ hours to become proficient  
**Difficulty**: `[████░░░░░░]` 40% - Programming concepts introduced gradually  
**Prerequisites**: Command-line comfort, text editor proficiency

## Implementation

### 🚀 Your First Shell Script

**The Shebang Line**:
Every script starts with `#!` (shebang) telling the system which interpreter to use.

```bash
#!/bin/bash
# my-first-script.sh
echo "Hello from a shell script!"
```

**Making It Executable**:
```bash
# Save the script as my-first-script.sh
chmod +x my-first-script.sh

# Run it
./my-first-script.sh
```

**Output**:
```
Hello from a shell script!
```

**Why `./` ?**: The dot-slash tells Bash to look in the current directory. Without it, Bash searches only `$PATH` directories.

---

### 📦 Variables - Storing Data

**Basic Variable Assignment**:
```bash
#!/bin/bash
# variables-demo.sh

# String variable (no spaces around =)
NAME="Alice"
echo "Hello, $NAME"

# Integer variable
COUNT=42
echo "The answer is $COUNT"

# Command output as variable
CURRENT_DIR=$(pwd)
echo "You are in: $CURRENT_DIR"

# Alternative syntax (older, still valid)
OLD_SYNTAX=`date`
echo "Date: $OLD_SYNTAX"
```

**Output**:
```
Hello, Alice
The answer is 42
You are in: /home/alice/scripts
Date: Thu Jan 30 14:23:19 PST 2026
```

**⚠️ Common Mistakes**:
```bash
# WRONG - spaces around =
NAME = "Alice"    # Error: command not found

# WRONG - forgetting $ for variable access
echo "Hello, NAME"    # Prints: Hello, NAME

# RIGHT
NAME="Alice"
echo "Hello, $NAME"   # Prints: Hello, Alice
```

**Variable Naming Rules**:
- Use UPPERCASE for constants: `MAX_RETRIES=3`
- Use lowercase for local variables: `temp_file=/tmp/data`
- Use underscores for readability: `user_count` not `usercount`
- Start with letter or underscore, not number: `_var` ✓, `2var` ✗

---

### 🔒 Quoting - Protecting Your Data

**Three Quoting Types**:

```bash
#!/bin/bash
# quoting-demo.sh

NAME="World"
COUNT=5

# Double quotes: Variables expanded
echo "Hello $NAME, count is $COUNT"
# Output: Hello World, count is 5

# Single quotes: Everything literal
echo 'Hello $NAME, count is $COUNT'
# Output: Hello $NAME, count is $COUNT

# No quotes: Word splitting on spaces
FILES="file1.txt file2.txt file3.txt"
echo $FILES
# Output: file1.txt file2.txt file3.txt

echo "$FILES"
# Output: file1.txt file2.txt file3.txt (same line)
```

**When to Use Each**:
- **Double quotes `""`**: Default choice, allows variable expansion
- **Single quotes `''`**: When you need literal text (passwords, regex)
- **No quotes**: Only when you want word splitting (rare)

**Real Example - File Paths with Spaces**:
```bash
#!/bin/bash
# handle-spaces.sh

FILE="My Document.txt"

# WRONG - splits on space
cat $FILE
# Error: cat: My: No such file or directory

# RIGHT - quotes prevent splitting
cat "$FILE"
# Works!
```

---

### 📥 Reading User Input

**Interactive Scripts**:

```bash
#!/bin/bash
# greeting.sh - Interactive greeting script

echo "What is your name?"
read NAME

echo "What is your favorite color?"
read COLOR

echo "Hello $NAME! I like $COLOR too!"
```

**Run Example**:
```
$ ./greeting.sh
What is your name?
Alice
What is your favorite color?
blue
Hello Alice! I like blue too!
```

**Reading with Prompt (Cleaner)**:
```bash
#!/bin/bash
# greeting-clean.sh

read -p "What is your name? " NAME
read -p "What is your favorite color? " COLOR

echo "Hello $NAME! I like $COLOR too!"
```

**Reading Passwords (Hidden Input)**:
```bash
#!/bin/bash
# password-demo.sh

read -sp "Enter password: " PASSWORD
echo ""  # New line after hidden input
echo "Password has ${#PASSWORD} characters"
```

---

### 🔁 Loops - Doing Things Repeatedly

**For Loops**:

```bash
#!/bin/bash
# for-loop-demo.sh

# Loop over a list
echo "Counting to 5:"
for i in 1 2 3 4 5; do
    echo "Number: $i"
done

# Loop over files
echo -e "\nFiles in current directory:"
for file in *.txt; do
    echo "Found: $file"
done

# C-style for loop
echo -e "\nC-style loop:"
for ((i=1; i<=5; i++)); do
    echo "Iteration $i"
done
```

**While Loops**:

```bash
#!/bin/bash
# while-loop-demo.sh

# While with counter
COUNT=1
while [ $COUNT -le 5 ]; do
    echo "Count: $COUNT"
    COUNT=$((COUNT + 1))
done

# Reading file line by line
while IFS= read -r line; do
    echo "Line: $line"
done < /etc/hostname
```

**Until Loops** (runs until condition is true):

```bash
#!/bin/bash
# until-demo.sh

COUNT=1
until [ $COUNT -gt 5 ]; do
    echo "Count: $COUNT"
    COUNT=$((COUNT + 1))
done
```

---

### ❓ Conditional Logic - Making Decisions

**If Statements**:

```bash
#!/bin/bash
# if-demo.sh

read -p "Enter a number: " NUM

if [ $NUM -gt 10 ]; then
    echo "$NUM is greater than 10"
elif [ $NUM -eq 10 ]; then
    echo "$NUM is exactly 10"
else
    echo "$NUM is less than 10"
fi
```

**Test Operators**:

**Numeric Comparisons**:
```bash
[ $A -eq $B ]    # Equal
[ $A -ne $B ]    # Not equal
[ $A -gt $B ]    # Greater than
[ $A -ge $B ]    # Greater than or equal
[ $A -lt $B ]    # Less than
[ $A -le $B ]    # Less than or equal
```

**String Comparisons**:
```bash
[ "$A" = "$B" ]     # Equal (note the quotes!)
[ "$A" != "$B" ]    # Not equal
[ -z "$A" ]         # String is empty
[ -n "$A" ]         # String is not empty
```

**File Tests**:
```bash
[ -f /path/to/file ]    # File exists and is regular file
[ -d /path/to/dir ]     # Directory exists
[ -r /path/to/file ]    # File is readable
[ -w /path/to/file ]    # File is writable
[ -x /path/to/file ]    # File is executable
[ -e /path/to/file ]    # File exists (any type)
```

**Combining Conditions**:
```bash
# AND
if [ $NUM -gt 0 ] && [ $NUM -lt 10 ]; then
    echo "Between 0 and 10"
fi

# OR
if [ $NUM -eq 0 ] || [ $NUM -eq 10 ]; then
    echo "0 or 10"
fi

# NOT
if [ ! -f /tmp/lock ]; then
    echo "Lock file doesn't exist"
fi
```

**Real Example - Backup Script**:
```bash
#!/bin/bash
# backup-check.sh

BACKUP_DIR="/backup"
SPACE_NEEDED=1000000  # 1GB in KB

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory doesn't exist"
    exit 1
fi

if [ ! -w "$BACKUP_DIR" ]; then
    echo "Error: Cannot write to backup directory"
    exit 1
fi

SPACE_AVAIL=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')

if [ $SPACE_AVAIL -lt $SPACE_NEEDED ]; then
    echo "Error: Not enough disk space"
    echo "Need: $SPACE_NEEDED KB, Available: $SPACE_AVAIL KB"
    exit 1
fi

echo "All checks passed! Starting backup..."
```

---

### 🎯 Case Statements - Multi-Way Branching

**Cleaner than Multiple If/Elif**:

```bash
#!/bin/bash
# case-demo.sh

read -p "Enter command (start|stop|restart|status): " CMD

case $CMD in
    start)
        echo "Starting service..."
        ;;
    stop)
        echo "Stopping service..."
        ;;
    restart)
        echo "Restarting service..."
        ;;
    status)
        echo "Checking status..."
        ;;
    *)
        echo "Unknown command: $CMD"
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
```

**Pattern Matching**:
```bash
#!/bin/bash
# file-type.sh

read -p "Enter filename: " FILE

case $FILE in
    *.txt)
        echo "Text file"
        ;;
    *.jpg|*.png|*.gif)
        echo "Image file"
        ;;
    *.sh)
        echo "Shell script"
        ;;
    *)
        echo "Unknown file type"
        ;;
esac
```

---

### 🔧 Functions - Reusable Code Blocks

**Basic Function Syntax**:

```bash
#!/bin/bash
# functions-demo.sh

# Define function
greet() {
    echo "Hello from a function!"
}

# Call function
greet
```

**Functions with Arguments**:

```bash
#!/bin/bash
# function-args.sh

greet_user() {
    local NAME=$1    # First argument
    local AGE=$2     # Second argument
    echo "Hello $NAME, you are $AGE years old"
}

# Call with arguments
greet_user "Alice" 25
greet_user "Bob" 30
```

**Arguments Explained**:
```
$0    # Script name
$1    # First argument
$2    # Second argument
$#    # Number of arguments
$@    # All arguments as separate words
$*    # All arguments as single string
```

**Functions with Return Values**:

```bash
#!/bin/bash
# function-return.sh

# Return numeric exit code (0-255)
is_root() {
    if [ $(id -u) -eq 0 ]; then
        return 0  # Success (true)
    else
        return 1  # Failure (false)
    fi
}

# Use return value
if is_root; then
    echo "You are root"
else
    echo "You are not root"
fi

# Return string (use echo + command substitution)
get_timestamp() {
    echo $(date +%Y%m%d_%H%M%S)
}

TIMESTAMP=$(get_timestamp)
echo "Timestamp: $TIMESTAMP"
```

**Real Example - File Backup Function**:

```bash
#!/bin/bash
# backup-functions.sh

backup_file() {
    local SOURCE=$1
    local BACKUP_DIR=$2
    
    # Validate arguments
    if [ $# -ne 2 ]; then
        echo "Usage: backup_file <source> <backup_dir>"
        return 1
    fi
    
    # Check source exists
    if [ ! -f "$SOURCE" ]; then
        echo "Error: Source file doesn't exist: $SOURCE"
        return 1
    fi
    
    # Create backup directory if needed
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamped backup
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local BASENAME=$(basename "$SOURCE")
    local BACKUP_FILE="$BACKUP_DIR/${BASENAME}.${TIMESTAMP}.bak"
    
    cp "$SOURCE" "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "Backup created: $BACKUP_FILE"
        return 0
    else
        echo "Error: Backup failed"
        return 1
    fi
}

# Use the function
backup_file "/etc/hosts" "/backup/config"
backup_file "$HOME/.bashrc" "/backup/dotfiles"
```

---

### ⚠️ Error Handling - Robust Scripts

**Exit Codes**:
Every command returns an exit code:
- `0` = Success
- `1-255` = Error

```bash
#!/bin/bash
# exit-codes.sh

ls /nonexistent 2>/dev/null

if [ $? -eq 0 ]; then
    echo "Command succeeded"
else
    echo "Command failed with exit code: $?"
fi
```

**Set Options for Safety**:

```bash
#!/bin/bash
# safe-script.sh

set -e    # Exit immediately if any command fails
set -u    # Exit if undefined variable used
set -o pipefail    # Fail if any command in pipeline fails

# Now script stops on first error
mkdir /tmp/test
cd /tmp/test
touch file1.txt
```

**Best Practice Template**:

```bash
#!/bin/bash
#
# Script: system-check.sh
# Description: Check system health
# Usage: ./system-check.sh
#

set -euo pipefail    # Strict error handling

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/system-check.log"
readonly MAX_LOAD=4.0

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Cleanup on exit
cleanup() {
    log "Cleaning up..."
    # Remove temp files, etc.
}

trap cleanup EXIT    # Run cleanup on script exit

# Main logic
main() {
    log "Starting system check..."
    
    # Check if root
    if [ $(id -u) -ne 0 ]; then
        error_exit "Must run as root"
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 90 ]; then
        error_exit "Disk usage critical: ${DISK_USAGE}%"
    fi
    log "Disk usage OK: ${DISK_USAGE}%"
    
    # Check load average
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    log "Current load: $LOAD"
    
    log "System check completed successfully"
}

# Run main function
main "$@"
```

---

### 🎨 Real-World Script Examples

**Example 1: Automated Deployment Script**

```bash
#!/bin/bash
# deploy.sh - Deploy web application

set -euo pipefail

readonly APP_NAME="myapp"
readonly APP_DIR="/var/www/$APP_NAME"
readonly BACKUP_DIR="/backup/$APP_NAME"
readonly GIT_REPO="https://github.com/user/$APP_NAME.git"
readonly SERVICE_NAME="${APP_NAME}.service"

log() {
    echo "[$(date +'%H:%M:%S')] $*"
}

backup_current() {
    log "Creating backup..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/backup_${timestamp}.tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    tar -czf "$backup_path" -C "$APP_DIR" .
    
    log "Backup created: $backup_path"
}

deploy_new_version() {
    log "Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
    
    log "Installing dependencies..."
    npm install --production
    
    log "Building application..."
    npm run build
}

restart_service() {
    log "Restarting service..."
    sudo systemctl restart "$SERVICE_NAME"
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log "Service restarted successfully"
    else
        log "ERROR: Service failed to start!"
        return 1
    fi
}

main() {
    log "Starting deployment of $APP_NAME"
    
    backup_current
    deploy_new_version
    restart_service
    
    log "Deployment completed successfully!"
}

main "$@"
```

**Example 2: System Monitoring Script**

```bash
#!/bin/bash
# monitor.sh - Monitor system resources

set -euo pipefail

readonly ALERT_EMAIL="admin@example.com"
readonly CPU_THRESHOLD=80
readonly MEM_THRESHOLD=85
readonly DISK_THRESHOLD=90

check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local cpu_int=${cpu_usage%.*}
    
    if [ $cpu_int -gt $CPU_THRESHOLD ]; then
        echo "ALERT: CPU usage at ${cpu_usage}%"
        return 1
    fi
    echo "CPU OK: ${cpu_usage}%"
    return 0
}

check_memory() {
    local mem_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    
    if [ $mem_usage -gt $MEM_THRESHOLD ]; then
        echo "ALERT: Memory usage at ${mem_usage}%"
        return 1
    fi
    echo "Memory OK: ${mem_usage}%"
    return 0
}

check_disk() {
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $disk_usage -gt $DISK_THRESHOLD ]; then
        echo "ALERT: Disk usage at ${disk_usage}%"
        return 1
    fi
    echo "Disk OK: ${disk_usage}%"
    return 0
}

send_alert() {
    local message=$1
    echo "$message" | mail -s "System Alert" "$ALERT_EMAIL"
}

main() {
    local alerts=""
    
    if ! check_cpu; then
        alerts="${alerts}\n$(check_cpu)"
    fi
    
    if ! check_memory; then
        alerts="${alerts}\n$(check_memory)"
    fi
    
    if ! check_disk; then
        alerts="${alerts}\n$(check_disk)"
    fi
    
    if [ -n "$alerts" ]; then
        send_alert "$alerts"
    fi
}

main "$@"
```

**Example 3: User Management Script**

```bash
#!/bin/bash
# user-manager.sh - Create users with SSH keys

set -euo pipefail

create_user() {
    local username=$1
    local ssh_key=$2
    
    # Check if user exists
    if id "$username" &>/dev/null; then
        echo "User $username already exists"
        return 1
    fi
    
    # Create user
    echo "Creating user: $username"
    sudo useradd -m -s /bin/bash "$username"
    
    # Setup SSH directory
    local ssh_dir="/home/${username}/.ssh"
    sudo mkdir -p "$ssh_dir"
    
    # Add SSH key
    echo "$ssh_key" | sudo tee "${ssh_dir}/authorized_keys" > /dev/null
    
    # Set permissions
    sudo chown -R "${username}:${username}" "$ssh_dir"
    sudo chmod 700 "$ssh_dir"
    sudo chmod 600 "${ssh_dir}/authorized_keys"
    
    echo "User $username created successfully"
}

main() {
    if [ $# -ne 2 ]; then
        echo "Usage: $0 <username> <ssh_public_key>"
        exit 1
    fi
    
    create_user "$1" "$2"
}

main "$@"
```

---

### 📝 Shell Scripting Best Practices

**1. Always Use Shebang**:
```bash
#!/bin/bash
# Not #!/bin/sh (might not be bash)
```

**2. Quote Variables**:
```bash
# WRONG
if [ $VAR = "value" ]; then

# RIGHT
if [ "$VAR" = "value" ]; then
```

**3. Use `readonly` for Constants**:
```bash
readonly MAX_RETRIES=3
readonly CONFIG_FILE="/etc/app.conf"
```

**4. Use `local` in Functions**:
```bash
my_function() {
    local temp_var="value"    # Won't affect global scope
}
```

**5. Check Command Success**:
```bash
if ! command_that_might_fail; then
    echo "Command failed"
    exit 1
fi
```

**6. Use Meaningful Variable Names**:
```bash
# POOR
a=5
x="file"

# GOOD
retry_count=5
config_file="app.conf"
```

**7. Add Comments for Complex Logic**:
```bash
# Calculate disk usage percentage and alert if over 90%
disk_pct=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
```

**8. Handle Signals Gracefully**:
```bash
cleanup() {
    rm -f /tmp/lockfile
}
trap cleanup EXIT SIGINT SIGTERM
```

---

### 🐛 Debugging Shell Scripts

**Enable Debug Mode**:
```bash
#!/bin/bash
set -x    # Print each command before execution

echo "Starting script..."
NAME="Alice"
echo "Hello $NAME"
```

**Output with Debug**:
```
+ echo 'Starting script...'
Starting script...
+ NAME=Alice
+ echo 'Hello Alice'
Hello Alice
```

**Debugging Specific Sections**:
```bash
#!/bin/bash

echo "Normal execution"

set -x
# Debug this section
complex_command1
complex_command2
set +x

echo "Back to normal"
```

**Using `trap` for Debugging**:
```bash
#!/bin/bash

trap 'echo "Line $LINENO: Command failed with exit code $?"' ERR

ls /nonexistent
echo "This won't print if set -e is enabled"
```

---

## Next Steps

**Practice Exercises**:

1. **Backup Script**: Write a script that backs up your home directory to `/backup/`
2. **Log Analyzer**: Parse `/var/log/syslog` and count error messages
3. **Service Manager**: Create start/stop/status script for a service
4. **User Report**: Generate CSV of all users and their last login time
5. **Disk Usage Alert**: Email alert when any partition exceeds 85%

**Further Learning**:
- **[command-line-essentials](command-line-essentials)** - grep, awk, sed for advanced scripting
- **[git-fundamentals](git-fundamentals)** - Version control for your scripts
- **[kb/infrastructure/ansible-basics](../infrastructure/ansible-basics)** - When bash scripts grow too large
- **[kb/cicd/woodpecker-ci](../cicd/woodpecker-ci)** - Running scripts in CI/CD pipelines

**Advanced Topics** (Future Articles):
- Regular expressions in bash
- Parallel execution with `xargs` and `parallel`
- Advanced parameter expansion
- Arrays and associative arrays
- Process substitution
- Bash debugging tools (`bashdb`)

## Community Resources

### 📚 Official Documentation
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/) - Complete bash documentation
- [Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/) - Comprehensive ABS guide

### 🎓 Tutorials & Guides
- **Beginner**: [Shell Scripting Tutorial](https://www.shellscript.sh/) - Great starting point
- **Intermediate**: [Bash Guide for Beginners](https://tldp.org/LDP/Bash-Beginners-Guide/html/) - More depth
- **Advanced**: [Bash Hackers Wiki](https://wiki.bash-hackers.org/) - Deep technical details

### 📺 Video Resources
- **Beginner**: [Bash Scripting on Linux](https://www.youtube.com/watch?v=SPwyp2NG-bE) - LearnLinuxTV
- **Intermediate**: [Shell Scripting Crash Course](https://www.youtube.com/watch?v=v-F3YLd6oMw) - Traversy Media
- **Advanced**: [Advanced Bash-Scripting](https://www.youtube.com/watch?v=emhouufDnB4) - LiveOverflow

### 📖 Books
- **Beginner**: "Learning the bash Shell" by Cameron Newham
- **Intermediate**: "Bash Cookbook" by Carl Albing
- **Advanced**: "Pro Bash Programming" by Chris F.A. Johnson

### 🛠️ Tools
- **ShellCheck** - `sudo apt install shellcheck` - Linting for shell scripts
- **Bash Language Server** - IDE support for bash (VSCode extension)
- **bashdb** - Debugger for bash scripts

## Sources

- Advanced Bash-Scripting Guide - https://tldp.org/LDP/abs/html/
- Shell Scripting Tutorial - https://www.shellscript.sh/
- GNU Bash Manual - https://www.gnu.org/software/bash/manual/
- Bash Hackers Wiki - https://wiki.bash-hackers.org/
- ShellCheck Project - https://www.shellcheck.net/

## Change Log

### 2026-01-30
- Initial creation with comprehensive bash scripting tutorial
- Covered variables, quoting, loops, conditionals, functions, error handling
- Added real-world script examples (deployment, monitoring, user management)
- Included debugging techniques and best practices
- Provided practice exercises and learning path
- Added community resources organized by skill level
- Included ASCII examples and visual formatting

---

**🎯 Master This**: Shell scripting is your automation superpower. Start with simple scripts, build confidence, then tackle complex workflows. Every system administrator's toolkit is filled with bash scripts!

