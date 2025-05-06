/**
 * MineCraft Protocol - Connection Handler
 * 
 * このファイルは、クライアント接続を処理し、適切なプロトコルステージに
 * 応じたハンドラを呼び出す責任を持ちます。
 */

const { logger } = require('../utils/logger');
const { parseHandshake } = require('./packets/handshake');
const { handleLoginStart } = require('./states/login');

/**
 * Connection states
 */
const STATES = {
  HANDSHAKING: 0,
  STATUS: 1,
  LOGIN: 2,
  PLAY: 3
};

/**
 * クライアント接続を処理します
 * @param {net.Socket} socket - クライアント接続ソケット
 * @param {Object} server - サーバーインスタンス
 */
function handleConnection(socket, server) {
  const connection = {
    socket,
    state: STATES.HANDSHAKING,
    address: `${socket.remoteAddress}:${socket.remotePort}`,
    username: null,
    uuid: null,
    protocol: null,
    server
  };
  
  // データ受信時のハンドラ
  socket.on('data', (data) => {
    try {
      switch (connection.state) {
        case STATES.HANDSHAKING:
          handleHandshake(data, connection);
          break;
        case STATES.STATUS:
          handleStatus(data, connection);
          break;
        case STATES.LOGIN:
          handleLogin(data, connection);
          break;
        case STATES.PLAY:
          handlePlay(data, connection);
          break;
        default:
          logger.warn(`Unknown state: ${connection.state}`);
          socket.end();
      }
    } catch (err) {
      logger.error(`Error handling connection: ${err.message}`);
      logger.debug(err.stack);
      socket.end();
    }
  });
  
  // 接続終了時のハンドラ
  socket.on('end', () => {
    logger.info(`Connection closed: ${connection.address}`);
    if (connection.username) {
      server.players.delete(connection.username);
    }
  });
  
  // エラー発生時のハンドラ
  socket.on('error', (err) => {
    logger.error(`Socket error: ${err.message}`);
    if (connection.username) {
      server.players.delete(connection.username);
    }
  });
}

/**
 * ハンドシェイクパケットを処理します
 * @param {Buffer} data - 受信データ
 * @param {Object} connection - 接続情報
 */
function handleHandshake(data, connection) {
  const handshake = parseHandshake(data);
  logger.debug(`Received handshake: protocol=${handshake.protocol}, address=${handshake.serverAddress}, port=${handshake.serverPort}, nextState=${handshake.nextState}`);
  
  connection.protocol = handshake.protocol;
  connection.state = handshake.nextState;
  
  // 次のステートに基づいてハンドラを呼び出す
  if (connection.state === STATES.STATUS) {
    logger.debug('Client is requesting server status');
  } else if (connection.state === STATES.LOGIN) {
    logger.debug('Client is requesting login');
  }
}

/**
 * ステータスパケットを処理します
 * @param {Buffer} data - 受信データ 
 * @param {Object} connection - 接続情報
 */
function handleStatus(data, connection) {
  // ステータスリクエストとpingの処理
  logger.debug('Status request received');
  // 実装を追加
}

/**
 * ログインパケットを処理します
 * @param {Buffer} data - 受信データ
 * @param {Object} connection - 接続情報
 */
function handleLogin(data, connection) {
  // ログインリクエストの処理
  logger.debug('Login request received');
  handleLoginStart(data, connection);
}

/**
 * プレイ状態のパケットを処理します
 * @param {Buffer} data - 受信データ
 * @param {Object} connection - 接続情報
 */
function handlePlay(data, connection) {
  // プレイ状態のパケット処理
  logger.debug('Play packet received');
  // 実装を追加
}

module.exports = {
  handleConnection,
  STATES
};