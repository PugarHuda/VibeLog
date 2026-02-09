import inquirer from 'inquirer';

export async function confirmAction(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: true,
    },
  ]);
  return confirmed;
}

export async function selectOption<T>(
  message: string,
  choices: { name: string; value: T }[]
): Promise<T> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message,
      choices,
    },
  ]);
  return selected;
}

export async function getInput(message: string, defaultValue?: string): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message,
      default: defaultValue,
    },
  ]);
  return input;
}

export async function getPassword(message: string): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message,
      mask: '•',
    },
  ]);
  return password;
}
