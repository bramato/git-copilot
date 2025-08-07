const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class CodeReviewExpert {
    constructor() {
        this.openrouterAgent = null;
        this.initializeAgent();
    }

    async initializeAgent() {
        try {
            const { createAgent } = require('openrouter-agents');
            this.openrouterAgent = createAgent({
                name: 'code-review-expert',
                model: 'anthropic/claude-3.5-sonnet',
                systemPrompt: `You are an expert code reviewer specializing in identifying bugs, security issues, 
                code quality problems, and maintainability concerns. You analyze code for best practices, 
                performance issues, and suggest improvements. You provide detailed, actionable feedback 
                with specific examples and solutions.`
            });
        } catch (error) {
            console.warn('OpenRouter agent not available, using fallback mode');
        }
    }

    async reviewCode(rules) {
        try {
            const codeFiles = await this.getCodeFiles();
            const analysis = await this.analyzeFiles(codeFiles);
            const issues = await this.identifyIssues(analysis, rules);
            const report = this.generateReport(issues);

            return {
                fixes: report,
                summary: this.generateSummary(issues),
                stats: this.getStats(issues)
            };
        } catch (error) {
            throw new Error(`Code review failed: ${error.message}`);
        }
    }

    async getCodeFiles() {
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
        const codeFiles = [];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next'];

        try {
            const files = await this.walkDirectory('.', excludeDirs);
            for (const file of files) {
                if (codeExtensions.some(ext => file.endsWith(ext))) {
                    codeFiles.push(file);
                }
            }
        } catch (error) {
            console.warn('Error reading code files:', error.message);
        }

        return codeFiles;
    }

    async walkDirectory(dir, exclude = []) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && !exclude.includes(entry.name) && !entry.name.startsWith('.')) {
                    files.push(...await this.walkDirectory(fullPath, exclude));
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }
        
        return files;
    }

    async analyzeFiles(codeFiles) {
        const analysis = [];

        for (const file of codeFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const fileAnalysis = {
                    file,
                    content,
                    lines: content.split('\n'),
                    size: content.length,
                    issues: []
                };

                // Basic static analysis
                fileAnalysis.issues.push(...this.checkCommonIssues(content, file));
                fileAnalysis.issues.push(...this.checkSecurity(content, file));
                fileAnalysis.issues.push(...this.checkPerformance(content, file));
                fileAnalysis.issues.push(...this.checkMaintainability(content, file));

                analysis.push(fileAnalysis);
            } catch (error) {
                console.warn(`Could not analyze file ${file}:`, error.message);
            }
        }

        return analysis;
    }

    checkCommonIssues(content, file) {
        const issues = [];
        const lines = content.split('\n');

        // Check for console.log statements
        lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
                issues.push({
                    type: 'warning',
                    category: 'Debug Code',
                    line: index + 1,
                    message: 'Console.log statement found - consider removing for production',
                    severity: 'low'
                });
            }
        });

        // Check for TODO comments
        lines.forEach((line, index) => {
            if (line.includes('TODO') || line.includes('FIXME')) {
                issues.push({
                    type: 'info',
                    category: 'TODO/FIXME',
                    line: index + 1,
                    message: 'TODO or FIXME comment found',
                    severity: 'info'
                });
            }
        });

        // Check for long functions (> 50 lines)
        const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\(|^\s*\w+\s*:\s*function|class\s+\w+/g;
        let currentFunction = null;
        let functionStartLine = 0;
        let braceCount = 0;

        lines.forEach((line, index) => {
            if (functionRegex.test(line)) {
                currentFunction = line.trim();
                functionStartLine = index + 1;
                braceCount = 0;
            }

            if (currentFunction) {
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;

                if (braceCount === 0 && (index - functionStartLine + 1) > 50) {
                    issues.push({
                        type: 'warning',
                        category: 'Code Complexity',
                        line: functionStartLine,
                        message: `Function is too long (${index - functionStartLine + 1} lines). Consider breaking it down.`,
                        severity: 'medium'
                    });
                    currentFunction = null;
                }
            }
        });

        return issues;
    }

    checkSecurity(content, file) {
        const issues = [];
        const lines = content.split('\n');

        // Check for hardcoded secrets
        const secretPatterns = [
            /password\s*[=:]\s*["'][^"']+["']/i,
            /api[_-]?key\s*[=:]\s*["'][^"']+["']/i,
            /secret\s*[=:]\s*["'][^"']+["']/i,
            /token\s*[=:]\s*["'][^"']+["']/i
        ];

        lines.forEach((line, index) => {
            secretPatterns.forEach(pattern => {
                if (pattern.test(line) && !line.includes('process.env')) {
                    issues.push({
                        type: 'error',
                        category: 'Security',
                        line: index + 1,
                        message: 'Possible hardcoded secret detected. Use environment variables instead.',
                        severity: 'high'
                    });
                }
            });
        });

        // Check for eval usage
        if (content.includes('eval(')) {
            issues.push({
                type: 'error',
                category: 'Security',
                line: content.split('\n').findIndex(line => line.includes('eval(')) + 1,
                message: 'Use of eval() is dangerous and should be avoided',
                severity: 'high'
            });
        }

        return issues;
    }

    checkPerformance(content, file) {
        const issues = [];
        const lines = content.split('\n');

        // Check for synchronous file operations
        const syncMethods = ['readFileSync', 'writeFileSync', 'existsSync'];
        lines.forEach((line, index) => {
            syncMethods.forEach(method => {
                if (line.includes(method) && !line.trim().startsWith('//')) {
                    issues.push({
                        type: 'warning',
                        category: 'Performance',
                        line: index + 1,
                        message: `Synchronous ${method} call may block the event loop. Consider using async version.`,
                        severity: 'medium'
                    });
                }
            });
        });

        // Check for nested loops
        let loopDepth = 0;
        lines.forEach((line, index) => {
            if (line.includes('for ') || line.includes('while ') || line.includes('forEach')) {
                loopDepth++;
                if (loopDepth > 2) {
                    issues.push({
                        type: 'warning',
                        category: 'Performance',
                        line: index + 1,
                        message: 'Deeply nested loops detected. Consider optimizing algorithm complexity.',
                        severity: 'medium'
                    });
                }
            }
            if (line.includes('}')) {
                loopDepth = Math.max(0, loopDepth - 1);
            }
        });

        return issues;
    }

    checkMaintainability(content, file) {
        const issues = [];
        const lines = content.split('\n');

        // Check for magic numbers
        lines.forEach((line, index) => {
            const numbers = line.match(/\b(\d{2,})\b/g);
            if (numbers && !line.trim().startsWith('//')) {
                numbers.forEach(num => {
                    if (parseInt(num) > 1 && parseInt(num) !== 100 && parseInt(num) !== 1000) {
                        issues.push({
                            type: 'info',
                            category: 'Maintainability',
                            line: index + 1,
                            message: `Magic number ${num} found. Consider using a named constant.`,
                            severity: 'low'
                        });
                    }
                });
            }
        });

        // Check for long parameter lists
        const functionRegex = /function\s*\([^)]+\)|\([^)]+\)\s*=>/g;
        lines.forEach((line, index) => {
            const matches = line.match(functionRegex);
            if (matches) {
                matches.forEach(match => {
                    const params = match.split(',').length;
                    if (params > 4) {
                        issues.push({
                            type: 'warning',
                            category: 'Maintainability',
                            line: index + 1,
                            message: `Function has ${params} parameters. Consider using an options object.`,
                            severity: 'low'
                        });
                    }
                });
            }
        });

        return issues;
    }

    async identifyIssues(analysis, rules) {
        const allIssues = [];

        analysis.forEach(fileAnalysis => {
            fileAnalysis.issues.forEach(issue => {
                allIssues.push({
                    ...issue,
                    file: fileAnalysis.file
                });
            });
        });

        // Sort by severity
        const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
        allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return allIssues;
    }

    generateReport(issues) {
        const reportDate = new Date().toISOString().split('T')[0];
        let report = `# Code Review Report
Generated: ${reportDate}

## Summary
Total issues found: ${issues.length}

`;

        // Group by severity
        const bySeverity = issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {});

        report += `### Issues by Severity
- 🔴 High: ${bySeverity.high || 0}
- 🟡 Medium: ${bySeverity.medium || 0}
- 🟢 Low: ${bySeverity.low || 0}
- ℹ️ Info: ${bySeverity.info || 0}

`;

        // Group by category
        const byCategory = issues.reduce((acc, issue) => {
            if (!acc[issue.category]) acc[issue.category] = [];
            acc[issue.category].push(issue);
            return acc;
        }, {});

        report += `## Issues by Category

`;

        Object.entries(byCategory).forEach(([category, categoryIssues]) => {
            report += `### ${category} (${categoryIssues.length} issues)

`;
            categoryIssues.forEach(issue => {
                const severityIcon = {
                    high: '🔴',
                    medium: '🟡', 
                    low: '🟢',
                    info: 'ℹ️'
                }[issue.severity];

                report += `${severityIcon} **${path.basename(issue.file)}:${issue.line}**
${issue.message}

`;
            });
            report += `
`;
        });

        report += `## Recommendations

### High Priority Fixes
`;
        issues.filter(i => i.severity === 'high').slice(0, 5).forEach(issue => {
            report += `1. **${path.basename(issue.file)}:${issue.line}** - ${issue.message}
`;
        });

        report += `
### Code Quality Improvements
- Remove debug statements (console.log) before production
- Replace magic numbers with named constants
- Break down complex functions into smaller, focused units
- Use environment variables for sensitive configuration
- Consider async alternatives for synchronous operations

### Best Practices
- Add comprehensive error handling
- Include unit tests for critical functions
- Document complex algorithms with comments
- Use consistent code formatting
- Follow established naming conventions
`;

        return report;
    }

    generateSummary(issues) {
        const total = issues.length;
        const high = issues.filter(i => i.severity === 'high').length;
        const medium = issues.filter(i => i.severity === 'medium').length;

        return `Found ${total} issues: ${high} high, ${medium} medium priority`;
    }

    getStats(issues) {
        return {
            total: issues.length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length,
            info: issues.filter(i => i.severity === 'info').length
        };
    }
}

module.exports = new CodeReviewExpert();