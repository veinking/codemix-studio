# 🤝 Contributing to OpenIDE

First off — **thank you** for your interest in contributing to **OpenIDE**! ❤️  
This project thrives because of developers, data scientists, and tinkerers like you.

Whether you're fixing a typo, improving docs, adding a new feature, or suggesting ideas — every contribution counts.

---

## 🧭 Table of Contents
1. [How to Contribute](#how-to-contribute)
2. [Project Setup](#project-setup)
3. [Coding Guidelines](#coding-guidelines)
4. [Commit Standards](#commit-standards)
5. [Issue Reporting](#issue-reporting)
6. [Pull Requests](#pull-requests)
7. [Communication](#communication)

---

## 🧠 How to Contribute

There are many ways to help:
- 🪶 **File bugs** and suggest improvements
- 💡 **Propose features**
- 🧰 **Improve documentation**
- 🧩 **Build new features** or fix existing issues
- 🧪 **Test and review pull requests**

New contributors: look for issues labeled  
**`good first issue`** or **`help wanted`** in the [Issues tab](../../issues).

---

## ⚙️ Project Setup

### Prerequisites
- Node.js ≥ 18
- npm or yarn
- Python ≥ 3.10 (if using backend)
- Git

### Clone and Run Locally
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/openide.git
cd openide

# Run frontend
cd client
npm install
npm run dev

# (Optional) Run backend
cd ../server
pip install -r requirements.txt
uvicorn main:app --reload
```

### Test Your Changes
```bash
# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format
```

---

## 📐 Coding Guidelines

### General Principles
- **Keep it simple** — clarity over cleverness
- **Write tests** — especially for new features
- **Document as you go** — good code explains itself, but comments help
- **Follow existing patterns** — consistency matters

### Code Style
- **JavaScript/TypeScript**: Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- **Python**: Follow [PEP 8](https://peps.python.org/pep-0008/)
- **Formatting**: Use Prettier (JS/TS) and Black (Python)
- **Linting**: ESLint (JS/TS) and Flake8 (Python)

### File Naming
- Components: `PascalCase.tsx` (e.g., `CodeEditor.tsx`)
- Utils/Hooks: `camelCase.ts` (e.g., `useFileManager.ts`)
- Python modules: `snake_case.py` (e.g., `auth_handler.py`)

### Component Structure
```tsx
// Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Types
interface MyComponentProps {
  title: string;
}

// Component
export const MyComponent = ({ title }: MyComponentProps) => {
  // State and hooks
  const [count, setCount] = useState(0);

  // Handlers
  const handleClick = () => setCount(count + 1);

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Count: {count}</Button>
    </div>
  );
};
```

---

## 📝 Commit Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(editor): add Python syntax highlighting
fix(runtime): resolve Pyodide loading issue
docs(readme): update installation instructions
refactor(components): simplify FileExplorer logic
```

---

## 🐛 Issue Reporting

### Before Filing an Issue
- Search existing issues to avoid duplicates
- Try to reproduce the bug in a fresh environment
- Gather relevant info (OS, browser, Node version, etc.)

### Filing a Bug Report
Use this template:

```markdown
**Describe the bug**
A clear and concise description.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen instead.

**Screenshots**
If applicable.

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]

**Additional context**
Any other relevant info.
```

### Filing a Feature Request
```markdown
**Problem you're solving**
What pain point does this address?

**Proposed solution**
How would this feature work?

**Alternatives considered**
Other approaches you've thought about.

**Additional context**
Mockups, examples, links, etc.
```

---

## 🔀 Pull Requests

### Process
1. **Fork** the repo
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
3. **Make your changes** and commit following our standards
4. **Push to your fork**:
   ```bash
   git push origin feature/my-awesome-feature
   ```
5. **Open a Pull Request** against `main`

### PR Checklist
- [ ] Code follows our style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains what/why (not just how)

### PR Template
```markdown
**What does this PR do?**
Brief summary.

**Why?**
Context and motivation.

**How to test**
Steps to verify the changes.

**Screenshots** (if UI changes)

**Related issues**
Fixes #123
```

### Review Process
- Maintainers will review within 3-5 days
- Address feedback in new commits (don't force-push during review)
- Once approved, we'll squash-merge into `main`

---

## 💬 Communication

### Where to Ask Questions
- **GitHub Discussions**: General questions, ideas, showcase
- **GitHub Issues**: Bug reports, feature requests
- **Discord** (coming soon): Real-time chat

### Code of Conduct
Be respectful, inclusive, and professional.  
We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

---

## 🙏 Thank You!

Your contributions make OpenIDE better for everyone.  
We're excited to see what you build! 🚀

---

**Need help?** Reach out in [Discussions](../../discussions) or tag `@maintainers` in an issue.
