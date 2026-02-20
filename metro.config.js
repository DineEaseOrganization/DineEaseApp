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
 *  2. Resolver fix     — @tanstack/react-query v5 lists src/index.ts as its
 *                        package entry point, but that file references modules
 *                        Metro cannot resolve (e.g. ./useSuspenseQueries).
 *                        We redirect the import to the pre-built
 *                        build/modern/index.js instead.
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

// Fix: @tanstack/react-query v5 ships source files that reference modules Metro
// cannot resolve (e.g. ./useSuspenseQueries). Point Metro to the compiled build.
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === '@tanstack/react-query') {
      return {
        filePath: path.resolve(
          __dirname,
          'node_modules/@tanstack/react-query/build/modern/index.js'
        ),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
