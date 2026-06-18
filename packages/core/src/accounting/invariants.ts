export interface EmployerWorkerState {
  readonly employerId: Int32Array;
  readonly firmWorkerCount: Int32Array;
}

export interface PayrollState {
  readonly employerId: Int32Array;
  readonly wage: Float64Array;
  readonly hours: Float64Array;
  readonly firmWageBill: Float64Array;
}

export function checkEmployerWorkerConsistency(state: EmployerWorkerState): boolean {
  let employedHouseholds = 0;
  for (const employer of state.employerId) {
    if (employer >= 0) {
      employedHouseholds += 1;
    }
  }

  let rosteredWorkers = 0;
  for (const count of state.firmWorkerCount) {
    rosteredWorkers += count;
  }

  return employedHouseholds === rosteredWorkers;
}

export function computeFirmWorkerCounts(employerId: Int32Array, firmCount: number): Int32Array {
  const counts = new Int32Array(firmCount);
  for (const employer of employerId) {
    if (employer >= 0) {
      if (employer >= firmCount) {
        throw new Error(`Employer id ${employer} exceeds firm count ${firmCount}.`);
      }
      counts[employer] += 1;
    }
  }
  return counts;
}

export function checkPayrollConsistency(state: PayrollState, tolerance = 1e-8): boolean {
  const computed = new Float64Array(state.firmWageBill.length);
  for (let h = 0; h < state.employerId.length; h += 1) {
    const employer = state.employerId[h];
    if (employer >= 0) {
      computed[employer] += state.wage[h] * state.hours[h];
    }
  }

  for (let f = 0; f < state.firmWageBill.length; f += 1) {
    if (Math.abs(computed[f] - state.firmWageBill[f]) > tolerance) {
      return false;
    }
  }

  return true;
}

