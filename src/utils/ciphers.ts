import type { Difficulty, Exercise, GameConfig, WordBankEntry } from "../types/game";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n");
}

// ─── Cifrado César ───

export function caesarEncrypt(text: string, shift: number): string {
  const normalized = normalize(text);
  return normalized
    .split("")
    .map((char) => {
      const idx = ALPHABET.indexOf(char);
      if (idx === -1) return char;
      return ALPHABET[(idx + shift) % 26];
    })
    .join("");
}

// ─── Banco de palabras ───

const WORD_BANK: Record<Difficulty, WordBankEntry[]> = {
  basic: [
    { word: "gato", category: "Animal" },
    { word: "perro", category: "Animal" },
    { word: "casa", category: "Objeto" },
    { word: "mesa", category: "Objeto" },
    { word: "luna", category: "Naturaleza" },
    { word: "sol", category: "Naturaleza" },
    { word: "agua", category: "Naturaleza" },
    { word: "flor", category: "Naturaleza" },
    { word: "libro", category: "Objeto" },
    { word: "arbol", category: "Naturaleza" },
    { word: "cielo", category: "Naturaleza" },
    { word: "fuego", category: "Naturaleza" },
    { word: "rio", category: "Naturaleza" },
    { word: "nube", category: "Naturaleza" },
    { word: "piedra", category: "Naturaleza" },
  ],
  intermediate: [
    { word: "mariposa", category: "Animal" },
    { word: "ventana", category: "Objeto" },
    { word: "estrella", category: "Naturaleza" },
    { word: "montana", category: "Naturaleza" },
    { word: "camino", category: "Lugar" },
    { word: "puente", category: "Lugar" },
    { word: "musica", category: "Arte" },
    { word: "pintura", category: "Arte" },
    { word: "oceano", category: "Naturaleza" },
    { word: "bosque", category: "Naturaleza" },
    { word: "reloj", category: "Objeto" },
    { word: "espejo", category: "Objeto" },
    { word: "tesoro", category: "Objeto" },
    { word: "dragon", category: "Fantasia" },
    { word: "castillo", category: "Lugar" },
  ],
  advanced: [
    { word: "libertad", category: "Concepto" },
    { word: "aventura", category: "Concepto" },
    { word: "secreto", category: "Concepto" },
    { word: "misterio", category: "Concepto" },
    { word: "universo", category: "Ciencia" },
    { word: "galaxia", category: "Ciencia" },
    { word: "volcan", category: "Naturaleza" },
    { word: "cascada", category: "Naturaleza" },
    { word: "laberinto", category: "Lugar" },
    { word: "horizonte", category: "Naturaleza" },
    { word: "diamante", category: "Objeto" },
    { word: "fantasma", category: "Fantasia" },
    { word: "orquidea", category: "Naturaleza" },
    { word: "relampago", category: "Naturaleza" },
    { word: "maravilla", category: "Concepto" },
  ],
};

const DEFAULT_TOTAL_EXERCISES: Record<Difficulty, number> = {
  basic: 8,
  intermediate: 6,
  advanced: 5,
};
const POINTS_PER_DIFFICULTY: Record<Difficulty, number> = {
  basic: 10,
  intermediate: 15,
  advanced: 20,
};
const SHIFT_BY_DIFFICULTY: Record<Difficulty, number> = {
  basic: 0,
  intermediate: 19,
  advanced: 13,
};

export function getShiftForDifficulty(difficulty: Difficulty): number {
  return SHIFT_BY_DIFFICULTY[difficulty];
}

export function getCaesarNumbers(text: string, shift: number): string {
  return normalize(text)
    .split("")
    .map((char) => {
      const idx = ALPHABET.indexOf(char);
      return idx === -1 ? char : String(((idx + shift) % 26) + 1);
    })
    .join(" ");
}

// ─── Generación de ejercicios ───

export function generateExercises(difficulty: Difficulty, count: number): Exercise[] {
  const bank = [...WORD_BANK[difficulty]];

  // Fisher-Yates shuffle
  for (let i = bank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bank[i], bank[j]] = [bank[j], bank[i]];
  }

  const selected = bank.slice(0, Math.min(count, bank.length));

  return selected.map((entry, index) => {
    const plainNormalized = normalize(entry.word);
    const shift = getShiftForDifficulty(difficulty);

    return {
      id: index,
      plainText: plainNormalized,
      encryptedText: caesarEncrypt(entry.word, shift).toUpperCase(),
      cipherType: "caesar",
      category: entry.category,
      shiftValue: shift,
      answered: false,
      correct: null,
    };
  });
}

// ─── Validación de respuesta ───

export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer.trim()) === normalize(correctAnswer.trim());
}

// ─── Configuración por dificultad ───

export function resolveExerciseCount(
  difficulty: Difficulty,
  requestedCount?: number | null,
): number {
  const fallbackCount = DEFAULT_TOTAL_EXERCISES[difficulty];
  const normalizedCount =
    typeof requestedCount === "number" && Number.isFinite(requestedCount)
      ? Math.floor(requestedCount)
      : fallbackCount;

  if (normalizedCount <= 0) {
    return Math.min(fallbackCount, WORD_BANK[difficulty].length);
  }

  return Math.min(normalizedCount, WORD_BANK[difficulty].length);
}

export function getGameConfig(
  difficulty: Difficulty,
  requestedCount?: number | null,
): GameConfig {
  return {
    totalExercises: resolveExerciseCount(difficulty, requestedCount),
    pointsCorrect: POINTS_PER_DIFFICULTY[difficulty],
  };
}

export function getTotalTime(difficulty: Difficulty): number {
  switch (difficulty) {
    case "basic":
      return 1200;
    case "intermediate":
      return 150;
    case "advanced":
      return 180;
  }
}
