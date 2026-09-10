# Pinpoint Result Visualizer

Static site for browsing the vulnerability-search results. The query payloads live
in a private Hugging Face dataset; a small Vercel function fetches them with a
token so the data stays private while the site itself is public.

```
public/            served as the site root
  index.html
  style.css
  fonts/           Inter and JetBrains Mono, self-hosted (see Fonts below)
  js/config.js     data source settings
  js/welcome.js    the first-load guide: how to read the page + the paper's cases
  js/examples.js   deep links for the Figure 6 case studies (edit these to retarget)
  data/            file and query lists (small, committed here)
api/data.py        proxies the private dataset, holding HF_TOKEN server-side
```

## Deploying

1. Push this folder to GitHub.
2. Import the repo on Vercel. Framework preset **Other**, no build command.
3. Add two environment variables in the Vercel project settings:

   | name | value |
   |---|---|
   | `HF_REPO` | `xininny/Pinpoint` |
   | `HF_TOKEN` | a Hugging Face access token with read permission |

   `HF_REVISION` is optional and defaults to `main`.

The token is only ever read inside `api/data.py`, which runs on Vercel's servers.
It never reaches the browser.

## How a page load works

```
browser  ──/api/data?path=regular/<target>/q3.json.gz──►  api/data.py
                                                            │ Authorization: Bearer HF_TOKEN
                                                            ▼
                                                    Hugging Face (private)
browser  ◄────────────── file relayed back ──────────────────┘
```

`public/data/` holds only the file and query lists, so the site can draw its two
left panels before touching the dataset. Everything heavier is fetched per query
through the proxy.

## Uploading the dataset

From the `vuln_viz` working copy, after `tools/export_static.py` finishes:

```bash
hf upload xininny/Pinpoint dist/bulk . --repo-type=dataset
```

Regenerate this folder any time with `tools/make_site.sh`.

## First-load guide

With no query string, the right pane shows a guide instead of empty placeholders.
It opens with what PinPoint does, then two columns: how to read the four panes on
the left, and how the staged sliding-window search works on the right, with an
annotated sketch of a chart. Under the first column, the four case studies from
Figure 6 of the paper are plain links straight into the view each one discusses.

The header title is a link back to this state, and the **Guide & examples** button
brings the guide back at any time.

The cases live in `public/js/examples.js` as `{db, file, idx, target}` plus the
headline and hover text shown on the link. Selections keep the URL in sync
(`?db=&file=&idx=&target=`), so any view can be shared or added to that list.

## Fonts

`public/fonts/` holds Inter and JetBrains Mono as woff2 subsets, served from this
origin so the page depends on no third party and works offline. Both are under the
SIL Open Font License 1.1, which permits redistribution and self-hosting; the
licences sit beside the files as `LICENSE-Inter.txt` and
`LICENSE-JetBrainsMono.txt`, and must stay there.

## Running it locally

There is no build step. Serve `public/` with any static server and point
`/api/data?path=...` at either a local copy of the bulk export or the Vercel
function. `vercel dev` does both at once if the CLI is installed.
