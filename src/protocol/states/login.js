/**
 * MineCraft Protocol - Login State Handler
 * 
 * このファイルはクライアントのログイン状態を処理します。
 * Minecraft Protocol: https://wiki.vg/Protocol#Login
 */

const crypto = require('crypto');
const { readVarInt, readString } = require('../../utils/dataReader');
const { writeVarInt, writeString, writeUUID } = require('../../utils/dataWriter');
const { logger } = require('../../utils/logger');
const { STATES } = require('../connection');

/**
 * ログイン開始パケットを処理します
 * @param {Buffer} data - 受信データ
 * @param {Object} connection - 接続情報
 */
function handleLoginStart(data, connection) {
  let offset = 0;
  
  // パケット長を読み取る
  const { value: length, bytesRead: lengthBytes } = readVarInt(data, offset);
  offset += lengthBytes;
  
  // パケットIDを読み取る
  const { value: packetId, bytesRead: packetIdBytes } = readVarInt(data, offset);
  offset += packetIdBytes;
  
  // パケットIDが0x00でない場合はエラー
  if (packetId !== 0x00) {
    throw new Error(`Invalid login start packet ID: 0x${packetId.toString(16)}`);
  }
  
  // ユーザー名を読み取る
  const { value: username, bytesRead: usernameBytes } = readString(data, offset);
  offset += usernameBytes;
  
  logger.info(`Player ${username} is trying to log in`);
  
  connection.username = username;
  
  // オンラインモードが有効な場合は認証を行う
  if (connection.server.onlineMode) {
    sendEncryptionRequest(connection);
  } else {
    // オフラインモードの場合は直接ログイン成功を送信
    acceptLogin(connection);
  }
}

/**
 * 暗号化リクエストを送信します
 * @param {Object} connection - 接続情報
 */
function sendEncryptionRequest(connection) {
  // 実際の実装では、セキュアな乱数生成と暗号化を使う
  logger.debug(`Sending encryption request to ${connection.username}`);
  
  // 簡略化のため、オフラインモードと同様の処理にする
  acceptLogin(connection);
}

/**
 * ログインを承認し、プレイ状態に移行します
 * @param {Object} connection - 接続情報
 */
function acceptLogin(connection) {
  const { socket, username, server } = connection;
  
  // UUIDを生成（オフラインモードでは一貫したUUIDを生成）
  const uuid = generateOfflineUUID(username);
  connection.uuid = uuid;
  
  logger.info(`Player ${username} logged in with UUID: ${uuid}`);
  
  // ログイン成功パケットを送信
  const loginSuccessPacket = createLoginSuccessPacket(uuid, username);
  socket.write(loginSuccessPacket);
  
  // プレイ状態に移行
  connection.state = STATES.PLAY;
  
  // プレイヤーをサーバーに追加
  server.players.set(username, connection);
  
  // ゲーム開始パケットを送信（実際の実装ではさらに多くのパケットを送信）
  // ...
}

/**
 * ログイン成功パケットを作成します
 * @param {string} uuid - プレイヤーのUUID
 * @param {string} username - プレイヤーのユーザー名
 * @returns {Buffer} ログイン成功パケット
 */
function createLoginSuccessPacket(uuid, username) {
  // バッファを準備
  const buffer = Buffer.alloc(1024); // 十分なサイズを確保
  let offset = 0;
  
  // パケットIDを書き込む (0x02 for Login Success)
  offset = writeVarInt(buffer, 0x02, offset);
  
  // UUIDを書き込む
  offset = writeUUID(buffer, uuid, offset);
  
  // ユーザー名を書き込む
  offset = writeString(buffer, username, offset);
  
  // プロパティの数を書き込む（ここでは0）
  offset = writeVarInt(buffer, 0, offset);
  
  // パケット長を計算して先頭に書き込む
  const packetLength = offset;
  const headerBuffer = Buffer.alloc(5); // VarInt用の十分なサイズ
  const headerLength = writeVarInt(headerBuffer, packetLength, 0);
  
  // 最終的なパケットを作成
  const finalPacket = Buffer.concat([
    headerBuffer.slice(0, headerLength),
    buffer.slice(0, offset)
  ]);
  
  return finalPacket;
}

/**
 * オフラインモードでのUUIDを生成します
 * @param {string} username - プレイヤーのユーザー名
 * @returns {string} UUID
 */
function generateOfflineUUID(username) {
  const hash = crypto.createHash('md5').update('OfflinePlayer:' + username).digest();
  
  // バージョン3のUUIDに変換
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  
  // UUID形式に変換
  return [
    hash.slice(0, 4).toString('hex'),
    hash.slice(4, 6).toString('hex'),
    hash.slice(6, 8).toString('hex'),
    hash.slice(8, 10).toString('hex'),
    hash.slice(10, 16).toString('hex')
  ].join('-');
}

module.exports = {
  handleLoginStart
};