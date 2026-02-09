export function generateQRCodeASCII(data: string): string {
  // Simple ASCII QR code representation for terminal
  // In production, you'd use a proper QR library, but for CLI we'll use a simple box
  const url = `https://pugarhuda.github.io/VibeLog/?address=${data}`;
  
  const lines = [
    '┌─────────────────────────────────┐',
    '│  Scan to verify on VibeLog     │',
    '│                                 │',
    '│  ████  ██  ████  ██  ████      │',
    '│  ████  ██  ████  ██  ████      │',
    '│  ██    ████    ████    ██      │',
    '│  ████  ██  ████  ██  ████      │',
    '│  ████  ██  ████  ██  ████      │',
    '│                                 │',
    `│  ${url.substring(0, 29)}  │`,
    '└─────────────────────────────────┘',
  ];

  return lines.join('\n');
}

export function generateVerificationURL(address: string, checkpointIndex?: number): string {
  let url = `https://pugarhuda.github.io/VibeLog/?address=${address}`;
  if (checkpointIndex !== undefined) {
    url += `&checkpoint=${checkpointIndex}`;
  }
  return url;
}

export function generateEmbedCode(address: string, checkpointCount: number): string {
  const verifierUrl = generateVerificationURL(address);
  
  return `<!-- VibeLog Verification Widget -->
<div style="border: 2px solid #f0b90b; border-radius: 8px; padding: 16px; max-width: 400px; font-family: sans-serif;">
  <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">🔐 Build Verified</h3>
  <p style="margin: 0 0 8px 0; color: #666;">
    This project uses <strong>VibeLog</strong> for transparent build logging.
  </p>
  <div style="background: #f9f9f9; padding: 12px; border-radius: 4px; margin: 12px 0;">
    <div style="font-size: 14px; color: #666;">Checkpoints</div>
    <div style="font-size: 32px; font-weight: bold; color: #f0b90b;">${checkpointCount}</div>
  </div>
  <a href="${verifierUrl}" 
     style="display: inline-block; background: #f0b90b; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
    Verify on BNB Chain →
  </a>
</div>`;
}
