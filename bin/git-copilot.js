#!/usr/bin/env node

require('dotenv').config();

const { Command } = require('commander');
const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

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

// Check and setup OpenRouter API key
async function checkOpenRouterSetup() {
    if (process.env.OPENROUTER_API_KEY) {
        return true; // Already configured
    }

    console.log(chalk.yellow('\n🔑 OpenRouter API Key non trovata!'));
    console.log(chalk.blue('Git Copilot utilizza OpenRouter per l\'analisi AI avanzata.'));
    console.log(chalk.gray('Puoi ottenere una chiave gratuita su: https://openrouter.ai/\n'));

    const { setupChoice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'setupChoice',
            message: 'Come vuoi procedere?',
            choices: [
                { name: '🔧 Configura API Key ora', value: 'setup' },
                { name: '⏭️  Continua senza AI (modalità base)', value: 'skip' },
                { name: '❌ Esci', value: 'exit' }
            ]
        }
    ]);

    switch (setupChoice) {
        case 'setup':
            return await setupOpenRouterKey();
        case 'skip':
            console.log(chalk.yellow('⚠️  Continuando in modalità base (senza AI avanzata)\n'));
            return false;
        case 'exit':
            console.log(chalk.gray('👋 Arrivederci!'));
            process.exit(0);
    }
}

async function setupOpenRouterKey() {
    console.log(chalk.blue('\n📋 Istruzioni:'));
    console.log('1. Vai su https://openrouter.ai/');
    console.log('2. Crea un account (gratuito)');
    console.log('3. Vai su "API Keys" nel tuo dashboard');
    console.log('4. Crea una nuova API key');
    console.log('5. Copia la chiave e incollala qui sotto\n');

    const { apiKey } = await inquirer.prompt([
        {
            type: 'password',
            name: 'apiKey',
            message: 'Inserisci la tua OpenRouter API Key:',
            mask: '*',
            validate: (input) => {
                if (!input || input.trim().length < 10) {
                    return 'La API key deve essere più lunga di 10 caratteri';
                }
                if (!input.startsWith('sk-')) {
                    return 'La API key dovrebbe iniziare con "sk-"';
                }
                return true;
            }
        }
    ]);

    const { saveChoice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'saveChoice',
            message: 'Dove vuoi salvare la API key?',
            choices: [
                { name: '🏠 Variabile d\'ambiente globale (raccomandato)', value: 'global' },
                { name: '📁 File .env locale (solo questo progetto)', value: 'local' },
                { name: '⚡ Solo per questa sessione', value: 'session' }
            ]
        }
    ]);

    switch (saveChoice) {
        case 'global':
            await saveGlobalEnv(apiKey);
            break;
        case 'local':
            await saveLocalEnv(apiKey);
            break;
        case 'session':
            process.env.OPENROUTER_API_KEY = apiKey.trim();
            console.log(chalk.green('✅ API key impostata per questa sessione\n'));
            break;
    }

    return true;
}

async function saveGlobalEnv(apiKey) {
    const homeDir = require('os').homedir();
    const profiles = ['.bashrc', '.zshrc', '.profile'];
    
    console.log(chalk.blue('\n📝 Aggiungendo la chiave al tuo profilo shell...'));
    
    const envLine = `export OPENROUTER_API_KEY="${apiKey.trim()}"`;
    
    for (const profile of profiles) {
        const profilePath = path.join(homeDir, profile);
        if (fs.existsSync(profilePath)) {
            const content = fs.readFileSync(profilePath, 'utf8');
            if (!content.includes('OPENROUTER_API_KEY')) {
                fs.appendFileSync(profilePath, `\n# Git Copilot OpenRouter API Key\n${envLine}\n`);
                console.log(chalk.green(`✅ Aggiunto a ${profile}`));
            }
        }
    }
    
    // Set for current session
    process.env.OPENROUTER_API_KEY = apiKey.trim();
    
    console.log(chalk.yellow('⚠️  Riavvia il terminal o esegui: source ~/.bashrc'));
    console.log(chalk.green('✅ API key configurata globalmente\n'));
}

async function saveLocalEnv(apiKey) {
    const envPath = '.env';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    if (!envContent.includes('OPENROUTER_API_KEY')) {
        const envLine = `OPENROUTER_API_KEY=${apiKey.trim()}`;
        envContent = envContent ? `${envContent}\n${envLine}\n` : `${envLine}\n`;
        fs.writeFileSync(envPath, envContent);
        
        // Add .env to .gitignore if not present
        const gitignorePath = '.gitignore';
        let gitignoreContent = '';
        
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }
        
        if (!gitignoreContent.includes('.env')) {
            gitignoreContent = gitignoreContent ? `${gitignoreContent}\n.env\n` : '.env\n';
            fs.writeFileSync(gitignorePath, gitignoreContent);
        }
    }
    
    // Set for current session
    process.env.OPENROUTER_API_KEY = apiKey.trim();
    
    console.log(chalk.green('✅ API key salvata in .env locale\n'));
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
    .version('1.0.4');

program
    .command('analyze-branch')
    .description('Analyze current branch changes using AI')
    .action(async () => {
        checkGitInstalled();
        await checkOpenRouterSetup();
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
        await checkOpenRouterSetup();
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
    .option('--no-ai', 'Skip OpenRouter setup and run in basic mode')
    .action(async (options) => {
        checkGitInstalled();
        
        if (!options.noAi) {
            await checkOpenRouterSetup();
        } else {
            console.log(chalk.yellow('⚡ Modalità base attivata (senza AI)\n'));
        }
        
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

// Parse commands first
program.parse();

// Handle default command if no command was provided
if (process.argv.length === 2) {
    (async () => {
        checkGitInstalled();
        await checkOpenRouterSetup();
        console.log(chalk.blue('🔍 Running analyze-branch by default...'));
        
        const gitAgent = loadAgent('pr-git-expert');
        try {
            const result = await gitAgent.analyzeBranch();
            console.log(chalk.green('✅ Analysis complete!'));
            console.log(result);
        } catch (error) {
            console.error(chalk.red('❌ Error during analysis:', error.message));
        }
    })();
}