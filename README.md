# 🚀 Git Copilot

> **Transform your Git workflow with AI-powered analysis, documentation, and code review**

[![npm version](https://badge.fury.io/js/git-copilot.svg)](https://badge.fury.io/js/git-copilot)
[![Downloads](https://img.shields.io/npm/dm/git-copilot.svg)](https://npmjs.org/package/git-copilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/bramato/git-copilot/workflows/Node.js%20CI/badge.svg)](https://github.com/bramato/git-copilot/actions)
[![Node.js Version](https://img.shields.io/node/v/git-copilot.svg)](https://nodejs.org)

**Git Copilot** revolutionizes your development workflow by combining the power of AI with Git operations. This intelligent CLI tool provides comprehensive code analysis, automated documentation generation, and thorough code reviews - all powered by cutting-edge AI agents through OpenRouter integration.

## ✨ Why Git Copilot?

- **🤖 AI-Powered Intelligence**: Leverages advanced AI models for deep code understanding
- **⚡ Lightning Fast**: Get instant insights without leaving your terminal  
- **🎯 Specialized Agents**: Three expert AI agents for different development needs
- **📊 Actionable Reports**: Detailed fix.md files with prioritized recommendations
- **🔧 Zero Configuration**: Works out of the box with any Git repository
- **🌐 OpenRouter Integration**: Access to multiple AI models and providers

## 🎯 Core Features

### 🔍 Smart Branch Analysis
- **Comprehensive Change Detection**: Analyzes staged, unstaged, and untracked files
- **Commit Quality Assessment**: Reviews commit messages and history patterns  
- **Intelligent Recommendations**: AI-powered suggestions for improving your workflow
- **Statistics & Insights**: Detailed diff stats and change summaries

### 📚 Automated Documentation
- **README Generation**: Creates professional project documentation automatically
- **API Documentation**: Extracts and documents your code's API surface
- **Changelog Management**: Maintains version history with semantic understanding
- **Style-Aware Writing**: Follows your existing documentation patterns

### 🛡️ Advanced Code Review
- **Security Analysis**: Detects hardcoded secrets, eval usage, and vulnerabilities
- **Performance Optimization**: Identifies sync operations, nested loops, and bottlenecks
- **Code Quality Checks**: Finds magic numbers, long functions, and complexity issues  
- **Best Practice Enforcement**: Suggests improvements based on industry standards
- **Prioritized Fix Reports**: Generates actionable fix.md files with severity ratings

## 📦 Installation

Choose your preferred installation method:

### 🌟 Global Installation (Recommended)
Install once, use everywhere:
```bash
npm install -g git-copilot
```

### 📁 Local Project Installation  
For project-specific usage:
```bash
npm install git-copilot --save-dev
```

### ⚡ One-time Usage with npx
Try without installing:
```bash
npx git-copilot [command]
```

### 📋 Requirements
- **Node.js** >= 16.0.0
- **Git** installed and configured  
- **OpenRouter API key** (for AI features) - Get yours at [OpenRouter.ai](https://openrouter.ai/)

## 🚀 Quick Start

Get up and running in 60 seconds:

### 1️⃣ Set up OpenRouter API Key
```bash
export OPENROUTER_API_KEY="your-api-key-here"
```
💡 **Pro tip**: Add this to your `.bashrc`, `.zshrc`, or `.env` file for persistent access

### 2️⃣ Navigate to Your Git Repository
```bash
cd your-awesome-project
```

### 3️⃣ Run Your First Analysis
```bash
git-copilot analyze-branch
```

### 4️⃣ See the Magic! ✨
```
🔍 BRANCH ANALYSIS REPORT
========================

📊 Current Branch: feature/user-auth

📈 Statistics:
3 files changed, 127 insertions(+), 23 deletions(-)

📋 Changes Summary:
• Staged: 2 files
• Unstaged: 1 files  
• Untracked: 0 files

💡 Recommendations:
• ✅ No pending changes detected
• 📋 2 files staged for commit
• 💬 Consider more descriptive commit messages
```

## 🎪 Use Cases & Examples

### 👨‍💻 For Individual Developers
```bash
# Before starting work
git-copilot analyze-branch          # Understand current state

# During development  
git-copilot review                  # Continuous quality checks

# Before committing
git-copilot analyze-branch          # Final review

# For documentation
git-copilot document               # Auto-generate docs
```

### 👥 For Development Teams
```bash
# Code review process
git-copilot review > team-review.md

# Documentation standards
git-copilot document --force        # Standardized docs

# PR preparation
git-copilot analyze-branch          # Pre-PR analysis
```

### 🏢 For Enterprise Projects
```bash
# Security audits
git-copilot review                  # Identify security issues

# Compliance reporting
git-copilot review --path src/      # Focused analysis

# Documentation maintenance
git-copilot document               # Keep docs current
```

## 📖 Commands Reference

### 🔍 `analyze-branch` - Smart Git Analysis

Provides comprehensive analysis of your Git branch with AI-powered insights.

```bash
git-copilot analyze-branch
# Also works as default command:
git-copilot
analyze-branch  # Direct global command
```

**What it analyzes:**
- ✅ Staged, unstaged, and untracked files
- 📊 Commit history and message quality  
- 📈 Diff statistics and change patterns
- 💡 Workflow improvement suggestions

**Example Output:**
```bash
🔍 Analyzing branch changes...
✅ Analysis complete!

📊 Current Branch: feature/auth-system
📋 Changes Summary: 5 files staged, 2 unstaged
💡 Recommendations: Consider more descriptive commit messages
```

---

### 📚 `document` - AI Documentation Generator

Creates comprehensive project documentation tailored to your codebase.

```bash
git-copilot document
git-copilot doc  # Short alias
```

**Features:**
- 📝 Analyzes existing documentation style
- 🏗️ Generates README.md, API.md, and CHANGELOG.md
- 📋 Reads project structure and package.json
- 🎨 Maintains consistent formatting

**Example:**
```bash
git-copilot document
# Creates: README.md, API.md, CHANGELOG.md
```

---

### 🛡️ `review` - Comprehensive Code Review

Performs deep code analysis and generates detailed improvement reports.

```bash
git-copilot review
```

**Analysis Categories:**
- 🔴 **Security**: Hardcoded secrets, eval usage, vulnerabilities
- 🟡 **Performance**: Sync operations, nested loops, bottlenecks  
- 🟢 **Quality**: Magic numbers, long functions, complexity
- ℹ️ **Best Practices**: TODOs, debug statements, conventions

**Output:**
- 📄 **fix.md**: Detailed report with prioritized issues
- 📊 **Statistics**: Issue counts by severity and category
- 💡 **Recommendations**: Actionable improvement suggestions

**Example Report:**
```markdown
# Code Review Report
Total issues found: 12

### Issues by Severity
- 🔴 High: 2 (Security vulnerabilities)
- 🟡 Medium: 4 (Performance issues)  
- 🟢 Low: 6 (Code quality)
```

## 🤖 Specialized AI Agents

Git Copilot employs three specialized AI agents, each expert in their domain, powered by [OpenRouter](https://openrouter.ai/):

### 🎯 PR/Git Expert Agent
**The Git Whisperer** - Understands your repository like a senior developer
```javascript
// Capabilities:
• Branch difference analysis with context awareness
• Commit quality assessment and pattern recognition
• Pull request optimization suggestions  
• Breaking change detection and impact analysis
• Workflow improvement recommendations
```

### 📚 Documentation Expert Agent  
**The Technical Writer** - Transforms code into clear, professional docs
```javascript  
// Capabilities:
• Intelligent README generation based on project structure
• API documentation extraction from code analysis
• Changelog creation with semantic versioning awareness
• Style consistency maintenance across all documentation
• Integration with existing KB.md and documentation rules
```

### 🔍 Code Review Expert Agent
**The Quality Guardian** - Your personal code quality mentor
```javascript
// Capabilities:
• Multi-layered security vulnerability detection
• Performance bottleneck identification and optimization
• Code complexity analysis with maintainability scoring
• Best practice enforcement with industry standards
• Prioritized fix reports with actionable recommendations
```

> **Powered by**: Claude 3.5 Sonnet, GPT-4, and other cutting-edge AI models via OpenRouter

## ⚙️ Configuration

### 🌐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | ✅ Yes | - |
| `GIT_COPILOT_MODEL` | AI model to use | ❌ No | `claude-3.5-sonnet` |

```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export OPENROUTER_API_KEY="your-api-key-here"
export GIT_COPILOT_MODEL="gpt-4"  # Optional: customize AI model
```

### 📁 Project-Specific Configuration

Git Copilot intelligently adapts to your project by reading existing files:

| File | Purpose | Impact |
|------|---------|--------|
| `README.md` | Documentation style reference | 📝 Maintains writing consistency |
| `KB.md` | Knowledge base and style guidelines | 🎨 Follows your team's conventions |
| `.github/CONTRIBUTING.md` | Contribution guidelines | 👥 Aligns with project standards |
| `docs/STYLE_GUIDE.md` | Code style preferences | 🎯 Customizes review criteria |
| `package.json` | Project metadata | 📦 Understands dependencies and scripts |

> **Smart Defaults**: No configuration files? No problem! Git Copilot works great out of the box.

## 📄 Generated Files

Git Copilot creates intelligent, actionable output files:

### 🛠️ fix.md - Code Review Report
```markdown
# Code Review Report
Generated: 2024-01-15

## Summary  
Total issues found: 23
- 🔴 High: 3 (Security vulnerabilities)
- 🟡 Medium: 8 (Performance issues)
- 🟢 Low: 12 (Code quality improvements)

## High Priority Fixes
1. **auth.js:42** - Hardcoded API key detected
2. **db.js:15** - SQL injection vulnerability  
3. **utils.js:89** - Use of eval() is dangerous
```

### 📚 Documentation Files  
- **README.md** - Professional project documentation with usage examples
- **API.md** - Comprehensive API reference with endpoints and examples  
- **CHANGELOG.md** - Semantic version history with detailed change descriptions

### 🎯 Real Examples

<details>
<summary><strong>📊 Sample Branch Analysis Output</strong></summary>

```bash
🔍 BRANCH ANALYSIS REPORT
========================

📊 Current Branch: feature/user-authentication
📈 Statistics: 8 files changed, 234 insertions(+), 67 deletions(-)

📋 Changes Summary:
• Staged: 5 files (auth.js, user.model.js, login.vue, etc.)
• Unstaged: 2 files (config.js, .env.example)  
• Untracked: 1 file (migration_001.sql)

🎯 Recent Commits (last 10):
• a1b2c3d Add JWT authentication middleware
• e4f5g6h Update user model with password hashing  
• i7j8k9l Fix login form validation

💡 Recommendations:
• ✅ Good commit message structure
• 📋 5 files ready for commit
• ⚠️ Consider staging config.js changes
• 📁 New migration file detected - review before commit
• 🔐 Ensure sensitive data is properly excluded from git
```
</details>

## 🛠️ Development & Contributing

### 🏗️ Project Architecture

```
git-copilot/
├── 📁 bin/                    # CLI executables & entry points
│   └── git-copilot.js        # Main CLI interface
├── 📁 src/                    # Core source code  
│   ├── commands/             # Command implementations
│   │   ├── analyze-branch.js # Git analysis logic
│   │   ├── documentation.js  # Doc generation
│   │   └── review.js         # Code review engine
│   ├── utils/                # Shared utilities
│   │   └── git-checker.js    # Git validation
│   └── types/                # TypeScript definitions
├── 📁 agents/                 # AI agent implementations
│   ├── pr-git-expert.js      # Git analysis specialist
│   ├── documentation-expert.js # Documentation creator
│   └── code-review-expert.js # Code quality auditor
├── 📁 tests/                  # Test suites
├── 📁 docs/                   # Project documentation
└── 📄 package.json           # Project metadata
```

### 🚀 Local Development Setup

#### 1️⃣ Clone & Install
```bash
git clone https://github.com/bramato/git-copilot.git
cd git-copilot
npm install
```

#### 2️⃣ Development Mode
```bash
# Link for global testing
npm link

# Test your changes
git-copilot --version
```

#### 3️⃣ Code Quality
```bash
# Run tests
npm test

# Lint code  
npm run lint
npm run lint:fix

# Type checking (if TypeScript)
npm run type-check
```

### 🧪 Testing Framework

```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# Coverage report
npm run test:coverage
```

### 🤝 Contributing Guidelines

We welcome contributions! Here's how to get involved:

#### 🌟 Ways to Contribute
- 🐛 **Bug Reports**: Found an issue? [Create an issue](https://github.com/bramato/git-copilot/issues)
- 💡 **Feature Requests**: Have an idea? We'd love to hear it!
- 🔧 **Code Contributions**: Fix bugs or add features
- 📚 **Documentation**: Improve docs and examples
- 🧪 **Testing**: Add test cases and improve coverage

#### 🚀 Contribution Workflow

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
3. **✨ Develop** your changes:
   - Add comprehensive tests
   - Follow existing code style
   - Update documentation if needed
4. **🧪 Test** everything:
   ```bash
   npm test
   npm run lint
   ```
5. **📝 Commit** with clear messages:
   ```bash
   git commit -m "✨ Add amazing new feature

   - Implement feature X with Y capability
   - Add comprehensive tests
   - Update documentation"
   ```
6. **🚀 Push** and create a Pull Request

#### 📋 Development Standards
- ✅ **Code Coverage**: Maintain > 80% test coverage
- 🎨 **Code Style**: Follow ESLint configuration  
- 📖 **Documentation**: Update README for new features
- 🧪 **Testing**: Add tests for all new functionality
- 🔒 **Security**: No hardcoded secrets or vulnerabilities

## 📦 Publishing & Releases

### 🏷️ Semantic Versioning
We follow [SemVer](https://semver.org/) for version management:

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)  
npm version minor

# Major release (breaking changes)
npm version major
```

### 🚀 NPM Publishing Process

```bash
# 1. Ensure everything is tested
npm test

# 2. Update version
npm version patch  # or minor/major

# 3. Publish to NPM
npm publish
```

### 🤖 CI/CD Pipeline

Our GitHub Actions automatically handle:
- ✅ **Automated Testing**: Run full test suite on PRs
- 🚀 **NPM Publishing**: Automatic publishing on release tags  
- 🔍 **Code Quality**: ESLint and security checks
- 📊 **Coverage Reports**: Track test coverage trends

## 💬 Support & Community

### 🆘 Get Help
- 📖 **Documentation**: [Complete Guide](https://github.com/bramato/git-copilot#readme)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/bramato/git-copilot/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/bramato/git-copilot/discussions)
- 🤔 **Questions**: [Stack Overflow](https://stackoverflow.com/questions/tagged/git-copilot)

### 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/bramato/git-copilot?style=social)
![GitHub forks](https://img.shields.io/github/forks/bramato/git-copilot?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/bramato/git-copilot?style=social)

### 🏆 Recognition & Thanks

**Special Thanks To:**
- 🤖 **[OpenRouter](https://openrouter.ai/)** - Providing access to cutting-edge AI models
- 🔧 **[openrouter-agents](https://github.com/bramato/openrouter-agents)** - The foundation for our AI integration
- 👥 **Open Source Community** - For inspiration and collaborative spirit
- 🧠 **AI Research Community** - Making advanced language models accessible

### 🔗 Related Projects

- 🤝 **[openrouter-agents](https://github.com/bramato/openrouter-agents)** - AI agent framework
- 🔄 **[Git Flow Tools](https://github.com/topics/git-workflow)** - Similar workflow tools
- 📝 **[Documentation Generators](https://github.com/topics/documentation-generator)** - Doc automation tools

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Free for commercial and personal use
✅ Commercial use    ✅ Modification    ✅ Distribution    ✅ Private use
```

---

<div align="center">

### 🚀 Ready to Transform Your Git Workflow?

```bash
npm install -g git-copilot
```

**Made with 💜 by [bramato](https://github.com/bramato) and the open source community**

*Git Copilot - Where AI meets Git mastery* ✨

</div>