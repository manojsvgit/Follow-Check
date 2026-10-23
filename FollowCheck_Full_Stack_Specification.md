# FollowCheck — Full-Stack Implementation Specification

## 1. Project overview

Build **FollowCheck**, a polished, privacy-conscious web application that helps a user identify Instagram accounts they follow that do not follow them back.

The application must analyze a user's **own Instagram data export**. The user downloads their information from Instagram, uploads the ZIP file to FollowCheck, and receives a comparison report.

**Core formula**

- `NotFollowingBack = Following − Followers`
- `MutualFollows = Following ∩ Followers`
- Optionally, `FollowersNotFollowedBack = Followers − Following`

This is an export-based analyzer, not a tool for querying arbitrary Instagram accounts. Results reflect the data in the export and may not reflect changes that happened after it was generated.

## 2. Required technology stack

### Backend
- **C# with ASP.NET Core Web API**
- Target the current stable .NET LTS version available in the development environment; use .NET 10 if installed and supported, otherwise .NET 8.
- Built-in dependency injection and configuration
- `System.IO.Compression` for ZIP processing
- `System.Text.Json` for JSON parsing
- `HtmlAgilityPack` only if needed for HTML export support
- xUnit for unit and integration tests
- Swagger/OpenAPI for local API documentation

### Frontend
- **TypeScript with React and Vite**
- React Router only if multiple routes are useful
- A clean component-based architecture
- Use a consistent styling solution such as Tailwind CSS if already available, or CSS Modules/plain CSS. Do not introduce multiple competing styling systems.
- Use `fetch` or a small typed API client for backend requests
- Use a lightweight chart library only if it adds clear value; charts are not required for the MVP.

### Storage and deployment
- No database is required for the MVP.
- Do not persist uploaded exports, extracted account lists, or analysis results on the server.
- Keep processing in memory where practical and discard temporary resources immediately.
- Do not require a user account, Instagram password, access token, or OAuth connection.
- Provide Docker support only after the app works locally; do not let deployment work block the core product.

## 3. Product goals

The user should be able to:

1. Understand how to download their Instagram data export.
2. Upload an Instagram export ZIP from their own account.
3. Have the application automatically locate and parse followers and following files.
4. See summary statistics.
5. Browse accounts they follow that do not follow them back.
6. Search and filter results.
7. Open a profile link in a new tab.
8. Export results as CSV.
9. See useful, actionable errors if the export is invalid or incomplete.
10. Use the application on desktop and mobile.

## 4. Explicit scope and non-goals

### In scope
- User-uploaded Instagram data ZIP.
- JSON export format first; support HTML export format if practical and covered by tests.
- Case-insensitive username matching.
- Deduplication.
- Comparison summaries and downloadable CSV.
- Client-side progress and backend validation errors.
- Responsive, accessible interface.

### Out of scope
- Scraping Instagram pages.
- Attempting to access private or arbitrary profiles.
- Asking for Instagram credentials.
- Automatically logging into Instagram.
- Automatically unfollowing accounts.
- Circumventing rate limits, access controls, or platform restrictions.
- Claiming results are live or real-time.
- Storing users' follower data or uploaded archives.
- Requiring an external API or paid third-party service.

## 5. Expected user flow

1. User opens FollowCheck.
2. The landing page explains the tool and privacy behavior.
3. The page gives concise instructions for downloading an Instagram export through Instagram's Accounts Center. Explain that Instagram's UI may change, so link to official Instagram/Meta help pages rather than hardcoding a fragile sequence as the only method.
4. User requests an export from Instagram. Recommend selecting the relevant followers/following information and JSON format where available. If the user already has a ZIP, they can continue.
5. User selects or drags the ZIP file into the upload area.
6. Frontend validates the file extension and size for user feedback, but the backend must independently validate everything.
7. Frontend sends the ZIP to the API as `multipart/form-data`.
8. Backend safely inspects the ZIP, finds relevant follower and following files, parses usernames, and compares the lists.
9. Backend returns a structured result without retaining the uploaded data.
10. Frontend displays the dashboard and account lists.
11. User can search, filter, open profiles, or download a CSV.
12. User can start a new analysis, clearing the previous result from frontend state.

## 6. Instagram export parsing requirements

Instagram export formats can change and can differ by language, export type, and date. Do not assume one exact folder layout.

The parser should look for common filenames such as:
- `followers_1.json`, `followers_2.json`, etc.
- `following.json`
- Equivalent HTML files when HTML support is implemented, such as `followers_1.html` and `following.html`

Files may be nested inside directories such as `connections/followers_and_following/`, but the implementation must discover files by normalized path and filename rather than assuming a fixed root folder.

### JSON structure handling

The parser must support common export structures where follower entries are objects containing a `string_list_data` array and username information appears in `value`, and where the following file may wrap entries under a `relationships_following` property. Treat these as known patterns, not guaranteed schemas.

Implementation rules:
- Inspect the supplied JSON using `JsonDocument` or a well-defined DTO model.
- Traverse supported structures deliberately; do not silently treat every arbitrary string as a username.
- Collect all numbered follower files (`followers_1`, `followers_2`, and so on) and combine them.
- Identify the following file separately.
- Normalize usernames by trimming whitespace and removing a leading `@` if present.
- Reject empty values and values that are clearly not usernames.
- Deduplicate usernames case-insensitively.
- Avoid depending on display names or profile URLs as the primary comparison key when a username is present.
- If the export structure is unknown, return a helpful `UnsupportedExportFormat` error rather than an empty success response.
- Do not assume that a file is valid just because its filename matches.

### HTML support

If implementing HTML parsing:
- Use an HTML parser such as HtmlAgilityPack; do not use brittle regex-only HTML parsing.
- Support only clearly recognized Instagram export layouts.
- Add fixture-based tests for representative HTML samples.
- If robust support cannot be completed, document JSON as the supported format and return a helpful error for HTML exports rather than pretending they work.

### Parser result model

Create a model similar to:

```csharp
public sealed record InstagramExportData(
    IReadOnlyList<string> Followers,
    IReadOnlyList<string> Following);
```

Also create a parse result/error model that distinguishes:
- Missing followers file
- Missing following file
- Unsupported export format
- Malformed ZIP
- Malformed JSON
- Empty or unrecognized data
- Upload too large
- Invalid file type

If multiple numbered follower files exist, merge them all. If any required part is missing, explain which one is missing.

## 7. Backend architecture

Use a maintainable but appropriately lightweight layered structure:

```text
FollowCheck/
├── backend/
│   ├── FollowCheck.Api/
│   │   ├── Controllers/
│   │   │   └── InstagramController.cs
│   │   ├── Contracts/
│   │   │   ├── AnalyzeResponse.cs
│   │   │   └── ApiErrorResponse.cs
│   │   ├── Services/
│   │   │   ├── IInstagramExportParser.cs
│   │   │   ├── InstagramExportParser.cs
│   │   │   ├── IFollowComparisonService.cs
│   │   │   └── FollowComparisonService.cs
│   │   ├── Validation/
│   │   │   └── UploadValidation.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   └── FollowCheck.Tests/
│       ├── Unit/
│       ├── Integration/
│       └── Fixtures/
└── frontend/
    └── followcheck.client/
        ├── src/
        │   ├── api/
        │   ├── components/
        │   ├── features/
        │   │   └── analysis/
        │   ├── hooks/
        │   ├── types/
        │   ├── utils/
        │   ├── App.tsx
        │   └── main.tsx
        ├── package.json
        └── vite.config.ts
```

You may adjust this structure if there is a simpler idiomatic layout, but keep parsing, comparison, API contracts, and UI components separated. Avoid overengineering with unnecessary microservices, CQRS, MediatR, or a database.

## 8. API design

### `POST /api/instagram/analyze`

Content type: `multipart/form-data`

Form field:
- `file`: Instagram data export ZIP

Success response (`200 OK`) example:

```json
{
  "followersCount": 791,
  "followingCount": 842,
  "mutualFollowsCount": 716,
  "notFollowingBackCount": 126,
  "followersNotFollowedBackCount": 75,
  "notFollowingBack": [
    {
      "username": "example_user",
      "profileUrl": "https://www.instagram.com/example_user/"
    }
  ],
  "mutualFollows": [
    {
      "username": "another_user",
      "profileUrl": "https://www.instagram.com/another_user/"
    }
  ],
  "followersNotFollowedBack": [
    {
      "username": "someone_else",
      "profileUrl": "https://www.instagram.com/someone_else/"
    }
  ],
  "warnings": []
}
```

Counts and sample usernames above are illustrative only. Derive all values from the uploaded export.

For large exports, avoid returning huge lists by default. Prefer pagination or a configurable maximum response size if needed. If pagination is implemented, make the API contract and frontend consistent. For an initial MVP, returning the full result is acceptable under a documented upload limit, but do not assume all exports are small.

### Error response

Use a consistent structure, for example:

```json
{
  "code": "MissingFollowingFile",
  "message": "We could not find your following list in this export.",
  "details": []
}
```

Use appropriate status codes:
- `400 Bad Request` for invalid upload, missing files, malformed ZIP/JSON, or unsupported format.
- `413 Payload Too Large` for uploads exceeding the configured size limit.
- `500 Internal Server Error` only for unexpected failures, with no stack trace or sensitive data exposed to the user.

Do not return a `200 OK` response with zero accounts when parsing failed.

### API implementation details
- Configure a reasonable maximum upload size, e.g. 50 MB initially, and make it configurable.
- Enforce limits both at the request and ZIP-entry levels.
- Avoid ZIP bombs: cap total uncompressed size, number of entries, and individual entry size; reject suspicious archives.
- Do not extract ZIP contents to a filesystem directory. Read relevant entries as streams and dispose of them properly.
- Ignore unrelated files in the archive.
- Never trust the filename or MIME type alone.
- Use cancellation tokens for upload and parsing operations.
- Use structured logging, but never log usernames, file contents, raw export data, or the uploaded filename if it may contain personal information.
- Add CORS configuration for the local frontend origin through configuration, not a wildcard in production.
- Enable Swagger in development.
- Add a health endpoint such as `GET /health`.
- Do not enable permissive production CORS or expose detailed exception pages in production.

## 9. Comparison logic

Use case-insensitive sets for matching:

```csharp
var followerSet = new HashSet<string>(
    followers,
    StringComparer.OrdinalIgnoreCase);

var followingSet = new HashSet<string>(
    following,
    StringComparer.OrdinalIgnoreCase);

var notFollowingBack = followingSet
    .Except(followerSet, StringComparer.OrdinalIgnoreCase)
    .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
    .ToList();

var mutualFollows = followingSet
    .Intersect(followerSet, StringComparer.OrdinalIgnoreCase)
    .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
    .ToList();

var followersNotFollowedBack = followerSet
    .Except(followingSet, StringComparer.OrdinalIgnoreCase)
    .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
    .ToList();
```

Ensure counts are based on unique normalized usernames. Avoid counting duplicates. Treat the same username with different casing as the same account. Do not infer that an account has unfollowed the user unless comparing against an earlier export; the initial analysis only shows current differences in the supplied snapshot.

## 10. Frontend design and user experience

Create a polished, modern, trustworthy product UI. It should feel like a real product rather than a default scaffold.

### Visual direction
- Clean, minimal layout with generous spacing.
- Use a neutral light background, strong readable typography, and restrained accent colors inspired by social-product dashboards. Avoid copying Instagram's exact UI.
- Responsive from mobile through desktop.
- Subtle transitions and clear focus states; no excessive animation.
- Consistent design tokens for colors, spacing, borders, radii, and shadows.
- Accessible color contrast and keyboard navigation.

### Required screens/states

#### A. Landing / upload screen
- Product wordmark: FollowCheck.
- Headline explaining the benefit, e.g. “Find out who doesn't follow you back.”
- Short explanation: “Analyze your own Instagram data export. No Instagram password required.”
- Three concise steps explaining how it works.
- Upload dropzone supporting drag-and-drop and file selection.
- Show selected filename and file size before submission.
- Upload/analyze button.
- Clear maximum upload size.
- Privacy note: uploaded data is processed for analysis and not intentionally stored.
- Link to instructions for obtaining the export from Instagram.
- Explain that results are based on the export date and are not live.

#### B. Loading state
- Show progress messaging such as “Validating export”, “Reading account lists”, and “Comparing accounts”.
- Do not fake a precise percentage if the backend doesn't provide progress.
- Disable duplicate submissions while a request is in progress.
- Allow the user to cancel if practical.

#### C. Results dashboard
- Summary cards for Followers, Following, Mutual follows, and Don't follow back.
- A clearly visible result count.
- Tabs or segmented controls for:
  - Don't follow back
  - Mutual follows
  - Followers you don't follow back
- Search field that filters the currently selected list.
- Sort alphabetically.
- Each account row shows `@username` and an “Open profile” link.
- Use `target="_blank"` with `rel="noopener noreferrer"` for external profile links.
- Provide “Download CSV” for the active list or separate clearly labeled downloads.
- Provide a “Analyze another export” action that resets the current result.
- Show an empty state if the comparison produces no accounts in a category.
- Show a notice that data comes from the uploaded export snapshot.

#### D. Error states
- Wrong file type
- File too large
- Malformed ZIP
- Missing followers list
- Missing following list
- Unsupported or unrecognized export format
- Network/API error
- Unexpected server error

Error copy should be clear, nontechnical, and actionable. Keep developer details out of user-facing messages.

#### E. Privacy and help section
- State that the app never asks for an Instagram password.
- Explain what is processed and whether anything is stored.
- Link to Instagram/Meta's official export instructions.
- Do not imply affiliation with or endorsement by Instagram/Meta.

### Frontend engineering standards
- Strict TypeScript; avoid `any`.
- Define API request/response types.
- Separate API calls from presentation components.
- Use reusable components for cards, upload dropzone, tabs, search, account rows, errors, and empty states.
- Add loading, success, error, and empty states.
- Validate at the UI level for helpful feedback, but trust only backend validation.
- Ensure all buttons work; no dead controls or placeholder links.
- Implement CSV escaping correctly, including commas, quotes, and newlines.
- Revoke any generated object URLs when no longer needed.
- Don't keep the ZIP file in local storage, session storage, or IndexedDB.
- Clear in-memory results when the user resets the analysis or leaves the workflow, where practical.

## 11. CSV export

CSV export should include at least:
- `username`
- `profile_url`

Use a standard CSV escaping function. For example, values containing quotes must have internal quotes doubled and the field wrapped in quotes. Prefix values that could be interpreted as spreadsheet formulas (`=`, `+`, `-`, `@`, tab, or carriage return at the start) when generating a spreadsheet-oriented CSV to reduce formula-injection risk. Document this behavior if it changes the raw username representation.

The filename should describe the exported category, e.g. `followcheck-not-following-back.csv`.

## 12. Security and privacy requirements

Treat exports as sensitive personal data.

- No Instagram password, session cookie, access token, or authentication credential collection.
- No server-side persistence of ZIPs or account lists.
- No logging of account lists or raw JSON/HTML.
- No analytics that capture usernames or exported data.
- Limit upload size and archive expansion.
- Validate archive entry paths; never extract untrusted paths to disk.
- Do not render uploaded HTML directly in the browser.
- Escape all user-derived strings in UI rendering.
- Build profile URLs only from a validated normalized username, using the fixed `https://www.instagram.com/{username}/` base URL.
- Configure appropriate request timeouts and cancellation.
- Return generic unexpected-error messages to clients.
- Add a short privacy notice explaining that data is sent to the app's backend for processing. Do not claim processing is entirely local if the ZIP is sent to the backend.
- If the app is deployed publicly, provide a privacy policy and basic abuse protection/rate limiting before inviting broad usage.
- Never promise absolute security. Clearly explain actual processing behavior.

## 13. Testing requirements

### Comparison service unit tests
- Both lists empty.
- Following contains accounts that all follow back.
- Following contains accounts that do not follow back.
- Followers contain accounts the user does not follow.
- Duplicate usernames.
- Case-insensitive username matching.
- Empty/whitespace usernames are rejected or removed during normalization.
- Results are deterministically sorted.
- Counts align with unique normalized sets.

### Parser unit tests
Use small, synthetic fixture ZIPs/JSON/HTML files. Do not use real personal Instagram exports in committed tests.

Test:
- Valid JSON export with standard structure.
- Multiple numbered follower files.
- Nested folder structure.
- Missing followers file.
- Missing following file.
- Malformed JSON.
- Malformed ZIP.
- Empty archive.
- Unrecognized JSON shape.
- Duplicate entries across files.
- Uppercase/mixed-case usernames.
- Very large entry / too many entries / suspicious expansion.
- Unrelated files in archive are ignored.
- Supported HTML format if implemented.

### API integration tests
- Valid upload returns expected result.
- Invalid extension/content is rejected.
- Oversized upload is rejected.
- Parser errors return correct status and error code.
- Unexpected errors do not leak stack traces.
- No uploaded file is persisted.
- CORS behavior is correct for configured frontend origins.

### Frontend tests
At minimum, test:
- File selection and invalid file feedback.
- Upload pending state.
- Successful result rendering.
- Search filtering.
- Tab switching.
- Empty state.
- CSV download.
- Error response display.
- Reset/new analysis action.

Use the testing tools already configured in the repository if present; otherwise choose a reasonable setup such as Vitest and React Testing Library.

## 14. Developer experience and documentation

Create a root `README.md` that includes:
- Product description and feature list.
- Architecture overview.
- Prerequisites.
- Exact commands to run the backend and frontend locally.
- Configuration and environment variables.
- API endpoint documentation and example response.
- How to run backend and frontend tests.
- Supported export formats and known limitations.
- Privacy and security behavior.
- Troubleshooting instructions.
- Deployment notes.
- Clear disclaimer that results represent the uploaded export snapshot and may be outdated.

Include an `.env.example` for frontend configuration if needed, but do not commit secrets. Use `appsettings.Development.json` only for safe local settings. Keep CORS origins and upload limits configurable.

## 15. Suggested implementation order

Work in small, verifiable phases:

1. Inspect the repository and current environment before making changes.
2. Create the backend solution and comparison service.
3. Add unit tests for comparison logic and get them passing.
4. Implement ZIP discovery and JSON parsing with synthetic fixtures.
5. Add safe upload validation and the analyze endpoint.
6. Add backend integration tests and run all backend tests.
7. Scaffold the React + TypeScript frontend.
8. Implement the upload flow and typed API client.
9. Implement the results dashboard, search, tabs, and CSV downloads.
10. Add frontend tests and run them.
11. Run formatting, linting, tests, and a production build.
12. Write the README with verified commands and limitations.
13. If possible, run the complete app locally and fix errors before declaring completion.

After each phase, report what was implemented and run relevant tests. Do not merely generate a plan or sample snippets: implement the application in the repository.

## 16. Acceptance criteria

The project is complete when:

- The backend is written in C# using ASP.NET Core Web API.
- The frontend is written in TypeScript using React.
- A user can upload a supported Instagram export ZIP.
- The parser finds and reads all supported followers and following files.
- The comparison results are correct, case-insensitive, and deduplicated.
- The results dashboard displays the correct counts and lists.
- Search, category switching, profile links, CSV downloads, and reset work.
- Invalid inputs receive clear errors.
- Upload size and ZIP expansion are limited.
- The server does not persist exports or extracted follower data.
- Automated backend and frontend tests pass.
- The README explains setup, usage, limitations, and privacy.
- No functionality is falsely presented as live Instagram access.

## 17. Instructions to the coding agent

Before coding:
- Inspect the existing repository, installed SDKs, package managers, and current project conventions.
- Preserve existing working code if this is not a blank repository.
- Check which .NET SDK is installed and target a compatible supported version.
- If a key decision is ambiguous, choose the simplest secure default and document it rather than stopping for minor questions.

While coding:
- Implement production-quality, readable code with sensible naming.
- Avoid unnecessary abstractions and dependencies.
- Do not hardcode secrets, credentials, or machine-specific paths.
- Do not invent API capabilities that Instagram does not provide.
- Do not leave TODOs for core requirements.
- Keep backend and frontend contracts consistent.
- Run tests and builds, and fix failures rather than only reporting them.
- Do not claim a test passed unless it was actually run and passed.
- If a requirement cannot be completed, explain exactly what remains and why.

At completion, provide:
1. A concise summary of what was built.
2. The final project structure.
3. Exact commands to run backend and frontend.
4. The test/build commands and actual results.
5. Supported Instagram export formats and any limitations.
6. Security/privacy decisions.
7. Any remaining issues.

**Now implement FollowCheck end-to-end according to this specification. Start by inspecting the repository and environment, then proceed phase by phase.**
