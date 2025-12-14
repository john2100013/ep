const path = require('path');

module.exports = {
  appId: 'com.awesomeinvoice.desktop',
  productName: 'Awesome Invoice',
  directories: {
    output: 'dist',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'electron/dist/**/*',
    'package.json',
    'node_modules/**/*',
    '!node_modules/.cache/**/*',
    '!node_modules/**/*.{md,ts,map}',
    '!node_modules/**/*.d.ts',
    '!node_modules/**/test/**',
    '!node_modules/**/tests/**',
    '!node_modules/**/*.test.*',
    '!node_modules/**/*.spec.*',
  ],
  extraResources: [
    {
      from: '../backend/dist',
      to: 'backend/dist',
    },
    {
      from: '../backend/package.json',
      to: 'backend',
    },
    {
      from: '../backend/node_modules',
      to: 'backend/node_modules',
    },
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32'],
      },
    ],
    icon: path.resolve(__dirname, 'public/icon.ico'),
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Awesome Invoice',
    installerIcon: path.resolve(__dirname, 'public/icon.ico'),
    uninstallerIcon: path.resolve(__dirname, 'public/icon.ico'),
    installerHeaderIcon: path.resolve(__dirname, 'public/icon.ico'),
    requestExecutionLevel: 'user',
  },
  mac: {
    target: ['dmg'],
    icon: path.resolve(__dirname, 'public/icon.icns'),
    category: 'public.app-category.business',
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: path.resolve(__dirname, 'public/icon.png'),
    category: 'Office',
  },
  publish: null,
};
