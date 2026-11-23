import { describe, expect, it } from 'vitest';
import {
  generateInterviewPrep,
  generateOfflineInterviewPrep,
} from './interviewPrep';

describe('Interview Prep Intelligence Engine', () => {
  it('generates tailored technical questions for a Frontend React role', () => {
    const guide = generateOfflineInterviewPrep(
      'Développeur Frontend React / TypeScript',
      'Capgemini Engineering Casablanca',
      ['React', 'TypeScript', 'CSS']
    );

    expect(guide).toBeDefined();
    expect(guide.roleTitle).toBe('Développeur Frontend React / TypeScript');
    expect(guide.company).toBe('Capgemini Engineering Casablanca');
    expect(guide.mode).toBe('offline_deterministic');
    expect(guide.detectedSkills).toContain('React');
    expect(guide.questions.length).toBeGreaterThanOrEqual(6);

    const techQuestions = guide.questions.filter((q) => q.category === 'technique');
    expect(techQuestions.length).toBeGreaterThanOrEqual(2);
    expect(techQuestions[0].keyPointsToCover.length).toBeGreaterThanOrEqual(2);

    const hrQuestions = guide.questions.filter((q) => q.category === 'culture_rh');
    expect(hrQuestions.length).toBeGreaterThanOrEqual(2);
    expect(hrQuestions.some((q) => q.question.includes('PFE') || q.question.includes('projet'))).toBe(true);

    const recruiterQuestions = guide.questions.filter((q) => q.category === 'question_au_recruteur');
    expect(recruiterQuestions.length).toBeGreaterThanOrEqual(2);

    expect(guide.checklistDayJ.length).toBeGreaterThanOrEqual(4);
  });

  it('generates tailored technical questions for a Java Spring Boot role', () => {
    const guide = generateOfflineInterviewPrep(
      'Stage PFE Ingénieur Java Spring Boot',
      'SQLI Rabat',
      ['Java', 'Spring Boot', 'SQL']
    );

    expect(guide).toBeDefined();
    expect(guide.detectedSkills).toContain('Java');
    const techQuestions = guide.questions.filter((q) => q.category === 'technique');
    expect(techQuestions.some((q) => q.question.includes('Spring') || q.question.includes('IoC'))).toBe(true);
  });

  it('generates tailored questions for a Python Data Analyst role', () => {
    const guide = generateOfflineInterviewPrep(
      'Junior Data Analyst Python',
      'OCP Casablanca',
      ['Python', 'SQL', 'Pandas']
    );

    expect(guide).toBeDefined();
    expect(guide.detectedSkills).toContain('Python');
    const techQuestions = guide.questions.filter((q) => q.category === 'technique');
    expect(techQuestions.some((q) => q.question.includes('Python') || q.question.includes('Pandas'))).toBe(true);
  });

  it('hybrid generator runs offline when no API key is supplied', async () => {
    const guide = await generateInterviewPrep(
      'Full Stack Developer',
      'Devoteam Morocco',
      ['Node.js', 'React'],
      ''
    );

    expect(guide).toBeDefined();
    expect(guide.mode).toBe('offline_deterministic');
    expect(guide.questions.length).toBeGreaterThanOrEqual(5);
  });
});
