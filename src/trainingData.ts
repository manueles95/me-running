import raw from '../data/training.json';
import type { TrainingData } from './types/training';

// Build-time import of the single source of truth (spec §2, §3).
// `resolveJsonModule` widens JSON string literals to `string`, so the enum-like
// fields (status, kind, …) can't be checked by a plain annotation; the assertion
// bridges that. The contract still binds everywhere it matters: all 15 components
// and the lib helpers consume the strict `TrainingData` type, so a shape mismatch
// there fails `tsc`. Full value-level schema validation is the §8 `validate-data`
// follow-up. Extra unknown fields are ignored by the render layer.
export const trainingData = raw as TrainingData;

export default trainingData;
