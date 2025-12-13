# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pixel Whisperer is an accessibility-focused web application designed to help colorblind users interpret visual data. Users can upload images or use their device camera, then mouse over pixels to see their color names using the ISCC-NBS Color System with additional greyscale values.

This is a pure client-side web application - all image processing occurs locally in the browser. No images or data are sent to any server.

## Technology Stack

- **Pure vanilla JavaScript** - No frameworks or build tools
- **Bootstrap 5.3.2** - For UI components and responsive layout
- **HTML5 Canvas API** - For image manipulation and pixel color extraction
- **MediaDevices API** - For camera access

## Project Structure

- `index.html` - Main application layout with Bootstrap styling (production)
- `script.js` - All application logic (~830 lines) (production)
- `style.css` - Custom CSS overrides and component styling (production)
- `colours.json` - Color reference data in two formats:
  - `colourList`: Full ISCC-NBS color system (default)
  - `elabList`: Simplified color palette for ELab mode
- `hashscript.js` - Small script for SRI (Subresource Integrity) testing
- `img/` - Static assets (favicon, default image)
- `dev/` - Development versions of HTML, JS, and CSS files for testing
- `promote-to-prod.bat` - Script to sync dev changes to production

## Key Architecture Concepts

### Color Matching System

The core functionality revolves around finding the closest named color to a given RGB pixel:

1. `colours.json` contains hex codes organized by color names
2. On load, `convertHexList()` preprocesses all hex codes to RGB for performance (script.js:64-83)
3. `closestcolour()` uses Euclidean distance in RGB space to find the nearest match (script.js:124-144)
4. `colourDistance()` calculates squared Euclidean distance without the sqrt for performance (script.js:115-121)

### Canvas-Based Image Handling

Images are drawn to an offscreen canvas to enable pixel-level access:

- `canvas` and `ctx` are global canvas/context (script.js:36-37)
- `fullImageData` and `fullData` cache the entire image pixel data (script.js:9, 601-604)
- `getPixelFromFullData()` retrieves RGB values without repeated `getImageData()` calls (script.js:228-238)
- This caching is critical for performance during mousemove events

### Zoom System

Zoom operates in powers of 2 (0.25x, 0.5x, 1x, 2x, 4x, etc.):

- `changeZoom()` handles zoom level changes (script.js:557-569)
- `redrawCanvas()` redraws the image at the new zoom level (script.js:573-594)
- `adjustZoomToFit()` automatically scales images to fit viewport on load (script.js:795-810)
- `isZoomAdjusted` flag prevents re-adjustment when user has manually zoomed (script.js:15)

### Coordinate Systems

The code manages three coordinate systems:

1. **Canvas coordinates** (`lastMouseX`, `lastMouseY`) - position on the displayed image
2. **Crosshair coordinates** (`lastCrosshairX`, `lastCrosshairY`) - viewport-relative position
3. **Original image coordinates** - scaled by `inv_zoom / zoom` for display (script.js:299)

The `updateFocus()` function (script.js:241-301) synchronizes all three systems.

### Touch vs Mouse Input

- Mouse events use `mousemove` and `click` (script.js:347-353)
- Touch events use `touchstart`, `touchmove`, `touchend` with tap detection (script.js:357-381)
- `tap_threshold` distinguishes taps from drags (script.js:33, 368-370)
- Arrow pad displays only on touch devices (script.js:813-829)

### Debug Mode

Hidden debug features are enabled via:
- Typing "debug" activates debug mode, showing brightness/contrast controls
- Typing "reset" deactivates debug mode
- Automatically enabled on localhost (script.js:719-726)
- Keyboard arrow keys scroll the image (script.js:643-665)

## Dev/Prod Workflow

The repository uses a `/dev` folder structure for testing changes before deploying to production (GitHub Pages).

### Directory Structure

```
PixelWhisperer/
├── index.html           (production)
├── script.js            (production)
├── style.css            (production)
├── colours.json         (shared between dev and prod)
├── hashscript.js        (shared between dev and prod)
├── img/                 (shared between dev and prod)
├── promote-to-prod.bat  (deployment script)
└── dev/
    ├── index.html       (development version)
    ├── script.js        (development version)
    └── style.css        (development version)
```

### Path Differences

Files in `/dev` use relative paths pointing to parent directory:
- `dev/index.html`: References `../img/`, `../hashscript.js`
- `dev/script.js`: References `../colours.json`
- Dev pages display "(DEV)" in title and heading for visual distinction

Production files in root use direct relative paths:
- `index.html`: References `img/`, `hashscript.js`
- `script.js`: References `colours.json`

### Development Workflow

**Testing new features:**
1. Make changes in `/dev` folder files
2. Test locally at `file:///path/to/dev/index.html` or `localhost/dev/` (note the trailing slash!)
3. When satisfied, run `promote-to-prod.bat` to copy changes to production
4. The script automatically updates paths and removes (DEV) indicators
5. Test production version
6. Commit and push changes to deploy to GitHub Pages

**Important Notes:**
- Always test in `/dev/` first. The promotion script will ask for confirmation before overwriting production files.
- **CRITICAL: Always use `/dev/` with the trailing slash** - accessing without the slash will not load the dev version correctly
- Bookmark `http://localhost:5500/dev/` or your server URL with `/dev/` included

## Development Commands

This is a static web application with no build process. To develop:

1. **Local development**: Open `index.html` or `dev/index.html` in a browser, or serve via local HTTP server
2. **Testing changes**: Refresh the browser after editing files
3. **Debug mode**: Type "debug" while on the page to reveal debug controls
4. **Promote to prod**: Run `promote-to-prod.bat` (Windows) to sync dev changes to production

## Important Implementation Details

### Image Processing Pipeline

1. Image loaded via upload or camera → `pic` element
2. Backup stored in `original_pic` for zoom operations
3. Drawn to offscreen `canvas` at current zoom level
4. `updateImageData()` caches all pixel data in `fullData`
5. Mouse/touch events query `fullData` via `getPixelFromFullData()`

### Brightness/Contrast

Applied in two places:
- Visual filter on `pic` element via CSS (script.js:167, 188)
- RGB adjustment in `rgbToHex()` when reading pixel values (script.js:98-112)

This dual application ensures both visual feedback and accurate color matching reflect the adjustments.

### Magnifying Glass

- Grid of colored squares showing pixels around cursor (script.js:192-226)
- Size controlled by slider (must be odd number)
- Central square has black border to indicate focus pixel (script.js:215-216)
- Updated in `updateFocus()` by sampling surrounding pixels (script.js:285-295)

### ELab Mode

Toggle between full ISCC-NBS color system and simplified ELab palette:
- Checkbox in footer controls `totalList` variable (script.js:526-546)
- Both lists loaded from `colours.json` (script.js:43-54)
- All color matching automatically uses the active list

## Known Issues (from README.md)

- Pixel selection doesn't update on scroll
- Crosshair clamping doesn't handle overall window scrolling well
- Magnifying glass resets on size change
- Transparency not handled
- Off-by-one pixel positioning issue
