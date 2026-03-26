/**
 * babel.config.js  —  SHARED build config, committed to git
 *
 * Required at the project root by Expo/Metro.  Applied for ALL builds
 * (development and production) by every developer on the project.
 *
 * Plugins:
 *  - inline-dotenv  — bakes .env variables into the JS bundle at Babel
 *                     compile time (NOT at runtime).  This means any change
 *                     to .env requires a Metro cache clear to take effect:
 *                       npm run android   (already includes --clear)
 *                       npx expo start --clear
 *                     safe: true  — silently skips missing variables
 *                     systemVar: 'overwrite'  — CI/system env vars take
 *                     precedence over the .env file
 */
const fs = require('fs');

module.exports = function(api) {
  const isProd = process.env.NODE_ENV === 'production';
  // In production builds (.env.production.local takes priority, falls back to .env).
  // .env.production.local is gitignored — put your live Stripe key there.
  // EAS builds inject keys via eas.json env / EAS Secrets, so the file need not
  // exist in CI; safe:true + systemVar:'overwrite' handles both cases.
  const envPath = isProd && fs.existsSync('.env.production.local')
    ? '.env.production.local'
    : '.env';

  api.cache(!isProd); // bust cache on production so fresh env values are always baked in
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['inline-dotenv', {
        path: envPath,
        safe: true,
        systemVar: 'overwrite'
      }]
    ]
  };
};
