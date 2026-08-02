# ChatGPT nexus

ChatGPT nexus is a local browser extension that adapts a nexus-style chat workflow to ChatGPT.

This repository contains the source code for a standalone Chrome/Edge extension intended for local development and maintenance.


## Features

- ChatGPT conversation timeline with dot navigation, preview, highlighting, and starred positions.
- Timeline text pins for long answers: pin exact spots inside a message, switch pins within the selected timeline dot, select pins from the page, and delete pins with an inline delete control.
- Sidebar folders for organizing conversations locally, with an optional layout that places the folder list below the Projects section (instead of pinned at the top) so it scrolls together with the chat list.
- Undo a temporary chat: from inside a temporary chat, scrape the transcript and build a handoff prompt that continues it in a normal conversation (delivered inline, or auto-attached as a `.txt` for long chats).
- Prompt Manager with tags, search, prompt import/export, compact/comfortable display modes, and click-to-copy or click-to-insert behavior.
- Input enhancements, including input collapse, draft autosave, quote reply, Vim-style input option, Ctrl+Enter send option, and auto-scroll prevention.
- Markdown, KaTeX/LaTeX, formula copy, and Mermaid rendering support, including mind maps.
- Conversation export and local backup/import for prompts, folders, settings, and timeline hierarchy.
- One-click single-conversation export to Markdown or JSON from the chat header (piggybacks ChatGPT's own conversation fetch — no separate API call, no extra permissions). The export button opens a small menu: export the entire conversation, or pick individual messages and export only the selected subset.
- Cross-conversation favorites: star any user message, jump back to it from the favorites panel even after switching conversations.
- Layout controls for chat width, font size, input width, sidebar width, and folder spacing.
- A small support popover with Ko-fi and optional payment QR codes.

## Install Locally

Requirements:

- Node.js 20 or newer.
- npm.
- Chrome or Edge with Developer Mode enabled.

Install dependencies:

```bash
npm install
```

Build

```bash
npm run build:chrome
```

Open

```
chrome://extensions
```

Enable

```
Developer Mode
```

Load

```
dist_chrome
```

Refresh ChatGPT.

You're done.

---

# 🛠 Common Commands

```bash
npm install
npm run typecheck
npm run test

```

# 🚀 Feature Deep Dive

## 🕒 Timeline Navigation

Never lose your place in long conversations again.

The Timeline is one of Nexus's flagship features. Every conversation is transformed into an interactive navigation rail that lets you jump anywhere instantly.

### Features

- ⚡ Instant navigation between messages
- 👀 Live hover previews
- ⭐ Favorite indicators
- 📎 Attachment indicators
- 📍 Text pin indicators
- 🎯 Active message tracking
- 🪄 Smooth scrolling animations
- 💾 Persistent cache for blazing-fast loading

---

## 📌 Text Pins

Stop bookmarking entire conversations when you only need one paragraph.

Text Pins allow you to bookmark exact locations inside any ChatGPT response.

Perfect for:

- Code snippets
- Algorithms
- Documentation
- Research papers
- Long tutorials
- AI-generated notes

Features include:

- Multiple pins per response
- Pin navigation
- Delete individual pins
- Stable after page rerenders
- Works alongside Timeline navigation

---

## 📂 Smart Folder Organization

Turn your ChatGPT sidebar into an actual workspace.

Instead of hundreds of chats in one list, organize conversations into folders.

### Capabilities

- Unlimited folders
- Drag & Drop organization
- Local storage
- Native ChatGPT styling
- Optional placement below Projects
- Sticky or scrolling layout

---

## ⭐ Cross Conversation Favorites

One of the most requested ChatGPT features.

Favorite any message and access it later—even from a completely different conversation.

No more searching through hundreds of chats trying to find that one perfect prompt.

---

## 📝 Prompt Manager

Your personal prompt library.

Store, search and organize prompts without leaving ChatGPT.

### Includes

- Search
- Tags
- Categories
- Favorites
- Import
- Export
- Backup
- Restore
- Compact mode
- Comfortable mode
- Click-to-copy
- Click-to-insert

---

## 📤 Export Conversations

Own your data.

Export conversations into multiple formats.

| Format | Supported |
|---------|-----------|
| Markdown | ✅ |
| Simplified Markdown | ✅ |
| JSON | ✅ |
| Simplified JSON | ✅ |
| HTML | ✅ |

Supports:

- Entire conversations
- Selected messages
- Rich formatting
- Attachments
- Metadata
- Timestamps

---

## 🧠 Rich Content Rendering

ChatGPT Nexus improves readability across technical conversations.

Supported:

- Markdown
- Tables
- KaTeX
- LaTeX
- Mermaid
- Mind Maps
- Formula Copy
- Syntax Highlighting

---

## ⚙ Layout Customization

Customize ChatGPT exactly how you like.

Available controls:

- Chat width
- Sidebar width
- Folder spacing
- Input width
- Font size
- Timeline visibility
- Prompt Manager appearance

Everything is stored locally.

---

# ⚡ Why Nexus?

| Feature | ChatGPT | Nexus |
|----------|:-------:|:-----:|
| Timeline Navigation | ❌ | ✅ |
| Prompt Library | ❌ | ✅ |
| Conversation Folders | ❌ | ✅ |
| Text Pins | ❌ | ✅ |
| Cross-chat Favorites | ❌ | ✅ |
| Rich Export | Limited | ✅ |
| Markdown Export | ❌ | ✅ |
| HTML Export | ❌ | ✅ |
| Mermaid Rendering | ❌ | ✅ |
| KaTeX Improvements | Limited | ✅ |
| Layout Controls | ❌ | ✅ |

---

# 🏗 Architecture

```
ChatGPT
     │
     ▼
──────────────────────────────
      ChatGPT Nexus
──────────────────────────────
│
├── Timeline
├── Prompt Manager
├── Folder Manager
├── Favorites
├── Export Engine
├── Rich Renderer
├── Text Pins
├── Layout Engine
└── Settings
```

---

# 🛠 Built With

- TypeScript
- React
- Chrome Extension APIs
- Markdown
- KaTeX
- Mermaid
- Local Storage APIs
- MutationObserver
- DOM APIs

---

# 📈 Performance

Recent releases focused heavily on performance.

Highlights include:

- Faster Timeline rendering
- Cached conversation summaries
- Optimized scroll handling
- Reduced DOM observers
- Lower memory usage
- Better virtualization support
- Reduced layout thrashing
- Smoother navigation

---

# 🗺 Roadmap

## Completed

- [x] Timeline Navigation
- [x] Prompt Manager
- [x] Conversation Export
- [x] Favorites
- [x] Text Pins
- [x] Folder Organization
- [x] Rich Markdown
- [x] Mermaid
- [x] KaTeX
- [x] HTML Export
- [x] Layout Customization

## Planned

- [ ] Prompt Collections
- [ ] Better Folder Management
- [ ] Keyboard Command Palette
- [ ] Workspace Profiles
- [ ] Improved Search
- [ ] More Export Formats

---

# 🤝 Contributing

Contributions are welcome.

If you'd like to improve ChatGPT Nexus:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request.

Please keep changes focused and well documented.

---

# 🐛 Reporting Bugs

Found a bug?

Please include:

- Browser version
- Extension version
- Operating system
- Screenshots
- Steps to reproduce

---

# ⭐ Support

If ChatGPT Nexus improves your workflow:

- ⭐ Star the repository
- 🐛 Report bugs
- 💡 Suggest features
- 🤝 Contribute improvements

Every contribution helps.

---

# 📄 License

This project is licensed under the license included in this repository.

Third-party libraries remain under their respective licenses.

---

<div align="center">

## ⭐ If you find ChatGPT Nexus useful, please consider starring the repository!

Built with ❤️ for the ChatGPT community.

</div>
npm run build:chrome
```
