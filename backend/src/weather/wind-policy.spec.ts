import { demoDrones, demoMissions } from '../database/demo-data';
import { evaluateFlight } from './wind-policy';

describe('wind flight policy', () => {
  const drone = demoDrones[1];
  const mission = demoMissions[1];

  it('holds a launch when gusts exceed the safety limit', () => {
    const result = evaluateFlight(drone, mission, {
      speedKmh: 22,
      gustKmh: 60,
      directionDegrees: 90,
      observedAt: new Date().toISOString(),
    });

    expect(result.decision).toBe('HOLD');
  });

  it('increases required energy under stronger headwind', () => {
    const mild = evaluateFlight(drone, mission, {
      speedKmh: 8,
      gustKmh: 12,
      directionDegrees: 0,
      observedAt: new Date().toISOString(),
    });
    const strong = evaluateFlight(drone, mission, {
      speedKmh: 32,
      gustKmh: 42,
      directionDegrees: 0,
      observedAt: new Date().toISOString(),
    });

    expect(strong.batteryRequired).toBeGreaterThan(mild.batteryRequired);
  });
});
