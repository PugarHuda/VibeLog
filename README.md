# VibeLog

**Proof of Vibe - Auto-generate verified AI build logs with onchain proof**

[Web Verifier](https://PugarHuda.github.io/VibeLog/) | [Sample Output](examples/BUILD_LOG.md) | [npm](https://www.npmjs.com/package/vibelog)

---

## What is VibeLog?

A CLI tool that automatically generates verified build logs with onchain proof. Think of it as **Git + AI Summarization + Blockchain Notary**.

> Track your work as you code. AI turns commits into readable narratives. Blockchain makes it tamper-proof. 3 commands, zero friction.

## Who Is This For?

**Hackathon Builders** - Auto-document your entire build journey. Judges get verifiable proof of when you built what, with onchain timestamps that can't be faked.

**Freelance Developers** - Show clients exactly what you built and when. No more "trust me" - give them a cryptographically verified build log with every delivery. Prove scope, timeline, and effort.

**Open Source Contributors** - Generate transparent contribution logs for grants, sponsorships, or portfolio. Every PR and commit summarized and timestamped onchain.

**Dev Agencies & Teams** - Automated progress reports for clients. Each sprint checkpoint is hashed and stored onchain - tamper-proof proof of delivery.

**Solo Builders & Indie Hackers** - Build in public with receipts. Share your verified build timeline on social media. Prove you shipped, not just talked.

## Features

### Core Features
- **Zero-friction logging** - git hooks auto-log every commit
- **Auto-detect** git commits, diffs, and code metrics
- **AI-powered** narrative generation (Google Gemini - free tier)
- **Onchain proof** via BSC (ultra-low gas costs)
- **Privacy-first** - only hashes go onchain, details stay local
- **Sensitive data detection** - auto-redacts API keys, emails, tokens
- **Beautiful CLI** with ASCII dashboard, colors, spinners, and interactive prompts
- **Web verifier** - anyone can verify checkpoints via browser, no CLI needed
- **Markdown export** - generates professional BUILD_LOG.md

### 🆕 Advanced Features

#### Offline Mode & Sync
- **Queue checkpoints offline** - no internet? No problem
- **Auto-sync** when connection restored
- Perfect for hackathons with unstable WiFi
```bash
vibe queue    # View pending checkpoints
vibe sync     # Sync all to blockchain
```

#### Team Collaboration
- **Multi-wallet support** - track team contributions
- **Role management** - assign roles to team members
- **Shared project tracking** - all members can create checkpoints
```bash
vibe team add 0x... --name "Alice" --role "Smart Contracts"
vibe team list
```

#### Analytics Dashboard
- **Coding patterns** - discover your most productive hours
- **Velocity metrics** - track commits/week, lines/day
- **Streak tracking** - maintain your coding streak
- **Language stats** - see what you code most
```bash
vibe analytics
vibe analytics --export json
```

#### GitHub Integration
- **Auto-sync releases** - create checkpoints from GitHub releases
- **Verified badges** - generate badges for README
- **README sections** - auto-generate verification sections
```bash
vibe github connect
vibe github badge
vibe github sync
```

#### Export Templates
- **Hackathon template** - optimized for judges
- **Client template** - professional reports
- **Grant template** - for grant applications
- **Multiple formats** - HTML, JSON, CSV, Markdown
```bash
vibe export --template hackathon --format html
```

#### Code Quality Analysis
- **AI-powered analysis** - detect issues and get recommendations
- **Security checks** - find sensitive data in commits
- **Best practices** - improve commit quality
- **Quality scoring** - get a quality score for your code
```bash
vibe quality check
vibe quality all
```

#### QR Code & Verification
- **QR code generation** - easy mobile verification
- **Embed widgets** - add to your website
- **Verification URLs** - shareable links
```bash
vibe qr
```

#### Backup & Restore
- **Full backups** - backup all your data
- **Easy restore** - restore from any backup
- **Version control** - track backup history
```bash
vibe backup create
vibe backup restore
```

#### Smart Notifications
- **Daily reminders** - never forget to checkpoint
- **Milestone alerts** - celebrate achievements
- **Streak reminders** - maintain your streak
```bash
vibe config remind
```

#### Shortcuts
- `vibe l "message"` - quick log
- `vibe c "summary"` - quick checkpoint
- `vibe s` - quick status

## Quick Start

```bash
# No install needed - just run with npx
npx vibelog init

# Or install globally
npm install -g vibelog

# Initialize in your project
vibe init

# Log your work (auto-detected from git)
vibe log "Implemented smart contract for token swap"

# Create onchain checkpoint
vibe checkpoint "Day 1 - Core contracts deployed"

# View your dashboard
vibe status

# Generate build report
vibe export
```

## Commands

### Core Commands

#### `vibe init`
Interactive setup wizard:
- Choose network (BSC testnet/mainnet)
- Setup wallet (import or generate)
- Configure AI summarization (optional, free)

#### `vibe log <message>`
Add a build log entry. Automatically captures:
- Latest git commit info
- File diff statistics
- Timestamp

Options:
- `-t, --tool <tool>` - AI tool used (e.g., "Claude", "Cursor")
- `-p, --prompt <prompt>` - AI prompt used
- `--auto` - Non-interactive mode (skips AI, fast - used by git hooks)

#### `vibe checkpoint <summary>`
Create an onchain checkpoint:
- Collects all logs since last checkpoint
- Generates SHA-256 hash of log data
- Submits proof to BSC smart contract
- Sanitizes summary for sensitive data
- Auto-queues if offline

Options:
- `--dry-run` - Estimate gas cost without submitting

#### `vibe export`
Generate a BUILD_LOG.md report:
- Full build narrative with timestamps
- Code metrics and statistics
- Onchain proof links
- AI-enhanced summaries (if enabled)

Options:
- `-o, --output <file>` - Output file path (default: BUILD_LOG.md)
- `-n, --name <name>` - Project name
- `--format <format>` - Export format: markdown, html, json, csv
- `--template <template>` - Template: default, hackathon, client, grant

#### `vibe verify`
Verify build log against blockchain:
- Compares local checkpoint hashes with onchain data
- Verifies timeline authenticity
- Confirms proof-of-work

#### `vibe status`
Beautiful dashboard showing:
- Project info, network, wallet, balance
- Build stats (logs, checkpoints, lines changed)
- Recent activity with time-ago formatting
- Checkpoint history

#### `vibe timeline`
Visual timeline of your entire build history:
- Day-by-day breakdown with timestamps
- Line change stats per session
- Checkpoint markers with tx hashes

### Git Hooks

#### `vibe hooks install`
Zero-friction auto-logging:
- Installs a git `post-commit` hook
- Every commit automatically creates a log entry
- No manual `vibe log` needed - just code and commit

#### `vibe hooks remove`
Remove the auto-logging hook

### Team Commands

#### `vibe team add [address]`
Add a team member to the project

#### `vibe team list`
List all team members

#### `vibe team remove [address]`
Remove a team member

### Offline & Sync

#### `vibe sync`
Sync all pending offline checkpoints to blockchain

#### `vibe queue`
Show offline checkpoint queue status

### GitHub Integration

#### `vibe github connect`
Connect to your GitHub repository

#### `vibe github sync`
Sync with GitHub releases

#### `vibe github badge`
Generate VibeLog badge for README

#### `vibe github status`
Show GitHub connection status

### Analytics

#### `vibe analytics`
Show comprehensive analytics dashboard:
- Coding patterns
- Velocity metrics
- Code quality
- Language statistics

Options:
- `--export <format>` - Export analytics (json or csv)

### Code Quality

#### `vibe quality check [logId]`
Analyze code quality of specific log (or latest)

#### `vibe quality all`
Analyze quality of all logs

### Configuration

#### `vibe config show`
Display current configuration

#### `vibe config set <key> <value>`
Set configuration values

#### `vibe config remind`
Setup reminders (daily, milestone, streak)

### Backup & Restore

#### `vibe backup create`
Create a full backup of all VibeLog data

#### `vibe backup list`
List all available backups

#### `vibe backup restore [timestamp]`
Restore from a backup

### QR Code

#### `vibe qr [checkpoint]`
Generate QR code for verification

### Shortcuts

- `vibe l <message>` - Shortcut for log
- `vibe c <summary>` - Shortcut for checkpoint
- `vibe s` - Shortcut for status

### Gas Optimization

#### `vibe gas check`
Check current BSC gas prices and get cost estimates

#### `vibe gas wait [maxGwei]`
Wait for gas price to drop below threshold (default: 5 Gwei)

**Example:**
```bash
# Check gas before checkpoint
vibe gas check

# Wait for optimal gas
vibe gas wait 5

# Create checkpoint when gas is low
vibe checkpoint "Milestone complete"
```

## Setup

### Prerequisites
- Node.js 18+
- Git (optional but recommended)

### Environment Variables

Create a `.env` file:

```env
# Required for onchain features
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=deployed_contract_address

# Optional - AI summaries (free)
GEMINI_API_KEY=your_gemini_api_key
```

### AI Setup (Free)

VibeLog uses **Google Gemini API** (free tier):
- 15 requests/minute
- 1M tokens/day
- Get your key: https://aistudio.google.com/apikey

### Network Setup

**BSC Testnet** (free - for development):
- Get testnet BNB: https://www.bnbchain.org/en/testnet-faucet

**BSC Mainnet** (for production):
- Requires small amount of BNB (~$0.01 per checkpoint)
- Get BNB from any exchange (Binance, etc.)

### Contract Deployment

```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

## How It Works

```
You Code  >>  vibe log  >>  AI Summary  >>  SHA-256 Hash  >>  BSC Onchain
```

### Privacy Model

```
ONCHAIN (public):           LOCAL (private):
- SHA-256 hash              - Full log messages
- Short summary (200 chars) - Git diffs & commits
- Timestamp                 - AI prompts used
- Builder address           - File contents
```

Only a hash and user-controlled summary are stored onchain. All detailed logs remain local.

### Verification

Anyone can verify a builder's work:

**Via Web** (no install needed):
Visit the [Web Verifier](https://PugarHuda.github.io/VibeLog/), enter a wallet address, and see all checkpoints with onchain proof.

**Via CLI**:
```bash
vibe verify BUILD_LOG.md
```

## Use Case Examples

### Hackathon
```bash
vibe init                              # Setup at project start
vibe hooks install                     # Auto-log every commit
# ...code for 2 days...
vibe checkpoint "Day 1 - MVP complete" # End of day 1
vibe checkpoint "Day 2 - Final polish" # Before submission
vibe export --template hackathon       # Generate BUILD_LOG.md for judges
vibe github badge                      # Add badge to README
vibe qr                                # Generate QR for presentation
```

### Freelance Project
```bash
vibe init                                    # Setup at project kickoff
vibe hooks install                           # Auto-log every commit
vibe team add <client-address>               # Add client to team
# ...work on client project...
vibe checkpoint "Sprint 1 - Auth system"     # End of sprint
vibe checkpoint "Sprint 2 - Dashboard"       # End of sprint
vibe export --template client -n "Client Project"  # Send report to client
```

### Open Source / Build in Public
```bash
vibe init
vibe hooks install
vibe github connect                          # Connect to GitHub
# ...contribute to repo...
vibe checkpoint "Added GraphQL API layer"
vibe export --format html                    # Share on blog
vibe analytics                               # Show your stats
```

### Team Development
```bash
vibe init
vibe team add 0x... --name "Alice" --role "Backend"
vibe team add 0x... --name "Bob" --role "Frontend"
vibe hooks install
# ...team codes together...
vibe analytics                               # Track team velocity
vibe export --template default               # Generate team report
```

## Smart Contract

`VibeProof.sol` - deployed on BSC

```solidity
function attestVibe(string memory summary, bytes32 logHash) external
function getCheckpoint(address builder, uint256 index) external view
function getCheckpointCount(address builder) external view
```

## Tech Stack

All free/open-source:
- **Runtime**: Node.js / TypeScript (ESM)
- **CLI**: Commander.js, Chalk, Ora, Inquirer
- **Git**: simple-git
- **Blockchain**: ethers.js v6, BNB Smart Chain (BSC)
- **AI**: Google Gemini API (free tier)
- **Smart Contract**: Solidity, Hardhat

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev -- init

# Build
npm run build

# Run tests
npm test

# Compile contract
npm run compile
```

## Cost Breakdown

| Component | Cost |
|-----------|------|
| npm packages | Free |
| Google Gemini API | Free (15 RPM) |
| BSC Testnet | Free |
| BSC Mainnet checkpoint | ~$0.01 |
| Hardhat / TypeScript | Free |

**Total cost for real-world usage: < $0.10 per project**

### Gas Optimization
With built-in gas monitoring:
- Check gas prices before submitting
- Wait for optimal gas prices
- Save even more on already-low BSC costs
- Compare with Ethereum (500x savings!)

## Why VibeLog?

Whether you're building for a hackathon, delivering to a client, or shipping your own product - everyone needs build documentation. Most developers either:
- Forget to document until the last minute
- Write vague logs from memory after the fact
- Can't prove when they actually built what

VibeLog solves all three: it **auto-captures** your work as you code, **AI-summarizes** it into readable narratives, and **anchors proof onchain** so anyone can verify it's real.

### Perfect for BNB Chain Hackathons

- ✅ **Prove authenticity** - Cryptographic proof you built during the event
- ✅ **Impress judges** - Professional build logs with onchain verification
- ✅ **Stand out** - QR codes, badges, and verified timelines
- ✅ **Ultra-low cost** - BSC gas fees are negligible (~$0.01 per checkpoint)
- ✅ **Offline support** - Queue checkpoints, sync later
- ✅ **Team-friendly** - Track multi-developer contributions

Run `npx vibelog init` in any project and start logging in 30 seconds.

## Documentation

- 📖 [Complete Feature Guide](docs/FEATURES.md)
- 🏆 [Hackathon Builder's Guide](docs/HACKATHON_GUIDE.md)
- ⛽ [Gas Optimization Guide](docs/GAS_OPTIMIZATION.md)
- 📝 [Sample Build Log](examples/BUILD_LOG.md)
- 🌐 [Web Verifier](https://PugarHuda.github.io/VibeLog/)
- 📊 [Test Results](TEST_RESULTS.md)
- 🔄 [Changelog](CHANGELOG.md)

## License

MIT

---

*Built on BNB Chain. Powered by AI. Verified onchain.*
