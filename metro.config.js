const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/** Always use the real path. JS bundling runs on D: before native subst (see scripts/build-apk.ps1). */
const projectRoot = fs.realpathSync(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot,
  watchFolders: [projectRoot],
  resolver: {
    unstable_enableSymlinks: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
