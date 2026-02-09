import chalk from 'chalk';
import { loadConfig } from '../utils/config.js';
import { generateQRCodeASCII, generateVerificationURL, generateEmbedCode } from '../utils/qrcode.js';
import { writeFileSync } from 'fs';
import inquirer from 'inquirer';

export async function qrCommand(checkpointIndex?: number): Promise<void> {
  const config = loadConfig();
  const address = config.wallet.address;

  console.log(chalk.bold('\n🔍 VibeLog Verification QR Code\n'));
  
  const qrCode = generateQRCodeASCII(address);
  console.log(chalk.cyan(qrCode));
  
  const url = generateVerificationURL(address, checkpointIndex);
  console.log(chalk.gray(`\nVerification URL:`));
  console.log(chalk.yellow(url));
  
  console.log(chalk.gray(`\nCheckpoints: ${config.stats.totalCheckpoints}`));
  console.log(chalk.gray(`Network: ${config.network.name}`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Generate embed code for website', value: 'embed' },
        { name: 'Save URL to file', value: 'save' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  if (action === 'embed') {
    const embedCode = generateEmbedCode(address, config.stats.totalCheckpoints);
    console.log(chalk.bold('\n📝 Embed Code:\n'));
    console.log(embedCode);
    
    const { saveEmbed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveEmbed',
        message: 'Save to vibelog-widget.html?',
        default: true,
      },
    ]);

    if (saveEmbed) {
      writeFileSync('vibelog-widget.html', embedCode);
      console.log(chalk.green('\n✓ Saved to vibelog-widget.html'));
    }
  } else if (action === 'save') {
    writeFileSync('VERIFICATION_URL.txt', url);
    console.log(chalk.green('\n✓ Saved to VERIFICATION_URL.txt'));
  }
}
