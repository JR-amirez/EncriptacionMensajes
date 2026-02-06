export type Difficulty = "basic" | "intermediate" | "advanced";

export type CipherType = "caesar" | "atbash" | "vigenere";

export interface WordBankEntry {
  word: string;
  category: string;
}

export interface Exercise {
  id: number;
  plainText: string;
  encryptedText: string;
  cipherType: CipherType;
  hint: string;
  category: string;
  shiftValue: number;
  answered: boolean;
  correct: boolean | null;
}

export interface GameConfig {
  totalExercises: number;
  pointsCorrect: number;
}
