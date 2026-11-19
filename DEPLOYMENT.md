# Deployment — Azure Storage Static Website (Azure for Students)

## Why this approach

The original plan was Azure Static Web Apps (Free tier). That's still the best option **if your subscription allows it** — but this UTAS Azure for Students subscription has a region policy that only permits: `koreacentral`, `japaneast`, `indonesiacentral`, `newzealandnorth`, `malaysiawest`. Static Web Apps only exists in `centralus`, `eastus2`, `westus2`, `westeurope`, `eastasia` — no overlap, so it can't be created on this subscription.

Instead, this site is hosted on **Azure Storage's static website feature**, which is available in all the allowed regions. Cost is effectively $0 for a personal portfolio (a few MB of static files, minimal bandwidth) — nowhere close to using the $100 student credit.

## What's already set up

| Resource | Value |
|---|---|
| Resource group | `personal-website-rg` |
| Storage account | `evanhuangportfolio` (region: `newzealandnorth`) |
| Static website | enabled, index doc `index.html`, error doc `404.html` |
| Live URL | `https://evanh.dev/` |
| Deploy secret | `AZURE_STORAGE_CONNECTION_STRING` (GitHub repo secret, not in any file) |
| Workflow | [`.github/workflows/azure-storage-deploy.yml`](.github/workflows/azure-storage-deploy.yml) |

Every push to `main` runs the workflow: `npm ci` → `npm run build` → uploads `out/` to the storage account's `$web` container via `az storage blob upload-batch --overwrite`. You can also trigger it manually from the GitHub Actions tab (`workflow_dispatch`).

## evanh.dev

The site answers at `https://evanh.dev`, and that is the address to give out.
`www.evanh.dev` is live too and sends a 301 to the apex with the path kept; the
rule for that lives in the zone (Rules -> Redirect Rules), not in this
repository, because Cloudflare's `_redirects` matches a path and not a hostname.

One build goes to two hosts. Cloudflare Pages project `evanh-dev` is the new
home; the Azure Storage static website keeps answering because the old URL is in
a resume, on LinkedIn and in an email signature, and Azure Storage cannot
redirect. Every canonical tag points at evanh.dev, so a search engine reads the
two copies as one page. Retire the Azure copy once those three are replaced.

The apex took a night to appear. Its CNAME was in the zone and Proxied and the
Pages custom domain read Active, but no A record was published for hours;
toggling the proxy did nothing and it resolved on its own overnight. If it ever
happens again, that is the shape of it: wait before deleting anything.

The Function App stays on Azure. `ALLOWED_ORIGINS` carries `https://evanh.dev`
and `https://www.evanh.dev` alongside the old URL.

## Custom domain (optional, later)

Azure Storage static websites don't support custom domains/HTTPS directly — for that you'd put **Azure CDN** or **Azure Front Door** in front of the storage endpoint, both of which work in more regions than Static Web Apps and would work here too. Not set up yet; ask if you want this added.

## If you get the region policy lifted

If UTAS IT ever adds `eastasia` (or another Static Web Apps region) to the subscription's allowed locations, migrating to Static Web Apps later is straightforward — it's a from-scratch resource creation (`az staticwebapp create --source https://github.com/Zeeekrom/personal-website --branch main --app-location "/" --output-location "out" --sku Free --login-with-github`), and you'd retire the storage account afterward (`az group delete -n personal-website-rg`).

## Manual redeploy / troubleshooting

```bash
npm run build
az storage blob upload-batch \
  --account-name evanhuangportfolio \
  --destination '$web' \
  --source out \
  --overwrite \
  --auth-mode login
```

Check current static website config:

```bash
az storage blob service-properties show --account-name evanhuangportfolio --auth-mode login
```
