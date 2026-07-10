interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface Dataset {
  headers: string[];
  data: string[][];
}

export interface PortfolioOptions {
  title: string;
  description: string;
  author: string;
  includeCode: boolean;
  includeDatasets: boolean;
  includePlots: boolean;
  includeOutput: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const getLanguageClass = (language: string): string => {
  const langMap: Record<string, string> = {
    python: 'language-python',
    r: 'language-r',
    javascript: 'language-javascript',
    sql: 'language-sql',
    csv: 'language-csv',
  };
  return langMap[language] || 'language-plaintext';
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generatePortfolioHTML = (
  files: FileItem[],
  datasets: Map<string, Dataset>,
  plots: string | null,
  consoleOutput: Array<{ text: string }>,
  options: PortfolioOptions
): string => {
  const { title, description, author, includeCode, includeDatasets, includePlots, includeOutput, theme } = options;

  const themeStyles = theme === 'dark' 
    ? `
      body { background: #0a0a0a; color: #e5e5e5; }
      .container { background: #111; }
      .section { background: #1a1a1a; border-color: #333; }
      pre { background: #0d0d0d; border-color: #222; }
      table { border-color: #333; }
      th { background: #1a1a1a; }
      tr:nth-child(even) { background: #151515; }
    `
    : `
      body { background: #f9fafb; color: #1f2937; }
      .container { background: #fff; }
      .section { background: #f9fafb; border-color: #e5e7eb; }
      pre { background: #f3f4f6; border-color: #d1d5db; }
      table { border-color: #e5e7eb; }
      th { background: #f9fafb; }
      tr:nth-child(even) { background: #f9fafb; }
    `;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="${escapeHtml(author)}">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  
  <!-- Prism.js for syntax highlighting -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-r.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      padding: 2rem;
    }
    
    ${themeStyles}
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      border-radius: 12px;
      padding: 3rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    header {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    
    .author {
      font-size: 1rem;
      opacity: 0.7;
      margin-bottom: 1rem;
    }
    
    .description {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .section {
      margin-bottom: 3rem;
      padding: 2rem;
      border-radius: 8px;
      border: 1px solid;
    }
    
    h2 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      font-weight: 600;
    }
    
    .file-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    
    .file-tab {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      opacity: 0.8;
      border: 1px solid;
    }
    
    pre {
      border-radius: 8px;
      padding: 1.5rem;
      overflow-x: auto;
      border: 1px solid;
      margin-bottom: 1.5rem;
    }
    
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9rem;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      border: 1px solid;
      border-radius: 8px;
      overflow: hidden;
    }
    
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid;
    }
    
    th {
      font-weight: 600;
    }
    
    .plot-container {
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .plot-container img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid;
      text-align: center;
      opacity: 0.7;
    }
    
    footer a {
      color: inherit;
      text-decoration: none;
      font-weight: 500;
    }
    
    footer a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }
      
      .container {
        padding: 1.5rem;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="author">By ${escapeHtml(author)}</p>
      <p class="description">${escapeHtml(description)}</p>
    </header>`;

  // Code section
  if (includeCode && files.length > 0) {
    html += `
    <section class="section">
      <h2>Source Code</h2>`;
    
    if (files.length > 1) {
      html += `<div class="file-tabs">`;
      files.forEach(file => {
        html += `<span class="file-tab">${escapeHtml(file.name)}</span>`;
      });
      html += `</div>`;
    }
    
    files.forEach(file => {
      if (file.language !== 'csv') {
        html += `
        <div class="code-file">
          ${files.length > 1 ? `<h3>${escapeHtml(file.name)}</h3>` : ''}
          <pre><code class="${getLanguageClass(file.language)}">${escapeHtml(file.content)}</code></pre>
        </div>`;
      }
    });
    
    html += `</section>`;
  }

  // Datasets section
  if (includeDatasets && datasets.size > 0) {
    html += `
    <section class="section">
      <h2>Data</h2>`;
    
    datasets.forEach((dataset, name) => {
      html += `
      <div class="dataset">
        <h3>${escapeHtml(name)}</h3>
        <table>
          <thead>
            <tr>
              ${dataset.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${dataset.data.slice(0, 10).map(row => `
              <tr>
                ${row.map(cell => `<td>${escapeHtml(String(cell))}</td>`).join('')}
              </tr>
            `).join('')}
            ${dataset.data.length > 10 ? `<tr><td colspan="${dataset.headers.length}"><em>... ${dataset.data.length - 10} more rows</em></td></tr>` : ''}
          </tbody>
        </table>
      </div>`;
    });
    
    html += `</section>`;
  }

  // Visualizations section
  if (includePlots && plots) {
    html += `
    <section class="section">
      <h2>Visualizations</h2>
      <div class="plot-container">
        <img src="${plots}" alt="Generated plot" />
      </div>
    </section>`;
  }

  // Output section
  if (includeOutput && consoleOutput.length > 0) {
    html += `
    <section class="section">
      <h2>Console Output</h2>
      <pre><code>${consoleOutput.map(o => escapeHtml(o.text)).join('\n')}</code></pre>
    </section>`;
  }

  html += `
    <footer>
      <p>Created with <a href="https://bideide.com" target="_blank">bIDE</a></p>
    </footer>
  </div>
  
  <script>
    // Auto-highlight code blocks
    Prism.highlightAll();
  </script>
</body>
</html>`;

  return html;
};

export const downloadPortfolio = (html: string, filename: string) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
