# Dwarkesh Real Estate Group (Next.js + React)

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

## 🗺️ Google Maps (property page)

Each property page has a neighbourhood viewer (photorealistic **3D**, **Street View** and a **map**) and a **commute check**. Without a key they show a "Map preview unavailable" card, so the site works either way.

To turn them on:

1. In Google Cloud, enable the **Maps JavaScript API**, **Places API (New)** and **Routes API** on a project with billing.
2. Create an API key and restrict it by **HTTP referrer** to:
   - `http://localhost:3000/*`
   - your live domain, e.g. `https://char-diwari.vercel.app/*`
   - your Vercel preview pattern, e.g. `https://*-<your-team>.vercel.app/*` (otherwise maps won't load on PR previews)
3. Optionally create a **Map ID** (Google Maps Platform → Map management) for map styling. Without one, Google's `DEMO_MAP_ID` is used.
4. Add both to `.env.local` (never committed) and to the Vercel project's environment variables:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=...
   ```
5. Set a **daily quota cap** per API (APIs & Services → each API → Quotas) as a cost safety net.

**Cost:** nothing loads from Google until a visitor clicks "Explore in 3D" or "Check my commute". Google's India price list gives monthly free usage per product, and a small site should stay within it.

**Data:** pins are placed at the locality centre (`coordinates` in `src/data/property-details.js`, marked `locationPrecision: 'approximate'`). Once there's a key, set `streetView: true` for properties where the Street View metadata endpoint finds coverage. Fill `commuteClaims` with the builder's advertised times to show them beside the real ones.
