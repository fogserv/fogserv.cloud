# Text Editors - Your Primary Tool

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Basics - Developer Tools  
**Prerequisites**: [linux-fundamentals](linux-fundamentals)  
**Time**: 2-4 hours  
**Tags**: editors, vim, vscode, nano, productivity, development-environment

## Summary

Choose and master your text editor - the tool you'll use every day. Learn nano for quick edits, VSCode for full development, or vim for power and speed. All three are valuable in different situations.

## 🎯 What You'll Learn

By the end of this article, you'll be able to:
- ✅ Choose the right editor for your needs
- ✅ Use nano for simple server edits
- ✅ Work efficiently in VSCode
- ✅ Understand vim basics (escape!)
- ✅ Customize your editor environment

## 📚 The Three-Editor Strategy

**Different Tools for Different Jobs**:
```
Nano:    Quick server edits, config files (5 minutes to learn)
VSCode:  Primary development, projects, debugging (1 day to learn)
Vim:     Power user editing, remote work, speed (months to master)
```

**Recommendation**: Learn all three!
- **Nano** - Everyone should know (save your sanity on servers)
- **VSCode** - Best general-purpose editor (main development)
- **Vim** - Optional but powerful (when you're ready)

---

## 🟢 Nano - The Friendly Terminal Editor

### Why Learn Nano?

**Scenarios**:
- SSH into server, need to edit config
- Quick file edits without GUI
- When vim confuses you (we've all been there)
- Emergency fixes in single-user mode

**Philosophy**: Simple, intuitive, always available.

---

### Installing Nano

**Usually Pre-installed**, but if needed:
```bash
# Debian/Ubuntu
sudo apt install nano

# Fedora/RHEL
sudo dnf install nano

# macOS
brew install nano
```

---

### Nano Basics

**Opening Files**:
```bash
# Create/edit file
nano filename.txt

# Edit with sudo (system files)
sudo nano /etc/hosts

# Open at specific line
nano +15 script.py
```

**The Interface**:
```
  GNU nano 6.2                  filename.txt                    Modified

This is your file content.
You can type normally here.
No special mode required!




^G Help      ^O Write Out  ^W Where Is   ^K Cut        ^T Execute
^X Exit      ^R Read File  ^\ Replace    ^U Paste      ^J Justify
```

**Key Symbols**:
- `^` = Ctrl key
- `M-` = Alt key (or Esc)

---

### Essential Nano Commands

**Navigation**:
```
Arrow keys       Move cursor
Ctrl+A           Beginning of line
Ctrl+E           End of line
Ctrl+Y           Page up
Ctrl+V           Page down
Alt+\            Top of file
Alt+/            Bottom of file
Ctrl+_           Go to line number
```

**Editing**:
```
Ctrl+K           Cut current line
Ctrl+U           Paste cut text
Alt+6            Copy current line
Ctrl+W           Search for text
Ctrl+\           Search and replace
Ctrl+K (repeat)  Cut multiple lines
```

**File Operations**:
```
Ctrl+O           Save (Write Out)
  → Enter        Confirm filename
Ctrl+X           Exit
  → Y/N          Save changes?
Ctrl+R           Insert file contents
Ctrl+T           Spell check (if available)
```

---

### Practical Nano Example

**Edit SSH config**:
```bash
# Open SSH config
nano ~/.ssh/config

# Add entry:
Host myserver
    HostName 192.168.1.100
    User admin
    Port 22

# Save: Ctrl+O, Enter
# Exit: Ctrl+X
```

**Tips**:
- Ctrl+O shows filename - you can change it here
- Ctrl+X always asks to save if modified
- Ctrl+C shows cursor position
- Nano is forgiving - you can't accidentally break it

---

### Nano Configuration

**Create ~/.nanorc**:
```bash
cat > ~/.nanorc << 'EOF'
# Show line numbers
set linenumbers

# Smooth scrolling
set smooth

# Convert tabs to spaces
set tabstospaces
set tabsize 4

# Enable mouse support
set mouse

# Syntax highlighting
include /usr/share/nano/*.nanorc

# Auto-indent
set autoindent

# Save cursor position
set positionlog
EOF
```

**Nano is Perfect For**:
- Quick config edits
- Git commit messages
- Cron job editing
- Emergency fixes
- Learning Linux

---

## 🔵 Visual Studio Code - The Modern Powerhouse

### Why VSCode?

**Advantages**:
- Free and open-source
- Massive extension ecosystem
- Integrated terminal
- Git integration
- Remote SSH editing
- IntelliSense (autocomplete)
- Debugging built-in
- Works on Windows, Mac, Linux

**Perfect For**:
- Primary development environment
- Full projects
- Multiple language support
- Remote server development
- Team collaboration

---

### Installing VSCode

**Download**: [code.visualstudio.com](https://code.visualstudio.com/)

**Linux (Debian/Ubuntu)**:
```bash
# Download .deb from website, then:
sudo dpkg -i code_*.deb
sudo apt install -f  # Fix dependencies
```

**macOS**:
```bash
brew install --cask visual-studio-code
```

**Windows**:
- Download installer or `winget install Microsoft.VisualStudioCode`

**Launch**:
```bash
code .              # Open current directory
code filename.py    # Open specific file
code --new-window   # New window
```

---

### Essential VSCode Extensions

**Install from Extensions panel (Ctrl+Shift+X)**:

**Must-Have**:
```
1. Remote - SSH          (edit files on servers)
2. GitLens               (supercharge Git)
3. Docker                (container development)
4. Prettier              (code formatting)
5. ESLint / Pylint       (linting)
```

**Language-Specific**:
```
Python:
- Python (Microsoft)
- Pylance

JavaScript/TypeScript:
- ESLint
- Prettier

Go:
- Go (Google)

Rust:
- rust-analyzer
```

**Productivity**:
```
- TODO Highlight
- Better Comments
- Bracket Pair Colorizer
- Path Intellisense
- Auto Rename Tag
```

---

### VSCode Keyboard Shortcuts

**Essential Navigation** (learn these first):
```
Ctrl+P            Quick file open
Ctrl+Shift+P      Command palette
Ctrl+B            Toggle sidebar
Ctrl+`            Toggle terminal
Ctrl+\            Split editor
Ctrl+W            Close editor
Ctrl+Tab          Switch between editors
```

**Editing**:
```
Ctrl+/            Toggle comment
Ctrl+D            Select next occurrence
Ctrl+Shift+L      Select all occurrences
Alt+↑/↓           Move line up/down
Shift+Alt+↑/↓     Copy line up/down
Ctrl+Shift+K      Delete line
Ctrl+X            Cut line (no selection needed)
```

**Multi-Cursor Magic**:
```
Alt+Click         Add cursor
Ctrl+Alt+↑/↓      Add cursor above/below
Ctrl+D            Select next match
Ctrl+Shift+L      Select all matches
Esc               Exit multi-cursor
```

**Search**:
```
Ctrl+F            Find in file
Ctrl+H            Replace in file
Ctrl+Shift+F      Find in all files
F3 / Shift+F3     Next/previous match
```

**Code Navigation**:
```
F12               Go to definition
Alt+F12           Peek definition
Shift+F12         Find all references
Ctrl+T            Go to symbol in workspace
Ctrl+G            Go to line
Ctrl+Shift+O      Go to symbol in file
```

---

### Remote SSH Development

**Killer Feature**: Edit files on servers as if they're local!

**Setup**:
1. Install "Remote - SSH" extension
2. Press F1 → "Remote-SSH: Connect to Host"
3. Enter `user@hostname`
4. Opens VSCode connected to server
5. Edit files, terminal runs on server

**SSH Config Integration**:
```bash
# Add to ~/.ssh/config
Host devserver
    HostName 192.168.1.100
    User admin
    IdentityFile ~/.ssh/id_ed25519

# Now in VSCode: "Remote-SSH: Connect" → "devserver"
```

**Benefits**:
- No need for manual scp/sftp
- Full IntelliSense on remote code
- Terminal on server
- Git operations on server

---

### VSCode Settings

**Open Settings**: Ctrl+, (comma)

**Essential Settings** (JSON):
```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": false,
  "editor.rulers": [80, 120],
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "terminal.integrated.fontSize": 13,
  "workbench.colorTheme": "Dark+ (default dark)",
  "git.autofetch": true,
  "editor.formatOnSave": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

### VSCode Workspace

**Multi-Root Workspaces**:
```json
// workspace.code-workspace
{
  "folders": [
    { "path": "/home/user/project1" },
    { "path": "/home/user/project2" },
    { "path": "/etc/nginx" }
  ],
  "settings": {
    "files.exclude": {
      "**/__pycache__": true,
      "**/node_modules": true
    }
  }
}
```

**Tasks** (build automation):
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Python",
      "type": "shell",
      "command": "python3 ${file}",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

---

### VSCode Tips & Tricks

**Zen Mode**: Ctrl+K Z (distraction-free)  
**Command Palette**: Ctrl+Shift+P (access everything)  
**Emmet**: Built-in HTML/CSS shortcuts  
**Snippets**: Define custom code templates  
**Git Integration**: Stage chunks, not whole files  
**Debugging**: F5 to start, breakpoints with F9  

---

## 🟣 Vim - The Power User's Choice

### Why Learn Vim?

**Advantages**:
- Available on every Unix system
- Incredibly fast editing
- No mouse required
- Works over slow SSH
- Powerful text manipulation
- Keyboard-driven workflow

**Philosophy**: Modal editing - different modes for different tasks.

---

### Vim Survival Guide

**The #1 Vim Skill**: How to exit!
```
:q          Quit (if no changes)
:q!         Quit without saving
:wq         Write and quit
:x          Write and quit (shorter)
ZZ          Write and quit (no colon)
```

**Starting Vim**:
```bash
vim file.txt        # Edit file
vim +10 file.txt    # Open at line 10
vim -R file.txt     # Read-only
view file.txt       # Read-only (same as vim -R)
```

---

### Vim Modes

**Understanding Modes** (the key to vim):
```
Normal Mode:  Navigate and manipulate text (default)
Insert Mode:  Type normally (press 'i' to enter)
Visual Mode:  Select text (press 'v' to enter)
Command Mode: Run commands (press ':' to enter)
```

**Mode Switching**:
```
Esc             Go to Normal mode (from any mode)
i               Insert mode (before cursor)
a               Insert mode (after cursor)
o               Insert mode (new line below)
v               Visual mode (character selection)
V               Visual line mode
:               Command mode
```

---

### Basic Vim Navigation

**Movement** (Normal mode):
```
h, j, k, l      Left, down, up, right (or arrow keys)
w               Next word
b               Previous word
0               Beginning of line
$               End of line
gg              Top of file
G               Bottom of file
:15             Go to line 15
Ctrl+F          Page down
Ctrl+B          Page up
```

---

### Editing in Vim

**Insert Text**:
```
i               Insert before cursor
a               Insert after cursor
I               Insert at beginning of line
A               Insert at end of line
o               Open new line below
O               Open new line above
```

**Delete**:
```
x               Delete character
dw              Delete word
dd              Delete line
D               Delete to end of line
d$              Delete to end of line
d0              Delete to beginning of line
```

**Copy/Paste** (called yank/put):
```
yy              Yank (copy) line
yw              Yank word
p               Put (paste) after cursor
P               Put before cursor
```

**Undo/Redo**:
```
u               Undo
Ctrl+R          Redo
.               Repeat last command
```

---

### Vim Search and Replace

**Search**:
```
/pattern        Search forward
?pattern        Search backward
n               Next match
N               Previous match
*               Search for word under cursor
```

**Replace**:
```
:s/old/new/         Replace first on line
:s/old/new/g        Replace all on line
:%s/old/new/g       Replace all in file
:%s/old/new/gc      Replace all with confirmation
```

---

### Vim Power Features

**Visual Mode**:
```
v               Select characters
V               Select lines
Ctrl+V          Select block (column)
d               Delete selection
y               Yank selection
>               Indent selection
<               Unindent selection
```

**Macros** (record actions):
```
qa              Start recording macro 'a'
... do actions ...
q               Stop recording
@a              Replay macro 'a'
@@              Replay last macro
```

**Multiple Files**:
```
:e file.txt     Edit another file
:split          Horizontal split
:vsplit         Vertical split
Ctrl+W W        Switch windows
:bn             Next buffer
:bp             Previous buffer
```

---

### Vim Configuration

**Create ~/.vimrc**:
```vim
" Basic settings
set number              " Show line numbers
set relativenumber      " Relative line numbers
set expandtab           " Use spaces instead of tabs
set tabstop=4           " Tab width
set shiftwidth=4        " Indent width
set autoindent          " Auto-indent new lines
set smartindent         " Smart indenting
syntax on               " Syntax highlighting
set background=dark     " Dark background
set hlsearch            " Highlight search results
set incsearch           " Incremental search
set ignorecase          " Case-insensitive search
set smartcase           " Unless uppercase used
set mouse=a             " Enable mouse
set clipboard=unnamedplus " Use system clipboard
set ruler               " Show cursor position
set showcmd             " Show command in status line

" Quality of life
set noswapfile          " Disable swap files
set nobackup            " Disable backups
set undofile            " Persistent undo
set wildmenu            " Command-line completion
set laststatus=2        " Always show status line

" Key remaps
let mapleader = " "     " Space as leader key
nnoremap <leader>w :w<CR>       " Space+w to save
nnoremap <leader>q :q<CR>       " Space+q to quit
nnoremap <leader>s :split<CR>   " Space+s to split

" Plugin manager (vim-plug)
" Install: curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
"   https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
call plug#begin()
Plug 'preservim/nerdtree'       " File tree
Plug 'tpope/vim-fugitive'       " Git integration
Plug 'vim-airline/vim-airline'  " Status bar
call plug#end()
```

---

### Vim Tips

**Learn Incrementally**:
1. Week 1: i, Esc, :wq (survive)
2. Week 2: hjkl, dd, yy, p (navigate and edit)
3. Week 3: w, b, $, 0, gg, G (move faster)
4. Month 2: Visual mode, macros, splits
5. Lifetime: Still learning new tricks!

**Vim Tutor**:
```bash
vimtutor        # Built-in interactive tutorial (30 min)
```

**When to Use Vim**:
- Quick config edits on servers
- When SSH is slow
- When you want speed
- When mouse is unavailable

**When NOT to Use Vim**:
- Large refactoring (use IDE)
- Learning new codebase (use VSCode)
- Debugging complex issues
- Collaboration (harder to pair)

---

## 🔀 Choosing Your Primary Editor

### Decision Matrix

| Feature              | Nano | VSCode | Vim  |
|---------------------|------|--------|------|
| Learning Curve      | 5min | 1 day  | Months |
| Speed              | Slow | Medium | Fast |
| Remote Editing     | Good | Great  | Great |
| Large Files        | Poor | Good   | Great |
| Plugins            | Few  | Tons   | Many |
| GUI                | No   | Yes    | No* |
| Mouse Support      | Yes  | Yes    | No* |
| Integrated Debug   | No   | Yes    | Plugin |
| Project Management | No   | Great  | Good |

*Vim has gvim/MacVim GUI versions

---

### Recommendation by Role

**Beginner Developer**:
- Primary: **VSCode**
- Server: **Nano**
- Future: Learn Vim basics

**DevOps Engineer**:
- Primary: **VSCode**
- Server: **Vim**
- Backup: Nano for emergencies

**Power User**:
- Primary: **Vim/Neovim**
- IDE: VSCode for debugging
- Server: Vim

**Team Lead**:
- Primary: **VSCode** (consistency)
- All: Know basics of all editors

---

## 🎓 Learning Path

### Week 1: Editor Foundations
```bash
Day 1: Install VSCode, basic shortcuts
Day 2: Nano survival guide
Day 3: Vim basics (vimtutor)
Day 4: VSCode extensions
Day 5: Practice on real project
```

### Month 1: Proficiency
- VSCode as main editor
- Remote SSH development
- Custom keybindings
- Vim for quick edits
- Nano for configs

### Month 3: Mastery
- VSCode workspace mastery
- Vim macros and plugins
- Editor-specific workflows
- Speed optimization
- Teaching others

---

## 💡 Pro Tips

**VSCode**:
- Learn Command Palette (Ctrl+Shift+P) - access everything
- Customize keybindings to match your workflow
- Use workspace settings for project-specific config
- Remote SSH is a game-changer
- Extensions can slow down - only install what you use

**Vim**:
- Don't try to learn everything at once
- Use vimtutor every few months
- Remap Caps Lock to Esc (system-wide)
- Learn one new command per day
- Vim motions work in many tools (browser extensions!)

**Nano**:
- Always know the basics - you'll need it
- Ctrl+G for help when stuck
- Mouse support makes it easier
- Perfect for git commit messages

---

## 🔗 What's Next?

After mastering your editor:

**Development Setup**:
- **[package-managers](package-managers)** - Install development tools
- **[git-fundamentals](git-fundamentals)** - Version control integration

**Advanced**:
- **[kb/infrastructure/vscode-remote](../infrastructure/vscode-remote)** - Remote development
- **[kb/aiml/coding-assistants](../aiml/coding-assistants)** - AI-powered coding

---

## 📚 Resources

**VSCode**:
- [code.visualstudio.com/docs](https://code.visualstudio.com/docs)
- [VSCode Tips](https://github.com/microsoft/vscode-tips-and-tricks)

**Vim**:
- [vimtutor](https://vimhelp.org/usr_01.txt.html) - Built-in tutorial
- [Vim Adventures](https://vim-adventures.com/) - Learn by gaming
- [Practical Vim](https://pragprog.com/titles/dnvim2/) - Excellent book

**Nano**:
- `man nano` - Built-in manual
- [nano-editor.org](https://www.nano-editor.org/)

---

## 📝 Change Log

### 2026-01-30
- Created comprehensive text editor guide
- Covered nano, VSCode, and vim
- Included practical examples and configurations
- Added decision matrix for editor selection
- Provided learning paths for each editor

---

**Next Article**: [package-managers](package-managers) - Install and manage software!

