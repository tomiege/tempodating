// types.ts
export interface Attendee {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  bye_count?: number;
  consecutive_byes?: number;
  dates?: string[];
}

export interface Pairing {
  round: number;
  male_id: string;
  female_id: string;
  male_name: string;
  female_name: string;
  male_age: number;
  female_age: number;
  age_diff: number;
  cost: number;
}

export interface Bye {
  round: number;
  attendee_id: string;
  attendee_name: string;
  bye_penalty: number;
}

export interface RoundResult {
  round: number;
  pairings: Pairing[];
  byes: Bye[];
}
