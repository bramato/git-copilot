const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PRGitExpert {
  constructor(openrouterClient) {
    this.client = openrouterClient;
    this.systemPrompt = `You are an expert Git and Pull Request analyst with deep knowledge of:

- Git workflows and best practices
- Branch analysis and code diff interpretation
- Pull request quality assessment
- Commit message evaluation
- Code review guidelines
- Git history analysis
- Merge conflict resolution
- Branch naming conventions

Your role is to analyze Git branches, commits, and changes to provide actionable insights for developers. You should:

1. Analyze branch differences and highlight significant changes
2. Evaluate commit quality and suggest improvements
3. Identify potential issues or risks in the changes
4. Suggest improvements for code organization and structure
5. Recommend appropriate PR titles and descriptions
6. Flag potential breaking changes or compatibility issues

Always provide concrete, actionable recommendations with specific examples.`;
  }

  /**
   * Analyze the current branch against the base branch
   * @param {string} baseBranch - The base branch to compare against (default: main/master)
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>}
   */
  async analyzeBranch(baseBranch = null, options = {}) {
    try {
      // Determine base branch if not provided
      if (!baseBranch) {
        baseBranch = await this.getDefaultBranch();
      }

      const currentBranch = await this.getCurrentBranch();
      
      if (currentBranch === baseBranch) {
        throw new Error(`Cannot analyze: currently on base branch (${baseBranch})`);
      }

      // Gather Git information
      const branchInfo = await this.getBranchInfo(currentBranch, baseBranch);
      const commits = await this.getCommitsSinceBase(baseBranch);
      const changes = await this.getChangesSinceBase(baseBranch);
      const stats = await this.getChangeStats(baseBranch);

      // Prepare context for AI analysis
      const context = {
        currentBranch,
        baseBranch,
        branchInfo,
        commits,
        changes: changes.slice(0, 5000), // Limit to prevent token overflow
        stats,
        options
      };

      // Get AI analysis
      const analysis = await this.getAIAnalysis(context);

      return {
        success: true,
        analysis,
        metadata: {
          currentBranch,
          baseBranch,
          commitCount: commits.length,
          filesChanged: stats.filesChanged,
          insertions: stats.insertions,
          deletions: stats.deletions
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the default branch (main or master)
   * @returns {Promise<string>}
   */
  async getDefaultBranch() {
    try {
      // Try to get remote default branch first
      const remoteHead = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo ""', { 
        encoding: 'utf8' 
      }).trim();
      
      if (remoteHead) {
        return remoteHead.replace('refs/remotes/origin/', '');
      }

      // Fallback to common branch names
      const branches = execSync('git branch -r', { encoding: 'utf8' });
      if (branches.includes('origin/main')) {
        return 'main';
      } else if (branches.includes('origin/master')) {
        return 'master';
      }

      // Final fallback
      return 'main';
    } catch (error) {
      return 'main';
    }
  }

  /**
   * Get current branch name
   * @returns {Promise<string>}
   */
  async getCurrentBranch() {
    return execSync('git rev-parse --abbrev-ref HEAD', { 
      encoding: 'utf8' 
    }).trim();
  }

  /**
   * Get branch information
   * @param {string} currentBranch 
   * @param {string} baseBranch 
   * @returns {Promise<Object>}
   */
  async getBranchInfo(currentBranch, baseBranch) {
    try {
      const lastCommit = execSync(`git log -1 --format="%H %s %an %ad" ${currentBranch}`, {
        encoding: 'utf8'
      }).trim();

      const branchAge = execSync(`git log -1 --format="%ar" ${currentBranch}`, {
        encoding: 'utf8'
      }).trim();

      return {
        lastCommit,
        branchAge,
        upstreamStatus: await this.getUpstreamStatus(currentBranch)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get upstream status for the branch
   * @param {string} branch 
   * @returns {Promise<string>}
   */
  async getUpstreamStatus(branch) {
    try {
      const status = execSync(`git status -b --porcelain=v1 | head -1`, {
        encoding: 'utf8'
      }).trim();
      return status;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get commits since base branch
   * @param {string} baseBranch 
   * @returns {Promise<Array>}
   */
  async getCommitsSinceBase(baseBranch) {
    try {
      const commits = execSync(`git log ${baseBranch}..HEAD --format="%H|%s|%an|%ad|%B" --date=relative`, {
        encoding: 'utf8'
      }).trim();

      if (!commits) return [];

      return commits.split('\n\n').map(commit => {
        const lines = commit.split('\n');
        const [hash, subject, author, date] = lines[0].split('|');
        const body = lines.slice(1).join('\n').trim();
        
        return {
          hash: hash?.substring(0, 8),
          subject,
          author,
          date,
          body
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get file changes since base branch
   * @param {string} baseBranch 
   * @returns {Promise<string>}
   */
  async getChangesSinceBase(baseBranch) {
    try {
      return execSync(`git diff ${baseBranch}..HEAD`, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
    } catch (error) {
      return `Error getting changes: ${error.message}`;
    }
  }

  /**
   * Get change statistics
   * @param {string} baseBranch 
   * @returns {Promise<Object>}
   */
  async getChangeStats(baseBranch) {
    try {
      const stats = execSync(`git diff --stat ${baseBranch}..HEAD`, {
        encoding: 'utf8'
      });

      const lines = stats.trim().split('\n');
      const summaryLine = lines[lines.length - 1];
      
      const filesMatch = summaryLine.match(/(\d+) files? changed/);
      const insertionsMatch = summaryLine.match(/(\d+) insertions?/);
      const deletionsMatch = summaryLine.match(/(\d+) deletions?/);

      return {
        filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0,
        insertions: insertionsMatch ? parseInt(insertionsMatch[1]) : 0,
        deletions: deletionsMatch ? parseInt(deletionsMatch[1]) : 0,
        rawStats: stats
      };
    } catch (error) {
      return {
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        error: error.message
      };
    }
  }

  /**
   * Get AI analysis of the branch
   * @param {Object} context 
   * @returns {Promise<Object>}
   */
  async getAIAnalysis(context) {
    const prompt = `Analyze this Git branch for a Pull Request review:

**Branch Information:**
- Current Branch: ${context.currentBranch}
- Base Branch: ${context.baseBranch}
- Files Changed: ${context.stats.filesChanged}
- Insertions: ${context.stats.insertions}
- Deletions: ${context.stats.deletions}

**Commits (${context.commits.length}):**
${context.commits.map(c => `- ${c.hash}: ${c.subject} (by ${c.author})`).join('\n')}

**Recent Changes:**
\`\`\`diff
${context.changes}
\`\`\`

Please provide a comprehensive analysis including:

1. **Summary**: Brief overview of what this branch accomplishes
2. **Code Quality**: Assessment of the changes, patterns, and structure
3. **Commit Quality**: Evaluation of commit messages and organization
4. **Potential Issues**: Any red flags, risks, or concerns
5. **Suggestions**: Specific improvements for code, commits, or PR description
6. **PR Recommendations**: Suggested title and description for the pull request

Format your response as JSON with these sections as keys.`;

    try {
      const response = await this.client.chat({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.3
      });

      // Parse JSON response or return structured fallback
      try {
        return JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        return {
          summary: response.choices[0].message.content,
          rawResponse: true
        };
      }
    } catch (error) {
      return {
        error: `AI analysis failed: ${error.message}`,
        fallback: true
      };
    }
  }
}

module.exports = { PRGitExpert };