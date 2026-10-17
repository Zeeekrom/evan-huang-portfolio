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
| Live URL | `https://evanhuangportfolio.z44.web.core.windows.net/` |
| Deploy secret | `AZURE_STORAGE_CONNECTION_STRING` (GitHub repo secret, not in any file) |
| Workflow | [`.github/workflows/azure-storage-deploy.yml`](.github/workflows/azure-storage-deploy.yml) |

Every push to `main` runs the workflow: `npm ci` → `npm run build` → uploads `out/` to the storage account's `$web` container via `az storage blob upload-batch --overwrite`. You can also trigger it manually from the GitHub Actions tab (`workflow_dispatch`).

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
