# Hosted Demo

This project has two deployment shapes:

- Static-only frontend from `main`.
- Backend-backed production branch from `production-backend`.

The backend-backed branch can run as one Render web service that serves both the API and frontend from the same origin.

## Render Backend + Frontend

This is the cleanest production-style demo.

1. Push the `production-backend` branch to GitHub.
2. Go to Render and choose `New -> Blueprint`.
3. Select the GitHub repo.
4. Render will detect `render.yaml`.
5. Confirm the free web service.
6. Wait for deploy to finish.
7. Open the Render URL. It will serve the frontend and `/api/*` backend from the same domain.

Expected local-equivalent commands:

```bash
npm install
npm start
```

Render settings from `render.yaml`:

```text
buildCommand: npm install
startCommand: npm start
plan: free
```

## GitHub Pages Frontend + Render Backend

Use this if you specifically want GitHub Pages for the frontend and Render for the backend.

1. Deploy the backend on Render using the steps above.
2. Copy the Render URL, for example `https://memory-os-rag-backend.onrender.com`.
3. In `public/config.js`, set:

```js
window.MEMORY_OS_API_BASE = "https://your-render-url.onrender.com";
```

4. Push the change to the branch used by GitHub Pages.
5. In GitHub, go to `Settings -> Pages`.
6. Select `GitHub Actions`.
7. Wait for the included Pages workflow to publish `public/`.

If `MEMORY_OS_API_BASE` is empty, the frontend first tries same-origin API calls and then falls back to browser-local demo logic.

## GitHub Pages

Recommended for the static-only project, or for the frontend half of the backend-backed project.

1. Push this repo to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings -> Pages`.
4. Under `Build and deployment`, choose `GitHub Actions`.
5. The included workflow at `.github/workflows/pages.yml` publishes the `public/` folder.
6. Push to `main`, then open the `Actions` tab and wait for `Deploy static frontend to GitHub Pages`.
7. Your URL will look like `https://hootsworth.github.io/RAG-2/`.

## Netlify

1. Create a new Netlify site from the GitHub repo.
2. Build command: leave empty.
3. Publish directory: `public`.
4. After deploy, set the demo URL in the README.

## Netlify Free

1. Go to Netlify and choose `Add new site -> Import an existing project`.
2. Select the GitHub repo.
3. Build command: leave empty.
4. Publish directory: `public`.
5. Deploy. Netlify's free tier is enough for this static project.

## Other Free Options

- Cloudflare Pages: publish directory `public`, no build command.
- Vercel Hobby: framework preset `Other`, output directory `public`.

## Local Preview

```bash
npm start
```

Open `http://localhost:5173/`.
