# PhantomExchange Mock Futures Exchange

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?logo=fastify&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-7C3AED)
![License](https://img.shields.io/badge/License-ISC-blue)

PhantomExchange is a mock cryptocurrency futures exchange API built with Fastify, TypeScript, and WebSocket streaming. It simulates a futures trading venue with live ticker generation, market and limit orders, long/short leveraged positions, orderbook depth, account balances, portfolio tracking, activity logs, reports, and mock multi-network asset operations.

This project is designed for API prototyping, bot development, UI integration, exchange workflow testing, and local simulations where a realistic exchange-like backend is needed without connecting to a real trading venue or blockchain.

> This is a mock exchange for development and testing only. It does not execute real trades, custody funds, or broadcast blockchain transactions.

## Quick Start

1. Clone the repository and enter the project directory.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open `http://localhost:3000` to verify the service is running.
5. Run `node api-test-runner.js` or execute requests from `requests.http`.

```bash
git clone <repository-url>
cd mock-exchange
npm install
npm run dev
```

## Features

- **Futures trading engine** with USDT collateral, long/short positions, and leverage from `1x` to `100x`.
- **Order management** for `MARKET` and `LIMIT` orders with create, list, fetch, cancel, open-order, and reduce-only flows.
- **Order matching and orderbook depth** built from active orders with configurable depth responses.
- **Portfolio accounting** with open positions, closed position history, equity, realized PNL, unrealized PNL, margin locking, and liquidation simulation.
- **Realtime market data** with generated L1 ticker updates for all configured symbols every `500ms`.
- **WebSocket event streaming** for ticker updates, depth updates, order events, trade events, and position lifecycle events.
- **Multi-asset support** for many USDT futures markets including BTC, ETH, BNB, SOL, XRP, DeFi, meme, gaming, L2, storage, oracle, and AI symbols.
- **Multi-network support** for mock deposits, withdrawals, transfers, asset metadata, network balances, stats, and health checks across ERC20, BEP20, TRC20, and Solana.
- **Testing utilities** including a Node.js API test runner that generates HTML and JSON reports, plus a REST Client compatible `requests.http` file.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **HTTP server:** Fastify
- **Realtime transport:** `ws` WebSocket server
- **Development runner:** `ts-node-dev`
- **Configuration:** `dotenv`
- **IDs:** `uuid`
- **Storage:** In-memory stores for accounts, balances, orders, trades, orderbooks, reports, activity logs, and network balances

## Installation

```bash
git clone <repository-url>
cd mock-exchange
npm install
```

### Environment Setup

No environment variables are required for the current implementation. The server listens on port `3000` and host `0.0.0.0` as configured in `src/server.ts`.

If you want to introduce environment-based configuration later, create a `.env` file and wire it through `src/config/env.ts`.

## Running the Server

### Development

Runs the TypeScript server with automatic restart on file changes.

```bash
npm run dev
```

### Production Build

Compiles TypeScript into `dist/`.

```bash
npm run build
```

### Production Start

Runs the compiled server.

```bash
npm start
```

### Health Check

```bash
curl http://localhost:3000/
```

Example response:

```json
{
  "status": "PhantomExchange Running - Futures Mode",
  "version": "1.0.0",
  "symbols": 57,
  "networks": 4,
  "leverage": "1x - 100x"
}
```

## API Documentation

Base URL:

```text
http://localhost:3000
```

All JSON `POST` requests should include:

```http
Content-Type: application/json
```

## Account API

Account endpoints expose trading balances, equity, PNL, default leverage, deposits, withdrawals, and network transfers.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/account/balance` | Get legacy USDT trading balance and realized PNL. |
| `GET` | `/account/equity` | Get account equity including unrealized PNL. |
| `GET` | `/account/pnl` | Get realized and unrealized PNL. |
| `GET` | `/account/balances` | Get trading balances plus network balances grouped by asset. |
| `GET` | `/account/balances/:asset` | Get one asset's trading and network balances. |
| `GET` | `/account/leverage` | Get default and maximum leverage settings. |
| `POST` | `/account/leverage` | Set default leverage from `1` to `100`. |
| `POST` | `/account/deposit` | Deposit into trading balance or a supported network balance. |
| `POST` | `/account/withdraw` | Withdraw from trading balance or a supported network balance. |
| `POST` | `/account/transfer` | Transfer an asset between supported networks with a mock bridge fee. |

### Get Account Balance

```bash
curl http://localhost:3000/account/balance
```

### Get Equity and PNL

```bash
curl http://localhost:3000/account/equity
curl http://localhost:3000/account/pnl
```

### Get Multi-Asset Balances

```bash
curl http://localhost:3000/account/balances
curl http://localhost:3000/account/balances/USDT
```

### Set Default Leverage

```bash
curl -X POST http://localhost:3000/account/leverage \
  -H "Content-Type: application/json" \
  -d '{"leverage":20}'
```

Example body:

```json
{
  "leverage": 20
}
```

### Deposit to Trading Balance

Deposits without `networkId` go to the internal futures trading balance. Trading deposits currently support `USDT` only.

```bash
curl -X POST http://localhost:3000/account/deposit \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","amount":5000}'
```

### Withdraw from Trading Balance

```bash
curl -X POST http://localhost:3000/account/withdraw \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","amount":1000}'
```

### Deposit to a Network Balance

```bash
curl -X POST http://localhost:3000/account/deposit \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","networkId":"erc20","amount":1000}'
```

Additional examples:

```json
{ "asset": "USDT", "networkId": "bep20", "amount": 2000 }
{ "asset": "BNB", "networkId": "bep20", "amount": 5 }
{ "asset": "SOL", "networkId": "solana", "amount": 10 }
```

### Withdraw from a Network Balance

```bash
curl -X POST http://localhost:3000/account/withdraw \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","networkId":"erc20","amount":100,"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"}'
```

Additional example:

```json
{
  "asset": "BNB",
  "networkId": "bep20",
  "amount": 1,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"
}
```

### Transfer Between Networks

```bash
curl -X POST http://localhost:3000/account/transfer \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","fromNetwork":"erc20","toNetwork":"bep20","amount":500}'
```

Additional example:

```json
{
  "asset": "USDT",
  "fromNetwork": "bep20",
  "toNetwork": "trc20",
  "amount": 300
}
```

## Orders API

Orders support `BUY` and `SELL` sides, `MARKET` and `LIMIT` types, optional per-order leverage, and optional `reduceOnly` behavior.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/orders` | Get all orders and order history. |
| `GET` | `/orders/open` | Get currently open orders. |
| `GET` | `/orders/:id` | Get a single order by ID. |
| `POST` | `/orders` | Create a market or limit futures order. |
| `DELETE` | `/orders/:id` | Cancel an order by ID. |

### Create Market BUY Order

Opens or increases a long position.

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":0.01,"leverage":10}'
```

### Create Market SELL Order

Opens or increases a short position.

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"SELL","type":"MARKET","quantity":0.01,"leverage":15}'
```

### Create Limit Orders

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"BUY","type":"LIMIT","quantity":0.02,"price":64000,"leverage":10}'
```

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"SELL","type":"LIMIT","quantity":0.02,"price":66000,"leverage":10}'
```

### Create Reduce-Only Order

Closes or reduces an existing position without intentionally increasing exposure.

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"SELL","type":"MARKET","quantity":0.01,"reduceOnly":true}'
```

### List and Cancel Orders

```bash
curl http://localhost:3000/orders
curl http://localhost:3000/orders/open
curl http://localhost:3000/orders/ORDER_ID_HERE
curl -X DELETE http://localhost:3000/orders/ORDER_ID_HERE
```

## Market API

Market endpoints expose all generated tickers, symbol-specific tickers, and orderbook depth.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/market/tickers` | Get all realtime ticker snapshots. |
| `GET` | `/market/ticker/:symbol` | Get ticker data for one symbol. |
| `GET` | `/market/orderbook?symbol=:symbol&depth=:depth` | Get orderbook bids and asks for a symbol. |

### Get All Tickers

```bash
curl http://localhost:3000/market/tickers
```

### Get Symbol Tickers

```bash
curl http://localhost:3000/market/ticker/BTCUSDT
curl http://localhost:3000/market/ticker/ETHUSDT
curl http://localhost:3000/market/ticker/SOLUSDT
curl http://localhost:3000/market/ticker/BNBUSDT
curl http://localhost:3000/market/ticker/XRPUSDT
```

### Get Orderbook Depth

```bash
curl "http://localhost:3000/market/orderbook?symbol=BTCUSDT"
curl "http://localhost:3000/market/orderbook?symbol=BTCUSDT&depth=10"
curl "http://localhost:3000/market/orderbook?symbol=ETHUSDT"
curl "http://localhost:3000/market/orderbook?symbol=SOLUSDT&depth=15"
```

## Portfolio and Positions API

Portfolio endpoints expose full account portfolio state, open positions, and closed position history.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/portfolio` | Get full portfolio state. |
| `GET` | `/positions/open` | Get all open positions. |
| `GET` | `/positions/history` | Get closed position history. |

```bash
curl http://localhost:3000/portfolio
curl http://localhost:3000/positions/open
curl http://localhost:3000/positions/history
```

### Liquidation Simulation Flow

Open a high-leverage position, inspect its liquidation price, then let the price engine update prices until liquidation conditions are met.

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":0.1,"leverage":100}'

curl http://localhost:3000/positions/open
```

## Trades API

Trade endpoints expose fills generated by order execution.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/trades` | Get recent trades across all symbols. |
| `GET` | `/trades?symbol=:symbol` | Filter trades by symbol. |
| `GET` | `/trades?symbol=:symbol&limit=:limit` | Filter by symbol and limit result count. |
| `GET` | `/trades/order/:orderId` | Get trades for a specific order. |

```bash
curl http://localhost:3000/trades
curl "http://localhost:3000/trades?symbol=BTCUSDT"
curl "http://localhost:3000/trades?symbol=BTCUSDT&limit=25"
curl http://localhost:3000/trades/order/ORDER_ID_HERE
```

## Network API

Network endpoints expose supported blockchain networks, per-network assets, mock network balances, statistics, and health.

Supported networks:

- `erc20` — Ethereum Network
- `bep20` — BNB Smart Chain
- `trc20` — TRON Network
- `solana` — Solana Network

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/networks` | Get all active blockchain networks. |
| `GET` | `/networks/:networkId` | Get details for one network. |
| `GET` | `/networks/:networkId/assets` | Get supported assets for one network. |
| `GET` | `/networks/:networkId/assets/:asset` | Check one asset's support and config on one network. |
| `GET` | `/network/balances` | Get balances grouped by network. |
| `GET` | `/network/balances/:asset` | Get one asset's balances across all networks. |
| `GET` | `/network/balances/network/:networkId` | Get all balances for one network. |
| `GET` | `/network/stats` | Get mock network statistics. |
| `GET` | `/network/health` | Get network subsystem health. |

### Network Metadata

```bash
curl http://localhost:3000/networks
curl http://localhost:3000/networks/erc20
curl http://localhost:3000/networks/erc20/assets
curl http://localhost:3000/networks/bep20/assets
curl http://localhost:3000/networks/trc20/assets
curl http://localhost:3000/networks/solana/assets
curl http://localhost:3000/networks/erc20/assets/USDT
```

### Network Balances, Stats, and Health

```bash
curl http://localhost:3000/network/balances
curl http://localhost:3000/network/balances/USDT
curl http://localhost:3000/network/balances/network/erc20
curl http://localhost:3000/network/stats
curl http://localhost:3000/network/health
```

## Reports and Activity Logs API

Reports and activity logs provide mock operational records for exchange workflows.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/activity-logs` | Get all activity log entries. |
| `GET` | `/reports` | Get all reports. |
| `GET` | `/reports/:id` | Get one report by ID. |

```bash
curl http://localhost:3000/activity-logs
curl http://localhost:3000/reports
curl http://localhost:3000/reports/YOUR_REPORT_ID_HERE
```

## WebSocket Guide

The WebSocket server is attached to the same HTTP server.

```text
ws://localhost:3000
```

Use `wscat`, a browser WebSocket client, or your application frontend to connect.

```bash
npx wscat -c ws://localhost:3000
```

### Automatic Ticker Stream

Every connected client receives `TICKER_UPDATE` messages every `500ms`.

```json
{
  "type": "TICKER_UPDATE",
  "data": [
    {
      "symbol": "BTCUSDT",
      "price": 65012.34,
      "change": 0.18,
      "volume": 123456
    }
  ]
}
```

### Subscribe to Orderbook Depth

Send this message after connecting:

```json
{
  "type": "SUBSCRIBE_DEPTH",
  "symbol": "BTCUSDT"
}
```

Subscribed clients receive `DEPTH_UPDATE` messages every `1s` for each subscribed symbol.

```json
{
  "type": "DEPTH_UPDATE",
  "symbol": "BTCUSDT",
  "data": {
    "bids": [[64000, 0.02]],
    "asks": [[66000, 0.02]],
    "timestamp": 1710000000000
  }
}
```

### Unsubscribe from Orderbook Depth

```json
{
  "type": "UNSUBSCRIBE_DEPTH",
  "symbol": "BTCUSDT"
}
```

### Exchange Event Messages

The server forwards order, position, and trade events to connected WebSocket clients.

| Message Type | Description |
| --- | --- |
| `TICKER_UPDATE` | Realtime ticker snapshot for all symbols every `500ms`. |
| `DEPTH_UPDATE` | Orderbook depth update for subscribed symbols every `1s`. |
| `ORDER_CREATED` | Emitted when an order is created. |
| `ORDER_FILLED` | Emitted when an order is filled. |
| `ORDER_REJECTED` | Emitted when an order is rejected. |
| `ORDER_CANCELLED` | Emitted when an order is cancelled. |
| `ORDER_UPDATED` | Emitted when an order changes state. |
| `POSITION_OPENED` | Emitted when a position opens. |
| `POSITION_UPDATED` | Emitted when a position changes. |
| `POSITION_CLOSED` | Emitted when a position closes. |
| `TRADE_EXECUTED` | Emitted when a trade is executed. |

Example event:

```json
{
  "type": "ORDER_FILLED",
  "data": {
    "id": "order-id",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "MARKET",
    "status": "FILLED"
  }
}
```

## Testing

### 1. Start the server

```bash
npm run dev
```

### 2. Run the test runner in a new terminal

```bash
node api-test-runner.js
```

This runs ~30 API tests covering accounts, orders, trades, positions, market data, and networks.

### 3. Check the results

Two files are created in the project root:

- `api-test-report.html` - Open this in your browser for a visual pass/fail report.
- `api-test-results.json` - Raw JSON data.

Make sure the server is running BEFORE running the tests.

## Environment Variables

No required environment variables are currently used.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` in code | Not currently wired; server port is hardcoded in `src/server.ts`. |
| `HOST` | No | `0.0.0.0` in code | Not currently wired; server host is hardcoded in `src/server.ts`. |

## Project Structure

```text
src/
├── server.ts     # Entry point: starts HTTP + WebSocket
├── config/       # Settings: 57 trading pairs, 4 blockchain networks
├── engine/       # Core logic: price updates, order matching, trade execution
├── realtime/     # WebSocket: live tickers, depth, order/position events
├── routes/       # All API endpoints (account, orders, market, portfolio, etc.)
├── store/        # In-memory data (orders, positions, balances, trades)
├── types/        # TypeScript interfaces
└── utils/        # EventBus for internal communication
```

### What each folder does

| Folder | Purpose |
|--------|---------|
| `config/` | Static lists of tradable symbols and blockchain networks. |
| `engine/` | Price simulation (500ms updates), order validation, matching engine. |
| `realtime/` | WebSocket server that pushes tickers, depth, and events to clients. |
| `routes/` | All HTTP endpoints you can call (see API docs above). |
| `store/` | Simple in-memory storage - resets when server restarts. |
| `types/` | TypeScript definitions for orders, positions, orderbook. |
| `utils/` | Event bus that connects different parts of the system. |

## Supported Markets

The exchange provides generated USDT futures tickers for the symbols configured in `src/config/symbols.ts`, including:

- Major: `BTCUSDT`, `ETHUSDT`, `BNBUSDT`, `SOLUSDT`, `XRPUSDT`
- Layer 1: `ADAUSDT`, `AVAXUSDT`, `DOTUSDT`, `MATICUSDT`, `ATOMUSDT`, `NEARUSDT`, `ALGOUSDT`, `VETUSDT`, `EGLDUSDT`, `FTMUSDT`
- DeFi: `UNIUSDT`, `AAVEUSDT`, `LINKUSDT`, `CRVUSDT`, `CAKEUSDT`, `SUSHIUSDT`, `COMPUSDT`, `MKRUSDT`, `SNXUSDT`, `LDOUSDT`
- Meme: `DOGEUSDT`, `SHIBUSDT`, `PEPEUSDT`, `FLOKIUSDT`, `BONKUSDT`, `WIFUSDT`
- Gaming, Layer 2, storage, oracle, AI, and other popular markets such as `SANDUSDT`, `MANAUSDT`, `ARBUSDT`, `OPUSDT`, `FILUSDT`, `PYTHUSDT`, `FETUSDT`, `RNDRUSDT`, and more

## Roadmap

Potential future improvements:

- Add environment-driven `PORT`, `HOST`, and runtime configuration.
- Add persistent storage with PostgreSQL, SQLite, Redis, or an event-sourced ledger.
- Add authentication, API keys, user accounts, and scoped permissions.
- Add OpenAPI/Swagger documentation generated from route schemas.
- Add formal unit and integration tests with a standard `npm test` command.
- Add deterministic test fixtures and reset endpoints for repeatable simulations.
- Add funding rates, mark price, index price, maintenance margin tiers, and insurance fund logic.
- Add WebSocket channel namespacing and per-symbol ticker subscriptions.
- Add Docker and Docker Compose support for local deployment.

## License

ISC
