/**
 * Analysis Job status enum.
 */
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'RETRYING';

/**
 * Customer-facing status values used by the operations console.
 */
export type ConsoleAnalysisStatus = 'queued' | 'running' | 'partial' | 'failed' | 'retrying' | 'complete';

/**
 * Channel type for notification delivery.
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

/**
 * Demographics data structure.
 * Represents audience demographic analysis results.
 */
export interface Demographics {
    ageRange?: string;
    gender?: string;
    location?: string;
    interests?: string[];
    confidence?: number;
}

/**
 * Analysis Job entity.
 */
export interface AnalysisJob {
    jobId: string;
    userId: string;
    dataUrl: string;
    status: AnalysisStatus;
    demographics?: Demographics;
    officialUsageCostCents?: number;
    payablePrepaidDebitCents?: number;
    prepaidMultiplier?: number;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    error?: string;
    version?: number;
}

/**
 * Cost and usage values rendered by the customer-facing console.
 * Official usage reporting and payable prepaid debit are intentionally separate.
 */
export interface UsageCostDisplay {
    officialUsageCostCents: number;
    officialUsageCostLabel: string;
    payablePrepaidDebitCents: number;
    payablePrepaidDebitLabel: string;
    prepaidMultiplier: number;
}

/**
 * Reviewed analysis result that can be shown to customers.
 * Raw prompts and provider metadata must not appear here.
 */
export interface ReviewedAiResult {
    summary: string;
    confidence: number;
    reviewedAt?: string;
}

/**
 * Minimal API response contract for the AI workflow operations console.
 */
export interface AnalysisJobApiResponse {
    id: string;
    userId: string;
    sourceDataUrl: string;
    status: ConsoleAnalysisStatus;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    usage: UsageCostDisplay;
    reviewedResult: ReviewedAiResult;
    retry: {
        canRetry: boolean;
        idempotencyKey: string;
        lastError?: string;
    };
}

/**
 * Shared error shape for frontend/backend contract tests.
 */
export interface AnalysisApiErrorResponse {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'PROVIDER_FAILURE' | 'PARTIAL_PROCESSING' | 'RETRY_EXHAUSTED';
    message: string;
    retryable: boolean;
    traceId?: string;
}

/**
 * Create Analysis Request DTO.
 */
export interface CreateAnalysisRequest {
    userId: string;
    dataUrl: string;
}

/**
 * Analysis Requested Event - published to the message queue.
 */
export interface AnalysisRequestedEvent {
    eventType: 'AnalysisRequested';
    jobId: string;
    userId: string;
    dataUrl: string;
    timestamp: string;
    traceId?: string;
}

/**
 * Third-party API raw response.
 * Format may vary between API versions and providers.
 */
export interface ThirdPartyApiResponse {
    success: boolean;
    data?: {
        age?: number | string | null;
        gender?: string | null;
        country?: string | null;
        city?: string | null;
        tags?: string[] | string | null;
        score?: number | string | null;
    };
    error?: string;
}
