/**
 * metro.config.js  —  SHARED build config, committed to git
 *
 * Required at the project root by Expo/Metro.  Applied for ALL builds
 * (development and production) by every developer on the project.
 *
 * Sections:
 *  1. Minifier config  — keeps class/function names intact to prevent Hermes
 *                        engine crashes in production builds caused by name
 *                        mangling (keep_classnames / keep_fnames).
 *  2. Resolver fixes   — Some packages list source files as their package entry
 *                        point, but those files reference modules Metro cannot
 *                        resolve. We redirect the import to the pre-built
 *                        compiled output instead.
 *
 *     @tanstack/react-query v5: src/index.ts references ./useSuspenseQueries
 *                               → redirected to build/modern/index.js
 *
 *     @stripe/stripe-react-native: react-native field points to src/index.tsx
 *                               which imports Codegen spec files Metro cannot
 *                               resolve. Redirected to lib/commonjs/index.js.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Disable minification for production builds to avoid crashes
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Fix: Several packages ship source files as their Metro entry point but those
// source files reference modules Metro cannot resolve. Redirect to compiled builds.
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // @tanstack/react-query v5 — src/index.ts references ./useSuspenseQueries
    if (moduleName === '@tanstack/react-query') {
      return {
        filePath: path.resolve(
          __dirname,
          'node_modules/@tanstack/react-query/build/modern/index.js'
        ),
        type: 'sourceFile',
      };
    }

    // @stripe/stripe-react-native — react-native field points to src/index.tsx
    // which imports Codegen spec files (.native.ts) Metro cannot resolve.
    if (moduleName === '@stripe/stripe-react-native') {
      return {
        filePath: path.resolve(
          __dirname,
          'node_modules/@stripe/stripe-react-native/lib/commonjs/index.js'
        ),
        type: 'sourceFile',
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
