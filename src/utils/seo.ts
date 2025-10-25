/**
 * SEO utility functions for OpenIDE
 * Manages document title and meta tags for each page
 */

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
}

/**
 * Updates page SEO metadata
 * @param config - SEO configuration object
 */
export const updatePageSEO = (config: SEOConfig) => {
  // Update document title
  document.title = config.title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', config.description);
  }
  
  // Update keywords if provided
  if (config.keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', config.keywords);
    }
  }
  
  // Update canonical URL
  if (config.canonical) {
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', config.canonical);
  }
  
  // Update Open Graph tags
  updateMetaTag('property', 'og:title', config.title);
  updateMetaTag('property', 'og:description', config.description);
  if (config.canonical) {
    updateMetaTag('property', 'og:url', config.canonical);
  }
  
  // Update Twitter Card tags
  updateMetaTag('name', 'twitter:title', config.title);
  updateMetaTag('name', 'twitter:description', config.description);
};

/**
 * Helper to update or create meta tags
 */
const updateMetaTag = (attrName: string, attrValue: string, content: string) => {
  let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

/**
 * Predefined SEO configurations for each page
 */
export const SEO_CONFIGS = {
  landing: {
    title: 'bIDE - Free Multi-Language IDE | Python, R, JavaScript, SQL & More',
    description: 'bIDE: Free online IDE supporting 16 languages including Python, R, JavaScript, SQL, PHP, Ruby, Lua, Java, TypeScript, C++, and more. AI assistance, data science tools, notebook mode, Undo/Redo, and comprehensive documentation. Works on mobile & desktop - no installation required.',
    keywords: 'free ide, multi-language ide, python ide, r ide, javascript editor, sql editor, online code editor, mobile coding, browser ide, webassembly, ai code assistant, free coding tools, learn programming, data science ide',
    canonical: 'https://bideide.com/'
  },
  ide: {
    title: 'IDE - bIDE | Code 16 Languages in Your Browser with AI',
    description: 'Full-featured online IDE supporting Python, R, JavaScript, SQL, PHP, Ruby, Lua, Java, TypeScript, C++, C, Rust, Go, Swift, Kotlin, C#. Features: AI assistant, Undo/Redo, Actions menu, notebook mode, data visualization, and offline support.',
    keywords: 'python online ide, r programming online, javascript editor, sql editor, php editor, ruby editor, browser ide, multi-language editor, webassembly ide, ai coding assistant',
    canonical: 'https://bideide.com/ide'
  },
  features: {
    title: 'Features - bIDE | 16 Languages, AI Assistant, Notebook Mode & More',
    description: 'Explore bIDE features: 16 programming languages, AI code assistant, Undo/Redo, Actions menu, notebook mode, data visualization, comprehensive language docs, mobile-optimized interface. All free, all in your browser.',
    keywords: 'ide features, multi-language support, python tools, r programming tools, data science tools, code editor features, ai code assistant, notebook mode, undo redo, mobile ide',
    canonical: 'https://bideide.com/features'
  },
  tutorials: {
    title: 'Tutorials - bIDE | Learn Python, R, JavaScript & 13 More Languages',
    description: 'Step-by-step tutorials for bIDE. Learn Python, R, JavaScript, SQL, and 12 more languages. Data science, AI-powered coding, and comprehensive documentation for students and developers.',
    keywords: 'python tutorial, r tutorial, javascript tutorial, sql tutorial, programming tutorials, data science tutorial, learn coding online, multi-language tutorials',
    canonical: 'https://bideide.com/tutorials'
  },
  docs: {
    title: 'Documentation Hub - bIDE | Reference for 16 Programming Languages',
    description: 'Complete documentation for all 16 languages in bIDE. Syntax guides, code examples, and "Open in IDE" feature. Languages: Python, R, JavaScript, SQL, PHP, Ruby, Lua, Java, TypeScript, C++, C, Rust, Go, Swift, Kotlin, C#.',
    keywords: 'programming documentation, language reference, syntax guide, code examples, python docs, r docs, javascript docs, sql docs, multi-language reference',
    canonical: 'https://bideide.com/docs'
  },
  pythonDocs: {
    title: 'Python Documentation - bIDE | Complete Syntax Guide & Examples',
    description: 'Comprehensive Python reference for bIDE. Variables, functions, data structures, file I/O, and more. Run examples instantly with "Open in IDE" button. Perfect for students and developers.',
    keywords: 'python documentation, python syntax, python tutorial, python examples, learn python, python reference guide, python data structures',
    canonical: 'https://bideide.com/docs/python'
  },
  rDocs: {
    title: 'R Documentation - bIDE | Statistical Programming Reference',
    description: 'Complete R language reference for bIDE. Data analysis, visualization with ggplot2, statistical functions, and data manipulation. Run R code examples instantly in your browser.',
    keywords: 'r documentation, r programming, r syntax, r tutorial, r examples, ggplot2, data analysis in r, statistical programming',
    canonical: 'https://bideide.com/docs/r'
  },
  javascriptDocs: {
    title: 'JavaScript Documentation - bIDE | Modern JS Reference & Examples',
    description: 'JavaScript reference guide for bIDE. ES6+ features, DOM manipulation, async/await, arrays, objects, and more. Interactive examples you can run instantly.',
    keywords: 'javascript documentation, javascript syntax, javascript tutorial, es6 javascript, modern javascript, javascript examples, learn javascript',
    canonical: 'https://bideide.com/docs/javascript'
  },
  sqlDocs: {
    title: 'SQL Documentation - bIDE | Database Query Reference',
    description: 'Complete SQL reference for bIDE. SELECT, JOIN, aggregations, subqueries, and database operations. Practice SQL queries in your browser with instant execution.',
    keywords: 'sql documentation, sql syntax, sql tutorial, sql queries, learn sql, database queries, sql examples',
    canonical: 'https://bideide.com/docs/sql'
  },
  phpDocs: {
    title: 'PHP Documentation - bIDE | Server-Side Programming Reference',
    description: 'PHP language reference for bIDE. Syntax, functions, arrays, OOP, and web development basics. Run PHP code examples directly in the browser.',
    keywords: 'php documentation, php syntax, php tutorial, php examples, learn php, server-side programming',
    canonical: 'https://bideide.com/docs/php'
  },
  rubyDocs: {
    title: 'Ruby Documentation - bIDE | Ruby Language Reference',
    description: 'Ruby programming reference for bIDE. Syntax, blocks, iterators, classes, and Ruby best practices. Interactive Ruby examples.',
    keywords: 'ruby documentation, ruby syntax, ruby tutorial, ruby examples, learn ruby, ruby programming',
    canonical: 'https://bideide.com/docs/ruby'
  },
  luaDocs: {
    title: 'Lua Documentation - bIDE | Lightweight Scripting Reference',
    description: 'Lua language reference for bIDE. Tables, metatables, coroutines, and Lua scripting basics. Run Lua code in your browser.',
    keywords: 'lua documentation, lua syntax, lua tutorial, lua examples, learn lua, lua scripting',
    canonical: 'https://bideide.com/docs/lua'
  },
  javaDocs: {
    title: 'Java Documentation - bIDE | Java Programming Reference',
    description: 'Java language reference for bIDE. OOP concepts, collections, streams, and Java syntax. Code examples for learning Java.',
    keywords: 'java documentation, java syntax, java tutorial, java examples, learn java, oop java',
    canonical: 'https://bideide.com/docs/java'
  },
  typescriptDocs: {
    title: 'TypeScript Documentation - bIDE | Typed JavaScript Reference',
    description: 'TypeScript reference for bIDE. Types, interfaces, generics, and modern TypeScript features. Run TypeScript examples instantly.',
    keywords: 'typescript documentation, typescript syntax, typescript tutorial, typescript examples, learn typescript, typed javascript',
    canonical: 'https://bideide.com/docs/typescript'
  },
  cppDocs: {
    title: 'C++ Documentation - bIDE | C++ Programming Reference',
    description: 'C++ language reference for bIDE. Classes, templates, STL, and modern C++ features. Code examples and syntax guide.',
    keywords: 'c++ documentation, cpp syntax, c++ tutorial, c++ examples, learn c++, modern c++',
    canonical: 'https://bideide.com/docs/cpp'
  },
  cDocs: {
    title: 'C Documentation - bIDE | C Programming Reference',
    description: 'C language reference for bIDE. Pointers, memory management, functions, and C syntax. Essential C programming examples.',
    keywords: 'c documentation, c programming, c syntax, c tutorial, c examples, learn c programming',
    canonical: 'https://bideide.com/docs/c'
  },
  rustDocs: {
    title: 'Rust Documentation - bIDE | Rust Programming Reference',
    description: 'Rust language reference for bIDE. Ownership, borrowing, lifetimes, and Rust syntax. Modern systems programming examples.',
    keywords: 'rust documentation, rust syntax, rust tutorial, rust examples, learn rust, rust programming',
    canonical: 'https://bideide.com/docs/rust'
  },
  goDocs: {
    title: 'Go Documentation - bIDE | Golang Reference',
    description: 'Go language reference for bIDE. Goroutines, channels, interfaces, and Go syntax. Concurrent programming examples.',
    keywords: 'go documentation, golang syntax, go tutorial, golang examples, learn go, golang programming',
    canonical: 'https://bideide.com/docs/go'
  },
  swiftDocs: {
    title: 'Swift Documentation - bIDE | Swift Programming Reference',
    description: 'Swift language reference for bIDE. Optionals, protocols, closures, and Swift syntax. Modern iOS development basics.',
    keywords: 'swift documentation, swift syntax, swift tutorial, swift examples, learn swift, ios programming',
    canonical: 'https://bideide.com/docs/swift'
  },
  kotlinDocs: {
    title: 'Kotlin Documentation - bIDE | Kotlin Programming Reference',
    description: 'Kotlin language reference for bIDE. Null safety, coroutines, data classes, and Kotlin syntax. Modern Android development.',
    keywords: 'kotlin documentation, kotlin syntax, kotlin tutorial, kotlin examples, learn kotlin, android programming',
    canonical: 'https://bideide.com/docs/kotlin'
  },
  csharpDocs: {
    title: 'C# Documentation - bIDE | C Sharp Programming Reference',
    description: 'C# language reference for bIDE. LINQ, async/await, properties, and C# syntax. .NET programming examples.',
    keywords: 'c# documentation, csharp syntax, c# tutorial, csharp examples, learn c#, dotnet programming',
    canonical: 'https://bideide.com/docs/csharp'
  },
  auth: {
    title: 'Sign In - bIDE | Access Your Projects',
    description: 'Sign in to bIDE to save your projects, sync across devices, and unlock unlimited AI assistance. Free account with Google sign-in or email.',
    keywords: 'bide login, sign in, create account, student ide account',
    canonical: 'https://bideide.com/auth'
  },
  account: {
    title: 'My Account - bIDE | Manage Profile & Subscription',
    description: 'Manage your bIDE account, view AI usage, upgrade to Pro, and configure your profile settings.',
    keywords: 'bide account, profile settings, subscription management, ai usage',
    canonical: 'https://bideide.com/account'
  },
  upgrade: {
    title: 'Upgrade to Pro - bIDE | Unlimited AI & Premium Features',
    description: 'Upgrade to bIDE Pro for unlimited AI assistance, priority support, and advanced features. Affordable plans for students and professionals.',
    keywords: 'bide pro, upgrade subscription, unlimited ai, premium ide features',
    canonical: 'https://bideide.com/upgrade'
  },
  terms: {
    title: 'Terms of Service - bIDE',
    description: 'bIDE Terms of Service. Read our usage terms, acceptable use policy, and user agreement for our browser-based IDE platform.',
    keywords: 'terms of service, user agreement, acceptable use policy',
    canonical: 'https://bideide.com/terms'
  },
  privacy: {
    title: 'Privacy Policy - bIDE',
    description: 'bIDE Privacy Policy. Learn how we protect your data, manage cookies, and respect your privacy while using our IDE.',
    keywords: 'privacy policy, data protection, cookie policy, user privacy',
    canonical: 'https://bideide.com/privacy'
  },
  support: {
    title: 'Support - bIDE | Get Help & Contact Us',
    description: 'Get help with bIDE. Contact our support team for technical assistance, billing questions, or general inquiries. We respond within 24-48 hours.',
    keywords: 'bide support, contact support, help center, technical support, customer service',
    canonical: 'https://bideide.com/support'
  },
  sharedCode: {
    title: 'Shared Code - bIDE | View & Run Code Snippets',
    description: 'View and run shared code snippets on bIDE. Copy, modify, and learn from community-shared code in 16 programming languages.',
    keywords: 'shared code, code snippets, programming examples, community code, code sharing',
    canonical: 'https://bideide.com/share'
  },
  testimonials: {
    title: 'Student Reviews & Testimonials - bIDE | Real User Feedback',
    description: 'See what students and educators say about bIDE. Real reviews from users who code Python, R, JavaScript, and 13+ languages in their browser for coursework and projects.',
    keywords: 'bide reviews, student testimonials, python ide reviews, r ide reviews, user feedback, online ide reviews, programming tool reviews',
    canonical: 'https://bideide.com/testimonials'
  },
  blog: {
    title: 'Blog - bIDE | Coding Tips, Tutorials & Updates',
    description: 'bIDE blog featuring coding tutorials, programming tips, data science guides, and platform updates for Python, R, JavaScript, and 13+ languages.',
    keywords: 'coding blog, programming tutorials, data science tips, python guides, r programming blog, javascript tips',
    canonical: 'https://bideide.com/blog'
  },
  notFound: {
    title: '404 Not Found - bIDE',
    description: 'Page not found. Return to bIDE homepage to start coding in 16 programming languages in your browser.',
    keywords: '404, page not found',
    canonical: 'https://bideide.com/'
  }
};
