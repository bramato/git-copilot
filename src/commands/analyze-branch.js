const chalk = require('chalk');
const ora = require('ora');
const { PRGitExpert } = require('../../agents/pr-git-expert');
const { OpenRouterAgent } = require('openrouter-agents');

class AnalyzeBranchCommand {
  constructor() {
    this.spinner = null;
  }

  /**
   * Execute the analyze-branch command
   * @param {Object} options - Command options
   */
  async execute(options) {
    try {
      this.spinner = ora('Initializing branch analysis...').start();
      
      // Initialize OpenRouter client
      const openrouterClient = new OpenRouterAgent({
        apiKey: process.env.OPENROUTER_API_KEY,
        appName: 'git-copilot',
        siteName: 'https://github.com/bramato/git-copilot'
      });

      // Initialize PR/Git expert agent
      const prExpert = new PRGitExpert(openrouterClient);
      
      this.spinner.text = 'Analyzing branch changes...';
      
      // Perform branch analysis
      const analysisResult = await prExpert.analyzeBranch(options.branch, options);
      
      this.spinner.stop();

      if (!analysisResult.success) {
        console.error(chalk.red('❌ Analysis failed:'), analysisResult.error);
        process.exit(1);
      }

      // Display results
      this.displayAnalysisResults(analysisResult, options);

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
   * Display analysis results in a formatted way
   * @param {Object} result - Analysis result
   * @param {Object} options - Command options
   */
  displayAnalysisResults(result, options) {
    const { analysis, metadata } = result;

    // Header
    console.log('\n' + chalk.cyan.bold('🔍 Branch Analysis Report'));
    console.log(chalk.gray('─'.repeat(50)));

    // Metadata
    console.log(chalk.white.bold('\nBranch Information:'));
    console.log(chalk.gray(`  Current Branch: ${metadata.currentBranch}`));
    console.log(chalk.gray(`  Base Branch: ${metadata.baseBranch}`));
    console.log(chalk.gray(`  Commits: ${metadata.commitCount}`));
    console.log(chalk.gray(`  Files Changed: ${metadata.filesChanged}`));
    console.log(chalk.gray(`  Insertions: ${chalk.green(`+${metadata.insertions}`)}`));
    console.log(chalk.gray(`  Deletions: ${chalk.red(`-${metadata.deletions}`)}`));

    // Analysis results
    if (analysis.rawResponse) {
      // If AI returned raw text instead of JSON
      console.log(chalk.white.bold('\n📋 Analysis:'));
      console.log(analysis.summary);
    } else {
      // Structured analysis
      this.displayStructuredAnalysis(analysis);
    }

    // Verbose output
    if (options.verbose) {
      this.displayVerboseInfo(metadata, analysis);
    }

    // Footer
    console.log('\n' + chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('✨ Analysis complete! Use the insights above to improve your PR.'));
  }

  /**
   * Display structured analysis results
   * @param {Object} analysis - Structured analysis object
   */
  displayStructuredAnalysis(analysis) {
    if (analysis.summary) {
      console.log(chalk.white.bold('\n📋 Summary:'));
      console.log(this.formatText(analysis.summary));
    }

    if (analysis['Code Quality']) {
      console.log(chalk.white.bold('\n🎯 Code Quality:'));
      console.log(this.formatText(analysis['Code Quality']));
    }

    if (analysis['Commit Quality']) {
      console.log(chalk.white.bold('\n📝 Commit Quality:'));
      console.log(this.formatText(analysis['Commit Quality']));
    }

    if (analysis['Potential Issues']) {
      console.log(chalk.white.bold('\n⚠️  Potential Issues:'));
      console.log(chalk.yellow(this.formatText(analysis['Potential Issues'])));
    }

    if (analysis.Suggestions) {
      console.log(chalk.white.bold('\n💡 Suggestions:'));
      console.log(chalk.cyan(this.formatText(analysis.Suggestions)));
    }

    if (analysis['PR Recommendations']) {
      console.log(chalk.white.bold('\n🚀 PR Recommendations:'));
      console.log(chalk.green(this.formatText(analysis['PR Recommendations'])));
    }
  }

  /**
   * Display verbose information
   * @param {Object} metadata - Analysis metadata
   * @param {Object} analysis - Analysis results
   */
  displayVerboseInfo(metadata, analysis) {
    console.log(chalk.white.bold('\n🔍 Detailed Information:'));
    
    if (metadata.commitDetails) {
      console.log(chalk.gray('\n  Recent Commits:'));
      metadata.commitDetails.forEach(commit => {
        console.log(chalk.gray(`    • ${commit.hash}: ${commit.subject}`));
        console.log(chalk.gray(`      by ${commit.author} ${commit.date}`));
      });
    }

    if (analysis.error) {
      console.log(chalk.red('\n⚠️  Analysis Error:'));
      console.log(chalk.red(`  ${analysis.error}`));
    }

    if (analysis.fallback) {
      console.log(chalk.yellow('\n⚠️  Using fallback analysis due to AI service issues'));
    }
  }

  /**
   * Format text for better display
   * @param {string} text - Text to format
   * @returns {string}
   */
  formatText(text) {
    if (typeof text !== 'string') {
      return JSON.stringify(text, null, 2);
    }

    return text
      .split('\n')
      .map(line => `  ${line}`)
      .join('\n');
  }
}

module.exports = { AnalyzeBranchCommand };