# Publishing MiniHog SDK to npm

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://www.npmjs.com/signup) if you don't have one
2. **Login to npm**: `npm login` (from your terminal)
3. **Check package name availability**: The name `minihog-sdk` might be taken. You may need to use a scoped package like `@yourusername/minihog-sdk`

## Step 1: Check Package Name Availability

```bash
cd packages/sdk
npm view minihog-sdk
```

If it returns 404, the name is available. If it returns package info, the name is taken.

**If name is taken**, update `package.json` to use a scoped package:
```json
{
  "name": "@yourusername/minihog-sdk",
  ...
}
```

## Step 2: Update package.json

Make sure these fields are filled:
- `author`: Your name/email
- `repository.url`: Your GitHub repo URL
- `version`: Start with `1.0.0` for first release

## Step 3: Build the Package

```bash
cd packages/sdk
npm run build
```

Verify `dist/` folder contains all compiled files.

## Step 4: Test the Package Locally (Optional)

```bash
# Create a test package
npm pack

# This creates a .tgz file you can test
# In another project: npm install /path/to/minihog-sdk-1.0.0.tgz
```

## Step 5: Login to npm

```bash
npm login
```

Enter your npm credentials.

## Step 6: Publish

### For Public Package (unscoped):
```bash
npm publish
```

### For Scoped Package (@yourusername/minihog-sdk):
```bash
npm publish --access public
```

## Step 7: Verify

```bash
npm view minihog-sdk
# or
npm view @yourusername/minihog-sdk
```

## Updating the Package

1. Update version in `package.json`:
   - Patch: `1.0.1` (bug fixes)
   - Minor: `1.1.0` (new features)
   - Major: `2.0.0` (breaking changes)

2. Rebuild and publish:
   ```bash
   npm run build
   npm publish
   ```

## Important Notes

- **Version**: Follow semantic versioning (semver)
- **Files**: Only files listed in `files` array will be published
- **README**: Include a good README.md for npm
- **License**: Make sure LICENSE file exists if using MIT license

## Troubleshooting

**"Package name already exists"**
- Use a scoped package: `@yourusername/minihog-sdk`
- Or choose a different name

**"You must verify your email"**
- Check your npm account email and verify it

**"403 Forbidden"**
- Make sure you're logged in: `npm whoami`
- Check you have publish permissions

