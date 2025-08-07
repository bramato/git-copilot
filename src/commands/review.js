const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { CodeReviewExpert } = require('../../agents/code-review-expert');
const { OpenRouterAgent } = require('openrouter-agents');

class ReviewCommand {
  constructor() {
    this.spinner = null;
  }

  /**
   * Execute the review command
   * @param {Object} options - Command options
   */
  async execute(options) {
    try {
      console.log(chalk.cyan.bold('🔍 Git Copilot Code Review'));
      console.log(chalk.gray('─'.repeat(50)));

      // Show what will be reviewed
      await this.showReviewScope(options);

      // Confirm action
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with code review?',
          default: true
        }
      ]);

      if (!answer.proceed) {
        console.log(chalk.yellow('Review cancelled.'));
        return;
      }

      this.spinner = ora('Initializing code review...').start();
      
      // Initialize OpenRouter client
      const openrouterClient = new OpenRouterAgent({
        apiKey: process.env.OPENROUTER_API_KEY,
        appName: 'git-copilot',
        siteName: 'https://github.com/bramato/git-copilot'
      });

      // Initialize Code Review expert agent
      const reviewExpert = new CodeReviewExpert(openrouterClient);
      
      this.spinner.text = 'Analyzing code and generating review...';
      
      // Perform code review
      const reviewResult = await reviewExpert.performReview(options);
      
      this.spinner.stop();

      if (!reviewResult.success) {
        console.error(chalk.red('❌ Code review failed:'), reviewResult.error);
        process.exit(1);
      }

      // Display results
      this.displayReviewResults(reviewResult, options);

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
   * Show what will be reviewed based on options
   * @param {Object} options - Command options
   */
  async showReviewScope(options) {
    console.log(chalk.white.bold('📋 Review Scope:'));
    
    if (options.path) {
      console.log(chalk.cyan(`   Target: ${options.path}`));
    } else if (options.staged) {
      console.log(chalk.cyan('   Target: Staged changes only'));
      
      // Show staged files
      try {
        const { execSync } = require('child_process');
        const stagedFiles = execSync('git diff --cached --name-only', { 
          encoding: 'utf8' 
        }).trim().split('\n').filter(f => f);
        
        if (stagedFiles.length > 0) {
          console.log(chalk.gray('   Staged files:'));
          stagedFiles.slice(0, 10).forEach(file => {
            console.log(chalk.gray(`     • ${file}`));
          });
          if (stagedFiles.length > 10) {
            console.log(chalk.gray(`     ... and ${stagedFiles.length - 10} more`));
          }
        } else {
          console.log(chalk.yellow('   No staged files found'));
        }
      } catch (error) {
        console.log(chalk.red('   Error reading staged files'));
      }
    } else {
      console.log(chalk.cyan('   Target: Recent changes in current branch'));
    }
    
    console.log('');
  }

  /**
   * Display code review results
   * @param {Object} result - Review result
   * @param {Object} options - Command options
   */
  displayReviewResults(result, options) {
    const severityEmojis = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵',
      INFO: '⚪'
    };

    // Header
    console.log(chalk.green.bold('✅ Code Review Complete!'));
    console.log(chalk.gray('─'.repeat(50)));

    // Summary
    console.log(chalk.white.bold('📊 Review Summary:'));
    console.log(chalk.gray(`   Files Reviewed: ${result.filesReviewed}`));
    console.log(chalk.gray(`   Issues Found: ${result.issuesFound}`));
    
    if (result.summary) {
      const { summary } = result;
      if (summary.criticalIssues > 0) {
        console.log(chalk.red(`   ${severityEmojis.CRITICAL} Critical: ${summary.criticalIssues}`));
      }
      if (summary.highIssues > 0) {
        console.log(chalk.red(`   ${severityEmojis.HIGH} High: ${summary.highIssues}`));
      }
      if (summary.mediumIssues > 0) {
        console.log(chalk.yellow(`   ${severityEmojis.MEDIUM} Medium: ${summary.mediumIssues}`));
      }
      if (summary.lowIssues > 0) {
        console.log(chalk.blue(`   ${severityEmojis.LOW} Low: ${summary.lowIssues}`));
      }
    }

    // Fix.md file info
    console.log(chalk.white.bold('\n📄 Review Report:'));
    console.log(chalk.cyan(`   Generated: ${result.fixMdPath}`));
    console.log(chalk.gray('   Open this file to see detailed findings and recommendations'));

    // Priority actions
    if (result.summary && (result.summary.criticalIssues > 0 || result.summary.highIssues > 0)) {
      console.log(chalk.white.bold('\n⚠️  Priority Actions:'));
      if (result.summary.criticalIssues > 0) {
        console.log(chalk.red('   • Address CRITICAL issues immediately'));
      }
      if (result.summary.highIssues > 0) {
        console.log(chalk.red('   • Review HIGH priority issues'));
      }
      console.log(chalk.cyan('   • Check fix.md for detailed recommendations'));
    }

    // Next steps
    console.log(chalk.white.bold('\n📝 Next Steps:'));
    console.log(chalk.cyan(`   1. Review the detailed report: ${result.fixMdPath}`));
    console.log(chalk.cyan('   2. Address critical and high-priority issues first'));
    console.log(chalk.cyan('   3. Implement suggested improvements'));
    console.log(chalk.cyan('   4. Run tests to ensure fixes don\'t break functionality'));
    console.log(chalk.cyan('   5. Commit your improvements'));

    // Footer
    console.log('\n' + chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('✨ Code review complete! Check fix.md for detailed analysis.'));
  }
}

module.exports = { ReviewCommand };