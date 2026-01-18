
export type Side = 'LEFT' | 'RIGHT' | null;

export interface DrawPoint {
  x: number;
  y: number;
  color: string;
  width: number;
  side: 'LEFT' | 'RIGHT';
  type: 'start' | 'move' | 'end';
  id: string;
}

export interface DebateSession {
  topicA: string;
  topicB: string;
  id: string;
}

export type ChannelMessage = 
  | { type: 'DRAW', data: DrawPoint }
  | { type: 'UPDATE_SESSION', data: DebateSession }
  | { type: 'CLEAR_CANVAS' };

export interface AnalysisResponse {
  summary: string;
  sentiment: string;
  visualPatterns: string[];
  sociologicalInsight: string;
}
