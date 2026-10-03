export interface LampMode {
  id: string;
  name: string;
  category: 'classic' | 'ambient' | 'dynamic' | 'lighting';
  icon: string;
  defaultSpeed: number;
  defaultScale: number;
  description: string;
  paletteColors?: string[];
}

export interface LampState {
  power: boolean;
  brightness: number; // 0 - 255
  speed: number;      // 1 - 255
  scale: number;      // 1 - 255
  modeId: string;
  color: string;      // HEX
  timerMinutes: number; // 0 = off, 15, 30, 60
}

export interface ConnectionConfig {
  ip: string;
  port: number;
  protocol: 'rest' | 'websocket' | 'gyver';
  isConnected: boolean;
  isSimulated: boolean;
  rssi: number;
  freeHeap: number;
  chipModel: string;
  firmwareVersion: string;
  uptimeSeconds: number;
}

export type OtaPartition = 'firmware' | 'filesystem';

export interface OtaLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'warn' | 'error' | 'success';
}

export interface OtaState {
  partition: OtaPartition;
  fileName: string | null;
  fileSize: number;
  progress: number;
  status: 'idle' | 'uploading' | 'verifying' | 'rebooting' | 'success' | 'error';
  errorMessage?: string;
  logs: OtaLogEntry[];
}
