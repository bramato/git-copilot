#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { GitChecker } = require('../src/utils/git-checker');
const { AnalyzeBranchCommand } = require('../src/commands/analyze-branch');
const { DocumentationCommand } = require('../src/commands/documentation');
const { ReviewCommand } = require('../src/commands/review');

const program = new Command();

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('Git Copilot', { horizontalLayout: 'full' })
  )
);

console.log(chalk.gray('AI-powered Git analysis and code review tool\n'));

// Check if git is installed before running any commands
async function checkGitInstallation() {
  const gitChecker = new GitChecker();
  const isGitInstalled = await gitChecker.isGitInstalled();
  
  if (!isGitInstalled) {
    gitChecker.showGitNotInstalledMessage();
    process.exit(1);
  }
}

program
  .name('git-copilot')
  .description('AI-powered Git analysis and code review CLI tool')
  .version('1.0.0');

program
  .command('analyze-branch')
  .alias('analyze')
  .description('Analyze current git branch for changes and improvements')
  .option('-b, --branch <branch>', 'specify branch to analyze (default: current)')
  .option('-v, --verbose', 'show detailed analysis')
  .action(async (options) => {
    await checkGitInstallation();
    const command = new AnalyzeBranchCommand();
    await command.execute(options);
  });

program
  .command('document')
  .alias('doc')
  .description('Create or update project documentation')
  .option('-f, --force', 'force update existing documentation')
  .option('-t, --type <type>', 'documentation type (readme, api, changelog)', 'readme')
  .action(async (options) => {
    await checkGitInstallation();
    const command = new DocumentationCommand();
    await command.execute(options);
  });

program
  .command('review')
  .description('Generate code review and create fix.md file')
  .option('-p, --path <path>', 'specific file or directory to review')
  .option('-s, --staged', 'review only staged changes')
  .action(async (options) => {
    await checkGitInstallation();
    const command = new ReviewCommand();
    await command.execute(options);
  });

program
  .command('init')
  .description('Initialize git-copilot in current repository')
  .action(async () => {
    await checkGitInstallation();
    console.log(chalk.green('Initializing git-copilot...'));
    // TODO: Add initialization logic
  });

// Handle unknown commands
program.on('command:*', function (operands) {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('Run "git-copilot --help" to see available commands'));
  process.exitCode = 1;
});

// Parse command line arguments
program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}