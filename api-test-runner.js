// api-test-runner.js

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

const tests = [
    // ==================== ACCOUNT TESTS ====================
    { name: 'GET /account/balance', method: 'GET', url: '/account/balance' },
    { name: 'GET /account/equity', method: 'GET', url: '/account/equity' },
    { name: 'GET /account/pnl', method: 'GET', url: '/account/pnl' },
    { name: 'GET /account/balances (multi-asset)', method: 'GET', url: '/account/balances' },
    { name: 'GET /account/balances/USDT', method: 'GET', url: '/account/balances/USDT' },
    { name: 'GET /account/leverage (default)', method: 'GET', url: '/account/leverage' },

    { name: 'POST /account/leverage - set 20x', method: 'POST', url: '/account/leverage', body: { leverage: 20 } },
    { name: 'POST /account/leverage - set 50x', method: 'POST', url: '/account/leverage', body: { leverage: 50 } },

    { name: 'POST /account/deposit - USDT to trading', method: 'POST', url: '/account/deposit', body: { asset: 'USDT', amount: 5000 } },
    { name: 'POST /account/withdraw - USDT from trading', method: 'POST', url: '/account/withdraw', body: { asset: 'USDT', amount: 1000 } },

    { name: 'POST /account/deposit - USDT on ERC20', method: 'POST', url: '/account/deposit', body: { asset: 'USDT', networkId: 'erc20', amount: 1000 } },
    { name: 'POST /account/deposit - USDT on BEP20', method: 'POST', url: '/account/deposit', body: { asset: 'USDT', networkId: 'bep20', amount: 2000 } },
    { name: 'POST /account/deposit - BNB on BEP20', method: 'POST', url: '/account/deposit', body: { asset: 'BNB', networkId: 'bep20', amount: 5 } },
    { name: 'POST /account/deposit - SOL on Solana', method: 'POST', url: '/account/deposit', body: { asset: 'SOL', networkId: 'solana', amount: 10 } },

    { name: 'POST /account/withdraw - USDT from ERC20', method: 'POST', url: '/account/withdraw', body: { asset: 'USDT', networkId: 'erc20', amount: 100, address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2' } },
    { name: 'POST /account/withdraw - BNB from BEP20', method: 'POST', url: '/account/withdraw', body: { asset: 'BNB', networkId: 'bep20', amount: 1, address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2' } },

    { name: 'POST /account/transfer - USDT ERC20 → BEP20', method: 'POST', url: '/account/transfer', body: { asset: 'USDT', fromNetwork: 'erc20', toNetwork: 'bep20', amount: 500 } },
    { name: 'POST /account/transfer - USDT BEP20 → TRC20', method: 'POST', url: '/account/transfer', body: { asset: 'USDT', fromNetwork: 'bep20', toNetwork: 'trc20', amount: 300 } },

    // ==================== NETWORK TESTS ====================
    { name: 'GET /networks', method: 'GET', url: '/networks' },
    { name: 'GET /networks/erc20', method: 'GET', url: '/networks/erc20' },
    { name: 'GET /networks/erc20/assets', method: 'GET', url: '/networks/erc20/assets' },
    { name: 'GET /networks/bep20/assets', method: 'GET', url: '/networks/bep20/assets' },
    { name: 'GET /networks/trc20/assets', method: 'GET', url: '/networks/trc20/assets' },
    { name: 'GET /networks/solana/assets', method: 'GET', url: '/networks/solana/assets' },

    { name: 'GET /network/balances (grouped by network)', method: 'GET', url: '/network/balances' },
    { name: 'GET /network/balances/USDT', method: 'GET', url: '/network/balances/USDT' },
    { name: 'GET /network/balances/network/erc20', method: 'GET', url: '/network/balances/network/erc20' },
    { name: 'GET /network/stats', method: 'GET', url: '/network/stats' },
    { name: 'GET /network/health', method: 'GET', url: '/network/health' },

    // ==================== ORDER TESTS ====================
    { name: 'GET /orders (all orders)', method: 'GET', url: '/orders' },
    { name: 'GET /orders/open', method: 'GET', url: '/orders/open' },

    { name: 'POST /orders - MARKET BUY 10x (LONG)', method: 'POST', url: '/orders', body: { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.01, leverage: 10 } },
    { name: 'POST /orders - MARKET BUY 20x (LONG)', method: 'POST', url: '/orders', body: { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.02, leverage: 20 } },

    { name: 'POST /orders - LIMIT BUY at 64000', method: 'POST', url: '/orders', body: { symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: 0.02, price: 64000, leverage: 10 } },
    { name: 'POST /orders - LIMIT SELL at 66000', method: 'POST', url: '/orders', body: { symbol: 'BTCUSDT', side: 'SELL', type: 'LIMIT', quantity: 0.02, price: 66000, leverage: 10 } },

    { name: 'POST /orders - MARKET SELL (reduceOnly)', method: 'POST', url: '/orders', body: { symbol: 'BTCUSDT', side: 'SELL', type: 'MARKET', quantity: 0.01, reduceOnly: true } },
    { name: 'POST /orders - MARKET SHORT 15x', method: 'POST', url: '/orders', body: { symbol: 'BTCUSDT', side: 'SELL', type: 'MARKET', quantity: 0.01, leverage: 15 } },

    // ==================== PORTFOLIO & POSITION TESTS ====================
    { name: 'GET /portfolio', method: 'GET', url: '/portfolio' },
    { name: 'GET /positions/open', method: 'GET', url: '/positions/open' },
    { name: 'GET /positions/history', method: 'GET', url: '/positions/history' },

    // ==================== TRADE TESTS ====================
    { name: 'GET /trades', method: 'GET', url: '/trades' },
    { name: 'GET /trades?symbol=BTCUSDT', method: 'GET', url: '/trades?symbol=BTCUSDT' },

    // ==================== MARKET TESTS ====================
    { name: 'GET /market/tickers', method: 'GET', url: '/market/tickers' },
    { name: 'GET /market/ticker/BTCUSDT', method: 'GET', url: '/market/ticker/BTCUSDT' },
    { name: 'GET /market/ticker/ETHUSDT', method: 'GET', url: '/market/ticker/ETHUSDT' },
    { name: 'GET /market/ticker/SOLUSDT', method: 'GET', url: '/market/ticker/SOLUSDT' },
    { name: 'GET /market/ticker/BNBUSDT', method: 'GET', url: '/market/ticker/BNBUSDT' },
    { name: 'GET /market/ticker/XRPUSDT', method: 'GET', url: '/market/ticker/XRPUSDT' },

    // ==================== ORDERBOOK TESTS ====================
    { name: 'GET /market/orderbook?symbol=BTCUSDT', method: 'GET', url: '/market/orderbook?symbol=BTCUSDT' },
    { name: 'GET /market/orderbook?symbol=BTCUSDT&depth=10', method: 'GET', url: '/market/orderbook?symbol=BTCUSDT&depth=10' },
    { name: 'GET /market/orderbook?symbol=ETHUSDT', method: 'GET', url: '/market/orderbook?symbol=ETHUSDT' },
    { name: 'GET /market/orderbook?symbol=SOLUSDT&depth=15', method: 'GET', url: '/market/orderbook?symbol=SOLUSDT&depth=15' },

    // ==================== ACTIVITY & REPORTS ====================
    { name: 'GET /activity-logs', method: 'GET', url: '/activity-logs' },
    { name: 'GET /reports', method: 'GET', url: '/reports' },
];

async function runTest(test) {
    const startTime = Date.now();

    try {
        const options = {
            method: test.method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (test.body) {
            options.body = JSON.stringify(test.body);
        }

        const response = await fetch(`${BASE_URL}${test.url}`, options);
        const endTime = Date.now();
        const duration = endTime - startTime;

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        return {
            name: test.name,
            method: test.method,
            url: test.url,
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`,
            success: response.ok,
            data: data,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            name: test.name,
            method: test.method,
            url: test.url,
            status: 0,
            statusText: 'ERROR',
            duration: 'N/A',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

function generateHtmlReport(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalCount = results.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhantomExchange - API Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            padding: 20px;
            color: #e0e0e0;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        
        /* Header */
        .header {
            background: rgba(15, 25, 45, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(0, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 {
            font-size: 2.5em;
            background: linear-gradient(135deg, #00d4ff, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        .subtitle { color: #888; margin-bottom: 20px; border-left: 3px solid #00d4ff; padding-left: 15px; }
        
        /* Stats Cards */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(0,0,0,0.4);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label { color: #888; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .stat-card.success .stat-value { color: #10b981; }
        .stat-card.fail .stat-value { color: #ef4444; }
        .stat-card.total .stat-value { color: #3b82f6; }
        .stat-card.rate .stat-value { color: #f59e0b; }
        
        /* Filters */
        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .filter-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            padding: 8px 20px;
            border-radius: 25px;
            color: #e0e0e0;
            cursor: pointer;
            transition: all 0.3s;
        }
        .filter-btn:hover, .filter-btn.active {
            background: #00d4ff;
            color: #0a0e27;
        }
        
        /* Results Table */
        .results-table {
            background: rgba(0,0,0,0.3);
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        table { width: 100%; border-collapse: collapse; }
        th {
            text-align: left;
            padding: 15px;
            background: rgba(0,0,0,0.5);
            color: #00d4ff;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
        }
        th:hover { background: rgba(0,212,255,0.1); }
        td {
            padding: 12px 15px;
            border-top: 1px solid rgba(255,255,255,0.05);
            font-size: 0.9em;
        }
        tr:hover { background: rgba(0,212,255,0.05); }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 500;
        }
        .status-success { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .status-fail { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
        
        .method {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 5px;
            font-size: 0.7em;
            font-weight: bold;
        }
        .method-GET { background: #10b981; color: white; }
        .method-POST { background: #3b82f6; color: white; }
        .method-DELETE { background: #ef4444; color: white; }
        
        .url { font-family: monospace; font-size: 0.85em; color: #a0a0a0; }
        
        .details-btn {
            background: none;
            border: 1px solid #00d4ff;
            color: #00d4ff;
            padding: 4px 12px;
            border-radius: 15px;
            cursor: pointer;
            font-size: 0.75em;
            transition: all 0.3s;
        }
        .details-btn:hover { background: #00d4ff; color: #0a0e27; }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background: #1a1f3a;
            border-radius: 15px;
            max-width: 800px;
            width: 90%;
            max-height: 80%;
            overflow: auto;
            padding: 20px;
            border: 1px solid #00d4ff;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #333;
        }
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        }
        pre {
            background: #0a0e27;
            padding: 15px;
            border-radius: 10px;
            overflow-x: auto;
            font-size: 0.8em;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 PhantomExchange</h1>
            <div class="subtitle">API Test Report - Full Suite (Exchange Only)</div>
            <div class="stats">
                <div class="stat-card success">
                    <div class="stat-value">${successCount}</div>
                    <div class="stat-label">✅ Passed</div>
                </div>
                <div class="stat-card fail">
                    <div class="stat-value">${failCount}</div>
                    <div class="stat-label">❌ Failed</div>
                </div>
                <div class="stat-card total">
                    <div class="stat-value">${totalCount}</div>
                    <div class="stat-label">📊 Total Tests</div>
                </div>
                <div class="stat-card rate">
                    <div class="stat-value">${successRate}%</div>
                    <div class="stat-label">📈 Success Rate</div>
                </div>
            </div>
            <div class="filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="success">✅ Passed</button>
                <button class="filter-btn" data-filter="fail">❌ Failed</button>
            </div>
        </div>
        
        <div class="results-table">
            <table id="resultsTable">
                <thead>
                    <tr>
                        <th onclick="sortTable(0)">#</th>
                        <th onclick="sortTable(1)">Method</th>
                        <th onclick="sortTable(2)">API Endpoint</th>
                        <th onclick="sortTable(3)">Status</th>
                        <th onclick="sortTable(4)">Duration</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r, idx) => `
                        <tr data-status="${r.success ? 'success' : 'fail'}">
                            <td>${idx + 1}</td>
                            <td><span class="method method-${r.method}">${r.method}</span></td>
                            <td><div class="url">${r.url}</div><div style="font-size:0.7em;color:#666;">${r.name}</div></td>
                            <td><span class="status-badge status-${r.success ? 'success' : 'fail'}">${r.status} ${r.statusText}</span></td>
                            <td>${r.duration}</td>
                            <td><button class="details-btn" onclick="showDetails(${idx})">🔍 View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Report generated: ${new Date().toLocaleString()} | PhantomExchange API v1.0 | Exchange-only mode (candle building is bot's responsibility)</p>
        </div>
    </div>
    
    <div id="modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>API Response Details</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <pre id="modal-content"></pre>
        </div>
    </div>
    
    <script>
        let currentFilter = 'all';
        let currentSort = { column: 0, asc: true };
        
        function filterTable() {
            const rows = document.querySelectorAll('#resultsTable tbody tr');
            rows.forEach(row => {
                if (currentFilter === 'all') {
                    row.style.display = '';
                } else {
                    row.style.display = row.dataset.status === currentFilter ? '' : 'none';
                }
            });
        }
        
        function sortTable(column) {
            const tbody = document.querySelector('#resultsTable tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            if (currentSort.column === column) {
                currentSort.asc = !currentSort.asc;
            } else {
                currentSort.column = column;
                currentSort.asc = true;
            }
            
            rows.sort((a, b) => {
                let aVal = a.cells[column].innerText.toLowerCase();
                let bVal = b.cells[column].innerText.toLowerCase();
                
                if (column === 0) {
                    aVal = parseInt(aVal);
                    bVal = parseInt(bVal);
                }
                
                if (currentSort.asc) {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            rows.forEach(row => tbody.appendChild(row));
        }
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                filterTable();
            });
        });
        
        const detailsData = ${JSON.stringify(results.map(r => ({
        name: r.name,
        url: r.url,
        method: r.method,
        status: r.status,
        data: r.data || r.error,
        success: r.success
    })))};
        
        function showDetails(idx) {
            const data = detailsData[idx];
            const modal = document.getElementById('modal');
            const content = document.getElementById('modal-content');
            content.textContent = JSON.stringify(data, null, 2);
            modal.style.display = 'flex';
        }
        
        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }
        
        window.onclick = function(e) {
            if (e.target === document.getElementById('modal')) {
                closeModal();
            }
        }
    </script>
</body>
</html>`;
}

async function main() {
    console.log('🚀 Starting API Test Suite...');
    console.log('📡 Target: ' + BASE_URL);
    console.log('⚠️  Note: OHLCV and Candle endpoints removed (exchange provides only real-time price feed)\n');

    const results = [];
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        process.stdout.write(`  [${i + 1}/${tests.length}] ${test.method} ${test.url} ... `);

        const result = await runTest(test);
        results.push(result);

        if (result.success) {
            console.log('✅');
            passed++;
        } else {
            console.log(`❌ (${result.status})`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Summary: ${passed} passed, ${failed} failed, ${tests.length} total`);
    console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);
    console.log('='.repeat(50));

    // Generate HTML report
    const html = generateHtmlReport(results);
    const reportPath = path.join(process.cwd(), 'api-test-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📄 HTML Report saved to: ${reportPath}`);

    // Also save JSON for reference
    const jsonPath = path.join(process.cwd(), 'api-test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`📄 JSON Results saved to: ${jsonPath}`);

    return results;
}

main().catch(console.error);