const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class CodeReviewExpert {
  constructor(openrouterClient) {
    this.client = openrouterClient;
    this.systemPrompt = `You are an expert code reviewer with deep knowledge of:

- Code quality assessment and best practices
- Security vulnerability identification
- Performance optimization opportunities
- Code architecture and design patterns
- Testing and maintainability evaluation
- Language-specific conventions and standards
- Accessibility and usability considerations
- Documentation and code clarity

Your role is to conduct thorough code reviews and provide actionable feedback. You should:

1. Identify bugs, security issues, and potential problems
2. Suggest improvements for readability, performance, and maintainability
3. Ensure adherence to coding standards and best practices
4. Flag breaking changes and compatibility issues
5. Recommend refactoring opportunities
6. Assess test coverage and quality
7. Evaluate error handling and edge cases
8. Check for proper documentation and comments

Always provide specific, actionable recommendations with examples and explanations of the benefits.`;

    this.severityLevels = {
      CRITICAL: '🔴',
      HIGH: '🟠', 
      MEDIUM: '🟡',
      LOW: '🔵',
      INFO: '⚪'
    };
  }

  /**
   * Perform code review and generate fix.md report
   * @param {Object} options - Review options
   * @returns {Promise<Object>}
   */
  async performReview(options = {}) {
    try {
      // Get files to review
      const filesToReview = await this.getFilesToReview(options);
      
      if (filesToReview.length === 0) {
        return {
          success: false,
          error: 'No files found for review'
        };
      }

      // Analyze each file
      const fileAnalyses = [];
      for (const file of filesToReview) {
        const analysis = await this.analyzeFile(file);
        if (analysis) {
          fileAnalyses.push(analysis);
        }
      }

      // Get overall project context
      const projectContext = await this.getProjectContext();

      // Generate comprehensive review
      const reviewReport = await this.generateReviewReport(fileAnalyses, projectContext, options);

      // Create fix.md file
      const fixMdPath = await this.createFixMdFile(reviewReport);

      return {
        success: true,
        filesReviewed: filesToReview.length,
        issuesFound: reviewReport.issues.length,
        fixMdPath,
        summary: reviewReport.summary
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of files to review based on options
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async getFilesToReview(options) {
    try {
      let files = [];

      if (options.path) {
        // Review specific path
        const stats = await fs.stat(options.path);
        if (stats.isFile()) {
          files = [options.path];
        } else if (stats.isDirectory()) {
          files = await this.getFilesInDirectory(options.path);
        }
      } else if (options.staged) {
        // Review only staged files
        const stagedFiles = execSync('git diff --cached --name-only', { 
          encoding: 'utf8' 
        }).trim().split('\n').filter(f => f);
        
        for (const file of stagedFiles) {
          try {
            await fs.access(file);
            files.push(file);
          } catch (error) {
            // File might be deleted, skip
          }
        }
      } else {
        // Review changed files in current branch
        try {
          const changedFiles = execSync('git diff --name-only HEAD~1..HEAD', { 
            encoding: 'utf8' 
          }).trim().split('\n').filter(f => f);
          
          for (const file of changedFiles) {
            try {
              await fs.access(file);
              files.push(file);
            } catch (error) {
              // File might be deleted, skip
            }
          }
        } catch (error) {
          // Fallback to all source files
          files = await this.getAllSourceFiles();
        }
      }

      // Filter for source code files only
      return files.filter(file => this.isSourceFile(file));

    } catch (error) {
      throw new Error(`Failed to get files for review: ${error.message}`);
    }
  }

  /**
   * Get all files in a directory recursively
   * @param {string} dirPath 
   * @returns {Promise<Array>}
   */
  async getFilesInDirectory(dirPath, maxDepth = 5, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];
    
    const files = [];
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }
        
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subFiles = await this.getFilesInDirectory(fullPath, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        } else if (this.isSourceFile(fullPath)) {
          files.push(fullPath);
        }
      }
      
      return files;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all source files in the project
   * @returns {Promise<Array>}
   */
  async getAllSourceFiles() {
    try {
      const extensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rs', 'php', 'rb'];
      const findCmd = `find . -type f \\( ${extensions.map(ext => `-name "*.${ext}"`).join(' -o ')} \\) | grep -v node_modules | head -20`;
      
      const files = execSync(findCmd, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(f => f && !f.includes('node_modules'));
      
      return files;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if file is a source code file
   * @param {string} filePath 
   * @returns {boolean}
   */
  isSourceFile(filePath) {
    const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.php', '.rb', '.c', '.cpp', '.h', '.hpp'];
    const ext = path.extname(filePath).toLowerCase();
    return sourceExtensions.includes(ext);
  }

  /**
   * Analyze a single file
   * @param {string} filePath 
   * @returns {Promise<Object>}
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileStats = await fs.stat(filePath);
      
      // Skip very large files to avoid token limits
      if (content.length > 50000) {
        return {
          filePath,
          skipped: true,
          reason: 'File too large for review'
        };
      }

      // Get basic file information
      const fileInfo = {
        path: filePath,
        size: fileStats.size,
        extension: path.extname(filePath),
        lines: content.split('\n').length,
        content: content.slice(0, 10000) // Limit content for AI analysis
      };

      // Perform static analysis
      const staticAnalysis = await this.performStaticAnalysis(fileInfo);

      return {
        ...fileInfo,
        ...staticAnalysis
      };

    } catch (error) {
      return {
        filePath,
        error: error.message
      };
    }
  }

  /**
   * Perform static analysis on file content
   * @param {Object} fileInfo 
   * @returns {Promise<Object>}
   */
  async performStaticAnalysis(fileInfo) {
    const issues = [];
    const content = fileInfo.content;

    // Basic pattern matching for common issues
    const patterns = [
      {
        pattern: /console\.log/g,
        severity: 'LOW',
        type: 'Debug Code',
        message: 'Console.log statements should be removed in production code'
      },
      {
        pattern: /TODO|FIXME|HACK/gi,
        severity: 'MEDIUM',
        type: 'Technical Debt',
        message: 'TODO/FIXME comments indicate unfinished work'
      },
      {
        pattern: /eval\s*\(/g,
        severity: 'CRITICAL',
        type: 'Security',
        message: 'Use of eval() can lead to security vulnerabilities'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'HIGH',
        type: 'Security',
        message: 'innerHTML assignment may lead to XSS vulnerabilities'
      },
      {
        pattern: /var\s+/g,
        severity: 'LOW',
        type: 'Modern JavaScript',
        message: 'Consider using let/const instead of var'
      }
    ];

    // Check for patterns
    patterns.forEach(({ pattern, severity, type, message }) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const lines = content.substring(0, match.index).split('\n');
        issues.push({
          severity,
          type,
          message,
          line: lines.length,
          column: lines[lines.length - 1].length + 1,
          code: match[0]
        });
      });
    });

    // Check file-specific issues
    if (fileInfo.extension === '.js' || fileInfo.extension === '.ts') {
      // Check for missing semicolons (simplified)
      const statements = content.split('\n').filter(line => 
        line.trim() && 
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('*') &&
        !line.trim().endsWith(';') &&
        !line.trim().endsWith('{') &&
        !line.trim().endsWith('}')
      );
      
      if (statements.length > fileInfo.lines * 0.3) {
        issues.push({
          severity: 'LOW',
          type: 'Code Style',
          message: 'Consider using consistent semicolon usage',
          line: 1,
          column: 1
        });
      }
    }

    return {
      issues,
      complexity: this.calculateComplexity(content),
      maintainability: this.assessMaintainability(content, fileInfo)
    };
  }

  /**
   * Calculate basic complexity score
   * @param {string} content 
   * @returns {number}
   */
  calculateComplexity(content) {
    const complexityIndicators = [
      /if\s*\(/g,
      /else/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&|\|\|/g
    ];

    let complexity = 1; // Base complexity
    complexityIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return Math.min(complexity, 100); // Cap at 100
  }

  /**
   * Assess maintainability
   * @param {string} content 
   * @param {Object} fileInfo 
   * @returns {Object}
   */
  assessMaintainability(content, fileInfo) {
    const lines = content.split('\n');
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('*') ||
      line.trim().startsWith('/*')
    ).length;
    
    const commentRatio = commentLines / lines.length;
    const avgLineLength = content.length / lines.length;
    
    let score = 10;
    
    // Adjust based on file size
    if (fileInfo.lines > 500) score -= 2;
    if (fileInfo.lines > 1000) score -= 3;
    
    // Adjust based on comments
    if (commentRatio < 0.1) score -= 2;
    if (commentRatio > 0.3) score += 1;
    
    // Adjust based on line length
    if (avgLineLength > 120) score -= 1;
    if (avgLineLength > 200) score -= 2;
    
    return {
      score: Math.max(1, Math.min(10, score)),
      commentRatio,
      avgLineLength
    };
  }

  /**
   * Get project context for review
   * @returns {Promise<Object>}
   */
  async getProjectContext() {
    try {
      // Read package.json
      let packageInfo = null;
      try {
        const packageContent = await fs.readFile('package.json', 'utf8');
        packageInfo = JSON.parse(packageContent);
      } catch (error) {
        // No package.json
      }

      // Get git information
      let gitInfo = {};
      try {
        gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        gitInfo.lastCommit = execSync('git log -1 --format="%h %s"', { encoding: 'utf8' }).trim();
      } catch (error) {
        // No git
      }

      return {
        packageInfo,
        gitInfo,
        reviewDate: new Date().toISOString()
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Generate comprehensive review report
   * @param {Array} fileAnalyses 
   * @param {Object} projectContext 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateReviewReport(fileAnalyses, projectContext, options) {
    // Collect all issues
    const allIssues = [];
    const filesSummary = [];

    fileAnalyses.forEach(analysis => {
      if (analysis.issues) {
        analysis.issues.forEach(issue => {
          allIssues.push({
            ...issue,
            file: analysis.path
          });
        });
      }

      filesSummary.push({
        file: analysis.path,
        issues: analysis.issues ? analysis.issues.length : 0,
        complexity: analysis.complexity || 0,
        maintainability: analysis.maintainability || { score: 5 },
        skipped: analysis.skipped || false
      });
    });

    // Sort issues by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Generate AI-powered insights
    const aiInsights = await this.generateAIInsights(fileAnalyses, allIssues, projectContext);

    return {
      summary: {
        filesReviewed: fileAnalyses.length,
        totalIssues: allIssues.length,
        criticalIssues: allIssues.filter(i => i.severity === 'CRITICAL').length,
        highIssues: allIssues.filter(i => i.severity === 'HIGH').length,
        mediumIssues: allIssues.filter(i => i.severity === 'MEDIUM').length,
        lowIssues: allIssues.filter(i => i.severity === 'LOW').length
      },
      issues: allIssues,
      filesSummary,
      aiInsights,
      projectContext
    };
  }

  /**
   * Generate AI-powered insights
   * @param {Array} fileAnalyses 
   * @param {Array} allIssues 
   * @param {Object} projectContext 
   * @returns {Promise<Object>}
   */
  async generateAIInsights(fileAnalyses, allIssues, projectContext) {
    const prompt = `Analyze this code review data and provide comprehensive insights:

**Project Context:**
${JSON.stringify(projectContext, null, 2)}

**Files Reviewed:**
${fileAnalyses.slice(0, 10).map(f => `- ${f.path} (${f.lines} lines, complexity: ${f.complexity})`).join('\n')}

**Issues Found (${allIssues.length} total):**
${allIssues.slice(0, 20).map(issue => 
  `- ${issue.severity}: ${issue.type} in ${issue.file}:${issue.line} - ${issue.message}`
).join('\n')}

**Analysis Request:**
Provide a comprehensive code review analysis including:

1. **Overall Assessment**: General code quality and health
2. **Priority Fixes**: Most critical issues that should be addressed first
3. **Patterns**: Common issues or anti-patterns detected across files
4. **Architecture**: Comments on code structure and organization
5. **Security**: Security-related concerns and recommendations
6. **Performance**: Potential performance issues or optimizations
7. **Maintainability**: Long-term maintainability concerns
8. **Recommendations**: Specific actionable recommendations

Format your response as a detailed analysis that will be included in the fix.md file.`;

    try {
      const response = await this.client.chat({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.3
      });

      return response.choices[0].message.content;

    } catch (error) {
      return `AI analysis failed: ${error.message}`;
    }
  }

  /**
   * Create fix.md file with review report
   * @param {Object} reviewReport 
   * @returns {Promise<string>}
   */
  async createFixMdFile(reviewReport) {
    const timestamp = new Date().toISOString().split('T')[0];
    const content = this.generateFixMdContent(reviewReport, timestamp);
    
    const fixMdPath = path.join(process.cwd(), 'fix.md');
    await fs.writeFile(fixMdPath, content, 'utf8');
    
    return fixMdPath;
  }

  /**
   * Generate fix.md file content
   * @param {Object} reviewReport 
   * @param {string} timestamp 
   * @returns {string}
   */
  generateFixMdContent(reviewReport, timestamp) {
    const { summary, issues, filesSummary, aiInsights, projectContext } = reviewReport;

    let content = `# Code Review Report

**Generated:** ${timestamp}  
**Project:** ${projectContext.packageInfo?.name || 'Unknown'}  
**Branch:** ${projectContext.gitInfo?.branch || 'Unknown'}  
**Files Reviewed:** ${summary.filesReviewed}

## Summary

${this.severityLevels.CRITICAL} **Critical Issues:** ${summary.criticalIssues}  
${this.severityLevels.HIGH} **High Priority:** ${summary.highIssues}  
${this.severityLevels.MEDIUM} **Medium Priority:** ${summary.mediumIssues}  
${this.severityLevels.LOW} **Low Priority:** ${summary.lowIssues}

**Total Issues Found:** ${summary.totalIssues}

## AI Analysis

${aiInsights}

## Issues by File

`;

    // Group issues by file
    const issuesByFile = {};
    issues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });

    Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
      content += `### ${file}\n\n`;
      
      fileIssues.forEach(issue => {
        content += `${this.severityLevels[issue.severity]} **${issue.severity}** - ${issue.type} (Line ${issue.line})\n`;
        content += `   ${issue.message}\n`;
        if (issue.code) {
          content += `   \`${issue.code}\`\n`;
        }
        content += '\n';
      });
    });

    // Add files summary
    content += `## Files Overview

| File | Issues | Complexity | Maintainability | Status |
|------|--------|------------|-----------------|---------|
`;

    filesSummary.forEach(file => {
      const maintScore = file.maintainability?.score || 'N/A';
      const status = file.skipped ? 'Skipped' : 'Reviewed';
      content += `| ${file.file} | ${file.issues} | ${file.complexity} | ${maintScore}/10 | ${status} |\n`;
    });

    content += `\n## Next Steps

1. **Address Critical Issues First** - Focus on ${this.severityLevels.CRITICAL} critical and ${this.severityLevels.HIGH} high priority issues
2. **Review Security Concerns** - Pay special attention to security-related warnings
3. **Improve Code Quality** - Address maintainability and style issues
4. **Add Tests** - Ensure adequate test coverage for complex functions
5. **Update Documentation** - Keep documentation in sync with code changes

---
*Generated by Git Copilot Code Review Expert*
`;

    return content;
  }
}

module.exports = { CodeReviewExpert };