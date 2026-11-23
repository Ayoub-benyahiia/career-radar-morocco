import { describe, expect, it } from 'vitest';
import {
  CURATED_PORTFOLIO_PROJECTS,
  getRecommendedProjectsForSkills,
  instantiateProjectItem,
  STANDARD_PROJECT_STEPS,
} from './portfolioProjects';

describe('Portfolio & Project Builder Module', () => {
  it('defines the 5 core project readiness steps', () => {
    expect(STANDARD_PROJECT_STEPS.length).toBe(5);
    const stepIds = STANDARD_PROJECT_STEPS.map((s) => s.id);
    expect(stepIds).toEqual(['requirements', 'repo', 'code', 'readme', 'deploy']);
    for (const step of STANDARD_PROJECT_STEPS) {
      expect(step.completed).toBe(false);
      expect(step.label.length).toBeGreaterThan(5);
    }
  });

  it('contains curated projects covering all Moroccan tech specializations', () => {
    expect(CURATED_PORTFOLIO_PROJECTS.length).toBeGreaterThanOrEqual(8);
    const categories = new Set(CURATED_PORTFOLIO_PROJECTS.map((p) => p.category));
    expect(categories.has('Frontend & Full Stack')).toBe(true);
    expect(categories.has('Backend')).toBe(true);
    expect(categories.has('Backend & Enterprise')).toBe(true);
    expect(categories.has('Data & Analytics')).toBe(true);
    expect(categories.has('Mobile')).toBe(true);
    expect(categories.has('DevOps & Cloud')).toBe(true);
  });

  it('recommends frontend/full-stack projects for React and TypeScript missing skills', () => {
    const recommended = getRecommendedProjectsForSkills(['React', 'TypeScript', 'Tailwind CSS'], 'Développeur Frontend');
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended[0].techStack).toContain('React');
    expect(recommended[0].category).toMatch(/Frontend|Full Stack/);
  });

  it('recommends Spring Boot project for Java and enterprise target role', () => {
    const recommended = getRecommendedProjectsForSkills(['Java', 'Spring Boot', 'SQL'], 'Développeur Java Spring');
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended[0].techStack).toContain('Spring Boot');
    expect(recommended[0].moroccanMarketContext).toContain('bancaire');
  });

  it('recommends Data ETL dashboard for Python and Pandas skills', () => {
    const recommended = getRecommendedProjectsForSkills(['Python', 'Pandas', 'Power BI'], 'Data Analyst');
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended[0].techStack).toContain('Pandas');
    expect(recommended[0].category).toBe('Data & Analytics');
  });

  it('instantiates an interactive project with isolated steps clone', () => {
    const template = CURATED_PORTFOLIO_PROJECTS[0];
    const item1 = instantiateProjectItem(template);
    const item2 = instantiateProjectItem(template);

    expect(item1.steps.length).toBe(5);
    item1.steps[0].completed = true;
    expect(item2.steps[0].completed).toBe(false);
  });
});
