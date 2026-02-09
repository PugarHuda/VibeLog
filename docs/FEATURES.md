# VibeLog - Complete Feature Guide

## 🎯 Core Features

### 1. Build Logging
```bash
# Basic logging
vibe log "Implemented user authentication"

# With AI context
vibe log "Added payment gateway" -t "Claude" -p "Integrate Stripe API"

# Auto-logging with git hooks
vibe hooks install
# Now every commit automatically creates a log
```

### 2. Onchain Checkpoints
```bash
# Create checkpoint
vibe checkpoint "Day 1 - MVP Complete"

# Dry run (estimate gas)
vibe checkpoint "Test checkpoint" --dry-run

# Offline mode (queue for later)
# If transaction fails, automatically queued
```

### 3. Export & Reports
```bash
# Basic markdown export
vibe export

# With project name
vibe export -n "My Awesome DApp"

# Different formats
vibe export --format html --template hackathon
vibe export --format json
vibe export --format csv

# Templates
vibe export --template hackathon  # For hackathon judges
vibe export --template client     # For client reports
vibe export --template grant      # For grant applications
```

## 🚀 New Advanced Features

### 4. Offline Mode & Sync
```bash
# View offline queue
vibe queue

# Sync all pending checkpoints
vibe sync

# Automatic offline queueing
# When checkpoint fails, it's automatically saved
# Sync later when you have internet
```

**Use Case**: Perfect for hackathons with unstable internet. Code offline, sync checkpoints later.

### 5. Team Collaboration
```bash
# Add team member
vibe team add 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# With details
vibe team add 0x... --name "Alice" --role "Smart Contract Dev"

# List team
vibe team list

# Remove member
vibe team remove 0x...
```

**Use Case**: Multi-developer projects. Track contributions from all team members.

### 6. Analytics Dashboard
```bash
# View analytics
vibe analytics

# Export analytics
vibe analytics --export json
vibe analytics --export csv
```

**Shows**:
- Coding patterns (most productive hours/days)
- Velocity metrics (commits/week, lines/day)
- Streak tracking
- Language statistics
- Code quality metrics

### 7. GitHub Integration
```bash
# Connect to GitHub
vibe github connect

# Sync with releases
vibe github sync

# Generate badge
vibe github badge

# Check status
vibe github status
```

**Features**:
- Auto-sync with GitHub releases
- Generate verified badges for README
- Create checkpoints from releases

### 8. Backup & Restore
```bash
# Create backup
vibe backup create

# List backups
vibe backup list

# Restore from backup
vibe backup restore [timestamp]
```

**Backs up**:
- All logs
- All checkpoints
- Configuration
- Team data
- Offline queue

### 9. Configuration Management
```bash
# View config
vibe config show

# Set values
vibe config set ai.enabled true
vibe config set ai.provider gemini

# Setup reminders
vibe config remind
```

**Reminder Types**:
- Daily checkpoint reminders
- Milestone reminders (every N checkpoints)
- Streak reminders

### 10. QR Code & Verification
```bash
# Generate QR code
vibe qr

# For specific checkpoint
vibe qr 5

# Generate embed widget
# Interactive prompt will guide you
```

**Features**:
- ASCII QR code in terminal
- Verification URL generation
- HTML embed widget for websites
- Mobile-friendly verification

### 11. Code Quality Analysis
```bash
# Check latest log
vibe quality check

# Check specific log
vibe quality check <log-id>

# Analyze all logs
vibe quality all
```

**Detects**:
- Security issues (sensitive files)
- Large commits
- Poor commit messages
- Missing tests
- Best practice violations

**AI-Powered** (if Gemini API enabled):
- Code quality assessment
- Personalized recommendations
- Commit message suggestions

### 12. Shortcuts
```bash
# Quick commands
vibe l "message"    # Same as: vibe log "message"
vibe c "summary"    # Same as: vibe checkpoint "summary"
vibe s              # Same as: vibe status
```

## 📊 Export Templates

### Hackathon Template
Perfect for hackathon submissions:
- Quick stats overview
- Verification links prominent
- Timeline focused
- Judge-friendly format

```bash
vibe export --template hackathon -n "My Hackathon Project"
```

### Client Template
Professional format for client deliverables:
- Executive summary
- Deliverables section
- Development activity breakdown
- Blockchain verification

```bash
vibe export --template client -n "Client Project Name"
```

### Grant Template
Optimized for grant applications:
- Proof of work emphasis
- Metrics and statistics
- Technical stack details
- Transparent verification

```bash
vibe export --template grant -n "Grant Application"
```

## 🔐 Security Features

### Encrypted Private Keys
```bash
# During init, option to encrypt private key
# Password-protected storage
# Never stored in plaintext
```

### Sensitive Data Detection
Automatically redacts:
- API keys (sk_, pk_, AIza...)
- Email addresses
- Private keys (0x...)
- GitHub tokens (ghp_...)

### Rate Limiting
Built-in protection against:
- API abuse
- Excessive blockchain calls
- Spam prevention

## 💡 Pro Tips

### 1. Hackathon Workflow
```bash
# Day 0 - Setup
vibe init
vibe hooks install
vibe config remind  # Set daily reminder

# During hackathon - just code!
# Logs created automatically on each commit

# End of each day
vibe checkpoint "Day 1 - Core features"
vibe checkpoint "Day 2 - Final polish"

# Before submission
vibe export --template hackathon -n "My Project"
vibe github badge  # Add to README
```

### 2. Freelance Project
```bash
# Project start
vibe init
vibe team add <client-address>

# Weekly checkpoints
vibe checkpoint "Week 1 - Authentication system"
vibe checkpoint "Week 2 - Dashboard UI"

# Client report
vibe export --template client -n "Client Project"
```

### 3. Open Source Contribution
```bash
# Setup
vibe init
vibe github connect

# Regular development
vibe hooks install  # Auto-log commits

# Milestone checkpoints
vibe checkpoint "v1.0.0 - Initial release"

# Portfolio showcase
vibe export --format html
vibe qr  # Generate verification QR
```

### 4. Build in Public
```bash
# Daily updates
vibe checkpoint "Day 1 - Started smart contracts"

# Analytics for transparency
vibe analytics > analytics.txt

# Share verification
vibe qr  # Share QR on Twitter
vibe github badge  # Add to README
```

## 🎨 Customization

### AI Provider
Currently supports:
- Google Gemini (free tier)
- More providers coming soon

### Export Formats
- Markdown (default)
- HTML (interactive)
- JSON (structured data)
- CSV (spreadsheet-friendly)

### Network
- BSC Testnet (free, for development)
- BSC Mainnet (production, ~$0.01/checkpoint)

## 📈 Metrics Tracked

### Automatic
- Commits count
- Lines added/deleted
- Files changed
- Time periods
- Gas spent

### Analytics
- Coding hours
- Productive days
- Streak tracking
- Language usage
- Commit frequency

### Quality
- Code quality score
- Issue detection
- Best practices
- Security checks

## 🔗 Integration Points

### Git
- Auto-logging via hooks
- Commit info extraction
- Diff analysis
- Framework detection

### GitHub
- Release syncing
- Badge generation
- README integration

### Blockchain
- BNB Smart Chain
- Onchain verification
- Gas optimization
- Transaction tracking

### AI
- Google Gemini API
- Code analysis
- Narrative generation
- Quality assessment

## 🎯 Use Cases

1. **Hackathons**: Prove you built it during the event
2. **Freelancing**: Show clients verifiable progress
3. **Grants**: Demonstrate consistent development
4. **Open Source**: Transparent contribution tracking
5. **Portfolio**: Verified project timeline
6. **Team Projects**: Multi-contributor tracking
7. **Build in Public**: Share verified progress
8. **Code Reviews**: Quality analysis
9. **Learning**: Track your coding journey
10. **Compliance**: Audit trail for development

## 🚀 Coming Soon

- Multi-chain support (Polygon, Arbitrum, Base)
- More AI providers (OpenAI, Anthropic)
- PDF export
- Mobile app
- Browser extension
- VS Code extension
- Slack/Discord notifications
- CI/CD integrations
- NFT badges for milestones

---

**Need help?** Run `vibe --help` or check specific command help with `vibe <command> --help`
