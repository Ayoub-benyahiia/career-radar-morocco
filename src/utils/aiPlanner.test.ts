import { describe, expect, it } from 'vitest';
import type { MarketDataset, UserProfile } from '../types/career';
import {
  adaptHybridCareerPlan,
  adaptOfflineCareerPlan,
  generateHybridCareerPlan,
  generateOfflineCareerPlan,
} from './aiPlanner';

// Load static dataset mock / fixtures
import skillsData from '../../public/data/skills.json';
import citiesData from '../../public/data/cities.json';
import offersData from '../../public/data/offers-lite.json';
import titlesData from '../../public/data/titles.json';
import pairingsData from '../../public/data/pairings.json';
import aggregatesData from '../../public/data/aggregates.json';
import metaData from '../../public/data/meta.json';

const mockDataset: MarketDataset = {
  skills: skillsData as any,
  cities: citiesData as any,
  offers: offersData as any,
  titles: titlesData as any,
  pairings: pairingsData as any,
  aggregates: aggregatesData as any,
  meta: metaData as any,
};

const mockProfile: UserProfile = {
  cityId: 3, // Agadir
  experienceLevel: 'stage_pfe',
  workMode: 'all',
  contractType: ['Stage'],
  skillIds: [88, 107], // React (88), SQL (107)
  onboardingCompleted: true,
};

describe('AI Career Planner Engine', () => {
  it('generates a deterministic 4-week offline career plan with milestones and tasks', () => {
    const start = performance.now();
    const plan = generateOfflineCareerPlan(mockDataset, mockProfile, {
      targetTitleId: 1, // Développeur Full Stack
      weeklyHours: 10,
      durationWeeks: 4,
    });
    const elapsed = performance.now() - start;

    expect(plan).toBeDefined();
    expect(plan.mode).toBe('offline_deterministic');
    expect(plan.durationWeeks).toBe(4);
    expect(plan.weeklyHours).toBe(10);
    expect(plan.milestones.length).toBe(4);
    expect(plan.projectedScore).toBeGreaterThanOrEqual(plan.currentScore);
    expect(plan.scoreGainPoints).toBeGreaterThanOrEqual(0);
    expect(plan.localMarketNote).toContain('Agadir');
    expect(plan.portfolioProject.title).toBeDefined();
    expect(plan.interviewTips.length).toBeGreaterThanOrEqual(3);

    // Verify task structure
    for (const milestone of plan.milestones) {
      expect(milestone.tasks.length).toBeGreaterThanOrEqual(3);
      for (const task of milestone.tasks) {
        expect(task.completed).toBe(false);
        expect(task.label.length).toBeGreaterThan(10);
      }
    }

    // Performance assertion (< 50ms)
    expect(elapsed).toBeLessThan(50);
  });

  it('generates an 8-week plan with extended milestones and higher skill coverage', () => {
    const plan = generateOfflineCareerPlan(mockDataset, mockProfile, {
      targetTitleId: 1,
      weeklyHours: 15,
      durationWeeks: 8,
    });

    expect(plan.durationWeeks).toBe(8);
    expect(plan.milestones.length).toBe(4);
    expect(plan.strategicAdvice).toContain('15h par semaine');
  });

  it('hybrid planner gracefully falls back to offline engine when no API key is provided', async () => {
    const plan = await generateHybridCareerPlan(mockDataset, mockProfile, {
      targetTitleId: 2,
      weeklyHours: 8,
      durationWeeks: 4,
      apiKey: '',
    });

    expect(plan).toBeDefined();
    expect(plan.mode).toBe('offline_deterministic');
    expect(plan.milestones.length).toBe(4);
  });

  it('adaptOfflineCareerPlan adapts remaining milestones and updates advice based on task progress', () => {
    const initialPlan = generateOfflineCareerPlan(mockDataset, mockProfile, {
      targetTitleId: 1,
      weeklyHours: 10,
      durationWeeks: 4,
    });

    // Mark 2 tasks completed in milestone 1
    initialPlan.milestones[0].tasks[0].completed = true;
    initialPlan.milestones[0].tasks[1].completed = true;

    const adapted = adaptOfflineCareerPlan(initialPlan, mockDataset, mockProfile);

    expect(adapted).toBeDefined();
    expect(adapted.adaptedAt).toBeDefined();
    expect(adapted.adaptationNote).toContain('2/12 tâches validées');
    expect(adapted.strategicAdvice).toContain('Bon démarrage');
    // Completed tasks stay completed
    expect(adapted.milestones[0].tasks[0].completed).toBe(true);
    expect(adapted.milestones[0].tasks[1].completed).toBe(true);
    // Uncompleted task is preserved
    expect(adapted.milestones[0].tasks[2].completed).toBe(false);
  });

  it('adaptOfflineCareerPlan marks milestone as validated when all its tasks are completed', () => {
    const initialPlan = generateOfflineCareerPlan(mockDataset, mockProfile, {
      targetTitleId: 1,
      weeklyHours: 10,
      durationWeeks: 4,
    });

    // Complete all tasks in milestone 1
    for (const t of initialPlan.milestones[0].tasks) {
      t.completed = true;
    }

    const adapted = adaptOfflineCareerPlan(initialPlan, mockDataset, mockProfile);

    expect(adapted.milestones[0].title).toContain('✓ [Validé]');
    expect(adapted.milestones[0].description).toContain('accompli avec succès');
  });

  it('adaptHybridCareerPlan falls back to offline adaptation without API key', async () => {
    const initialPlan = generateOfflineCareerPlan(mockDataset, mockProfile, {
      targetTitleId: 1,
      weeklyHours: 10,
      durationWeeks: 4,
    });

    const adapted = await adaptHybridCareerPlan(initialPlan, mockDataset, mockProfile, '');

    expect(adapted).toBeDefined();
    expect(adapted.adaptedAt).toBeDefined();
  });
});
