const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DocumentationExpert {
  constructor(openrouterClient) {
    this.client = openrouterClient;
    this.systemPrompt = `You are an expert technical documentation specialist with expertise in:

- Software documentation best practices
- README.md structure and content optimization
- API documentation generation
- Code documentation standards
- Project documentation architecture
- Knowledge base organization
- Documentation maintenance workflows

Your role is to create, improve, and maintain high-quality project documentation. You should:

1. Analyze existing documentation and identify gaps
2. Follow project-specific documentation rules and styles
3. Create clear, comprehensive, and user-friendly documentation
4. Ensure consistency across all documentation files
5. Include practical examples and usage scenarios
6. Structure documentation for different audiences (users, contributors, maintainers)
7. Maintain up-to-date and accurate information

Always follow the project's existing documentation conventions and style guides when available.`;
  }

  /**
   * Create or update documentation based on project analysis
   * @param {Object} options - Documentation options
   * @returns {Promise<Object>}
   */
  async createDocumentation(options = {}) {
    try {
      // Read existing documentation rules
      const documentationRules = await this.readDocumentationRules();
      
      // Analyze project structure
      const projectAnalysis = await this.analyzeProject();
      
      // Get existing documentation
      const existingDocs = await this.getExistingDocumentation();
      
      // Generate documentation based on type
      const docType = options.type || 'readme';
      let result;

      switch (docType) {
        case 'readme':
          result = await this.generateReadme(projectAnalysis, existingDocs, documentationRules, options);
          break;
        case 'api':
          result = await this.generateApiDocs(projectAnalysis, existingDocs, documentationRules, options);
          break;
        case 'changelog':
          result = await this.generateChangelog(projectAnalysis, existingDocs, documentationRules, options);
          break;
        default:
          throw new Error(`Unsupported documentation type: ${docType}`);
      }

      return {
        success: true,
        type: docType,
        ...result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Read documentation rules from README.md and KB.md
   * @returns {Promise<Object>}
   */
  async readDocumentationRules() {
    const rules = {
      readme: null,
      knowledgeBase: null,
      customRules: []
    };

    try {
      // Read README.md if exists
      try {
        const readmePath = path.join(process.cwd(), 'README.md');
        rules.readme = await fs.readFile(readmePath, 'utf8');
      } catch (error) {
        // README doesn't exist, will be created
      }

      // Read KB.md if exists
      try {
        const kbPath = path.join(process.cwd(), 'KB.md');
        rules.knowledgeBase = await fs.readFile(kbPath, 'utf8');
      } catch (error) {
        // KB doesn't exist
      }

      // Look for other documentation rule files
      const possibleRuleFiles = [
        '.github/CONTRIBUTING.md',
        'CONTRIBUTING.md',
        'docs/STYLE_GUIDE.md',
        'docs/README.md'
      ];

      for (const filePath of possibleRuleFiles) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          const content = await fs.readFile(fullPath, 'utf8');
          rules.customRules.push({
            file: filePath,
            content
          });
        } catch (error) {
          // File doesn't exist, skip
        }
      }

      return rules;
    } catch (error) {
      return rules; // Return empty rules on error
    }
  }

  /**
   * Analyze the current project structure and files
   * @returns {Promise<Object>}
   */
  async analyzeProject() {
    try {
      const projectRoot = process.cwd();
      const packageJsonPath = path.join(projectRoot, 'package.json');
      
      let packageInfo = null;
      try {
        const packageContent = await fs.readFile(packageJsonPath, 'utf8');
        packageInfo = JSON.parse(packageContent);
      } catch (error) {
        // No package.json
      }

      // Get project files structure
      const fileStructure = await this.getFileStructure(projectRoot);
      
      // Get Git information
      const gitInfo = await this.getGitInformation();
      
      // Detect project type and technologies
      const technologies = await this.detectTechnologies(fileStructure, packageInfo);

      return {
        packageInfo,
        fileStructure,
        gitInfo,
        technologies,
        projectRoot
      };
    } catch (error) {
      return {
        error: error.message,
        projectRoot: process.cwd()
      };
    }
  }

  /**
   * Get existing documentation files
   * @returns {Promise<Object>}
   */
  async getExistingDocumentation() {
    const docs = {};
    
    const docFiles = [
      'README.md',
      'CHANGELOG.md',
      'API.md',
      'CONTRIBUTING.md',
      'LICENSE',
      'docs/README.md'
    ];

    for (const docFile of docFiles) {
      try {
        const filePath = path.join(process.cwd(), docFile);
        docs[docFile] = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        // File doesn't exist
        docs[docFile] = null;
      }
    }

    return docs;
  }

  /**
   * Generate README.md documentation
   * @param {Object} projectAnalysis 
   * @param {Object} existingDocs 
   * @param {Object} rules 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateReadme(projectAnalysis, existingDocs, rules, options) {
    const prompt = `Generate a comprehensive README.md for this project:

**Project Information:**
- Name: ${projectAnalysis.packageInfo?.name || 'Unknown'}
- Description: ${projectAnalysis.packageInfo?.description || 'No description'}
- Version: ${projectAnalysis.packageInfo?.version || '1.0.0'}
- Technologies: ${projectAnalysis.technologies.join(', ')}

**File Structure:**
${projectAnalysis.fileStructure.slice(0, 2000)}

**Existing README (if any):**
${existingDocs['README.md'] ? existingDocs['README.md'].slice(0, 1000) : 'None'}

**Documentation Rules:**
${rules.readme ? 'Follow existing README style and structure' : 'Create new comprehensive README'}
${rules.knowledgeBase ? `Knowledge Base Guidelines:\n${rules.knowledgeBase.slice(0, 1000)}` : ''}

**Requirements:**
- Create a professional, comprehensive README
- Include installation instructions
- Add usage examples
- Document all available commands/features
- Include contribution guidelines
- Add proper badges and links
- Follow markdown best practices
- Make it beginner-friendly

${options.force ? 'IMPORTANT: Replace existing content completely' : 'IMPORTANT: Preserve and enhance existing content where possible'}

Generate the complete README.md content:`;

    try {
      const response = await this.client.chat({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.2
      });

      const content = response.choices[0].message.content;
      
      // Write the README file
      const readmePath = path.join(process.cwd(), 'README.md');
      await fs.writeFile(readmePath, content, 'utf8');

      return {
        filePath: readmePath,
        content,
        action: existingDocs['README.md'] ? 'updated' : 'created'
      };

    } catch (error) {
      throw new Error(`Failed to generate README: ${error.message}`);
    }
  }

  /**
   * Generate API documentation
   * @param {Object} projectAnalysis 
   * @param {Object} existingDocs 
   * @param {Object} rules 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateApiDocs(projectAnalysis, existingDocs, rules, options) {
    // Scan for API endpoints, functions, classes
    const codeAnalysis = await this.analyzeCodeForApi();
    
    const prompt = `Generate API documentation for this project:

**Project Information:**
- Name: ${projectAnalysis.packageInfo?.name || 'Unknown'}
- Type: ${projectAnalysis.technologies.join(', ')}

**Code Analysis:**
${JSON.stringify(codeAnalysis, null, 2)}

**Existing API Docs:**
${existingDocs['API.md'] || 'None'}

Create comprehensive API documentation including:
- All public functions/methods
- Parameters and return values
- Usage examples
- Error handling
- Rate limits (if applicable)

Generate the complete API.md content:`;

    try {
      const response = await this.client.chat({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.2
      });

      const content = response.choices[0].message.content;
      const apiPath = path.join(process.cwd(), 'API.md');
      await fs.writeFile(apiPath, content, 'utf8');

      return {
        filePath: apiPath,
        content,
        action: existingDocs['API.md'] ? 'updated' : 'created'
      };

    } catch (error) {
      throw new Error(`Failed to generate API docs: ${error.message}`);
    }
  }

  /**
   * Generate CHANGELOG.md
   * @param {Object} projectAnalysis 
   * @param {Object} existingDocs 
   * @param {Object} rules 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateChangelog(projectAnalysis, existingDocs, rules, options) {
    // Get recent Git history
    const gitHistory = await this.getRecentGitHistory();
    
    const prompt = `Generate a CHANGELOG.md for this project:

**Recent Git History:**
${gitHistory}

**Existing CHANGELOG:**
${existingDocs['CHANGELOG.md'] || 'None'}

**Current Version:**
${projectAnalysis.packageInfo?.version || '1.0.0'}

Create a changelog following standard format:
- Use semantic versioning
- Group changes by type (Added, Changed, Deprecated, Removed, Fixed, Security)
- Include dates
- Reference issues/PRs where applicable

Generate the complete CHANGELOG.md content:`;

    try {
      const response = await this.client.chat({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.2
      });

      const content = response.choices[0].message.content;
      const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
      await fs.writeFile(changelogPath, content, 'utf8');

      return {
        filePath: changelogPath,
        content,
        action: existingDocs['CHANGELOG.md'] ? 'updated' : 'created'
      };

    } catch (error) {
      throw new Error(`Failed to generate CHANGELOG: ${error.message}`);
    }
  }

  /**
   * Get file structure of the project
   * @param {string} projectRoot 
   * @returns {Promise<string>}
   */
  async getFileStructure(projectRoot, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return '';
    
    try {
      const items = await fs.readdir(projectRoot, { withFileTypes: true });
      let structure = '';
      
      for (const item of items) {
        if (item.name.startsWith('.') && !item.name.match(/^\.(github|gitignore|env)$/)) {
          continue; // Skip hidden files except important ones
        }
        
        const indent = '  '.repeat(currentDepth);
        if (item.isDirectory()) {
          structure += `${indent}${item.name}/\n`;
          if (currentDepth < maxDepth - 1) {
            const subStructure = await this.getFileStructure(
              path.join(projectRoot, item.name), 
              maxDepth, 
              currentDepth + 1
            );
            structure += subStructure;
          }
        } else {
          structure += `${indent}${item.name}\n`;
        }
      }
      
      return structure;
    } catch (error) {
      return `Error reading directory: ${error.message}\n`;
    }
  }

  /**
   * Get Git information
   * @returns {Promise<Object>}
   */
  async getGitInformation() {
    try {
      const remoteUrl = execSync('git config --get remote.origin.url 2>/dev/null || echo ""', { 
        encoding: 'utf8' 
      }).trim();
      
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""', { 
        encoding: 'utf8' 
      }).trim();
      
      return {
        remoteUrl,
        currentBranch,
        hasGit: !!remoteUrl || !!currentBranch
      };
    } catch (error) {
      return {
        hasGit: false,
        error: error.message
      };
    }
  }

  /**
   * Detect project technologies
   * @param {string} fileStructure 
   * @param {Object} packageInfo 
   * @returns {Promise<Array>}
   */
  async detectTechnologies(fileStructure, packageInfo) {
    const technologies = [];
    
    // Package.json indicators
    if (packageInfo) {
      technologies.push('Node.js');
      
      const deps = { ...packageInfo.dependencies, ...packageInfo.devDependencies };
      
      if (deps.react) technologies.push('React');
      if (deps.vue) technologies.push('Vue.js');
      if (deps.angular) technologies.push('Angular');
      if (deps.express) technologies.push('Express');
      if (deps.typescript) technologies.push('TypeScript');
      if (deps.jest) technologies.push('Jest');
    }
    
    // File structure indicators
    if (fileStructure.includes('Dockerfile')) technologies.push('Docker');
    if (fileStructure.includes('.py')) technologies.push('Python');
    if (fileStructure.includes('.java')) technologies.push('Java');
    if (fileStructure.includes('.go')) technologies.push('Go');
    if (fileStructure.includes('.rs')) technologies.push('Rust');
    if (fileStructure.includes('.php')) technologies.push('PHP');
    
    return [...new Set(technologies)]; // Remove duplicates
  }

  /**
   * Analyze code for API documentation
   * @returns {Promise<Object>}
   */
  async analyzeCodeForApi() {
    // This is a simplified implementation
    // In a real scenario, you'd parse AST or use specialized tools
    try {
      const jsFiles = execSync('find . -name "*.js" -o -name "*.ts" | head -10', { 
        encoding: 'utf8' 
      }).trim().split('\n').filter(f => f);

      const analysis = {
        files: [],
        functions: [],
        classes: []
      };

      for (const file of jsFiles.slice(0, 5)) {
        try {
          const content = await fs.readFile(file, 'utf8');
          analysis.files.push({
            path: file,
            size: content.length,
            hasExports: content.includes('module.exports') || content.includes('export')
          });
        } catch (error) {
          // Skip file if can't read
        }
      }

      return analysis;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get recent Git history for changelog
   * @returns {Promise<string>}
   */
  async getRecentGitHistory() {
    try {
      return execSync('git log --oneline -20', { encoding: 'utf8' });
    } catch (error) {
      return 'No git history available';
    }
  }
}

module.exports = { DocumentationExpert };