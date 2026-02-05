# Publishing MiniHog SDK to npm

📦 **Published Package**: [minihog-sdk](https://www.npmjs.com/package/minihog-sdk)

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://www.npmjs.com/signup) if you don't have one
2. **2FA Enabled**: npm requires 2FA for publishing. See [NPM_2FA_SETUP.md](./NPM_2FA_SETUP.md)
3. **Login to npm**: `npm login` (from your terminal)
4. **Package name**: The package is published as `minihog-sdk`

> **Note:** Run all commands from the `packages/sdk` directory.

## Step 1: Verify Current Package

```bash
cd packages/sdk
npm view minihog-sdk
```

This shows the current published version and package info.

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
- **Files**: Only files listed in `files` array in `package.json` will be published
- **README**: README.md is automatically included and shown on npm
- **License**: MIT license is specified in package.json
- **2FA Required**: npm requires 2FA for publishing. See [NPM_2FA_SETUP.md](./NPM_2FA_SETUP.md) if you encounter 403 errors

## Related Documentation

- [SDK README](../README.md) - SDK usage and API reference
- [NPM_2FA_SETUP.md](./NPM_2FA_SETUP.md) - 2FA setup guide

## Current Package Info

- **Name**: `minihog-sdk`
- **Registry**: https://www.npmjs.com/package/minihog-sdk
- **Install**: `npm install minihog-sdk`

## Troubleshooting

**"Package name already exists"**
- Use a scoped package: `@yourusername/minihog-sdk`
- Or choose a different name

**"You must verify your email"**
- Check your npm account email and verify it

**"403 Forbidden"**
- Make sure you're logged in: `npm whoami`
- Check you have publish permissions
- **2FA Required**: npm requires 2FA for publishing. See [NPM_2FA_SETUP.md](./NPM_2FA_SETUP.md)

