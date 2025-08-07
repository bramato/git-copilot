# Git Copilot

> AI-powered Git analysis and code review CLI tool with specialized agents for PR analysis, documentation, and code quality

[![npm version](https://badge.fury.io/js/git-copilot.svg)](https://badge.fury.io/js/git-copilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/bramato/git-copilot/workflows/Node.js%20CI/badge.svg)](https://github.com/bramato/git-copilot/actions)

Git Copilot is a comprehensive CLI tool that leverages AI to enhance your Git workflow. It provides intelligent analysis of your code changes, generates documentation, performs code reviews, and creates actionable improvement reports.

## Features

- 🔍 **Branch Analysis**: Intelligent analysis of Git branches and changes
- 📚 **Documentation Generation**: Auto-generate comprehensive documentation
- 🛡️ **Code Review**: AI-powered code quality assessment and fix recommendations  
- 🎯 **Multiple AI Agents**: Specialized agents for different aspects of development
- 🚀 **Easy CLI Interface**: Simple commands with intuitive options
- 📄 **Detailed Reports**: Generate fix.md files with actionable insights

## Installation

### Global Installation (Recommended)

```bash
npm install -g git-copilot
```

### Local Installation

```bash
npm install git-copilot
```

### Using with npx

```bash
npx git-copilot [command]
```

## Quick Start

1. **Set up your OpenRouter API key** (required for AI features):
   ```bash
   export OPENROUTER_API_KEY="your-api-key-here"
   ```
   Get your key at [OpenRouter.ai](https://openrouter.ai/)

2. **Navigate to your Git repository**:
   ```bash
   cd your-project
   ```

3. **Run your first analysis**:
   ```bash
   git-copilot analyze-branch
   ```

## Commands

### `analyze-branch`

Analyze your current Git branch for changes and improvements.

```bash
git-copilot analyze-branch [options]

# Aliases
git-copilot analyze
analyze-branch  # Direct command
```

**Options:**
- `-b, --branch <branch>` - Specify branch to analyze (default: current)
- `-v, --verbose` - Show detailed analysis
- `-h, --help` - Display help

**Example:**
```bash
git-copilot analyze-branch --verbose
git-copilot analyze-branch -b feature/new-feature
```

### `document`

Create or update project documentation using AI.

```bash
git-copilot document [options]

# Alias
git-copilot doc
```

**Options:**
- `-f, --force` - Force update existing documentation
- `-t, --type <type>` - Documentation type: `readme`, `api`, `changelog` (default: readme)
- `-h, --help` - Display help

**Examples:**
```bash
git-copilot document                    # Generate README.md
git-copilot doc --type api             # Generate API.md
git-copilot doc --type changelog       # Generate CHANGELOG.md  
git-copilot doc --force                # Overwrite existing README
```

### `review`

Generate comprehensive code review and create fix.md report.

```bash
git-copilot review [options]
```

**Options:**
- `-p, --path <path>` - Specific file or directory to review
- `-s, --staged` - Review only staged changes
- `-h, --help` - Display help

**Examples:**
```bash
git-copilot review                      # Review recent changes
git-copilot review --staged             # Review staged files only
git-copilot review --path src/          # Review specific directory
git-copilot review --path file.js       # Review specific file
```

### `init`

Initialize git-copilot in your current repository (coming soon).

```bash
git-copilot init
```

## AI Agents

Git Copilot uses specialized AI agents powered by [openrouter-agents](https://github.com/bramato/openrouter-agents):

### 🎯 PR/Git Expert Agent
- Analyzes branch differences and changes
- Evaluates commit quality and history
- Suggests PR improvements and descriptions
- Identifies potential breaking changes

### 📚 Documentation Expert Agent  
- Reads existing README.md and KB.md rules
- Generates comprehensive project documentation
- Creates API documentation from code analysis
- Maintains consistent documentation style

### 🔍 Code Review Expert Agent
- Performs static code analysis
- Identifies security vulnerabilities and code smells
- Assesses code complexity and maintainability
- Generates detailed fix.md reports with priorities

## Configuration

### Environment Variables

- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)
- `GIT_COPILOT_MODEL` - AI model to use (optional, default: claude-3.5-sonnet)

### Project Configuration

Git Copilot automatically reads project-specific documentation rules from:
- `README.md` - Existing documentation style
- `KB.md` - Knowledge base and style guidelines  
- `.github/CONTRIBUTING.md` - Contribution guidelines
- `docs/STYLE_GUIDE.md` - Style guide

## Output Files

Git Copilot generates several output files:

- **fix.md** - Comprehensive code review report with prioritized issues
- **README.md** - Auto-generated project documentation (when using `document`)
- **API.md** - API documentation (when using `document --type api`)
- **CHANGELOG.md** - Change log (when using `document --type changelog`)

## Requirements

- **Node.js** >= 16.0.0
- **Git** installed and configured
- **OpenRouter API key** for AI features
- Git repository (for most commands)

## Development

### Project Structure

```
git-copilot/
├── bin/                 # CLI executables
├── src/
│   ├── commands/        # Command implementations
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── agents/              # AI agent implementations
├── lib/                 # Compiled output (auto-generated)
├── tests/               # Test files
└── docs/                # Documentation
```

### Building from Source

```bash
# Clone the repository
git clone https://github.com/bramato/git-copilot.git
cd git-copilot

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Publishing

### NPM Publishing

The package is configured for easy publishing to NPM:

```bash
# Bump version
npm version patch|minor|major

# Publish to NPM
npm publish
```

### GitHub Actions

The project includes GitHub Actions workflows for:
- Automated testing
- NPM publishing on release
- Code quality checks

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/bramato/git-copilot#readme)
- 🐛 [Issues](https://github.com/bramato/git-copilot/issues)
- 💬 [Discussions](https://github.com/bramato/git-copilot/discussions)

## Acknowledgments

- Built with [openrouter-agents](https://github.com/bramato/openrouter-agents)
- Powered by [OpenRouter](https://openrouter.ai/) AI models
- Inspired by the developer community's need for better code review tools

---

**Made with ❤️ by [bramato](https://github.com/bramato)**