const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { DocumentationExpert } = require('../../agents/documentation-expert');
const { OpenRouterAgent } = require('openrouter-agents');

class DocumentationCommand {
  constructor() {
    this.spinner = null;
  }

  /**
   * Execute the documentation command
   * @param {Object} options - Command options
   */
  async execute(options) {
    try {
      console.log(chalk.cyan.bold('📚 Git Copilot Documentation Generator'));
      console.log(chalk.gray('─'.repeat(50)));

      // Confirm action if not forced
      if (!options.force && await this.shouldProceed(options)) {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: `Generate/update ${options.type} documentation?`,
            default: true
          }
        ]);

        if (!answer.proceed) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }

      this.spinner = ora('Initializing documentation generator...').start();
      
      // Initialize OpenRouter client
      const openrouterClient = new OpenRouterAgent({
        apiKey: process.env.OPENROUTER_API_KEY,
        appName: 'git-copilot',
        siteName: 'https://github.com/bramato/git-copilot'
      });

      // Initialize Documentation expert agent
      const docExpert = new DocumentationExpert(openrouterClient);
      
      this.spinner.text = `Analyzing project and generating ${options.type} documentation...`;
      
      // Generate documentation
      const result = await docExpert.createDocumentation(options);
      
      this.spinner.stop();

      if (!result.success) {
        console.error(chalk.red('❌ Documentation generation failed:'), result.error);
        process.exit(1);
      }

      // Display results
      this.displayResults(result, options);

    } catch (error) {
      if (this.spinner) {
        this.spinner.stop();
      }
      
      console.error(chalk.red('❌ Command failed:'), error.message);
      
      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log(chalk.yellow('\n💡 Setup required:'));
        console.log(chalk.gray('   Please set your OpenRouter API key:'));
        console.log(chalk.cyan('   export OPENROUTER_API_KEY="your-api-key-here"'));
        console.log(chalk.gray('   Get your key at: https://openrouter.ai/'));
      }
      
      process.exit(1);
    }
  }

  /**
   * Check if we should proceed with documentation generation
   * @param {Object} options - Command options
   * @returns {Promise<boolean>}
   */
  async shouldProceed(options) {
    const fs = require('fs').promises;
    
    try {
      // Check if target file exists
      const targetFiles = {
        readme: 'README.md',
        api: 'API.md',
        changelog: 'CHANGELOG.md'
      };
      
      const targetFile = targetFiles[options.type];
      if (targetFile) {
        await fs.access(targetFile);
        return true; // File exists, ask for confirmation
      }
      
      return false; // File doesn't exist, proceed without confirmation
    } catch (error) {
      return false; // File doesn't exist
    }
  }

  /**
   * Display documentation generation results
   * @param {Object} result - Generation result
   * @param {Object} options - Command options
   */
  displayResults(result, options) {
    console.log(chalk.green.bold(`✅ ${result.type.toUpperCase()} documentation ${result.action}!`));
    console.log(chalk.gray(`   File: ${result.filePath}`));
    
    if (result.content) {
      const preview = result.content.split('\n').slice(0, 10).join('\n');
      console.log(chalk.white.bold('\n📄 Preview:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(preview);
      if (result.content.split('\n').length > 10) {
        console.log(chalk.gray('... (truncated)'));
      }
      console.log(chalk.gray('─'.repeat(40)));
    }

    // Show next steps
    console.log(chalk.white.bold('\n📝 Next Steps:'));
    console.log(chalk.cyan('   • Review and customize the generated documentation'));
    console.log(chalk.cyan('   • Add project-specific details as needed'));
    console.log(chalk.cyan('   • Commit the changes to your repository'));
    
    if (options.type === 'readme') {
      console.log(chalk.cyan('   • Update badges and links for your specific project'));
      console.log(chalk.cyan('   • Add screenshots or examples if applicable'));
    }

    console.log('\n' + chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('✨ Documentation generation complete!'));
  }
}

module.exports = { DocumentationCommand };