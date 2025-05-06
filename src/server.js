/**
 * MineCraft Protocol Server - Main Server File
 * 
 * このファイルはMCPサーバーのメインエントリーポイントです。
 * サーバーの初期化、設定の読み込み、イベントハンドラの設定を行います。
 */

const net = require('net');
const { logger } = require('./utils/logger');
const { handleConnection } = require('./protocol/connection');
const config = require('../config/config.json');

class MCPServer {
  constructor(options = {}) {
    this.port = options.port || config.port || 25565;
    this.host = options.host || config.host || '0.0.0.0';
    this.maxPlayers = options.maxPlayers || config.maxPlayers || 20;
    this.onlineMode = options.onlineMode !== undefined ? options.onlineMode : config.onlineMode !== undefined ? config.onlineMode : true;
    this.gameMode = options.gameMode || config.gameMode || 'survival';
    this.difficulty = options.difficulty || config.difficulty || 'normal';
    
    this.players = new Map();
    this.server = null;
  }

  /**
   * サーバーを起動します
   */
  start() {
    this.server = net.createServer(this.handleSocketConnection.bind(this));
    
    this.server.on('error', (err) => {
      logger.error(`Server error: ${err.message}`);
    });
    
    this.server.listen(this.port, this.host, () => {
      logger.info(`MCP Server running on ${this.host}:${this.port}`);
      logger.info(`Max players: ${this.maxPlayers}, Game mode: ${this.gameMode}, Difficulty: ${this.difficulty}`);
    });
  }
  
  /**
   * サーバーを停止します
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('Server stopped');
      });
    }
  }
  
  /**
   * クライアント接続のハンドラ
   * @param {net.Socket} socket - クライアント接続ソケット
   */
  handleSocketConnection(socket) {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`New connection from ${remoteAddress}`);
    
    if (this.players.size >= this.maxPlayers) {
      logger.warn(`Connection rejected: server full (${this.players.size}/${this.maxPlayers})`);
      socket.end('Server is full');
      return;
    }
    
    handleConnection(socket, this);
  }
}

// エクスポート
module.exports = MCPServer;

// 直接実行された場合はサーバーを起動
if (require.main === module) {
  const server = new MCPServer();
  server.start();
  
  // 終了シグナルのハンドリング
  process.on('SIGINT', () => {
    logger.info('Received SIGINT. Shutting down...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Shutting down...');
    server.stop();
    process.exit(0);
  });
}