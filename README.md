# FollowCheck

FollowCheck analyzes your **own Instagram data export** and shows which accounts you follow that don't follow you back. It is a single client-side website: React + TypeScript + Vite. There is no server and no API. Your ZIP is opened and compared inside your browser and never uploaded.

> **Results are a snapshot.** They reflect the date the export was generated, not live Instagram data, and may be outdated.

FollowCheck is an independent tool, not affiliated with or endorsed by Instagram or Meta. It never asks for an Instagram password and never contacts Instagram.

## Features

- Choose or drag in an export ZIP, with early file-type and size feedback
- Summary: followers, following, mutual follows, don't follow back
- Three lists in a card grid: don't follow back, mutual follows, followers you don't follow back
- Search, A–Z / Z–A sort, "Open profile" buttons, CSV download per list
- Clear, plain-language errors; responsive and keyboard accessible

```
NotFollowingBack         = Following − Followers
MutualFollows            = Following ∩ Followers
FollowersNotFollowedBack = Followers − Following
```

Matching is case-insensitive and deduplicated.

## Project layout

```
src/lib/          parser.ts (ZIP + JSON), compare.ts, analyze.ts
src/components/   Dropzone, Tabs, SummaryCards, AccountList, ErrorNotice, ...
src/features/     upload, loading, results screens
src/hooks/        useAnalysis (idle / loading / success / error)
src/utils/        CSV escaping + download, file validation, error copy
archive/          the earlier ASP.NET Core version (unused, safe to delete)
```

## Run locally

Prerequisite: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Tests and build

```bash
npm test           # Vitest + React Testing Library
npm run lint
npm run build      # outputs dist/
npm run preview    # serve the production build locally
```

## Supported export formats and limitations

- **JSON export only.** Files are found by name anywhere in the ZIP: `followers_1.json`, `followers_2.json`, … and `following.json`. Usernames are read from `string_list_data[].value`, or from the entry `title` or profile link when `value` is missing. `relationships_following` wrappers are handled.
- **HTML exports are not supported.** The user is asked to re-export as JSON.
- Instagram changes its export layout from time to time. Unrecognized shapes show an error instead of empty results.
- Entries without a valid username (letters, digits, `.`, `_`, up to 30 characters) are skipped, and a warning says how many.
- Limits: 50 MB ZIP, 10,000 entries, 100 MB per file. Only the followers and following files are ever unpacked. Sizes come from the ZIP header, so a deliberately crafted archive could still use more memory in the user's own tab than declared.
- Only the current snapshot is compared. The app cannot say who *unfollowed* you.
- Instagram exports contain no profile pictures, so cards show a coloured initial instead.

## Privacy and security

- No Instagram password, cookie or token is requested.
- The ZIP is read in the browser and never sent anywhere. Nothing is stored in local storage, session storage or IndexedDB; refreshing clears the results.
- No analytics or tracking is included.
- Profile URLs are built only from validated usernames on `https://www.instagram.com/`. Links use `rel="noopener noreferrer"`.
- CSV export doubles quotes and prefixes `'` to fields starting with `=`, `+`, `-`, `@`, tab or CR to prevent spreadsheet formula injection.

## Deploy

`npm run build` produces a static `dist/` folder. Upload it to any static host: Cloudflare Pages, Netlify, Vercel, GitHub Pages, or Azure Static Web Apps. No environment variables are needed. For Netlify or Cloudflare Pages, set the build command to `npm run build` and the output directory to `dist`.

## Troubleshooting

- **"Missing followers/following list"**: request an export that includes *Followers and following*, in **JSON**.
- **"Not a ZIP" for a real export**: Instagram may deliver several ZIP parts for large accounts. Upload the part that contains `followers_and_following`.
- **"Too large"**: request only followers and following in the export.
