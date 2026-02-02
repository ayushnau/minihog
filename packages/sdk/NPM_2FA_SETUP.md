# Setting Up npm 2FA for Publishing

npm requires two-factor authentication (2FA) or a granular access token to publish packages.

## Option 1: Enable 2FA on npm Account (Recommended)

### Step 1: Enable 2FA on npmjs.com

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click on your profile picture → **Account Settings**
3. Go to **Two-Factor Authentication** section
4. Click **Enable 2FA**
5. Choose your preferred method:
   - **Authenticator App** (recommended - Google Authenticator, Authy, etc.)
   - **SMS** (if available)
6. Follow the setup instructions
7. Save your backup codes in a safe place

### Step 2: Login Again with 2FA

After enabling 2FA, you'll need to log in again:

```bash
npm logout
npm login
```

When you run `npm login`, it will prompt for:
- Username
- Password
- One-time password (from your authenticator app)

### Step 3: Publish

```bash
cd packages/sdk
npm publish
```

---

## Option 2: Use Granular Access Token (Alternative)

If you don't want to enable 2FA, you can create a granular access token with publish permissions.

### Step 1: Create Access Token

1. Go to [npmjs.com](https://www.npmjs.com) → **Access Tokens**
2. Click **Generate New Token**
3. Select **Granular Access Token**
4. Configure:
   - **Token name**: `minihog-sdk-publish`
   - **Expiration**: Choose your preference
   - **Type**: **Automation** (for publishing)
   - **Packages**: Select `minihog-sdk` or all packages
   - **Permissions**: Enable **Read and Publish**
   - **Bypass 2FA**: Enable this option
5. Click **Generate Token**
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Use Token for Publishing

```bash
cd packages/sdk

# Set the token as an environment variable
export NPM_TOKEN=your-token-here

# Or use .npmrc file
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Then publish
npm publish
```

**Or** use the token directly in the command:
```bash
npm publish --access public --//registry.npmjs.org/:_authToken=your-token-here
```

---

## Quick Fix: Enable 2FA (Easiest)

1. Visit: https://www.npmjs.com/settings/your-username/two-factor-auth
2. Enable 2FA with an authenticator app
3. Run `npm logout` then `npm login` again
4. Run `npm publish` in `packages/sdk`

---

## Troubleshooting

**"403 Forbidden" after enabling 2FA**
- Make sure you logged out and logged back in: `npm logout && npm login`
- Verify 2FA is enabled in your npm account settings

**"Invalid one-time password"**
- Make sure your device time is synced
- Try generating a new code from your authenticator app

**Token not working**
- Make sure the token has "Bypass 2FA" enabled
- Check token hasn't expired
- Verify token has publish permissions

