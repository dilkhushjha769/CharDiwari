# CharDiwari (Next.js + React)

A modern web application built with [Next.js](https://nextjs.org/) (App Router), React 19, and Node.js.

## 🚀 Features

- ⚡️ **Next.js App Router** for server/client components and fast page routing
- ⚛️ **React 19** with server-side rendering and static optimization
- 🎨 **Tailwind CSS v4** styling system
- 🛡️ **ESLint** pre-configured for Next.js

## 📁 Project Structure

```text
├── public/                 # Static assets (images, icons, svgs)
├── src/
│   └── app/
│       ├── favicon.ico     # Favicon
│       ├── globals.css     # Global styles & Tailwind directives
│       ├── layout.js       # Root layout component
│       └── page.js         # Root homepage route
├── .gitignore              # Git ignored files & directories
├── eslint.config.mjs       # ESLint configuration
├── jsconfig.json           # Path aliasing configuration (@/*)
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies & scripts
└── README.md               # Project documentation
```

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18+ or later)
- `npm`

### Installation

If you clone the repository or need to re-install dependencies:

```bash
npm install
```

### Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.js`. The page auto-updates as you edit the file.

### Production Build

Create an optimized production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

### Linting

Check code quality with ESLint:

```bash
npm run lint
```
