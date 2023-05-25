export interface FromTo {
  from: string;
  to: string;
}

export interface Validation {
  valid: boolean;
  additional: { from: string; to: string } | null;
}

export enum BoardType {
  Classic,
  Circle,
}
