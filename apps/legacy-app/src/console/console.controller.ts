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
            body {
                margin: 0;
                background: #f5f7f8;
                color: #17202a;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            main {
                max-width: 960px;
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

            .eyebrow {
                margin: 0 0 4px;
                color: #5f6f77;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
            }

            section {
                border: 1px solid #dde5e8;
                border-radius: 8px;
                background: white;
                padding: 20px;
            }

            .wide {
                grid-column: 1 / -1;
            }

            dl {
                display: grid;
                grid-template-columns: minmax(160px, 1fr) 2fr;
                gap: 10px 16px;
            }

            dt {
                color: #5f6f77;
            }

            dd {
                margin: 0;
                font-weight: 600;
            }

            code {
                background: #eef3f5;
                padding: 2px 5px;
                border-radius: 4px;
            }

            .muted {
                color: #5f6f77;
            }

            @media (max-width: 720px) {
                header,
                .grid,
                dl {
                    display: block;
                }

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
                <p class="muted">Incomplete operational surface for the challenge.</p>
            </header>
            <div class="grid">
                <section aria-labelledby="job-heading">
                    <h2 id="job-heading">Analysis job</h2>
                    <dl>
                        <dt>Status</dt>
                        <dd>Needs contract-backed state</dd>
                        <dt>Latest update</dt>
                        <dd>Not wired</dd>
                        <dt>Retry</dt>
                        <dd>Not modeled</dd>
                    </dl>
                </section>
                <section aria-labelledby="cost-heading">
                    <h2 id="cost-heading">Usage and cost</h2>
                    <dl>
                        <dt>Official usage cost</dt>
                        <dd>Needs source of truth</dd>
                        <dt>Payable prepaid debit</dt>
                        <dd>Needs explicit label</dd>
                        <dt>Multiplier</dt>
                        <dd>Needs semantic decision</dd>
                    </dl>
                </section>
                <section class="wide" aria-labelledby="result-heading">
                    <h2 id="result-heading">Reviewed AI result</h2>
                    <p>Customer-visible insight has not been wired to a reviewed result contract.</p>
                    <p class="muted">Raw prompts, provider balances, credentials, and routing weights must not be exposed here.</p>
                </section>
            </div>
        </main>
    </body>
</html>`;
}
