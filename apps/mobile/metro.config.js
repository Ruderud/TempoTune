const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    disableHierarchicalLookup: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      react: path.resolve(projectRoot, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-dev-runtime.js'),
      'react-test-renderer': path.resolve(projectRoot, 'node_modules/react-test-renderer'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
