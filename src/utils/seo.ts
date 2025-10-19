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
    title: 'OpenIDE - Free Python & R IDE for Students | Browser-Based Code Editor',
    description: 'OpenIDE: Free online Python & R IDE built by students, for students. Run code instantly in your browser with AI assistance, data science tools, and Jupyter-style notebooks. No installation required - works on mobile & desktop.',
    keywords: 'free python ide, free r ide, online python editor, online r editor, student code editor, data science ide, mobile python ide, jupyter notebook alternative, browser ide, webassembly python, pyodide, webr, monaco editor',
    canonical: 'https://codemixapp.com/'
  },
  ide: {
    title: 'IDE - OpenIDE | Code Python & R in Your Browser',
    description: 'Start coding Python, R, JavaScript, and SQL instantly in your browser. Full-featured online IDE with AI assistance, data visualization, and offline support. No installation required.',
    keywords: 'python online ide, r programming online, javascript editor, sql editor, browser ide, online code editor, webassembly ide',
    canonical: 'https://codemixapp.com/ide'
  },
  features: {
    title: 'Features - OpenIDE | Complete Browser-Based IDE Tools',
    description: 'Explore OpenIDE features: Python & R execution, AI code assistant, data science tools, visualization builder, Jupyter-style notebooks, and more. All free, all in your browser.',
    keywords: 'ide features, python tools, r programming tools, data science tools, code editor features, ai code assistant, data visualization tools',
    canonical: 'https://codemixapp.com/features'
  },
  tutorials: {
    title: 'Tutorials - OpenIDE | Learn Python & R Programming',
    description: 'Step-by-step tutorials for OpenIDE. Learn Python, R, data science, and AI-powered coding. From beginner to advanced guides for students and developers.',
    keywords: 'python tutorial, r programming tutorial, data science tutorial, learn python online, learn r programming, coding tutorials for students',
    canonical: 'https://codemixapp.com/tutorials'
  },
  auth: {
    title: 'Sign In - OpenIDE | Access Your Projects',
    description: 'Sign in to OpenIDE to save your projects, sync across devices, and unlock unlimited AI assistance. Free account with Google sign-in or email.',
    keywords: 'openide login, sign in, create account, student ide account',
    canonical: 'https://codemixapp.com/auth'
  },
  account: {
    title: 'My Account - OpenIDE | Manage Profile & Subscription',
    description: 'Manage your OpenIDE account, view AI usage, upgrade to Pro, and configure your profile settings.',
    keywords: 'openide account, profile settings, subscription management, ai usage',
    canonical: 'https://codemixapp.com/account'
  },
  upgrade: {
    title: 'Upgrade to Pro - OpenIDE | Unlimited AI & Premium Features',
    description: 'Upgrade to OpenIDE Pro for unlimited AI assistance, priority support, and advanced features. Affordable plans for students and professionals.',
    keywords: 'openide pro, upgrade subscription, unlimited ai, premium ide features',
    canonical: 'https://codemixapp.com/upgrade'
  },
  terms: {
    title: 'Terms of Service - OpenIDE',
    description: 'OpenIDE Terms of Service. Read our usage terms, acceptable use policy, and user agreement for our browser-based IDE platform.',
    keywords: 'terms of service, user agreement, acceptable use policy',
    canonical: 'https://codemixapp.com/terms'
  },
  privacy: {
    title: 'Privacy Policy - OpenIDE',
    description: 'OpenIDE Privacy Policy. Learn how we protect your data, manage cookies, and respect your privacy while using our IDE.',
    keywords: 'privacy policy, data protection, cookie policy, user privacy',
    canonical: 'https://codemixapp.com/privacy'
  },
  support: {
    title: 'Support - OpenIDE | Get Help & Contact Us',
    description: 'Get help with OpenIDE. Contact our support team for technical assistance, billing questions, or general inquiries. We respond within 24-48 hours.',
    keywords: 'openide support, contact support, help center, technical support, customer service',
    canonical: 'https://codemixapp.com/support'
  },
  sharedCode: {
    title: 'Shared Code - OpenIDE | View & Run Code Snippets',
    description: 'View and run shared code snippets on OpenIDE. Copy, modify, and learn from community-shared Python and R code.',
    keywords: 'shared code, code snippets, python examples, r examples, community code',
    canonical: 'https://codemixapp.com/share'
  },
  notFound: {
    title: '404 Not Found - OpenIDE',
    description: 'Page not found. Return to OpenIDE homepage to start coding Python and R in your browser.',
    keywords: '404, page not found',
    canonical: 'https://codemixapp.com/'
  }
};
