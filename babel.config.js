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
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['inline-dotenv', {
        path: '.env',
        safe: true,
        systemVar: 'overwrite'
      }]
    ]
  };
};
