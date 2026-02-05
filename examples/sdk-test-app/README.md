# MiniHog SDK Test App

A Next.js test application for developing and testing the MiniHog SDK locally with hot reload.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Make sure SDK is built:**
```bash
# From root
cd packages/sdk
npm run build

# Or use watch mode for auto-rebuild
npm run dev
```

3. **Start the test app:**
```bash
npm run dev
```

The app will be available at `http://localhost:3001` (or next available port)

## How It Works

- The app uses `file:../../packages/sdk` to link to the local SDK package
- Changes to SDK source code require a rebuild (`npm run build` in `packages/sdk`)
- Use `npm run dev` in SDK for watch mode (auto-rebuilds on changes)
- Refresh the test app to see SDK changes

## Features

- ✅ Initialize SDK with different environments
- ✅ Track events with custom properties
- ✅ Track page views, button clicks, form submissions, and other interactions
- ✅ Track events with button IDs, page paths, and contextual information
- ✅ Manual flush events
- ✅ View event logs
- ✅ Quick test buttons for common events
- ✅ Real-time SDK status

## Development Workflow

1. Make changes to SDK in `packages/sdk/src/`
2. Run `npm run build` in `packages/sdk/` (or use `npm run dev` for watch mode)
3. Refresh the test app browser
4. Test your changes!

## Troubleshooting

**SDK changes not reflecting?**
- Make sure you've rebuilt the SDK (`npm run build` in `packages/sdk/`)
- Clear Next.js cache: `rm -rf .next`
- Restart the test app

**Module not found errors?**
- Run `npm install` again to re-link the SDK
- Check that `packages/sdk/dist/` exists and has built files

