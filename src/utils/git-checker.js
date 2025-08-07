const { execSync } = require('child_process');
const chalk = require('chalk');
const figlet = require('figlet');

class GitChecker {
  /**
   * Check if Git is installed on the system
   * @returns {Promise<boolean>}
   */
  async isGitInstalled() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Display ASCII art message when Git is not installed
   */
  showGitNotInstalledMessage() {
    console.log('\n');
    
    // ASCII art for "NO GIT"
    const asciiArt = `
    ███╗   ██╗ ██████╗      ██████╗ ██╗████████╗
    ████╗  ██║██╔═══██╗    ██╔════╝ ██║╚══██╔══╝
    ██╔██╗ ██║██║   ██║    ██║  ███╗██║   ██║   
    ██║╚██╗██║██║   ██║    ██║   ██║██║   ██║   
    ██║ ╚████║╚██████╔╝    ╚██████╔╝██║   ██║   
    ╚═╝  ╚═══╝ ╚═════╝      ╚═════╝ ╚═╝   ╚═╝   
    `;
    
    console.log(chalk.red(asciiArt));
    
    console.log(chalk.red.bold('ERROR: Git is not installed on your system!'));
    console.log(chalk.yellow('\nGit Copilot requires Git to function properly.'));
    
    console.log(chalk.white('\nTo install Git, please visit:'));
    console.log(chalk.cyan.underline('https://git-scm.com/downloads'));
    
    console.log(chalk.white('\nOr install using your package manager:'));
    console.log(chalk.gray('  macOS:   ') + chalk.green('brew install git'));
    console.log(chalk.gray('  Ubuntu:  ') + chalk.green('sudo apt-get install git'));
    console.log(chalk.gray('  Windows: ') + chalk.green('winget install Git.Git'));
    
    console.log(chalk.white('\nAfter installing Git, please run the command again.'));
    console.log('\n');
  }

  /**
   * Check if current directory is a Git repository
   * @returns {Promise<boolean>}
   */
  async isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current Git branch name
   * @returns {Promise<string|null>}
   */
  async getCurrentBranch() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      }).trim();
      return branch;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if there are uncommitted changes
   * @returns {Promise<boolean>}
   */
  async hasUncommittedChanges() {
    try {
      const status = execSync('git status --porcelain', { 
        encoding: 'utf8',
        stdio: 'pipe' 
      }).trim();
      return status.length > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { GitChecker };