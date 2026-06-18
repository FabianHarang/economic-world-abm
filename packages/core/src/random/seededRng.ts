export interface SeededRng {
  nextUint32(): number;
  nextFloat(): number;
}

export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;
  if (state === 0) {
    state = 0x9e3779b9;
  }

  return {
    nextUint32() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return state >>> 0;
    },
    nextFloat() {
      return this.nextUint32() / 0x1_0000_0000;
    }
  };
}

export function deriveSeed(masterSeed: number, label: string, index = 0): number {
  let hash = masterSeed >>> 0;
  for (let i = 0; i < label.length; i += 1) {
    hash ^= label.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619) >>> 0;
  }
  hash ^= index >>> 0;
  return hash >>> 0;
}

