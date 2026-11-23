import { describe, expect, it } from 'vitest';
import { getSkillLearningResources } from './learningResources';
import skillsData from '../../public/data/skills.json';

describe('Learning Resources & YouTube Keywords Resolver', () => {
  it('returns curated resources for React with exact links and query', () => {
    const res = getSkillLearningResources('React');
    expect(res.skillName).toBe('React');
    expect(res.w3schoolsUrl).toBe('https://www.w3schools.com/react/');
    expect(res.geeksForGeeksUrl).toBe('https://www.geeksforgeeks.org/react/');
    expect(res.officialDocsUrl).toBe('https://react.dev/learn');
    expect(res.youtubeQuery).toContain('React JS');
    expect(res.youtubeUrl).toContain('youtube.com/results?search_query=');
  });

  it('returns curated resources for Python, SQL, Docker, TypeScript and Git', () => {
    const techList = ['Python', 'SQL', 'Docker', 'TypeScript', 'Git', 'Node.js', 'Spring Boot'];
    for (const tech of techList) {
      const res = getSkillLearningResources(tech);
      expect(res.skillName).toBe(tech);
      expect(res.youtubeUrl).toContain('youtube.com/results?search_query=');
      expect(res.geeksForGeeksUrl).toBeDefined();
      expect(res.w3schoolsUrl).toBeDefined();
    }
  });

  it('dynamically generates valid fallback queries for uncurated skills', () => {
    const uncurated = 'LangChain AI';
    const res = getSkillLearningResources(uncurated);
    expect(res.skillName).toBe(uncurated);
    expect(res.youtubeQuery).toBe('LangChain AI tutorial crash course project');
    expect(res.youtubeUrl).toBe(
      'https://www.youtube.com/results?search_query=LangChain%20AI%20tutorial%20crash%20course%20project'
    );
    expect(res.geeksForGeeksUrl).toBe('https://www.geeksforgeeks.org/?q=LangChain%20AI');
    expect(res.w3schoolsUrl).toBe(
      'https://www.w3schools.com/howto/howto_search.asp?q=LangChain%20AI'
    );
  });

  it('guarantees 100% coverage and valid URLs across all 121 skills in skills.json', () => {
    expect(skillsData.length).toBe(121);
    for (const s of skillsData) {
      const res = getSkillLearningResources(s.name, s.id, s.domaine);
      expect(res.skillName).toBe(s.name);
      expect(res.youtubeUrl).toMatch(/^https:\/\/www\.youtube\.com\/results\?search_query=/);
      expect(res.geeksForGeeksUrl).toMatch(/^https:\/\/(www\.)?geeksforgeeks\.org/);
      expect(res.w3schoolsUrl).toMatch(/^https:\/\/(www\.)?w3schools\.com/);
    }
  });
});
