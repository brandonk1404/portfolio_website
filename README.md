# Brandon Kreitsch — Portfolio

A minimal, modern gallery site for your design portfolio.

## What’s included

- **Work** — 18 pieces from your portfolio (images extracted from your PPTX). Edit titles/categories in `index.html` (search for “Work 1”, “Work 2”, etc.).
- **Resume** — Your PDF is linked: `Brandon_Kreitsch_Resume.pdf`. The on-page experience/education/skills are placeholders; update them in `index.html` to match your resume or leave as-is and let the PDF be the source of truth.
- **About** — Short bio (edit text in `index.html`).
- **Contact** — Email and social links. Update the email and replace `#` with your Instagram, LinkedIn, Behance, Dribbble URLs.

## Run locally

Open `index.html` in a browser, or use a simple server:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Tech

- Plain HTML, CSS, and JavaScript
- Google Fonts: Roboto (headings), Inter (body)
- No build step; easy to host on any static host (Netlify, Vercel, GitHub Pages, etc.)
