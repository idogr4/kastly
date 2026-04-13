# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kastly — AI-powered marketing campaign generator. Users paste a business URL, the app scans it, and generates a full campaign (ad copy, images, video, landing page) then distributes to Facebook, Instagram, and LinkedIn.

## Tech Stack

- **Framework**: Next.js 16 with App Router (TypeScript)
- **Styling**: Tailwind CSS v4
- **Database/Auth**: Supabase (planned)
- **Hosting**: Vercel
- **Design direction**: Light, friendly — "Notion meets Canva"

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run start` — Serve production build
- `npm run lint` — Run ESLint

## Architecture

- `src/app/` — Next.js App Router pages and layouts
- `src/app/globals.css` — Design tokens (colors, fonts) as CSS custom properties
- Theme colors: primary (#6c5ce7 purple), accent (#fd79a8 pink), light background (#fafafa)
