import chalk from 'chalk';

const BANNER = `
 __     __ _  _            _
 \\ \\   / /(_)| |__   ___  | |     ___    __ _
  \\ \\ / / | || '_ \\ / _ \\ | |    / _ \\  / _\` |
   \\ V /  | || |_) |  __/ | |___| (_) || (_| |
    \\_/   |_||_.__/ \\___| |______\\___/  \\__, |
                                         |___/`;

export function printBanner(): void {
  console.log(chalk.hex('#f0b90b')(BANNER));
  console.log(chalk.gray('  Verified AI Build Logs on BNB Chain\n'));
}
