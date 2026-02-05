# Quick Setup Guide

## First Time Setup

1. **Build the SDK:**
```bash
cd ../../packages/sdk
npm run build
```

2. **Install test app dependencies:**
```bash
cd ../../examples/sdk-test-app
npm install
```

3. **Start SDK in watch mode (optional, for auto-rebuild):**
```bash
# In a separate terminal
cd packages/sdk
npm run dev
```

4. **Start the test app:**
```bash
# In examples/sdk-test-app
npm run dev
```

5. **Open browser:**
Navigate to `http://localhost:3001` (or the port shown in terminal)

## Development Workflow

1. Edit SDK code in `packages/sdk/src/`
2. If using watch mode (`npm run dev`), SDK auto-rebuilds
3. If not, run `npm run build` in `packages/sdk/`
4. Refresh the test app browser
5. Test your changes!

## Tips

- Keep SDK watch mode running in a separate terminal for instant rebuilds
- Use browser DevTools console to see detailed SDK logs
- Check Network tab to see actual API requests
- The test app shows all tracked events in the log

