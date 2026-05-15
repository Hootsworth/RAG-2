# Hosted Demo

This project is a dependency-free static site. Any static host works. The best free options are GitHub Pages, Netlify, Cloudflare Pages, and Vercel hobby hosting.

## GitHub Pages

Recommended because the frontend is already static and you said you plan to host there.

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

Open `http://localhost:5173/public/`.
