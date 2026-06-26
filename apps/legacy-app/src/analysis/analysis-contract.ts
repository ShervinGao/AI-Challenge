import type {
    AnalysisJob,
    AnalysisJobApiResponse,
    ConsoleAnalysisStatus,
    ReviewedAiResult,
    UsageCostDisplay,
} from '@senior-challenge/shared-types';

const DEFAULT_OFFICIAL_USAGE_COST_CENTS = 10000;
const DEFAULT_PAYABLE_PREPAID_DEBIT_CENTS = 4000;
const DEFAULT_PREPAID_MULTIPLIER = 0.4;

export function toConsoleAnalysisJob(job: AnalysisJob): AnalysisJobApiResponse {
    return {
        id: job.jobId,
        userId: job.userId,
        sourceDataUrl: job.dataUrl,
        status: toConsoleStatus(job.status),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        usage: toUsageCostDisplay(job),
        reviewedResult: toReviewedResult(job),
        retry: {
            canRetry: job.status === 'FAILED' || job.status === 'PARTIAL',
            idempotencyKey: `analysis:${job.jobId}`,
            lastError: job.error,
        },
    };
}

function toConsoleStatus(status: AnalysisJob['status']): ConsoleAnalysisStatus {
    switch (status) {
        case 'PENDING':
            return 'queued';
        case 'PROCESSING':
            return 'running';
        case 'PARTIAL':
            return 'partial';
        case 'FAILED':
            return 'failed';
        case 'RETRYING':
            return 'retrying';
        case 'COMPLETED':
            return 'complete';
    }
}

function toUsageCostDisplay(job: AnalysisJob): UsageCostDisplay {
    return {
        officialUsageCostCents: job.officialUsageCostCents ?? DEFAULT_OFFICIAL_USAGE_COST_CENTS,
        officialUsageCostLabel: 'Official usage cost',
        payablePrepaidDebitCents: job.payablePrepaidDebitCents ?? DEFAULT_PAYABLE_PREPAID_DEBIT_CENTS,
        payablePrepaidDebitLabel: 'Payable prepaid debit',
        prepaidMultiplier: job.prepaidMultiplier ?? DEFAULT_PREPAID_MULTIPLIER,
    };
}

function toReviewedResult(job: AnalysisJob): ReviewedAiResult {
    const demographics = job.demographics;
    if (!demographics) {
        return {
            summary: 'No reviewed AI result is available yet.',
            confidence: 0,
        };
    }

    const segments = [
        demographics.ageRange ? `Age range ${demographics.ageRange}` : undefined,
        demographics.location ? `location ${demographics.location}` : undefined,
        demographics.interests?.length ? `interests ${demographics.interests.join(', ')}` : undefined,
    ].filter((segment): segment is string => Boolean(segment));

    return {
        summary: segments.length > 0 ? segments.join('; ') : 'Reviewed audience insight is available.',
        confidence: demographics.confidence ?? 0,
        reviewedAt: job.completedAt,
    };
}
