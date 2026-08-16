# PinPoint-BinShot Result Explorer

Static site for browsing the vulnerability-search results. The query payloads live
in a private Hugging Face dataset; a small Vercel function fetches them with a
token so the data stays private while the site itself is public.

```
public/            served as the site root
  index.html
  style.css
  js/config.js     data source settings
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
