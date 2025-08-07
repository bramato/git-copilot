const { execSync } = require('child_process');
const fs = require('fs-extra');

class PRGitExpert {
    constructor() {
        this.openrouterAgent = null;
        this.initializeAgent();
    }

    async initializeAgent() {
        try {
            // This will integrate with the openrouter-agents package
            const { createAgent } = require('openrouter-agents');
            this.openrouterAgent = createAgent({
                name: 'pr-git-expert',
                model: 'anthropic/claude-3.5-sonnet',
                systemPrompt: `You are an expert in Git workflows, pull requests, and code analysis. 
                You analyze git changes, provide insights on commit quality, suggest improvements for PRs, 
                and help with branching strategies. You understand git history, diff analysis, and best practices 
                for collaborative development.`
            });
        } catch (error) {
            console.warn('OpenRouter agent not available, using fallback mode');
        }
    }

    async analyzeBranch() {
        try {
            const currentBranch = this.getCurrentBranch();
            const changes = this.getChanges();
            const commits = this.getRecentCommits();
            const diffStats = this.getDiffStats();

            const analysis = {
                branch: currentBranch,
                changes: changes,
                commits: commits,
                stats: diffStats,
                recommendations: await this.generateRecommendations(changes, commits)
            };

            return this.formatAnalysis(analysis);
        } catch (error) {
            throw new Error(`Branch analysis failed: ${error.message}`);
        }
    }

    getCurrentBranch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    getChanges() {
        try {
            const staged = execSync('git diff --cached --name-status', { encoding: 'utf8' }).trim();
            const unstaged = execSync('git diff --name-status', { encoding: 'utf8' }).trim();
            const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).trim();

            return {
                staged: staged ? staged.split('\\n') : [],
                unstaged: unstaged ? unstaged.split('\\n') : [],
                untracked: untracked ? untracked.split('\\n') : []
            };
        } catch (error) {
            return { staged: [], unstaged: [], untracked: [] };
        }
    }

    getRecentCommits() {
        try {
            const commits = execSync('git log --oneline -10', { encoding: 'utf8' }).trim();
            return commits ? commits.split('\\n') : [];
        } catch (error) {
            return [];
        }
    }

    getDiffStats() {
        try {
            const stats = execSync('git diff --stat', { encoding: 'utf8' }).trim();
            return stats;
        } catch (error) {
            return 'No changes detected';
        }
    }

    async generateRecommendations(changes, commits) {
        const recommendations = [];

        // Basic recommendations based on analysis
        if (changes.staged.length === 0 && changes.unstaged.length === 0) {
            recommendations.push('✅ No pending changes detected');
        }

        if (changes.staged.length > 0) {
            recommendations.push(`📋 ${changes.staged.length} files staged for commit`);
        }

        if (changes.unstaged.length > 0) {
            recommendations.push(`⚠️  ${changes.unstaged.length} files with unstaged changes`);
        }

        if (changes.untracked.length > 0) {
            recommendations.push(`📁 ${changes.untracked.length} untracked files`);
        }

        // Commit message analysis
        if (commits.length > 0) {
            const shortCommits = commits.filter(commit => commit.length < 20);
            if (shortCommits.length > 0) {
                recommendations.push(`💬 Consider more descriptive commit messages for recent commits`);
            }
        }

        return recommendations;
    }

    formatAnalysis(analysis) {
        return `
🔍 BRANCH ANALYSIS REPORT
========================

📊 Current Branch: ${analysis.branch}

📈 Statistics:
${analysis.stats}

📋 Changes Summary:
• Staged: ${analysis.changes.staged.length} files
• Unstaged: ${analysis.changes.unstaged.length} files  
• Untracked: ${analysis.changes.untracked.length} files

🎯 Recent Commits (last 10):
${analysis.commits.map(commit => `  ${commit}`).join('\\n')}

💡 Recommendations:
${analysis.recommendations.map(rec => `• ${rec}`).join('\\n')}
`;
    }
}

module.exports = new PRGitExpert();