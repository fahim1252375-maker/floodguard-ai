import { describe, it, expect } from 'vitest';
import {
  calculatePrepositionPlan,
  DEFAULT_PREPOSITION_ASSUMPTIONS,
} from './prepositionPlanner';
import { INITIAL_LOCATIONS } from '../data/mockData';
import { SAMPLE_SHELTER_MEDICAL_BOARD } from './healthRisk';

describe('Preposition Planner Model', () => {
  it('correctly calculates daily ORS need based on displaced population and assumption rate', () => {
    const plan = calculatePrepositionPlan(
      INITIAL_LOCATIONS,
      SAMPLE_SHELTER_MEDICAL_BOARD,
      DEFAULT_PREPOSITION_ASSUMPTIONS
    );

    expect(plan.length).toBe(INITIAL_LOCATIONS.length);
    const topItem = plan[0];
    expect(topItem.projectedOrsDailyNeed).toBe(
      Math.round(topItem.displacedPopulationEstimate * DEFAULT_PREPOSITION_ASSUMPTIONS.orsPerPersonDay)
    );
    expect(topItem.orsShortfall).toBeGreaterThanOrEqual(0);
  });

  it('adjusts need dynamically when assumptions change', () => {
    const higherAssumption = {
      ...DEFAULT_PREPOSITION_ASSUMPTIONS,
      orsPerPersonDay: 4, // doubled assumption rate
    };

    const plan = calculatePrepositionPlan(
      INITIAL_LOCATIONS,
      SAMPLE_SHELTER_MEDICAL_BOARD,
      higherAssumption
    );

    const first = plan[0];
    expect(first.orsSachetsPerPersonDay).toBe(4);
    expect(first.projectedOrsDailyNeed).toBe(first.displacedPopulationEstimate * 4);
  });

  it('identifies nearest surplus shelter when shortfall exists and surplus is available', () => {
    const plan = calculatePrepositionPlan(INITIAL_LOCATIONS, SAMPLE_SHELTER_MEDICAL_BOARD);
    const deficitItem = plan.find((p) => p.orsShortfall > 0);
    if (deficitItem) {
      expect(deficitItem.suggestedTransferQuantity).toBeGreaterThan(0);
      expect(deficitItem.nearestSurplusShelterEn).toBeDefined();
    }
  });

  it('ranks upazilas in descending order of shortfall and risk', () => {
    const plan = calculatePrepositionPlan(INITIAL_LOCATIONS, SAMPLE_SHELTER_MEDICAL_BOARD);
    for (let i = 0; i < plan.length - 1; i++) {
      expect(plan[i].orsShortfall).toBeGreaterThanOrEqual(plan[i + 1].orsShortfall);
    }
  });
});
