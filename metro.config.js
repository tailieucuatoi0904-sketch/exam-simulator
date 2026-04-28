const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix cho Firebase modular SDK (v9+) với Metro Bundler
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Cho phép Metro resolve các subpath exports của Firebase
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
