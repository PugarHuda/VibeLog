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

- **Zero-friction logging** - git hooks auto-log every commit
- **Auto-detect** git commits, diffs, and code metrics
- **AI-powered** narrative generation (Google Gemini - free tier)
- **Onchain proof** via BSC (ultra-low gas costs)
- **Privacy-first** - only hashes go onchain, details stay local
- **Sensitive data detection** - auto-redacts API keys, emails, tokens
- **Beautiful CLI** with ASCII dashboard, colors, spinners, and interactive prompts
- **Web verifier** - anyone can verify checkpoints via browser, no CLI needed
- **Markdown export** - generates professional BUILD_LOG.md

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

### `vibe init`
Interactive setup wizard:
- Choose network (BSC testnet/mainnet)
- Setup wallet (import or generate)
- Configure AI summarization (optional, free)

### `vibe log <message>`
Add a build log entry. Automatically captures:
- Latest git commit info
- File diff statistics
- Timestamp

Options:
- `-t, --tool <tool>` - AI tool used (e.g., "Claude", "Cursor")
- `-p, --prompt <prompt>` - AI prompt used
- `--auto` - Non-interactive mode (skips AI, fast - used by git hooks)

### `vibe checkpoint <summary>`
Create an onchain checkpoint:
- Collects all logs since last checkpoint
- Generates SHA-256 hash of log data
- Submits proof to BSC smart contract
- Sanitizes summary for sensitive data

### `vibe export`
Generate a BUILD_LOG.md report:
- Full build narrative with timestamps
- Code metrics and statistics
- Onchain proof links
- AI-enhanced summaries (if enabled)

Options:
- `-o, --output <file>` - Output file path (default: BUILD_LOG.md)
- `-n, --name <name>` - Project name

### `vibe verify`
Verify build log against blockchain:
- Compares local checkpoint hashes with onchain data
- Verifies timeline authenticity
- Confirms proof-of-work

### `vibe status`
Beautiful dashboard showing:
- Project info, network, wallet, balance
- Build stats (logs, checkpoints, lines changed)
- Recent activity with time-ago formatting
- Checkpoint history

### `vibe timeline`
Visual timeline of your entire build history:
- Day-by-day breakdown with timestamps
- Line change stats per session
- Checkpoint markers with tx hashes

### `vibe hooks install` / `vibe hooks remove`
Zero-friction auto-logging:
- Installs a git `post-commit` hook
- Every commit automatically creates a log entry
- No manual `vibe log` needed - just code and commit

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
# ...code for 2 days...
vibe checkpoint "Day 1 - MVP complete" # End of day 1
vibe checkpoint "Day 2 - Final polish" # Before submission
vibe export                            # Generate BUILD_LOG.md for judges
```

### Freelance Project
```bash
vibe init                                    # Setup at project kickoff
vibe hooks install                           # Auto-log every commit
# ...work on client project...
vibe checkpoint "Sprint 1 - Auth system"     # End of sprint
vibe checkpoint "Sprint 2 - Dashboard"       # End of sprint
vibe export -n "Client Project"              # Send report to client
```

### Open Source / Build in Public
```bash
vibe init
vibe hooks install
# ...contribute to repo...
vibe checkpoint "Added GraphQL API layer"
vibe export                                  # Share on Twitter/blog
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

## Why VibeLog?

Whether you're building for a hackathon, delivering to a client, or shipping your own product - everyone needs build documentation. Most developers either:
- Forget to document until the last minute
- Write vague logs from memory after the fact
- Can't prove when they actually built what

VibeLog solves all three: it **auto-captures** your work as you code, **AI-summarizes** it into readable narratives, and **anchors proof onchain** so anyone can verify it's real.

Run `npx vibelog init` in any project and start logging in 30 seconds.

## License

MIT

---

*Built on BNB Chain. Powered by AI. Verified onchain.*
