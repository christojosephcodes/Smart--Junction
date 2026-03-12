
export enum SignalState {
  GREEN = 'GREEN',
  RED = 'RED',
  EMERGENCY = 'EMERGENCY'
}

export enum TrafficDensity {
  CLEAR = 'CLEAR',
  LOW = 'LOW',
  CONGESTION = 'CONGESTION',
  EMERGENCY = 'EMERGENCY'
}

export interface LaneState {
  id: number;
  name: string;
  vehicleCount: number;
  signal: SignalState;
  remainingTime: number;
  videoUrl: string | null;
  isEmergency: boolean;
  aiInsight?: string;
}

export interface TrafficUpdate {
  timestamp: number;
  lanes: {
    name: string;
    status: TrafficDensity;
    count: number;
  }[];
  activeLane: string;
  targetIp: string;
}
