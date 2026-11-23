import type {
  City,
  ContractType,
  JobTitle,
  MarketCoverageResult,
  MatchedJobRole,
  OfferLite,
  OfferWorkMode,
  Skill,
  SkillROIResult,
  UserProfile,
} from '../types/career';

export const MIN_ELIGIBLE_SKILLS = 3;
export const MATCH_THRESHOLD_PCT = 50;

/**
 * Filter offers-lite.json for eligible offers (skill_ids.length >= 3).
 */
export function filterEligibleOffers(offers: OfferLite[]): OfferLite[] {
  return offers.filter((offer) => offer.skill_ids.length >= MIN_ELIGIBLE_SKILLS);
}

/**
 * TS-11: JobMatch(offer, userSkills) = (matchingSkillsCount / offer.skill_ids.length) * 100
 */
export function calculateJobMatch(offer: OfferLite, userSkillSet: ReadonlySet<number>): number {
  const total = offer.skill_ids.length;
  if (total === 0 || userSkillSet.size === 0) return 0;

  let matches = 0;
  for (let i = 0; i < total; i++) {
    if (userSkillSet.has(offer.skill_ids[i])) {
      matches++;
    }
  }
  return (matches / total) * 100;
}

/**
 * TS-11: MarketCoverage = percentage of national eligible offers where JobMatch >= 50%
 * (rounded to integer, e.g., 24%).
 */
export function calculateMarketCoverage(
  offers: OfferLite[],
  userSkills: number[] | ReadonlySet<number>
): MarketCoverageResult {
  const userSkillSet = userSkills instanceof Set ? userSkills : new Set(userSkills);
  let eligibleOffersCount = 0;
  let matchingOffersCount = 0;

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const len = offer.skill_ids.length;
    if (len < MIN_ELIGIBLE_SKILLS) continue;
    eligibleOffersCount++;

    if (userSkillSet.size === 0) continue;

    // Exact integer check for (matches / len) * 100 >= 50  <==>  matches * 2 >= len
    let matches = 0;
    for (let j = 0; j < len; j++) {
      if (userSkillSet.has(offer.skill_ids[j])) {
        matches++;
      }
    }
    if (matches * 2 >= len) {
      matchingOffersCount++;
    }
  }

  if (eligibleOffersCount === 0) {
    return {
      score: 0,
      exactPct: 0,
      matchingOffersCount: 0,
      eligibleOffersCount: 0,
    };
  }

  const exactPct = (matchingOffersCount / eligibleOffersCount) * 100;
  return {
    score: Math.round(exactPct),
    exactPct,
    matchingOffersCount,
    eligibleOffersCount,
  };
}

/**
 * TS-11: calculateSkillROI — Single-pass O(offers * avg_skills) exact ROI calculation.
 * For every missing skill, computes the exact number of newly unlocked offers (crossing >= 50%)
 * and exact percentage point gain (+X.X pts) if added to userSkills.
 * Runs in ~2-6ms on 4,774 offers.
 */
export function calculateSkillROI(
  offers: OfferLite[],
  skills: Skill[],
  userSkills: number[] | ReadonlySet<number>,
  limit = 10
): SkillROIResult[] {
  const userSkillSet = userSkills instanceof Set ? userSkills : new Set(userSkills);

  let eligibleOffersCount = 0;
  let currentMatchingCount = 0;
  const unlockCounts = new Map<number, number>();

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const len = offer.skill_ids.length;
    if (len < MIN_ELIGIBLE_SKILLS) continue;
    eligibleOffersCount++;

    let matches = 0;
    for (let j = 0; j < len; j++) {
      if (userSkillSet.has(offer.skill_ids[j])) {
        matches++;
      }
    }

    if (matches * 2 >= len) {
      currentMatchingCount++;
      continue;
    }

    // Check if adding ONE missing skill from this offer makes it cross >= 50%
    // i.e. (matches + 1) * 2 >= len
    if ((matches + 1) * 2 >= len) {
      for (let j = 0; j < len; j++) {
        const skillId = offer.skill_ids[j];
        if (!userSkillSet.has(skillId)) {
          unlockCounts.set(skillId, (unlockCounts.get(skillId) ?? 0) + 1);
        }
      }
    }
  }

  if (eligibleOffersCount === 0) return [];

  const currentExactPct = (currentMatchingCount / eligibleOffersCount) * 100;
  const results: SkillROIResult[] = [];

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    if (userSkillSet.has(skill.id)) continue;

    const additionalOffers = unlockCounts.get(skill.id) ?? 0;
    const gainPoints = Number(((additionalOffers / eligibleOffersCount) * 100).toFixed(1));
    const projectedScore = Math.round(currentExactPct + (additionalOffers / eligibleOffersCount) * 100);

    results.push({
      skillId: skill.id,
      skillName: skill.name,
      domaine: skill.domaine,
      additionalOffers,
      gainPoints,
      projectedScore,
    });
  }

  results.sort(
    (a, b) =>
      b.additionalOffers - a.additionalOffers ||
      b.gainPoints - a.gainPoints ||
      a.skillName.localeCompare(b.skillName)
  );

  return limit > 0 ? results.slice(0, limit) : results;
}

export interface TopMatchingJobsOutput {
  roles: MatchedJobRole[];
  localMatchCount: number;
  usedNationalScope: boolean;
}

/**
 * TS-11: getTopMatchingJobs — Filter offers by userProfile (city, contract, level, workMode)
 * and return Top 5 matching titles & offers with owned vs missing required skills.
 */
export function getTopMatchingJobs(
  offers: OfferLite[],
  titles: JobTitle[],
  cities: City[],
  profile: UserProfile,
  options: { includeNational?: boolean; limit?: number } = {}
): TopMatchingJobsOutput {
  const { includeNational = false, limit = 5 } = options;
  const userSkillSet = new Set(profile.skillIds);
  const allowedContracts = new Set<ContractType>(
    profile.contractType.length > 0 ? profile.contractType : ['Stage', 'Alternance', 'CDI', 'CDD / Freelance']
  );

  const cityById = new Map<number, string>();
  for (const c of cities) {
    cityById.set(c.id, c.name);
  }

  const titleById = new Map<number, JobTitle>();
  for (const t of titles) {
    titleById.set(t.id, t);
  }

  const matchesProfileFilters = (offer: OfferLite, applyCityFilter: boolean): boolean => {
    if (offer.skill_ids.length < MIN_ELIGIBLE_SKILLS) return false;
    if (applyCityFilter && offer.city_id !== profile.cityId) return false;
    if (!allowedContracts.has(offer.contract)) return false;

    // Experience level compatibility: junior can also see junior offers; stage_pfe filters stage_pfe
    if (profile.experienceLevel === 'stage_pfe' && offer.level !== 'stage_pfe') return false;
    if (profile.experienceLevel === 'junior' && offer.level !== 'junior') return false;

    if (profile.workMode === 'onsite' && offer.work_mode !== 'onsite') return false;
    if (profile.workMode === 'hybrid_remote' && offer.work_mode === 'onsite') return false;

    return true;
  };

  const aggregateOffersByTitle = (filteredOffers: OfferLite[]): MatchedJobRole[] => {
    const groups = new Map<
      number,
      {
        sumMatch: number;
        count: number;
        qualifyingCount: number;
        contracts: Set<ContractType>;
        workModes: Set<OfferWorkMode>;
        cities: Set<string>;
        skillFreq: Map<number, number>;
      }
    >();

    for (let i = 0; i < filteredOffers.length; i++) {
      const offer = filteredOffers[i];
      const match = calculateJobMatch(offer, userSkillSet);

      let group = groups.get(offer.title_id);
      if (!group) {
        group = {
          sumMatch: 0,
          count: 0,
          qualifyingCount: 0,
          contracts: new Set(),
          workModes: new Set(),
          cities: new Set(),
          skillFreq: new Map(),
        };
        groups.set(offer.title_id, group);
      }

      group.sumMatch += match;
      group.count++;
      if (match >= MATCH_THRESHOLD_PCT) group.qualifyingCount++;
      group.contracts.add(offer.contract);
      group.workModes.add(offer.work_mode);
      const cityName = cityById.get(offer.city_id);
      if (cityName) group.cities.add(cityName);

      for (let j = 0; j < offer.skill_ids.length; j++) {
        const sId = offer.skill_ids[j];
        group.skillFreq.set(sId, (group.skillFreq.get(sId) ?? 0) + 1);
      }
    }

    const roles: MatchedJobRole[] = [];
    for (const [titleId, group] of groups.entries()) {
      const titleMeta = titleById.get(titleId);
      if (!titleMeta) continue;

      const avgMatch = Math.round(group.sumMatch / group.count);
      const topReqSkills = Array.from(group.skillFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([skillId]) => skillId);

      const ownedSkillIds = topReqSkills.filter((id) => userSkillSet.has(id));
      const missingSkillIds = topReqSkills.filter((id) => !userSkillSet.has(id));

      roles.push({
        titleId,
        title: titleMeta.title,
        domaine: titleMeta.domaine,
        matchPct: avgMatch,
        matchingOfferCount: group.qualifyingCount,
        totalRoleOffers: group.count,
        contracts: Array.from(group.contracts),
        workModes: Array.from(group.workModes),
        cityNames: Array.from(group.cities).slice(0, 3),
        requiredSkillIds: topReqSkills,
        ownedSkillIds,
        missingSkillIds,
      });
    }

    roles.sort(
      (a, b) =>
        b.matchPct - a.matchPct ||
        b.matchingOfferCount - a.matchingOfferCount ||
        b.totalRoleOffers - a.totalRoleOffers
    );

    return roles.slice(0, limit);
  };

  // Compute local count first so UI knows if local city has < 5 matches
  let localFiltered = offers.filter((o) => matchesProfileFilters(o, true));
  // If strict filters return very few offers locally, relax experience/workMode gracefully only if 0
  if (localFiltered.length === 0) {
    localFiltered = offers.filter(
      (o) => o.skill_ids.length >= MIN_ELIGIBLE_SKILLS && o.city_id === profile.cityId
    );
  }
  const localRoles = aggregateOffersByTitle(localFiltered);

  if (!includeNational) {
    return {
      roles: localRoles,
      localMatchCount: localRoles.length,
      usedNationalScope: false,
    };
  }

  let nationalFiltered = offers.filter((o) => matchesProfileFilters(o, false));
  if (nationalFiltered.length === 0) {
    nationalFiltered = filterEligibleOffers(offers);
  }
  const nationalRoles = aggregateOffersByTitle(nationalFiltered);

  return {
    roles: nationalRoles,
    localMatchCount: localRoles.length,
    usedNationalScope: true,
  };
}
