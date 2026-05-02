import {
  generateExercises,
  getCaesarNumbers,
  getShiftForDifficulty,
} from "./ciphers";
import type { Difficulty } from "../types/game";

describe("ciphers", () => {
  it("uses the fixed shift for each difficulty", () => {
    const expectedShifts: Record<Difficulty, number> = {
      basic: 0,
      intermediate: 19,
      advanced: 13,
    };

    Object.entries(expectedShifts).forEach(([difficulty, expectedShift]) => {
      expect(getShiftForDifficulty(difficulty as Difficulty)).toBe(
        expectedShift,
      );

      const exercises = generateExercises(difficulty as Difficulty, 3);

      expect(exercises).toHaveLength(3);
      exercises.forEach((exercise) => {
        expect(exercise.shiftValue).toBe(expectedShift);
      });
    });
  });

  it("returns encrypted letter positions as clue numbers", () => {
    expect(getCaesarNumbers("gato", 0)).toBe("7 1 20 15");
    expect(getCaesarNumbers("gato", 19)).toBe("26 20 13 8");
    expect(getCaesarNumbers("gato", 13)).toBe("20 14 7 2");
  });
});
