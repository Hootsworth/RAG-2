# Hosted Demo

This project is a dependency-free static site. Any static host works.

## Netlify

1. Create a new Netlify site from the GitHub repo.
2. Build command: leave empty.
3. Publish directory: `public`.
4. After deploy, set the demo URL in the README.

## GitHub Pages

1. Push the repo to GitHub.
2. In repository settings, enable Pages.
3. Source: deploy from branch.
4. Folder: `/public` if your Pages configuration supports it, otherwise copy the public files to a `gh-pages` branch.

## Local Preview

```bash
npm start
```

Open `http://localhost:5173/public/`.
