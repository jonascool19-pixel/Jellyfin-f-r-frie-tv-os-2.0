# Jellyfin Vega TV

Vega OS client for Jellyfin. The UI intentionally follows the familiar Jellyfin TV information architecture while using a Vega-native implementation.

## Current target
Amazon Vega OS 2.x compatible Fire TV hardware. The project uses Amazon's Vega React Native toolchain and keeps platform-specific code isolated.

## UI goals
- Jellyfin-style left/top navigation and focused TV controls
- Poster/landscape card rails
- Home, Libraries, Search and Item details
- Continue Watching / Next Up / Recently Added
- Resume playback and progress reporting
- Audio/subtitle selection
- D-pad focus management

## Build
Install the Amazon Vega SDK and configure its npm registry, then:

    npm install --legacy-peer-deps
    npm run build:debug

Release:

    npm run build:release

The Vega SDK is required and is not redistributed in this repository.

## License
Project code is GPL-2.0-only. Jellyfin API compatibility is independent of Jellyfin server software.