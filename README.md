# Azure DevOps Tools

A browser extension for Chrome, Edge, and Firefox that enhances the Azure DevOps user experience with additional features for sprint backlogs and more.

## Features

This extension adds several features to Azure DevOps:

1. **Status Aggregation** - Displays story points totals by status in backlogs
2. **Task Drift** - Visualizes the drift between original estimates and actual work
3. **Quick Filter** - Allows filtering of tasks by assignment during daily meetings
4. **Wiki Enhancement** - Adds custom templates to simplify wiki editing

## Architecture

The extension uses a modular architecture to facilitate maintenance and code evolution:

### Folder Structure

```
ado-tools/
├── background/          # Background scripts for the extension
├── popup/               # Extension popup interface
│   └── components/      # Reusable components for the popup
├── options/             # Complete configuration page
│   └── components/      # Reusable components for options
├── features/            # Features injected into Azure DevOps pages
│   ├── core/            # Modules shared by all features
│   ├── status-aggregation/  # Status aggregation feature
│   ├── task-drift/      # Task drift feature
│   ├── quick-filter/    # Quick filter feature
│   └── better-wiki/     # Wiki enhancement feature
└── libs/                # External libraries
```

### Code Organization

Each feature follows the same structure:

- `index.js`: Main entry point for the feature
- `helpers/`: Utilities specific to the feature
- `components/`: Reusable UI components for the feature

### How to add a new feature

1. Create a new folder in `features/` with your feature name
2. Create an `index.js` file that extends the `FeatureBase` class
3. Implement the `initFeature()` method with specific logic
4. Add the necessary helpers and components in appropriate subfolders
5. Update `background.js` to include the new feature
6. Add configuration options in `options.js`

Example structure for a new feature:

```javascript
import FeatureBase from '../core/feature-base.js';

class MyNewFeature extends FeatureBase {
  constructor(config) {
    super('myNewFeature', config);
  }

  initFeature() {
    // Specific initialization logic
  }
}

chrome.runtime.onMessage.addListener((message) => {
  const config = message.config;
  if (!config?.myNewFeature?.enabled) return;
  
  const feature = new MyNewFeature(config);
  feature.init();
});

export default MyNewFeature;
```

## Installation and Development

### Chrome/Edge Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/` (or Edge at `edge://extensions/`)
3. Enable "Developer mode"
4. Click on "Load unpacked extension" and select the project folder
5. The extension is now installed and ready to use

### Firefox Installation

1. Clone this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click on "Load Temporary Add-on"
4. Navigate to the project folder and select the `manifest.json` file
5. The extension is now installed and ready to use

**Note:** For Firefox, the extension will be temporary and will be removed when Firefox restarts. For permanent installation, the extension needs to be signed by Mozilla or you need to use Firefox Developer Edition or Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.

## Configuration

Click the extension icon to open the popup, or access the full options to configure:

- Azure DevOps projects and organizations
- Features to enable for each project
- Settings specific to each feature