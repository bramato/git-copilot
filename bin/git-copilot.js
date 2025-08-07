#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const program = new Command();

// ASCII Art for missing git
const ASCII_ART = `
 ____  _            ____  _            
|  _ \\(_)_ __ _   _|  _ \\(_)_ __ _   _ 
| |_) | | '__| | | | |_) | | '__| | | |
|  __/| | |  | |_| |  __/| | |  | |_| |
|_|   |_|_|   \\__,_|_|   |_|_|   \\__,_|
                                       
GIT NON È INSTALLATO! 
Installa Git prima di continuare.
`;

// Check if git is installed
function checkGitInstalled() {
    try {
        execSync('git --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        console.log(chalk.red(ASCII_ART));
        process.exit(1);
    }
}

// Load agents
function loadAgent(agentType) {
    try {
        const agentPath = path.join(__dirname, '..', 'agents', `${agentType}.js`);
        if (fs.existsSync(agentPath)) {
            return require(agentPath);
        }
        throw new Error(`Agent ${agentType} not found`);
    } catch (error) {
        console.error(chalk.red(`Error loading agent ${agentType}:`, error.message));
        process.exit(1);
    }
}

// Read documentation files
function readDocumentationRules() {
    const rules = {
        readme: '',
        kb: ''
    };
    
    if (fs.existsSync('README.md')) {
        rules.readme = fs.readFileSync('README.md', 'utf8');
    }
    
    if (fs.existsSync('KB.md')) {
        rules.kb = fs.readFileSync('KB.md', 'utf8');
    }
    
    return rules;
}

program
    .name('git-copilot')
    .description('AI-powered Git analysis and documentation tool')
    .version('1.0.0');

program
    .command('analyze-branch')
    .description('Analyze current branch changes using AI')
    .action(async () => {
        checkGitInstalled();
        console.log(chalk.blue('🔍 Analyzing branch changes...'));
        
        try {
            const gitAgent = loadAgent('pr-git-expert');
            const result = await gitAgent.analyzeBranch();
            console.log(chalk.green('✅ Analysis complete!'));
            console.log(result);
        } catch (error) {
            console.error(chalk.red('❌ Error during analysis:', error.message));
        }
    });

program
    .command('document')
    .description('Create or update documentation')
    .action(async () => {
        checkGitInstalled();
        console.log(chalk.blue('📝 Generating documentation...'));
        
        try {
            const docAgent = loadAgent('documentation-expert');
            const rules = readDocumentationRules();
            const result = await docAgent.generateDocumentation(rules);
            console.log(chalk.green('✅ Documentation updated!'));
            console.log(result);
        } catch (error) {
            console.error(chalk.red('❌ Error generating documentation:', error.message));
        }
    });

program
    .command('review')
    .description('Review code and generate fix.md')
    .action(async () => {
        checkGitInstalled();
        console.log(chalk.blue('🔍 Reviewing code...'));
        
        try {
            const reviewAgent = loadAgent('code-review-expert');
            const rules = readDocumentationRules();
            const result = await reviewAgent.reviewCode(rules);
            
            // Create fix.md
            fs.writeFileSync('fix.md', result.fixes);
            console.log(chalk.green('✅ Code review complete! Check fix.md for issues.'));
        } catch (error) {
            console.error(chalk.red('❌ Error during code review:', error.message));
        }
    });

// Default command
if (process.argv.length === 2 || process.argv[2] === 'analyze-branch') {
    checkGitInstalled();
    console.log(chalk.blue('🔍 Running analyze-branch by default...'));
    program.parse(['node', 'git-copilot', 'analyze-branch']);
} else {
    program.parse();
}