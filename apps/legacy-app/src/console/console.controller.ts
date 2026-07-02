import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class RootConsoleController {
    @Get()
    @Header('content-type', 'text/html; charset=utf-8')
    getRootConsole(): string {
        return renderConsoleHtml();
    }
}

@Controller('console')
export class ConsoleController {
    @Get()
    @Header('content-type', 'text/html; charset=utf-8')
    getConsole(): string {
        return renderConsoleHtml();
    }
}

function renderConsoleHtml(): string {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>AI Workflow Console</title>
        <style>
            :root {
                color-scheme: light;
                --bg: #f5f7f8;
                --panel: #ffffff;
                --border: #dbe4e7;
                --text: #17202a;
                --muted: #5f6f77;
                --focus: #0f766e;
                --danger: #9f1239;
                --warning: #92400e;
                --success: #166534;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                background: var(--bg);
                color: var(--text);
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            main {
                max-width: 1040px;
                margin: 0 auto;
                padding: 32px 20px;
            }

            header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 24px;
                margin-bottom: 24px;
            }

            h1,
            h2 {
                margin: 0;
                letter-spacing: 0;
            }

            h1 {
                font-size: 2rem;
                line-height: 1.15;
            }

            h2 {
                font-size: 1rem;
                line-height: 1.35;
            }

            .eyebrow {
                margin: 0 0 4px;
                color: var(--muted);
            }

            .toolbar {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
                margin-bottom: 16px;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
            }

            section,
            form {
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--panel);
                padding: 20px;
            }

            form {
                display: grid;
                gap: 12px;
                align-content: start;
            }

            .wide {
                grid-column: 1 / -1;
            }

            label {
                display: grid;
                gap: 6px;
                color: var(--muted);
                font-size: 0.92rem;
                font-weight: 600;
            }

            input {
                width: 100%;
                min-height: 40px;
                border: 1px solid #c8d4d8;
                border-radius: 6px;
                padding: 8px 10px;
                color: var(--text);
                font: inherit;
            }

            input:focus-visible,
            button:focus-visible {
                outline: 3px solid rgba(15, 118, 110, 0.28);
                outline-offset: 2px;
            }

            button {
                min-height: 40px;
                border: 0;
                border-radius: 6px;
                background: var(--focus);
                color: white;
                cursor: pointer;
                font: inherit;
                font-weight: 700;
                padding: 9px 14px;
            }

            button.secondary {
                background: #2f3d46;
            }

            button:disabled {
                cursor: not-allowed;
                opacity: 0.58;
            }

            dl {
                display: grid;
                grid-template-columns: minmax(168px, 1fr) 2fr;
                gap: 10px 16px;
                margin: 16px 0 0;
            }

            dt {
                color: var(--muted);
            }

            dd {
                margin: 0;
                min-width: 0;
                overflow-wrap: anywhere;
                font-weight: 650;
            }

            code {
                background: #eef3f5;
                border-radius: 4px;
                padding: 2px 5px;
                overflow-wrap: anywhere;
            }

            .muted {
                color: var(--muted);
            }

            .notice {
                border: 1px solid var(--border);
                border-radius: 8px;
                background: #eef6f6;
                margin-bottom: 16px;
                padding: 14px 16px;
            }

            .notice.error {
                background: #fff1f2;
                border-color: #fecdd3;
                color: var(--danger);
            }

            .notice.loading {
                background: #eff6ff;
                border-color: #bfdbfe;
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                min-height: 28px;
                border-radius: 999px;
                border: 1px solid var(--border);
                background: #f8fafc;
                padding: 4px 10px;
                font-weight: 750;
            }

            .status-complete {
                border-color: #bbf7d0;
                color: var(--success);
            }

            .status-failed {
                border-color: #fecdd3;
                color: var(--danger);
            }

            .status-partial,
            .status-retrying {
                border-color: #fed7aa;
                color: var(--warning);
            }

            [hidden] {
                display: none !important;
            }

            @media (max-width: 760px) {
                header,
                .toolbar,
                .grid,
                dl {
                    display: block;
                }

                form,
                section {
                    margin-top: 16px;
                }

                dt {
                    margin-top: 12px;
                }
            }
        </style>
    </head>
    <body>
        <main>
            <header>
                <div>
                    <p class="eyebrow">Acme Team</p>
                    <h1>AI Workflow Console</h1>
                </div>
                <p class="muted" id="page-state">Empty state: no analysis job loaded.</p>
            </header>

            <div id="live-region" class="notice" role="status" aria-live="polite">Empty state: create or look up an analysis job.</div>

            <div class="toolbar" aria-label="Analysis actions">
                <form id="create-form">
                    <h2>Create analysis</h2>
                    <label for="create-user-id">
                        User ID
                        <input id="create-user-id" name="userId" autocomplete="off" required>
                    </label>
                    <label for="create-data-url">
                        Data URL
                        <input id="create-data-url" name="dataUrl" autocomplete="off" required>
                    </label>
                    <button id="create-button" type="submit">Create analysis</button>
                </form>

                <form id="lookup-form">
                    <h2>Look up analysis</h2>
                    <label for="lookup-job-id">
                        Job ID
                        <input id="lookup-job-id" name="jobId" autocomplete="off" required>
                    </label>
                    <button id="lookup-button" class="secondary" type="submit">Load console view</button>
                </form>
            </div>

            <div class="grid">
                <section aria-labelledby="job-heading">
                    <h2 id="job-heading">Analysis job</h2>
                    <dl>
                        <dt>Status</dt>
                        <dd><span id="job-status" class="status-badge">No job loaded</span></dd>
                        <dt>Job ID</dt>
                        <dd><code id="job-id">--</code></dd>
                        <dt>User ID</dt>
                        <dd id="user-id">--</dd>
                        <dt>Source data URL</dt>
                        <dd id="source-data-url">--</dd>
                        <dt>Created</dt>
                        <dd id="created-at">--</dd>
                        <dt>Latest update</dt>
                        <dd id="updated-at">--</dd>
                        <dt>Completed</dt>
                        <dd id="completed-at">--</dd>
                        <dt>Freshness</dt>
                        <dd id="stale-state">Empty state: no server timestamp loaded.</dd>
                    </dl>
                </section>

                <section aria-labelledby="cost-heading">
                    <h2 id="cost-heading">Usage and cost</h2>
                    <dl>
                        <dt>Official usage cost</dt>
                        <dd id="official-usage-cost">--</dd>
                        <dt>Payable prepaid debit</dt>
                        <dd id="payable-prepaid-debit">--</dd>
                        <dt>Prepaid multiplier</dt>
                        <dd id="prepaid-multiplier">--</dd>
                    </dl>
                </section>

                <section aria-labelledby="retry-heading">
                    <h2 id="retry-heading">Retry</h2>
                    <dl>
                        <dt>Can retry</dt>
                        <dd id="retry-can-retry">--</dd>
                        <dt>Idempotency key</dt>
                        <dd><code id="retry-idempotency-key">--</code></dd>
                        <dt id="retry-last-error-label" hidden>Last error</dt>
                        <dd id="retry-last-error" hidden>--</dd>
                    </dl>
                </section>

                <section aria-labelledby="result-heading">
                    <h2 id="result-heading">Reviewed AI result</h2>
                    <dl>
                        <dt>Summary</dt>
                        <dd id="reviewed-summary">--</dd>
                        <dt>Confidence</dt>
                        <dd id="reviewed-confidence">--</dd>
                        <dt>Reviewed at</dt>
                        <dd id="reviewed-at">--</dd>
                    </dl>
                </section>
            </div>
        </main>

        <script>
            (function () {
                var API_BASE = '/api/analysis';
                var STALE_AFTER_MS = 5 * 60 * 1000;
                var createForm = document.getElementById('create-form');
                var lookupForm = document.getElementById('lookup-form');
                var createButton = document.getElementById('create-button');
                var lookupButton = document.getElementById('lookup-button');
                var lookupJobId = document.getElementById('lookup-job-id');
                var liveRegion = document.getElementById('live-region');
                var pageState = document.getElementById('page-state');

                function byId(id) {
                    return document.getElementById(id);
                }

                function setText(id, value) {
                    byId(id).textContent = value == null || value === '' ? '--' : String(value);
                }

                function setNotice(kind, message) {
                    liveRegion.className = kind ? 'notice ' + kind : 'notice';
                    liveRegion.textContent = message;
                    pageState.textContent = message;
                }

                function setBusy(isBusy) {
                    createButton.disabled = isBusy;
                    lookupButton.disabled = isBusy;
                }

                function formatDate(value) {
                    if (!value) {
                        return '--';
                    }

                    var time = Date.parse(value);
                    if (!Number.isFinite(time)) {
                        return String(value);
                    }

                    return new Date(time).toLocaleString();
                }

                function formatMoney(cents) {
                    var value = Number(cents);
                    if (!Number.isFinite(value)) {
                        return '--';
                    }

                    return new Intl.NumberFormat('en-US', {
                        currency: 'USD',
                        style: 'currency'
                    }).format(value / 100);
                }

                function formatMultiplier(value) {
                    var multiplier = Number(value);
                    if (!Number.isFinite(multiplier)) {
                        return '--';
                    }

                    return multiplier + 'x';
                }

                function formatConfidence(value) {
                    var confidence = Number(value);
                    if (!Number.isFinite(confidence)) {
                        return '--';
                    }

                    return Math.round(confidence * 100) + '%';
                }

                function isActiveStatus(status) {
                    return status === 'queued' || status === 'running' || status === 'partial' || status === 'retrying';
                }

                function setStatusBadge(status) {
                    var badge = byId('job-status');
                    var safeStatus = typeof status === 'string' && status ? status : 'No job loaded';
                    badge.textContent = safeStatus;
                    badge.className = 'status-badge status-' + safeStatus.replace(/[^a-z]/g, '');
                }

                function renderEmptyState() {
                    setStatusBadge('');
                    setText('job-id', '--');
                    setText('user-id', '--');
                    setText('source-data-url', '--');
                    setText('created-at', '--');
                    setText('updated-at', '--');
                    setText('completed-at', '--');
                    setText('stale-state', 'Empty state: no server timestamp loaded.');
                    setText('official-usage-cost', '--');
                    setText('payable-prepaid-debit', '--');
                    setText('prepaid-multiplier', '--');
                    setText('retry-can-retry', '--');
                    setText('retry-idempotency-key', '--');
                    setLastError('');
                    setText('reviewed-summary', '--');
                    setText('reviewed-confidence', '--');
                    setText('reviewed-at', '--');
                    setNotice('', 'Empty state: create or look up an analysis job.');
                }

                function setLastError(value) {
                    var hasError = typeof value === 'string' && value.length > 0;
                    byId('retry-last-error-label').hidden = !hasError;
                    byId('retry-last-error').hidden = !hasError;
                    setText('retry-last-error', hasError ? value : '--');
                }

                function renderJob(job) {
                    assertConsoleContract(job);

                    var usage = job.usage;
                    var reviewedResult = job.reviewedResult;
                    var retry = job.retry;

                    setStatusBadge(job.status);
                    setText('job-id', job.id);
                    setText('user-id', job.userId);
                    setText('source-data-url', job.sourceDataUrl);
                    setText('created-at', formatDate(job.createdAt));
                    setText('updated-at', formatDate(job.updatedAt));
                    setText('completed-at', formatDate(job.completedAt));

                    setText('official-usage-cost', formatMoney(usage.officialUsageCostCents));
                    setText('payable-prepaid-debit', formatMoney(usage.payablePrepaidDebitCents));
                    setText('prepaid-multiplier', formatMultiplier(usage.prepaidMultiplier));

                    setText('retry-can-retry', retry.canRetry ? 'Yes' : 'No');
                    setText('retry-idempotency-key', retry.idempotencyKey);
                    setLastError(retry.lastError || '');

                    setText('reviewed-summary', reviewedResult.summary);
                    setText('reviewed-confidence', formatConfidence(reviewedResult.confidence));
                    setText('reviewed-at', formatDate(reviewedResult.reviewedAt));

                    renderFreshness(job);
                    setNotice('', 'Success state: loaded customer-facing console contract for job ' + job.id + '.');
                }

                function renderFreshness(job) {
                    var updatedAt = Date.parse(job.updatedAt);
                    if (!Number.isFinite(updatedAt)) {
                        setText('stale-state', 'Stale-data state: latest update timestamp is unavailable.');
                        return;
                    }

                    if (isActiveStatus(job.status) && Date.now() - updatedAt > STALE_AFTER_MS) {
                        setText('stale-state', 'Stale-data state: active job has not updated in more than 5 minutes.');
                        return;
                    }

                    setText('stale-state', 'Current as of latest update.');
                }

                function assertConsoleContract(value) {
                    if (!value || typeof value !== 'object') {
                        throw new Error('Unexpected console contract response.');
                    }

                    if (!value.usage || !value.reviewedResult || !value.retry) {
                        throw new Error('Console contract is missing required customer-facing fields.');
                    }
                }

                async function readJson(response) {
                    var text = await response.text();
                    if (!text) {
                        return null;
                    }

                    return JSON.parse(text);
                }

                function errorMessage(error) {
                    if (error && typeof error.message === 'string') {
                        return error.message;
                    }

                    return 'Request failed.';
                }

                async function requestJson(url, options) {
                    var response = await fetch(url, options);
                    var payload = await readJson(response);
                    if (!response.ok) {
                        var message = payload && typeof payload.message === 'string' ? payload.message : 'Request failed with status ' + response.status + '.';
                        throw new Error(message);
                    }

                    return payload;
                }

                async function loadJob(jobId) {
                    var trimmedJobId = String(jobId || '').trim();
                    if (!trimmedJobId) {
                        setNotice('error', 'Error state: enter a job ID.');
                        return;
                    }

                    setBusy(true);
                    setNotice('loading', 'Loading state: fetching customer-facing console contract.');

                    try {
                        var job = await requestJson(API_BASE + '/' + encodeURIComponent(trimmedJobId) + '/console', {
                            headers: {
                                accept: 'application/json'
                            }
                        });
                        renderJob(job);
                    } catch (error) {
                        setNotice('error', 'Error state: ' + errorMessage(error));
                    } finally {
                        setBusy(false);
                    }
                }

                async function createAnalysis(event) {
                    event.preventDefault();

                    var userId = String(byId('create-user-id').value || '').trim();
                    var dataUrl = String(byId('create-data-url').value || '').trim();

                    if (!userId || !dataUrl) {
                        setNotice('error', 'Error state: user ID and data URL are required.');
                        return;
                    }

                    setBusy(true);
                    setNotice('loading', 'Loading state: creating analysis job.');

                    try {
                        var created = await requestJson(API_BASE, {
                            body: JSON.stringify({
                                dataUrl: dataUrl,
                                userId: userId
                            }),
                            headers: {
                                accept: 'application/json',
                                'content-type': 'application/json'
                            },
                            method: 'POST'
                        });

                        var createdJobId = created && typeof created.jobId === 'string' ? created.jobId : '';
                        if (!createdJobId) {
                            throw new Error('Create response did not include a job ID.');
                        }

                        lookupJobId.value = createdJobId;
                        await loadJob(createdJobId);
                    } catch (error) {
                        setNotice('error', 'Error state: ' + errorMessage(error));
                    } finally {
                        setBusy(false);
                    }
                }

                function lookupAnalysis(event) {
                    event.preventDefault();
                    loadJob(lookupJobId.value);
                }

                createForm.addEventListener('submit', createAnalysis);
                lookupForm.addEventListener('submit', lookupAnalysis);

                var params = new URLSearchParams(window.location.search);
                var initialJobId = params.get('jobId');
                if (initialJobId) {
                    lookupJobId.value = initialJobId;
                    loadJob(initialJobId);
                } else {
                    renderEmptyState();
                }
            }());
        </script>
    </body>
</html>`;
}
