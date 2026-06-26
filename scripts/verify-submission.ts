import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

type RequiredFile = {
    readonly path: string;
    readonly description: string;
};

type CheckResult = {
    readonly name: string;
    readonly passed: boolean;
    readonly message: string;
};

const requiredFiles: readonly RequiredFile[] = [
    { path: 'docs/CHALLENGE_FULLSTACK_AI_WORKFLOW.md', description: 'full-stack AI workflow challenge prompt' },
    { path: 'apps/legacy-app/src/console/console.controller.ts', description: 'legacy full-stack console surface' },
    { path: 'apps/legacy-app/src/analysis/analysis-contract.ts', description: 'customer-facing API contract mapper' },
    { path: 'solutions/spec.md', description: 'spec-driven triage before code' },
    { path: 'solutions/ai-collaboration-log.md', description: 'AI collaboration chronology' },
    { path: 'solutions/decision-log.md', description: 'semantic, source-of-truth, and contract decisions' },
    { path: 'solutions/release-command-log.md', description: 'release state and command timeline' },
    { path: 'solutions/part1-billing-semantics.md', description: 'UI/API billing semantic incident report' },
    { path: 'solutions/part2-release-interruption.md', description: 'interrupted UI/API rollout plan' },
    { path: 'solutions/refactor-plan.md', description: 'surgical full-stack refactor plan' },
    { path: 'solutions/scale-plan.md', description: 'scale and frontend degrade plan under constraints' },
];

const allowEmptyTemplates: boolean = process.argv.includes('--allow-empty-templates');

async function main(): Promise<void> {
    const existenceResults: readonly CheckResult[] = await Promise.all(requiredFiles.map(checkFileExists));
    const contentResults: readonly CheckResult[] = allowEmptyTemplates ? [] : await checkSubmissionContent();
    const results: readonly CheckResult[] = [...existenceResults, ...contentResults];
    printResults(results);
    if (results.some((result: CheckResult): boolean => !result.passed)) {
        process.exitCode = 1;
    }
}

async function checkFileExists(file: RequiredFile): Promise<CheckResult> {
    const absolutePath: string = join(process.cwd(), file.path);
    try {
        await access(absolutePath, constants.R_OK);
        return { name: file.path, passed: true, message: `Found ${file.description}.` };
    } catch (error: unknown) {
        return { name: file.path, passed: false, message: `Missing required file for ${file.description}.` };
    }
}

async function checkSubmissionContent(): Promise<readonly CheckResult[]> {
    const spec: string = await readText('solutions/spec.md');
    const aiLog: string = await readText('solutions/ai-collaboration-log.md');
    const decisionLog: string = await readText('solutions/decision-log.md');
    const releaseLog: string = await readText('solutions/release-command-log.md');
    const billingReport: string = await readText('solutions/part1-billing-semantics.md');
    const rolloutReport: string = await readText('solutions/part2-release-interruption.md');
    const refactorPlan: string = await readText('solutions/refactor-plan.md');
    const scalePlan: string = await readText('solutions/scale-plan.md');
    return [
        checkSpecContent(spec),
        checkMinimumAiEntries(aiLog),
        checkHumanCorrectionEvidence(aiLog),
        checkSemanticTerms(decisionLog),
        checkReleaseStateEvidence(releaseLog),
        checkBillingPlaceholders(billingReport),
        checkRolloutPlaceholders(rolloutReport),
        checkRefactorScope(refactorPlan),
        checkScalePlan(scalePlan),
    ];
}

async function readText(path: string): Promise<string> {
    return readFile(join(process.cwd(), path), 'utf8');
}

function checkSpecContent(content: string): CheckResult {
    const requiredTerms: readonly string[] = [
        'source-of-truth',
        'non-goals',
        'blast radius',
        'validation plan',
        'ai recommendation',
        'frontend',
        'api contract',
        'ui states',
        'accessibility',
        'metadata leakage',
    ];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    const hasEmptyRows: boolean = content.includes('| | | |') || content.includes('- \n- \n-');
    return { name: 'Spec content', passed: missingTerms.length === 0 && !hasEmptyRows, message: missingTerms.length === 0 && !hasEmptyRows ? 'Spec appears filled.' : `Spec is incomplete. Missing or empty: ${missingTerms.join(', ') || 'template rows'}.` };
}

function checkMinimumAiEntries(content: string): CheckResult {
    const matches: RegExpMatchArray | null = content.match(/^##\s+20\d{2}/gm);
    const entryCount: number = matches?.length ?? 0;
    return { name: 'AI log entries', passed: entryCount >= 4, message: `Found ${entryCount} timestamped AI collaboration entries; expected at least 4.` };
}

function checkHumanCorrectionEvidence(content: string): CheckResult {
    const hasCorrectionHeading: boolean = content.includes('Human corrections / decisions');
    const hasNonEmptyCorrection: boolean = /Human corrections \/ decisions[\s\S]{1,300}\n(?!-?\s*(none|n\/a|无|\.\.\.)\s*$).+/i.test(content);
    return { name: 'Human correction evidence', passed: hasCorrectionHeading && hasNonEmptyCorrection, message: 'AI log must show where the human accepted, rejected, or corrected AI output.' };
}

function checkSemanticTerms(content: string): CheckResult {
    const requiredTerms: readonly string[] = [
        'balance',
        'provider',
        'load',
        'official',
        'actual',
        'ledger',
        'stable',
        'canary',
        'dashboard label',
        'api dto',
        'generated result',
        'upload job',
        'retry',
    ];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    return { name: 'Semantic glossary', passed: missingTerms.length === 0, message: missingTerms.length === 0 ? 'Semantic glossary covers overloaded terms.' : `Missing semantic terms: ${missingTerms.join(', ')}.` };
}

function checkReleaseStateEvidence(content: string): CheckResult {
    const requiredTerms: readonly string[] = [
        'stable image',
        'canary image',
        'traffic weight',
        'rollback',
        'public traffic',
        'frontend',
        'api contract',
        'compatibility',
    ];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    return { name: 'Release state evidence', passed: missingTerms.length === 0, message: missingTerms.length === 0 ? 'Release log includes required state fields.' : `Release log is missing: ${missingTerms.join(', ')}.` };
}

function checkBillingPlaceholders(content: string): CheckResult {
    const hasUnfilledPrompt: boolean = content.includes('Answer:') || content.includes('| customer balance | | |');
    const requiredTerms: readonly string[] = ['ui label', 'api', 'reviewed ai result', 'metadata', 'retry'];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    return { name: 'UI/API billing semantics report', passed: !hasUnfilledPrompt && missingTerms.length === 0, message: hasUnfilledPrompt ? 'Billing report still contains template placeholders.' : missingTerms.length === 0 ? 'Billing report appears filled.' : `Billing report missing full-stack terms: ${missingTerms.join(', ')}.` };
}

function checkRolloutPlaceholders(content: string): CheckResult {
    const hasUnfilledPrompt: boolean = content.includes('1. \n2.') || content.includes('| stable image | | |');
    const requiredTerms: readonly string[] = ['frontend', 'api contract', 'compatibility', 'ui label', 'ai result'];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    return { name: 'Interrupted UI/API rollout report', passed: !hasUnfilledPrompt && missingTerms.length === 0, message: hasUnfilledPrompt ? 'Rollout report still contains template placeholders.' : missingTerms.length === 0 ? 'Rollout report appears filled.' : `Rollout report missing full-stack terms: ${missingTerms.join(', ')}.` };
}

function checkRefactorScope(content: string): CheckResult {
    const requiredTerms: readonly string[] = ['target', 'characterization', 'extraction boundary', 'rejected', 'component', 'contract'];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    return { name: 'Surgical refactor plan', passed: missingTerms.length === 0 && !content.includes('| | |'), message: missingTerms.length === 0 ? 'Refactor plan includes scope controls.' : `Refactor plan missing: ${missingTerms.join(', ')}.` };
}

function checkScalePlan(content: string): CheckResult {
    const requiredTerms: readonly string[] = ['throughput', 'idempotency', 'concurrency', 'backpressure', 'rollback', 'upload progress', 'partial result', 'stale-data'];
    const missingTerms: readonly string[] = requiredTerms.filter((term: string): boolean => !content.toLowerCase().includes(term));
    return { name: 'Scale plan', passed: missingTerms.length === 0, message: missingTerms.length === 0 ? 'Scale plan includes required operational controls.' : `Scale plan missing: ${missingTerms.join(', ')}.` };
}

function printResults(results: readonly CheckResult[]): void {
    for (const result of results) {
        const icon: string = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}: ${result.message}`);
    }
}

void main();
