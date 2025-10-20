# 🌐 bIDE — Browser-Based Python & R Environment

**bIDE** is an open-source, browser-based IDE inspired by RStudio — built for Python and R.
It runs code *entirely in your browser*, powered by WebAssembly (Pyodide & webR), with an optional lightweight backend for cloud sync and collaboration.

> "Run data science anywhere — instantly, securely, and open source."

---

## 🚀 Features ##

- 🧠 **Python & R runtimes in the browser** (via Pyodide + webR)
- 🪶 **Lightweight server** — minimal backend for saving files & auth
- 📄 **Integrated code editor** (Monaco Editor)
- 🧩 **Plots & visualization support** (Matplotlib, ggplot2, Plotly)
- 🧱 **Offline mode** with local storage (IndexedDB + File System Access API)
- 🔐 **Secure sandboxed execution** (Web Workers)
- 🌍 **Optional cloud sync & collaboration**

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React / Svelte / SolidJS |
| Editor | Monaco Editor (VS Code engine) |
| Python Runtime | [Pyodide](https://pyodide.org) |
| R Runtime | [webR](https://docs.r-wasm.org/webr/latest/) |
| Storage | IndexedDB + File System Access API |
| Backend (optional) | FastAPI / Supabase Functions |
| Auth | Supabase Auth / OAuth 2.0 |
| Hosting | Vercel / Netlify / Cloudflare Pages |

---

## 🧱 Architecture Overview

```
Frontend (Browser)
├── Monaco Editor
├── Pyodide (Python Runtime)
├── webR (R Runtime)
├── Plot Renderer
├── File Manager (IndexedDB / FS Access)
└── API Client → (Optional) Backend

Backend (optional)
├── Auth (JWT / OAuth)
├── File Storage (Supabase / Firebase)
└── Remote Compute (Future)
```

🧠 **Client-heavy design:**  
Most execution happens in the browser — no need for a heavy backend server.  
The backend only handles saving, sharing, and optional collaboration.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10 (if using FastAPI backend)
- npm or yarn

### 1. Clone the Repo
```bash
git clone https://github.com/yourusername/bide.git
cd bide
```

### 2. Run the Frontend

```bash
cd client
npm install
npm run dev
```

This launches the local dev server (Vite / Webpack) — the IDE will open in your browser.

### 3. (Optional) Run the Backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Try It Out

* Open your browser to `http://localhost:5173`
* Type some Python or R code in the editor
* Hit **Run** — the output appears in the console below!

---

## 📂 Project Structure

```
/client
  /src
    /components
    /runtimes
      /python
      /r
    /hooks
    /state
  package.json

/server
  /api
  /models
  main.py
  requirements.txt

/docs
  setup.md
  contributing.md
  architecture.md

/examples
  /python
  /r

LICENSE
README.md
```

---

## 🧰 Roadmap

| Stage              | Description                               | Status        |
| ------------------ | ----------------------------------------- | ------------- |
| **MVP**            | Run Python & R locally with Monaco editor | ✅ In progress |
| **Offline Mode**   | IndexedDB + FS API for persistence        | 🧩 Planned    |
| **Cloud Sync**     | Supabase or Firebase backend              | 🧩 Planned    |
| **Collaboration**  | Real-time shared sessions                 | 🧠 Future     |
| **Plugin API**     | Extend with Julia / SQL / AI tools        | 💡 Future     |
| **Remote Compute** | Dockerized jobs for large workloads       | 💡 Future     |

---

## 🧑‍💻 Contributing

We'd love your help!

1. Fork the repo & clone it locally
2. Create a feature branch (`git checkout -b feature/awesome-thing`)
3. Commit your changes (`git commit -m 'Add awesome thing'`)
4. Push to your fork (`git push origin feature/awesome-thing`)
5. Open a Pull Request 🚀

Please read [`CONTRIBUTING.md`](./docs/contributing.md) before submitting.

---

## 🔒 Security

All code runs client-side in a sandboxed environment (Web Workers / iframes).
The backend **never executes** user code — it only stores metadata and user files.

---

## 🧑‍🎓 License

Licensed under the [MIT License](./LICENSE).
Feel free to fork, remix, and use in your own projects.

---

## ❤️ Acknowledgements

* [Pyodide](https://pyodide.org)
* [webR](https://docs.r-wasm.org/webr/latest/)
* [Monaco Editor](https://microsoft.github.io/monaco-editor/)
* [Supabase](https://supabase.com)
* [FastAPI](https://fastapi.tiangolo.com)
* The open-source community 🙌

---

## 🌟 Vision

> Build a truly portable, browser-native IDE for data science —
> No installs. No setup. Just open a tab and code.

---

## 🔗 Lovable Project

**URL**: https://lovable.dev/projects/495ca4b6-d8e1-4e4c-965e-594d39780d56

This project was built with [Lovable](https://lovable.dev) - the AI-powered app builder.
