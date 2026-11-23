import type { SkillLearningResource } from '../types/career';

/**
 * Curated knowledge base for the most demanded tech skills in Morocco IT market.
 * Maps skills to beginner-friendly tutorials (W3Schools, GeeksforGeeks, Official Docs)
 * and tailored YouTube queries.
 */
interface CuratedSkillEntry {
  w3schoolsUrl?: string;
  geeksForGeeksUrl?: string;
  officialDocsUrl?: string;
  youtubeQuery: string;
}

const CURATED_RESOURCES: Record<string, CuratedSkillEntry> = {
  // Frontend
  react: {
    w3schoolsUrl: 'https://www.w3schools.com/react/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/react/',
    officialDocsUrl: 'https://react.dev/learn',
    youtubeQuery: 'React JS crash course project 2026',
  },
  typescript: {
    w3schoolsUrl: 'https://www.w3schools.com/typescript/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/typescript/',
    officialDocsUrl: 'https://www.typescriptlang.org/docs/',
    youtubeQuery: 'TypeScript tutorial full course for beginners',
  },
  javascript: {
    w3schoolsUrl: 'https://www.w3schools.com/js/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/javascript/',
    officialDocsUrl: 'https://developer.mozilla.org/fr/docs/Web/JavaScript',
    youtubeQuery: 'JavaScript moderne ES6 projets pour débutant',
  },
  angular: {
    w3schoolsUrl: 'https://www.w3schools.com/angular/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/angular-tutorial/',
    officialDocsUrl: 'https://angular.dev',
    youtubeQuery: 'Angular crash course standalone components',
  },
  'vue.js': {
    w3schoolsUrl: 'https://www.w3schools.com/vue/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/vue-js/',
    officialDocsUrl: 'https://vuejs.org/guide/introduction.html',
    youtubeQuery: 'Vue js 3 composition api tutorial',
  },
  'next.js': {
    w3schoolsUrl: 'https://www.w3schools.com/react/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/next-js/',
    officialDocsUrl: 'https://nextjs.org/docs',
    youtubeQuery: 'Next js full course app router project',
  },
  'tailwind css': {
    w3schoolsUrl: 'https://www.w3schools.com/css/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/tailwind-css/',
    officialDocsUrl: 'https://tailwindcss.com/docs',
    youtubeQuery: 'Tailwind CSS tutorial responsive project',
  },
  html5: {
    w3schoolsUrl: 'https://www.w3schools.com/html/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/html-tutorial/',
    officialDocsUrl: 'https://developer.mozilla.org/fr/docs/Web/HTML',
    youtubeQuery: 'HTML5 CSS3 pour débutant complet',
  },
  css3: {
    w3schoolsUrl: 'https://www.w3schools.com/css/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/css/',
    officialDocsUrl: 'https://developer.mozilla.org/fr/docs/Web/CSS',
    youtubeQuery: 'CSS3 Flexbox Grid masterclass',
  },
  redux: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/redux-tutorial/',
    officialDocsUrl: 'https://redux-toolkit.js.org/introduction/getting-started',
    youtubeQuery: 'Redux Toolkit tutorial React state management',
  },

  // Backend
  'node.js': {
    w3schoolsUrl: 'https://www.w3schools.com/nodejs/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/node-js/',
    officialDocsUrl: 'https://nodejs.org/en/learn',
    youtubeQuery: 'Node js Express API REST complete tutorial',
  },
  express: {
    w3schoolsUrl: 'https://www.w3schools.com/nodejs/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/express-js/',
    officialDocsUrl: 'https://expressjs.com/fr/starter/installing.html',
    youtubeQuery: 'Express js crash course backend',
  },
  java: {
    w3schoolsUrl: 'https://www.w3schools.com/java/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/java/',
    officialDocsUrl: 'https://dev.java/learn/',
    youtubeQuery: 'Java tutorial programmation orientee objet débutant',
  },
  'spring boot': {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/spring-boot/',
    officialDocsUrl: 'https://spring.io/guides',
    youtubeQuery: 'Spring Boot 3 REST API microservices tutorial',
  },
  python: {
    w3schoolsUrl: 'https://www.w3schools.com/python/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/python-programming-language/',
    officialDocsUrl: 'https://docs.python.org/3/tutorial/',
    youtubeQuery: 'Python tutorial for beginners crash course in 1 hour',
  },
  django: {
    w3schoolsUrl: 'https://www.w3schools.com/django/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/django-tutorial/',
    officialDocsUrl: 'https://docs.djangoproject.com/fr/',
    youtubeQuery: 'Django full course python web development project',
  },
  fastapi: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/fastapi-tutorial/',
    officialDocsUrl: 'https://fastapi.tiangolo.com/tutorial/',
    youtubeQuery: 'FastAPI python tutorial REST API',
  },
  php: {
    w3schoolsUrl: 'https://www.w3schools.com/php/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/php-tutorials/',
    officialDocsUrl: 'https://www.php.net/manual/fr/',
    youtubeQuery: 'PHP 8 moderne tutoriel complet',
  },
  laravel: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/laravel/',
    officialDocsUrl: 'https://laravel.com/docs',
    youtubeQuery: 'Laravel 11 tutorial for beginners project',
  },
  'c#': {
    w3schoolsUrl: 'https://www.w3schools.com/cs/index.php',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/c-sharp-tutorial/',
    officialDocsUrl: 'https://learn.microsoft.com/fr-fr/dotnet/csharp/',
    youtubeQuery: 'C# full course for beginners object oriented',
  },
  '.net': {
    w3schoolsUrl: 'https://www.w3schools.com/cs/index.php',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/net-framework-architecture/',
    officialDocsUrl: 'https://learn.microsoft.com/fr-fr/dotnet/',
    youtubeQuery: 'ASP NET Core Web API tutorial C#',
  },
  'rest api': {
    w3schoolsUrl: 'https://www.w3schools.com/js/js_api_intro.asp',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/rest-api-tutorial/',
    officialDocsUrl: 'https://restfulapi.net/',
    youtubeQuery: 'REST API architecture best practices HTTP',
  },
  nestjs: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/nestjs-tutorial/',
    officialDocsUrl: 'https://docs.nestjs.com/',
    youtubeQuery: 'NestJS crash course backend architecture',
  },

  // Databases
  sql: {
    w3schoolsUrl: 'https://www.w3schools.com/sql/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/sql-tutorial/',
    officialDocsUrl: 'https://www.postgresql.org/docs/',
    youtubeQuery: 'SQL tutorial for beginners queries joins aggregations',
  },
  postgresql: {
    w3schoolsUrl: 'https://www.w3schools.com/postgresql/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/postgresql-tutorial/',
    officialDocsUrl: 'https://www.postgresql.org/docs/',
    youtubeQuery: 'PostgreSQL database tutorial for beginners',
  },
  mysql: {
    w3schoolsUrl: 'https://www.w3schools.com/mysql/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/mysql-tutorial/',
    officialDocsUrl: 'https://dev.mysql.com/doc/',
    youtubeQuery: 'MySQL database tutorial queries and administration',
  },
  mongodb: {
    w3schoolsUrl: 'https://www.w3schools.com/mongodb/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/mongodb-tutorial/',
    officialDocsUrl: 'https://www.mongodb.com/docs/',
    youtubeQuery: 'MongoDB tutorial complete guide NoSQL database',
  },
  redis: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/redis-tutorial/',
    officialDocsUrl: 'https://redis.io/docs/',
    youtubeQuery: 'Redis crash course cache and key value store',
  },

  // DevOps & Cloud
  git: {
    w3schoolsUrl: 'https://www.w3schools.com/git/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/git-tutorial/',
    officialDocsUrl: 'https://git-scm.com/doc',
    youtubeQuery: 'Git and GitHub for beginners crash course in 1 hour',
  },
  docker: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/docker-tutorial/',
    officialDocsUrl: 'https://docs.docker.com/get-started/',
    youtubeQuery: 'Docker tutorial for beginners step by step container',
  },
  kubernetes: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/kubernetes/',
    officialDocsUrl: 'https://kubernetes.io/docs/home/',
    youtubeQuery: 'Kubernetes tutorial for beginners K8s cluster',
  },
  linux: {
    w3schoolsUrl: 'https://www.w3schools.com/linux/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/linux-tutorial/',
    officialDocsUrl: 'https://ubuntu.com/tutorials',
    youtubeQuery: 'Linux command line tutorial for beginners bash',
  },
  'ci/cd': {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/what-is-cicd/',
    officialDocsUrl: 'https://docs.github.com/fr/actions',
    youtubeQuery: 'CI CD pipeline GitHub Actions tutorial automated tests',
  },
  aws: {
    w3schoolsUrl: 'https://www.w3schools.com/aws/',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/aws-tutorial/',
    officialDocsUrl: 'https://aws.amazon.com/getting-started/',
    youtubeQuery: 'AWS Cloud Practitioner crash course for beginners',
  },
  azure: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/microsoft-azure/',
    officialDocsUrl: 'https://learn.microsoft.com/fr-fr/azure/',
    youtubeQuery: 'Microsoft Azure tutorial for beginners cloud',
  },

  // Data & AI
  pandas: {
    w3schoolsUrl: 'https://www.w3schools.com/python/pandas/default.asp',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/pandas-tutorial/',
    officialDocsUrl: 'https://pandas.pydata.org/docs/',
    youtubeQuery: 'Python Pandas tutorial data analysis in 1 hour',
  },
  'power bi': {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/power-bi-tutorial/',
    officialDocsUrl: 'https://learn.microsoft.com/fr-fr/power-bi/',
    youtubeQuery: 'Power BI dashboard tutorial for beginners step by step',
  },
  'machine learning': {
    w3schoolsUrl: 'https://www.w3schools.com/python/python_ml_getting_started.asp',
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/machine-learning/',
    officialDocsUrl: 'https://scikit-learn.org/stable/',
    youtubeQuery: 'Machine Learning full course beginner to advanced python',
  },

  // Mobile
  flutter: {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/flutter-tutorial/',
    officialDocsUrl: 'https://docs.flutter.dev/',
    youtubeQuery: 'Flutter tutorial for beginners mobile app dart',
  },
  'react native': {
    geeksForGeeksUrl: 'https://www.geeksforgeeks.org/react-native/',
    officialDocsUrl: 'https://reactnative.dev/docs/getting-started',
    youtubeQuery: 'React Native full course cross platform mobile app',
  },
};

/**
 * Universal dynamic resolver for all 121 IT skills in Morocco.
 * Returns curated high-value links if available, or deterministically generates
 * optimized search queries and documentation links with 100% coverage.
 */
export function getSkillLearningResources(
  skillName: string,
  skillId?: number,
  domaine?: string
): SkillLearningResource {
  const normalized = skillName.trim().toLowerCase();
  const curated = CURATED_RESOURCES[normalized];

  const youtubeQuery = curated?.youtubeQuery ?? `${skillName} tutorial crash course project`;
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

  const w3schoolsUrl =
    curated?.w3schoolsUrl ??
    `https://www.w3schools.com/howto/howto_search.asp?q=${encodeURIComponent(skillName)}`;

  const geeksForGeeksUrl =
    curated?.geeksForGeeksUrl ??
    `https://www.geeksforgeeks.org/?q=${encodeURIComponent(skillName)}`;

  return {
    skillId,
    skillName,
    domaine,
    w3schoolsUrl,
    geeksForGeeksUrl,
    officialDocsUrl: curated?.officialDocsUrl,
    youtubeQuery,
    youtubeUrl,
  };
}
