/**
 * MineCraft Protocol - Handshake Packet Parser
 * 
 * このファイルは、ハンドシェイクパケットを解析するためのユーティリティを提供します。
 * Minecraft Protocol: https://wiki.vg/Protocol#Handshaking
 */

const { readVarInt, readString } = require('../../utils/dataReader');

/**
 * ハンドシェイクパケットを解析します
 * @param {Buffer} buffer - パケットデータ
 * @returns {Object} 解析されたハンドシェイク情報
 */
function parseHandshake(buffer) {
  let offset = 0;
  
  // パケット長を読み取る
  const { value: length, bytesRead: lengthBytes } = readVarInt(buffer, offset);
  offset += lengthBytes;
  
  // パケットIDを読み取る
  const { value: packetId, bytesRead: packetIdBytes } = readVarInt(buffer, offset);
  offset += packetIdBytes;
  
  // パケットIDが0でない場合はエラー
  if (packetId !== 0x00) {
    throw new Error(`Invalid handshake packet ID: 0x${packetId.toString(16)}`);
  }
  
  // プロトコルバージョンを読み取る
  const { value: protocol, bytesRead: protocolBytes } = readVarInt(buffer, offset);
  offset += protocolBytes;
  
  // サーバーアドレスを読み取る
  const { value: serverAddress, bytesRead: serverAddressBytes } = readString(buffer, offset);
  offset += serverAddressBytes;
  
  // サーバーポートを読み取る
  const serverPort = buffer.readUInt16BE(offset);
  offset += 2;
  
  // 次のステートを読み取る
  const { value: nextState, bytesRead: nextStateBytes } = readVarInt(buffer, offset);
  offset += nextStateBytes;
  
  return {
    protocol,
    serverAddress,
    serverPort,
    nextState
  };
}

module.exports = {
  parseHandshake
};