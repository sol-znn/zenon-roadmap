# zenon-roadmap

A one-page site that explains a community plan for Network of Momentum Phase 1: what
to build, in what order, and the decisions ahead. It is plain HTML, CSS and JavaScript,
with no build step and no dependencies outside this folder.

## Preview locally

Any static file server works. From this folder:

```console
python -m http.server 8137
```

Then open http://localhost:8137.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, open Settings, then Pages.
3. Under "Build and deployment", choose "Deploy from a branch", then the `main` branch
   and the `/ (root)` folder.

The `.nojekyll` file tells Pages to serve the files as they are.

## What is in it

| Path | What it is |
|---|---|
| `index.html` | All the content, including the schedule as Mermaid text |
| `assets/style.css` | Colours and type from the Zenon design system, copied in |
| `assets/app.js` | Live momentum readings and the schedule drawing |
| `assets/fonts/` | Space Grotesk and JetBrains Mono, with their SIL Open Font Licenses |
| `assets/vendor/` | Mermaid 11.17.2, with its MIT license, loaded only near the schedule |

## Live data

The hero reads mainnet from two public nodes, `node.zenonhub.io` and `my.hc1node.com`.
Both answer JSON-RPC over HTTPS and allow requests from any website. If neither answers,
the page shows an estimate and says so.

## Editing

- Keep the writing plain and short, with no em dashes.
- Cite an external source for every claim a reader might want to check. Sources are
  numbered at the bottom of `index.html`.
- The schedule is the Mermaid block in `index.html`. After changing it, open the page
  and check that the chart draws. A mistake shows as an error message instead of a chart.
