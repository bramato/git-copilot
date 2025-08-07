const fs = require('fs-extra');
const path = require('path');

class DocumentationExpert {
    constructor() {
        this.openrouterAgent = null;
        this.initializeAgent();
    }

    async initializeAgent() {
        try {
            const { createAgent } = require('openrouter-agents');
            this.openrouterAgent = createAgent({
                name: 'documentation-expert',
                model: 'anthropic/claude-3.5-sonnet',
                systemPrompt: `You are an expert technical writer and documentation specialist. 
                You create comprehensive, clear, and well-structured documentation for software projects.
                You understand README files, API documentation, code comments, and knowledge bases.
                You follow documentation best practices and create user-friendly guides.`
            });
        } catch (error) {
            console.warn('OpenRouter agent not available, using fallback mode');
        }
    }

    async generateDocumentation(rules) {
        try {
            const projectInfo = await this.analyzeProject();
            const documentation = await this.createDocumentation(projectInfo, rules);
            
            // Save documentation files
            await this.saveDocumentation(documentation);
            
            return this.formatResult(documentation);
        } catch (error) {
            throw new Error(`Documentation generation failed: ${error.message}`);
        }
    }

    async analyzeProject() {
        const projectInfo = {
            packageJson: await this.readPackageJson(),
            fileStructure: await this.getFileStructure(),
            codeFiles: await this.getCodeFiles(),
            existingDocs: await this.getExistingDocumentation()
        };

        return projectInfo;
    }

    async readPackageJson() {
        try {
            if (await fs.pathExists('package.json')) {
                return await fs.readJson('package.json');
            }
        } catch (error) {
            return null;
        }
    }

    async getFileStructure() {
        try {
            const structure = [];
            const files = await fs.readdir('.', { withFileTypes: true });
            
            for (const file of files) {
                if (file.isDirectory() && !file.name.startsWith('.')) {
                    structure.push({
                        name: file.name,
                        type: 'directory',
                        files: await this.getDirectoryFiles(file.name)
                    });
                } else if (file.isFile()) {
                    structure.push({
                        name: file.name,
                        type: 'file'
                    });
                }
            }
            
            return structure;
        } catch (error) {
            return [];
        }
    }

    async getDirectoryFiles(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            return files.filter(file => !file.startsWith('.'));
        } catch (error) {
            return [];
        }
    }

    async getCodeFiles() {
        const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
        const codeFiles = [];

        try {
            const files = await fs.readdir('.', { recursive: true });
            for (const file of files) {
                if (codeExtensions.some(ext => file.endsWith(ext))) {
                    codeFiles.push(file);
                }
            }
        } catch (error) {
            // Fallback for older Node.js versions
            return [];
        }

        return codeFiles;
    }

    async getExistingDocumentation() {
        const docs = {};
        const docFiles = ['README.md', 'KB.md', 'CHANGELOG.md', 'API.md'];

        for (const docFile of docFiles) {
            try {
                if (await fs.pathExists(docFile)) {
                    docs[docFile] = await fs.readFile(docFile, 'utf8');
                }
            } catch (error) {
                // Continue if file can't be read
            }
        }

        return docs;
    }

    async createDocumentation(projectInfo, rules) {
        const documentation = {};

        // Generate README.md if it doesn't exist or needs updating
        if (!projectInfo.existingDocs['README.md']) {
            documentation['README.md'] = this.generateReadme(projectInfo);
        }

        // Generate API documentation if code files exist
        if (projectInfo.codeFiles.length > 0) {
            documentation['API.md'] = this.generateApiDoc(projectInfo);
        }

        // Generate CHANGELOG.md
        documentation['CHANGELOG.md'] = this.generateChangelog(projectInfo);

        return documentation;
    }

    generateReadme(projectInfo) {
        const pkg = projectInfo.packageJson;
        const projectName = pkg?.name || 'Project';
        const description = pkg?.description || 'A software project';

        return `# ${projectName}

${description}

## Installation

\`\`\`bash
npm install ${pkg?.name || 'project-name'}
\`\`\`

## Usage

\`\`\`bash
${pkg?.name || 'project-name'} --help
\`\`\`

## Features

- AI-powered Git analysis
- Automated documentation generation
- Code review and issue detection
- Integration with OpenRouter agents

## Commands

### \`analyze-branch\`
Analyzes the current Git branch and provides insights about changes, commits, and recommendations.

\`\`\`bash
${pkg?.name || 'project-name'} analyze-branch
\`\`\`

### \`document\`
Generates or updates project documentation based on existing files and code analysis.

\`\`\`bash
${pkg?.name || 'project-name'} document
\`\`\`

### \`review\`
Performs code review and generates a \`fix.md\` file with identified issues and suggestions.

\`\`\`bash
${pkg?.name || 'project-name'} review
\`\`\`

## Requirements

- Node.js >= 14.0.0
- Git installed and configured
- OpenRouter API key (optional, for enhanced AI features)

## Configuration

Set your OpenRouter API key as an environment variable:

\`\`\`bash
export OPENROUTER_API_KEY="your-api-key-here"
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

${pkg?.license || 'MIT'}
`;
    }

    generateApiDoc(projectInfo) {
        return `# API Documentation

## Overview

This document describes the API and internal structure of ${projectInfo.packageJson?.name || 'the project'}.

## Agents

### PR Git Expert Agent
- **Location**: \`agents/pr-git-expert.js\`
- **Purpose**: Analyzes Git branches, commits, and changes
- **Methods**:
  - \`analyzeBranch()\`: Returns comprehensive branch analysis

### Documentation Expert Agent
- **Location**: \`agents/documentation-expert.js\`
- **Purpose**: Generates and maintains project documentation
- **Methods**:
  - \`generateDocumentation(rules)\`: Creates documentation based on project analysis

### Code Review Expert Agent
- **Location**: \`agents/code-review-expert.js\`
- **Purpose**: Reviews code and identifies issues
- **Methods**:
  - \`reviewCode(rules)\`: Performs code analysis and returns findings

## CLI Interface

### Main Entry Point
- **File**: \`bin/git-copilot.js\`
- **Commands**: analyze-branch, document, review
- **Dependencies**: commander, chalk, fs-extra

## File Structure

\`\`\`
${this.formatFileStructure(projectInfo.fileStructure)}
\`\`\`
`;
    }

    formatFileStructure(structure) {
        let output = '';
        for (const item of structure) {
            if (item.type === 'directory') {
                output += `${item.name}/\\n`;
                for (const file of item.files) {
                    output += `  ${file}\\n`;
                }
            } else {
                output += `${item.name}\\n`;
            }
        }
        return output;
    }

    generateChangelog(projectInfo) {
        const version = projectInfo.packageJson?.version || '1.0.0';
        const today = new Date().toISOString().split('T')[0];

        return `# Changelog

All notable changes to this project will be documented in this file.

## [${version}] - ${today}

### Added
- Initial release of git-copilot
- AI-powered branch analysis
- Automated documentation generation
- Code review functionality
- Integration with OpenRouter agents
- CLI interface with multiple commands

### Features
- \`analyze-branch\` command for Git analysis
- \`document\` command for documentation generation  
- \`review\` command for code review
- ASCII art for missing Git installation
- Support for README.md and KB.md rule files

### Dependencies
- commander for CLI interface
- chalk for colored output
- fs-extra for file operations
- openrouter-agents for AI functionality
`;
    }

    async saveDocumentation(documentation) {
        for (const [filename, content] of Object.entries(documentation)) {
            try {
                await fs.writeFile(filename, content, 'utf8');
            } catch (error) {
                console.warn(`Could not save ${filename}: ${error.message}`);
            }
        }
    }

    formatResult(documentation) {
        const files = Object.keys(documentation);
        return `
📝 DOCUMENTATION GENERATED
==========================

✅ Created/Updated Files:
${files.map(file => `• ${file}`).join('\\n')}

📊 Summary:
• ${files.length} documentation files processed
• Project structure analyzed
• API documentation generated
• Changelog updated

💡 Next Steps:
• Review generated documentation
• Add project-specific details
• Update with your actual usage examples
`;
    }
}

module.exports = new DocumentationExpert();