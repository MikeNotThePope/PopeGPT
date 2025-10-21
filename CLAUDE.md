# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PopeGPT is an AI-powered application built with Flowbite UI components and the OpenRouter API.

## Environment Configuration

- **API Key**: OpenRouter API key is stored in `.env` as `OPENROUTER_API_KEY`
- The `.env` file is gitignored and should never be committed

## Flowbite Templates

The project includes two Flowbite Pro templates (currently as zip files, gitignored):
- `flowbite-admin-dashboard-v2.2.0.zip` - Admin dashboard components built with Hugo
- `flowbite-pro-landing-pages-v1.2.0.zip` - Marketing/landing page components built with Hugo

Both templates use:
- Hugo static site generator
- Tailwind CSS for styling
- Webpack for bundling
- PostCSS for CSS processing

### Template Structure (once extracted)
- `content/` - HTML page templates organized by category (e-commerce, authentication, users, etc.)
- `layouts/` - Hugo layout templates
- `static/` - Static assets
- `src/` - Source files for compilation
- `package.json` - Node dependencies and build scripts
- `webpack.config.js` - Webpack configuration
- `config.yml` - Hugo configuration

## Development Status

This is an early-stage project. The Flowbite templates have not yet been extracted or integrated into the main project structure.
