# Git Fundamentals - Version Control for Everyone

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Basics - Version Control  
**Prerequisites**: [linux-fundamentals](linux-fundamentals), [bash-scripting](bash-scripting)  
**Time**: 4-6 hours  
**Tags**: git, version-control, collaboration, github, gitlab, forgejo

## Summary

Master Git version control from zero to production workflows. Learn commits, branches, merging, collaboration, and best practices. Works with GitHub, GitLab, Forgejo, or any Git hosting platform.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Understand why version control exists
- ✅ Clone, commit, push, and pull repositories
- ✅ Create and merge branches
- ✅ Collaborate with teams using pull requests
- ✅ Resolve merge conflicts
- ✅ Use Git effectively in daily work

## 📚 The Git Mental Model

**Git is a Time Machine for Code**:
```
Working Directory → Staging Area → Local Repository → Remote Repository
(Your files)       (git add)      (git commit)      (git push)
```

**Key Concept**: Git tracks **changes**, not files. Every commit is a snapshot of your project at a point in time.

## 🔍 Why Version Control?

### The Problem Without Git:
```
my-project/
├── app.py
├── app-backup.py
├── app-final.py
├── app-final-v2.py
├── app-final-ACTUAL.py
└── app-final-ACTUAL-fixed.py
```

**Nightmare scenario**:
- Which version is current?
- What changed between versions?
- Who made what changes?
- How to collaborate without overwriting?
- How to revert bad changes?

### The Solution With Git:
```
my-project/
└── app.py         # One file, full history preserved

$ git log --oneline
abc1234 Fix critical bug
def5678 Add user authentication
789abcd Initial commit
```

**Git provides**:
- Complete history of every change
- Who changed what, when, and why
- Ability to revert to any previous state
- Parallel development with branches
- Conflict-free collaboration

---

## 📦 Installation and Setup

### Install Git

**Linux (Debian/Ubuntu)**:
```bash
sudo apt update
sudo apt install git
```

**Linux (Fedora/RHEL)**:
```bash
sudo dnf install git
```

**macOS**:
```bash
# Using Homebrew
brew install git

# Or install Xcode Command Line Tools
xcode-select --install
```

**Windows**:
- Download from [git-scm.com](https://git-scm.com/download/win)
- Or use `winget install --id Git.Git -e --source winget`

**Verify Installation**:
```bash
git --version
# Should output: git version 2.x.x
```

---

### Initial Configuration

**Set Your Identity** (required):
```bash
# Your name (shows in commits)
git config --global user.name "Your Name"

# Your email (shows in commits)
git config --global user.email "your.email@example.com"
```

**Helpful Global Settings**:
```bash
# Default branch name (use 'main' instead of 'master')
git config --global init.defaultBranch main

# Colorize output
git config --global color.ui auto

# Set default editor (choose one)
git config --global core.editor "vim"
git config --global core.editor "nano"
git config --global core.editor "code --wait"  # VSCode

# Better diff algorithm
git config --global diff.algorithm histogram

# Reuse recorded conflict resolutions
git config --global rerere.enabled true
```

**View Configuration**:
```bash
# See all settings
git config --list

# See where settings come from
git config --list --show-origin
```

---

## 🚀 Git Basics - Your First Repository

### Creating a Repository

**Option 1: Start a New Project**:
```bash
# Create project directory
mkdir my-project
cd my-project

# Initialize Git repository
git init

# Verify
ls -la .git  # Git's internal directory
```

**Option 2: Clone Existing Repository**:
```bash
# Clone from GitHub
git clone https://github.com/username/repo-name.git

# Clone from GitLab
git clone https://gitlab.com/username/repo-name.git

# Clone from Forgejo (self-hosted)
git clone https://git.yourserver.com/username/repo-name.git

# Clone with custom directory name
git clone https://github.com/username/repo.git my-custom-name
```

---

### The Basic Workflow

**Understanding Git States**:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Untracked     │────▶│     Staged      │────▶│   Committed     │
│   (new files)   │ add │  (ready to save)│commit│ (saved forever) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       │ unstage                │
         │                       ◀────────────────────────┘
         │                    git reset
         │
         └──────────────────────────────────────────────▶
                         (delete file)
```

**Creating Your First Commit**:
```bash
# 1. Check status (do this often!)
git status

# 2. Create a file
echo "# My Project" > README.md

# 3. Stage the file
git add README.md

# 4. Check status again
git status
# Shows: Changes to be committed

# 5. Commit with message
git commit -m "Initial commit: Add README"

# 6. View history
git log
```

**Adding Multiple Files**:
```bash
# Create more files
echo "print('Hello')" > app.py
echo "# Ignore this" > notes.txt

# Stage specific files
git add app.py README.md

# Or stage all changes
git add .

# Or stage all files matching pattern
git add *.py

# Commit
git commit -m "Add Python application"
```

---

### Ignoring Files with .gitignore

**Why Ignore Files?**
- Temporary files (logs, cache)
- Build artifacts (compiled code)
- Secrets (passwords, API keys)
- Dependencies (node_modules, venv)
- IDE files (.vscode, .idea)

**Create .gitignore**:
```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
*.pyo
venv/
.env

# Node
node_modules/
npm-debug.log

# Build outputs
dist/
build/
*.exe

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
EOF

# Add and commit gitignore
git add .gitignore
git commit -m "Add gitignore for Python and Node projects"
```

**Useful .gitignore Templates**:
- [github.com/github/gitignore](https://github.com/github/gitignore)

---

## 🌿 Branches - Parallel Development

### Understanding Branches

**Branches let you work on features without breaking main code**:
```
main:     A───B───C───D───E
                   \
feature:            F───G   (work in progress)
```

**When feature is ready**:
```
main:     A───B───C───D───E───H   (merge feature into main)
                   \         /
feature:            F───────G
```

---

### Branch Operations

**Create and Switch Branches**:
```bash
# Create new branch
git branch feature-login

# Switch to branch
git checkout feature-login

# Or create and switch in one command (modern)
git checkout -b feature-login

# Even newer syntax (Git 2.23+)
git switch -c feature-login
```

**List Branches**:
```bash
# Local branches
git branch

# Remote branches
git branch -r

# All branches
git branch -a

# With last commit info
git branch -v
```

**Delete Branches**:
```bash
# Delete local branch (safe)
git branch -d feature-login

# Force delete (even if not merged)
git branch -D feature-login

# Delete remote branch
git push origin --delete feature-login
```

---

### Merging Branches

**Fast-Forward Merge** (simple, no conflicts):
```bash
# On main branch
git checkout main

# Merge feature branch
git merge feature-login
```

**Three-Way Merge** (creates merge commit):
```bash
git checkout main
git merge feature-authentication

# Git opens editor for merge commit message
# Save and exit to complete merge
```

**Squash Merge** (combine all commits into one):
```bash
git merge --squash feature-small-fix
git commit -m "Add small fix (squashed)"
```

---

### Resolving Merge Conflicts

**Conflict Occurs When**:
- Same line changed in both branches
- File deleted in one branch, modified in other

**Example Conflict**:
```python
# app.py has conflict
<<<<<<< HEAD
print("Hello from main!")
=======
print("Hello from feature branch!")
>>>>>>> feature-branch
```

**Resolution Steps**:
```bash
# 1. Git tells you there's a conflict
git merge feature-branch
# CONFLICT in app.py

# 2. Check which files have conflicts
git status

# 3. Open conflicted file and edit
# Remove conflict markers, keep desired code:
print("Hello from feature branch!")

# 4. Stage resolved file
git add app.py

# 5. Complete merge
git commit -m "Merge feature-branch, resolve conflicts"
```

**Abort Merge** (if things go wrong):
```bash
git merge --abort
```

---

## 🔄 Working with Remotes

### Understanding Remotes

**Remote = Git repository on another server**:
```
Your Computer                  Remote Server
┌──────────────┐              ┌──────────────┐
│ Local Repo   │──push────────▶│ GitHub/      │
│              │               │ GitLab/      │
│              │◀────pull──────│ Forgejo      │
└──────────────┘              └──────────────┘
```

---

### Remote Operations

**View Remotes**:
```bash
# List remotes
git remote -v

# Typical output:
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)
```

**Add Remote** (after git init):
```bash
# Add remote named 'origin'
git remote add origin https://github.com/username/repo.git

# Verify
git remote -v
```

**Push to Remote**:
```bash
# First push (sets upstream)
git push -u origin main

# Subsequent pushes
git push

# Push specific branch
git push origin feature-branch
```

**Pull from Remote**:
```bash
# Fetch changes and merge
git pull

# Equivalent to:
git fetch      # Download changes
git merge      # Merge into current branch

# Pull specific branch
git pull origin main
```

**Fetch vs Pull**:
```bash
# Fetch: download changes but don't merge
git fetch origin

# Now you can inspect before merging
git log origin/main
git diff main origin/main

# Merge when ready
git merge origin/main
```

---

### SSH Keys for Authentication

**Generate SSH Key** (if not done already):
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub
```

**Add to GitHub/GitLab/Forgejo**:
1. Copy public key
2. Go to Settings → SSH Keys
3. Paste and save

**Clone with SSH**:
```bash
# SSH format (no password needed after key setup)
git clone git@github.com:username/repo.git
```

---

## 👥 Collaboration Workflows

### Pull Request / Merge Request Workflow

**Standard Team Workflow**:
```
1. Clone repository
2. Create feature branch
3. Make changes and commit
4. Push branch to remote
5. Create pull request
6. Code review
7. Merge to main
```

**Practical Example**:
```bash
# 1. Clone repo
git clone git@github.com:company/project.git
cd project

# 2. Create feature branch
git checkout -b feature/add-login

# 3. Make changes
vim app.py
git add app.py
git commit -m "Add user login functionality"

# 4. Push to remote
git push -u origin feature/add-login

# 5. Go to GitHub/GitLab and create pull request
# (This is done in web UI)

# 6. After approval, maintainer merges
# You delete local branch:
git checkout main
git pull
git branch -d feature/add-login
```

---

### Keeping Your Branch Up-to-Date

**Rebase vs Merge**:
```bash
# On your feature branch, main has new commits

# Option 1: Merge (creates merge commit)
git checkout feature-branch
git merge main

# Option 2: Rebase (rewrites history, cleaner)
git checkout feature-branch
git rebase main
```

**Rebase Visualization**:
```
Before rebase:
main:     A───B───C───D
               \
feature:        E───F

After rebase:
main:     A───B───C───D
                       \
feature:                E'───F'  (E and F re-applied)
```

**Interactive Rebase** (clean up commits):
```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Editor opens with options:
# pick  abc123 First commit
# squash def456 Fix typo
# reword 789abc Add feature

# pick = use commit
# squash = merge with previous
# reword = change message
# drop = remove commit
```

---

## 📖 Essential Git Commands Reference

### Status and History

```bash
# Current status
git status
git status -s              # Short format

# Commit history
git log
git log --oneline          # Compact view
git log --graph --oneline  # Visual branch graph
git log -5                 # Last 5 commits
git log --author="John"    # Commits by author
git log --since="2 weeks"  # Recent commits

# Show changes
git diff                   # Unstaged changes
git diff --staged          # Staged changes
git diff main feature      # Between branches
git diff HEAD~1            # Last commit vs current
```

---

### Undoing Changes

```bash
# Discard changes in working directory
git checkout -- file.txt

# Unstage file (keep changes)
git reset HEAD file.txt

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert commit (creates new commit)
git revert abc1234
```

---

### Stashing (Temporary Storage)

```bash
# Save work in progress
git stash

# With message
git stash save "WIP: working on feature"

# List stashes
git stash list

# Apply latest stash
git stash apply

# Apply and delete stash
git stash pop

# Delete stash
git stash drop stash@{0}

# Show stash contents
git stash show -p stash@{0}
```

---

### Tagging (Releases)

```bash
# Create lightweight tag
git tag v1.0.0

# Create annotated tag (recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"

# Tag old commit
git tag -a v0.9.0 abc1234

# List tags
git tag

# Push tags to remote
git push origin v1.0.0
git push origin --tags  # Push all tags

# Delete tag
git tag -d v1.0.0
git push origin --delete v1.0.0  # Delete remote
```

---

## 🔧 Advanced Git Techniques

### Cherry-Picking

**Apply specific commit from another branch**:
```bash
# Get commit hash from feature branch
git log feature-branch --oneline

# Apply that commit to current branch
git cherry-pick abc1234
```

---

### Submodules

**Include another Git repository inside yours**:
```bash
# Add submodule
git submodule add https://github.com/user/library.git libs/library

# Clone repo with submodules
git clone --recurse-submodules https://github.com/user/project.git

# Update submodules
git submodule update --remote
```

---

### Bisect (Find Bug Introduction)

**Binary search through history to find bug**:
```bash
# Start bisect
git bisect start

# Mark current as bad
git bisect bad

# Mark known good commit
git bisect good abc1234

# Git checks out middle commit
# Test it, then mark:
git bisect good  # or git bisect bad

# Repeat until bug found
# Git tells you the offending commit

# Clean up
git bisect reset
```

---

## 💡 Git Best Practices

### Commit Messages

**Good Format**:
```
Short summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"
```

**Conventional Commits**:
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login button bug"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify validation logic"
git commit -m "test: add unit tests for parser"
```

**Types**: feat, fix, docs, style, refactor, test, chore

---

### When to Commit

**Commit Often**:
- Each logical change
- When tests pass
- Before switching tasks
- At end of work session

**Don't Commit**:
- Broken code (unless WIP branch)
- Half-done features on main
- Generated files (build artifacts)
- Secrets (passwords, API keys)

---

### Branch Naming

**Good Branch Names**:
```bash
feature/user-authentication
fix/login-bug
hotfix/critical-security-patch
refactor/database-layer
docs/api-reference
```

**Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

---

### .gitattributes for Line Endings

**Prevent line ending issues**:
```bash
cat > .gitattributes << 'EOF'
# Auto detect text files and normalize to LF
* text=auto

# Force LF for these
*.sh text eol=lf
*.py text eol=lf

# Binary files
*.png binary
*.jpg binary
*.pdf binary
EOF
```

---

## 🚨 Common Pitfalls

### 1. Committing Secrets
**Problem**: Passwords in Git history forever  
**Solution**: Use `.env` files and `.gitignore`
```bash
# Add to .gitignore
.env
secrets.yml
*.key
```

**If you already committed a secret**:
```bash
# Remove file from history (nuclear option)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch secrets.yml" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (be careful!)
git push origin --force --all
```

---

### 2. Large Files
**Problem**: Git is slow with large binary files  
**Solution**: Use Git LFS (Large File Storage)
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.psd"
git lfs track "*.mp4"

# Commit .gitattributes
git add .gitattributes
git commit -m "Track large files with LFS"
```

---

### 3. Wrong Branch
**Problem**: Made commits on wrong branch  
**Solution**: Move commits to correct branch
```bash
# You're on main but should be on feature
git log --oneline  # Note commit hashes

# Create feature branch from current state
git branch feature-branch

# Reset main to previous state
git reset --hard origin/main

# Switch to feature branch
git checkout feature-branch
```

---

### 4. Merge Conflicts Are Scary
**Truth**: Conflicts are normal, not errors!  
**Solution**: Practice resolving them
```bash
# Create conflict intentionally (practice)
git checkout -b branch1
echo "Line from branch1" > test.txt
git add test.txt && git commit -m "Branch1 change"

git checkout main
git checkout -b branch2
echo "Line from branch2" > test.txt
git add test.txt && git commit -m "Branch2 change"

git checkout main
git merge branch1
git merge branch2  # CONFLICT!

# Now practice resolving it
```

---

## 🎯 Real-World Scenarios

### Scenario 1: Fix Production Bug

```bash
# 1. Create hotfix branch from production
git checkout production
git checkout -b hotfix/critical-bug

# 2. Fix bug
vim app.py
git add app.py
git commit -m "hotfix: resolve critical payment bug"

# 3. Deploy and test
# ... testing ...

# 4. Merge to production
git checkout production
git merge hotfix/critical-bug
git push

# 5. Merge to main too
git checkout main
git merge hotfix/critical-bug
git push

# 6. Cleanup
git branch -d hotfix/critical-bug
```

---

### Scenario 2: Collaborate on Feature

```bash
# Developer A starts feature
git checkout -b feature/new-api
# ... work ...
git push -u origin feature/new-api

# Developer B joins
git fetch origin
git checkout feature/new-api
# ... work ...
git pull  # Get A's changes
git push  # Share B's changes

# Both developers keep pushing/pulling
# Until feature is complete

# Create pull request when done
```

---

### Scenario 3: Undo Public Commit

**DON'T use reset on public commits!**  
**Use revert instead**:
```bash
# Bad commit was pushed
git log --oneline
# abc1234 Bad commit

# Create revert commit (safe)
git revert abc1234

# Push revert
git push
```

---

## 📚 Resources

**Official Documentation**:
- [git-scm.com/doc](https://git-scm.com/doc) - Official Git docs
- [Pro Git Book](https://git-scm.com/book/en/v2) - Free comprehensive guide

**Interactive Learning**:
- [learngitbranching.js.org](https://learngitbranching.js.org/) - Visual Git tutorial
- [git-school.github.io/visualizing-git](https://git-school.github.io/visualizing-git/) - Visualize commands

**Cheat Sheets**:
- [GitHub Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)

**Advanced Topics**:
- [ohshitgit.com](https://ohshitgit.com/) - Fix common mistakes
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

## 🔗 What's Next?

After mastering Git:

**Apply to Projects**:
- **[kb/cicd/forgejo-setup](../cicd/forgejo-setup)** - Self-hosted Git
- **[kb/cicd/github-actions-to-woodpecker](../cicd/github-actions-to-woodpecker)** - CI/CD with Git

**Team Workflows**:
- **[kb/cicd/git-workflows](../cicd/git-workflows)** - Team strategies
- **[kb/migrations/github-to-forgejo](../migrations/github-to-forgejo)** - Migrate repos

---

## 📝 Change Log

### 2026-01-30
- Created comprehensive Git fundamentals guide
- Covered installation through advanced workflows
- Added real-world scenarios and troubleshooting
- Included best practices and common pitfalls
- Provided interactive learning resources

---

**Next Article**: [text-editors](text-editors) - Choose and master your editor!

