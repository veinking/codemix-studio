import { SupportedLanguage } from '@/runtimes/RuntimeRegistry';

export interface LanguageCapability {
  language: SupportedLanguage;
  displayName: string;
  icon: string;
  category: 'executable' | 'editor-only';
  executionModel: 'wasm' | 'browser-native' | 'editor-only';
  
  capabilities: {
    dataAnalysis: boolean;
    webDevelopment: boolean;
    machineLearning: boolean;
    scripting: boolean;
    systemsProgramming: boolean;
    mobileDevelopment: boolean;
    gamesDevelopment: boolean;
  };
  
  useCases: string[];
  
  bideSupport: {
    codeExecution: boolean;
    packageInstallation: boolean;
    fileIO: boolean;
    plotting: boolean;
    dataVisualization: boolean;
    debugging: boolean;
  };
  
  popularLibraries: string[];
  commonProjects: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  industryUse: string[];
  description: string;
}

export const languageCapabilities: LanguageCapability[] = [
  {
    language: 'python',
    displayName: 'Python',
    icon: '🐍',
    category: 'executable',
    executionModel: 'wasm',
    description: 'A beginner-friendly, readable language for data science, scripting, and web development.',
    capabilities: {
      dataAnalysis: true,
      webDevelopment: true,
      machineLearning: true,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: false,
      gamesDevelopment: true,
    },
    useCases: [
      'Data analysis and visualization',
      'Machine learning and AI',
      'Web scraping and automation',
      'Scientific computing',
      'Backend web development',
      'Task automation and scripting',
      'Image and video processing',
      'Natural language processing',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: true,
      fileIO: true,
      plotting: true,
      dataVisualization: true,
      debugging: true,
    },
    popularLibraries: [
      'pandas', 'numpy', 'matplotlib', 'seaborn', 
      'scikit-learn', 'requests', 'beautifulsoup4'
    ],
    commonProjects: [
      'Build a COVID-19 data dashboard',
      'Train a sentiment analysis model',
      'Create a web scraper for job listings',
      'Analyze social media trends',
      'Build a recommendation system',
    ],
    difficulty: 'beginner',
    industryUse: [
      'Data Science', 'Machine Learning', 'Finance', 
      'Healthcare', 'Academia', 'Web Development'
    ],
  },
  
  {
    language: 'r',
    displayName: 'R',
    icon: '📊',
    category: 'executable',
    executionModel: 'wasm',
    description: 'Statistical computing language for data analysis and visualization.',
    capabilities: {
      dataAnalysis: true,
      webDevelopment: false,
      machineLearning: true,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: false,
      gamesDevelopment: false,
    },
    useCases: [
      'Statistical analysis and modeling',
      'Data visualization and reporting',
      'Bioinformatics and genomics',
      'Clinical trial analysis',
      'Survey data analysis',
      'Time series forecasting',
      'A/B testing and experimentation',
      'Academic research and publications',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: true,
      fileIO: true,
      plotting: true,
      dataVisualization: true,
      debugging: true,
    },
    popularLibraries: [
      'ggplot2', 'dplyr', 'tidyr', 'shiny',
      'caret', 'randomForest', 'data.table'
    ],
    commonProjects: [
      'Perform regression analysis on housing data',
      'Create interactive Shiny dashboards',
      'Conduct hypothesis testing on experimental data',
      'Build predictive models with caret',
      'Visualize survey results with ggplot2',
    ],
    difficulty: 'intermediate',
    industryUse: [
      'Statistics', 'Biotech', 'Pharma', 
      'Academia', 'Finance', 'Market Research'
    ],
  },
  
  {
    language: 'javascript',
    displayName: 'JavaScript',
    icon: '⚡',
    category: 'executable',
    executionModel: 'browser-native',
    description: 'The language of the web - runs in browsers and Node.js.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: true,
      gamesDevelopment: true,
    },
    useCases: [
      'Frontend web development',
      'Backend development with Node.js',
      'Building interactive web apps',
      'Creating browser extensions',
      'Mobile app development (React Native)',
      'Game development (Phaser, Three.js)',
      'Server-side APIs and microservices',
      'Real-time applications',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: true,
    },
    popularLibraries: [
      'React', 'Vue', 'Express', 'Lodash',
      'Axios', 'Moment', 'D3.js'
    ],
    commonProjects: [
      'Build a todo list app',
      'Create a weather dashboard',
      'Develop a REST API',
      'Build a real-time chat app',
      'Create interactive data visualizations',
    ],
    difficulty: 'beginner',
    industryUse: [
      'Web Development', 'Mobile Apps', 'Startups', 
      'E-commerce', 'Gaming', 'Enterprise Software'
    ],
  },
  
  {
    language: 'sql',
    displayName: 'SQL',
    icon: '🗄️',
    category: 'executable',
    executionModel: 'wasm',
    description: 'Query and manage relational databases.',
    capabilities: {
      dataAnalysis: true,
      webDevelopment: false,
      machineLearning: false,
      scripting: false,
      systemsProgramming: false,
      mobileDevelopment: false,
      gamesDevelopment: false,
    },
    useCases: [
      'Query databases for reporting',
      'Data manipulation and transformation',
      'Business intelligence and analytics',
      'Database design and management',
      'Creating complex joins and aggregations',
      'Data warehousing',
      'ETL processes',
      'Performance optimization',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: [],
    commonProjects: [
      'Analyze sales data with complex queries',
      'Design a database schema for an e-commerce site',
      'Create reports with window functions',
      'Optimize slow queries with indexes',
      'Build a data warehouse model',
    ],
    difficulty: 'intermediate',
    industryUse: [
      'Data Analysis', 'Business Intelligence', 'Backend Development',
      'Finance', 'Healthcare', 'E-commerce'
    ],
  },
  
  {
    language: 'php',
    displayName: 'PHP',
    icon: '🐘',
    category: 'executable',
    executionModel: 'wasm',
    description: 'Server-side scripting language for web development.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: false,
      gamesDevelopment: false,
    },
    useCases: [
      'Building dynamic websites',
      'Content management systems (WordPress)',
      'E-commerce platforms',
      'Form processing and validation',
      'Session management',
      'API development',
      'Server-side logic',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['Laravel', 'Symfony', 'CodeIgniter', 'Composer'],
    commonProjects: [
      'Build a contact form handler',
      'Create a simple CMS',
      'Develop a REST API',
      'Build a user authentication system',
    ],
    difficulty: 'beginner',
    industryUse: ['Web Development', 'E-commerce', 'CMS', 'Startups'],
  },
  
  {
    language: 'ruby',
    displayName: 'Ruby',
    icon: '💎',
    category: 'executable',
    executionModel: 'wasm',
    description: 'An elegant, readable language designed for developer happiness.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: false,
      gamesDevelopment: false,
    },
    useCases: [
      'Web application development (Ruby on Rails)',
      'Scripting and automation',
      'Backend API development',
      'DevOps tooling',
      'Data processing',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['Rails', 'Sinatra', 'RSpec', 'Rake'],
    commonProjects: [
      'Build a Rails web app',
      'Create automation scripts',
      'Develop a JSON API',
    ],
    difficulty: 'intermediate',
    industryUse: ['Web Development', 'Startups', 'DevOps'],
  },
  
  {
    language: 'lua',
    displayName: 'Lua',
    icon: '🌙',
    category: 'executable',
    executionModel: 'wasm',
    description: 'Lightweight scripting language often embedded in applications.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: false,
      machineLearning: false,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: false,
      gamesDevelopment: true,
    },
    useCases: [
      'Game scripting (Roblox, WoW)',
      'Embedded systems',
      'Configuration files',
      'Rapid prototyping',
    ],
    bideSupport: {
      codeExecution: true,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['LuaSocket', 'LuaFileSystem', 'Penlight'],
    commonProjects: [
      'Write game scripts',
      'Create configuration parsers',
      'Build simple automation tools',
    ],
    difficulty: 'beginner',
    industryUse: ['Gaming', 'Embedded Systems', 'Networking'],
  },
  
  {
    language: 'java',
    displayName: 'Java',
    icon: '☕',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Enterprise-grade, object-oriented language with JVM.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: true,
      scripting: false,
      systemsProgramming: false,
      mobileDevelopment: true,
      gamesDevelopment: true,
    },
    useCases: [
      'Enterprise applications',
      'Android mobile development',
      'Backend microservices',
      'Big data processing',
      'Desktop applications',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['Spring', 'Hibernate', 'JUnit', 'Maven'],
    commonProjects: [
      'Build a Spring Boot REST API',
      'Create an Android app',
      'Develop enterprise software',
    ],
    difficulty: 'intermediate',
    industryUse: ['Enterprise', 'Android', 'Finance', 'Big Data'],
  },
  
  {
    language: 'cpp',
    displayName: 'C++',
    icon: '⚙️',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'High-performance systems programming language.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: false,
      machineLearning: true,
      scripting: false,
      systemsProgramming: true,
      mobileDevelopment: false,
      gamesDevelopment: true,
    },
    useCases: [
      'Game engines',
      'Operating systems',
      'High-frequency trading',
      'Embedded systems',
      'Graphics programming',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['STL', 'Boost', 'Qt', 'OpenCV'],
    commonProjects: [
      'Build a game engine',
      'Create graphics renderers',
      'Develop system utilities',
    ],
    difficulty: 'advanced',
    industryUse: ['Gaming', 'Systems', 'Finance', 'Aerospace'],
  },
  
  {
    language: 'c',
    displayName: 'C',
    icon: '🔧',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Low-level systems programming language.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: false,
      machineLearning: false,
      scripting: false,
      systemsProgramming: true,
      mobileDevelopment: false,
      gamesDevelopment: false,
    },
    useCases: [
      'Operating system kernels',
      'Device drivers',
      'Embedded firmware',
      'System utilities',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['glibc', 'pthread', 'OpenSSL'],
    commonProjects: [
      'Write device drivers',
      'Create embedded firmware',
      'Build system utilities',
    ],
    difficulty: 'advanced',
    industryUse: ['Systems', 'Embedded', 'IoT', 'Hardware'],
  },
  
  {
    language: 'rust',
    displayName: 'Rust',
    icon: '🦀',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Memory-safe systems language without garbage collection.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: false,
      systemsProgramming: true,
      mobileDevelopment: false,
      gamesDevelopment: true,
    },
    useCases: [
      'Systems programming',
      'WebAssembly applications',
      'CLI tools',
      'Network services',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['Tokio', 'Serde', 'Rocket', 'Actix'],
    commonProjects: [
      'Build CLI tools',
      'Create web servers',
      'Develop system utilities',
    ],
    difficulty: 'advanced',
    industryUse: ['Systems', 'WebAssembly', 'Blockchain', 'Cloud'],
  },
  
  {
    language: 'go',
    displayName: 'Go',
    icon: '🐹',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Simple, fast language for building scalable systems.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: false,
      systemsProgramming: true,
      mobileDevelopment: false,
      gamesDevelopment: false,
    },
    useCases: [
      'Microservices',
      'Cloud infrastructure',
      'DevOps tools',
      'Network programming',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['Gin', 'Echo', 'GORM', 'Cobra'],
    commonProjects: [
      'Build REST APIs',
      'Create CLI tools',
      'Develop microservices',
    ],
    difficulty: 'intermediate',
    industryUse: ['Cloud', 'DevOps', 'Backend', 'Containers'],
  },
  
  {
    language: 'swift',
    displayName: 'Swift',
    icon: '🕊️',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Modern language for iOS and macOS development.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: false,
      machineLearning: false,
      scripting: false,
      systemsProgramming: false,
      mobileDevelopment: true,
      gamesDevelopment: true,
    },
    useCases: [
      'iOS app development',
      'macOS applications',
      'watchOS and tvOS apps',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['SwiftUI', 'Combine', 'Alamofire', 'Realm'],
    commonProjects: [
      'Build iOS apps',
      'Create macOS utilities',
      'Develop watchOS apps',
    ],
    difficulty: 'intermediate',
    industryUse: ['Mobile', 'Apple Ecosystem', 'Startups'],
  },
  
  {
    language: 'kotlin',
    displayName: 'Kotlin',
    icon: '🟣',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Modern JVM language for Android and backend.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: false,
      systemsProgramming: false,
      mobileDevelopment: true,
      gamesDevelopment: false,
    },
    useCases: [
      'Android app development',
      'Backend services',
      'Multiplatform mobile',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['Ktor', 'Exposed', 'Coroutines', 'Jetpack Compose'],
    commonProjects: [
      'Build Android apps',
      'Create REST APIs',
      'Develop multiplatform apps',
    ],
    difficulty: 'intermediate',
    industryUse: ['Android', 'Backend', 'Mobile'],
  },
  
  {
    language: 'typescript',
    displayName: 'TypeScript',
    icon: '🔷',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Typed superset of JavaScript for large-scale applications.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: true,
      systemsProgramming: false,
      mobileDevelopment: true,
      gamesDevelopment: false,
    },
    useCases: [
      'Frontend frameworks (React, Angular, Vue)',
      'Backend development (Node.js)',
      'Full-stack applications',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['React', 'Express', 'NestJS', 'TypeORM'],
    commonProjects: [
      'Build type-safe React apps',
      'Create Node.js APIs',
      'Develop full-stack applications',
    ],
    difficulty: 'intermediate',
    industryUse: ['Web Development', 'Enterprise', 'Startups'],
  },
  
  {
    language: 'csharp',
    displayName: 'C#',
    icon: '🎮',
    category: 'editor-only',
    executionModel: 'editor-only',
    description: 'Microsoft\'s modern object-oriented language.',
    capabilities: {
      dataAnalysis: false,
      webDevelopment: true,
      machineLearning: false,
      scripting: false,
      systemsProgramming: false,
      mobileDevelopment: true,
      gamesDevelopment: true,
    },
    useCases: [
      'Game development (Unity)',
      'Enterprise applications',
      'Desktop applications',
      'Web APIs',
    ],
    bideSupport: {
      codeExecution: false,
      packageInstallation: false,
      fileIO: false,
      plotting: false,
      dataVisualization: false,
      debugging: false,
    },
    popularLibraries: ['.NET', 'Unity', 'ASP.NET', 'Entity Framework'],
    commonProjects: [
      'Build Unity games',
      'Create ASP.NET APIs',
      'Develop desktop apps',
    ],
    difficulty: 'intermediate',
    industryUse: ['Gaming', 'Enterprise', 'Windows', 'Mobile'],
  },
];
