// app.config.js — dynamic Expo config
// This file is evaluated on the EAS build server, where EAS Secrets are
// available as real process.env variables. Values placed in `extra` are
// embedded into the app binary and accessible at runtime via expo-constants.
// Never put secret values in app.json — it is static and cannot read env vars.

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    // EAS Secret MOBILE_API_KEY is injected by EAS at build time.
    // Falls back to empty string so the app doesn't crash in dev without the secret.
    mobileApiKey: process.env.MOBILE_API_KEY || '',
    // EAS Secret STRIPE_PUBLISHABLE_KEY — dev/preview profiles override this with
    // the test key via eas.json env block; production falls through to the EAS secret.
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
});
