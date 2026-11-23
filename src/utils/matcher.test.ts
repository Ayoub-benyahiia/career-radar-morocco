import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { City, JobTitle, OfferLite, Skill, UserProfile } from '../types/career';
import {
  calculateJobMatch,
  calculateMarketCoverage,
  calculateSkillROI,
  filterEligibleOffers,
  getTopMatchingJobs,
} from './matcher';

const dataDir = path.resolve(process.cwd(), 'public/data');
const skills: Skill[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'));
const cities: City[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'cities.json'), 'utf8'));
const offers: OfferLite[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'offers-lite.json'), 'utf8'));
const titles: JobTitle[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'titles.json'), 'utf8'));

const skillIdByName = (name: string): number => {
  const found = skills.find((s) => s.name === name);
  if (!found) throw new Error(`Skill not found: ${name}`);
  return found.id;
};

describe('Career Radar Matching Engine (TS-11)', () => {
  it('filters eligible offers with skill_ids.length >= 3 and matches 4,774 offers', () => {
    const eligible = filterEligibleOffers(offers);
    expect(eligible.length).toBe(4774);

    // Verify offers with < 3 skills are excluded
    const synthetic: OfferLite[] = [
      { id: 1, title_id: 1, city_id: 1, contract: 'Stage', level: 'stage_pfe', work_mode: 'onsite', skill_ids: [1, 2] },
      { id: 2, title_id: 1, city_id: 1, contract: 'Stage', level: 'stage_pfe', work_mode: 'onsite', skill_ids: [1, 2, 3] },
    ];
    expect(filterEligibleOffers(synthetic).length).toBe(1);
  });

  it('Case 1 (Empty Profile): returns 0% MarketCoverage and 0 matching offers', () => {
    const result = calculateMarketCoverage(offers, []);
    expect(result.score).toBe(0);
    expect(result.exactPct).toBe(0);
    expect(result.matchingOffersCount).toBe(0);
    expect(result.eligibleOffersCount).toBe(4774);
  });

  it('Case 2 (Partial Profile — MERN Stack): computes exact JobMatch and realistic MarketCoverage', () => {
    const mernIds = ['MongoDB', 'Express', 'React', 'Node.js', 'JavaScript', 'Git'].map(skillIdByName);
    const sampleOffer: OfferLite = {
      id: 9999,
      title_id: 1,
      city_id: 3,
      contract: 'Stage',
      level: 'stage_pfe',
      work_mode: 'hybrid',
      skill_ids: ['React', 'Node.js', 'TypeScript', 'Docker'].map(skillIdByName),
    };

    // 2 of 4 skills match => 50%
    expect(calculateJobMatch(sampleOffer, new Set(mernIds))).toBe(50);

    const coverage = calculateMarketCoverage(offers, mernIds);
    expect(coverage.score).toBeGreaterThan(10);
    expect(coverage.score).toBeLessThan(70);
    expect(coverage.matchingOffersCount).toBeGreaterThan(500);
    expect(coverage.eligibleOffersCount).toBe(4774);
  });

  it('Case 3 (Full Profile — All 121 Skills): returns 100% MarketCoverage across all 4,774 offers', () => {
    const allSkillIds = skills.map((s) => s.id);
    const coverage = calculateMarketCoverage(offers, allSkillIds);
    expect(coverage.score).toBe(100);
    expect(coverage.matchingOffersCount).toBe(4774);
    expect(coverage.eligibleOffersCount).toBe(4774);
  });

  it('calculates exact Skill ROI matching brute-force single-skill recomputation', () => {
    const baseSkills = ['React', 'JavaScript', 'Git'].map(skillIdByName);
    const baseCoverage = calculateMarketCoverage(offers, baseSkills);
    const roiTop5 = calculateSkillROI(offers, skills, baseSkills, 5);

    expect(roiTop5.length).toBe(5);
    expect(roiTop5[0].additionalOffers).toBeGreaterThan(0);

    // Cross-verify top ROI skill against full MarketCoverage recomputation
    const topSkill = roiTop5[0];
    const withTopSkill = calculateMarketCoverage(offers, [...baseSkills, topSkill.skillId]);
    expect(withTopSkill.matchingOffersCount - baseCoverage.matchingOffersCount).toBe(
      topSkill.additionalOffers
    );
    expect(withTopSkill.score).toBe(topSkill.projectedScore);
  });

  it('filters top 5 matching roles by user profile and supports national fallback', () => {
    const profile: UserProfile = {
      cityId: 3, // Agadir
      experienceLevel: 'stage_pfe',
      workMode: 'all',
      contractType: ['Stage'],
      skillIds: ['Java', 'Spring Boot', 'SQL', 'Git', 'Docker', 'REST API'].map(skillIdByName),
      onboardingCompleted: true,
    };

    const localRes = getTopMatchingJobs(offers, titles, cities, profile, { includeNational: false });
    expect(localRes.roles.length).toBeGreaterThan(0);
    expect(localRes.roles.length).toBeLessThanOrEqual(5);

    const nationalRes = getTopMatchingJobs(offers, titles, cities, profile, { includeNational: true });
    expect(nationalRes.roles.length).toBe(5);
    expect(nationalRes.usedNationalScope).toBe(true);
    // Java / Spring Boot should rank near the very top
    expect(nationalRes.roles.some((r) => r.title.includes('Java'))).toBe(true);
  });

  it('executes full matching + ROI + Top 5 roles pipeline in < 100ms on 4,774 offers', () => {
    const profile: UserProfile = {
      cityId: 3,
      experienceLevel: 'stage_pfe',
      workMode: 'all',
      contractType: ['Stage', 'CDI'],
      skillIds: ['React', 'JavaScript', 'Node.js', 'Git', 'SQL'].map(skillIdByName),
      onboardingCompleted: true,
    };

    const start = performance.now();
    calculateMarketCoverage(offers, profile.skillIds);
    calculateSkillROI(offers, skills, profile.skillIds, 10);
    getTopMatchingJobs(offers, titles, cities, profile, { includeNational: true });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
  });
});
