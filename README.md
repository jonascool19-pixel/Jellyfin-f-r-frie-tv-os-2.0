# Jellyfin Vega TV

A standalone Jellyfin client for Amazon Vega OS, built with React Native for Vega. The UI follows the Jellyfin TV information architecture closely while keeping the implementation independent.

## What is implemented

- Jellyfin server login with persistent Vega storage
- Home screen with **Weiterschauen**, **Als Nächstes**, **Zuletzt hinzugefügt** and libraries
- Poster and landscape rails with TV/D-pad focus states
- Library browsing, series -> season -> episode navigation
- Search
- Item details with metadata, genres and resume information
- Vega W3C media playback using `VideoPlayer` + `KeplerVideoSurfaceView`
- Direct Play / Direct Stream / Jellyfin server-provided TranscodingUrl selection
- Resume position
- Playback progress and stop reporting to Jellyfin
- Pause, +/-30 second seeking and playback error/retry UI
- Audio/subtitle track selection through Jellyfin PlaybackInfo
- Captions surface integration
- Settings and logout
- Back-button handling for player, details, libraries and pages

## Vega target

The repository targets the React Native 0.72 Vega toolchain and OS version 1.2, which is the manifest target used for the current Vega SDK line. Amazon documents Vega OS as the Linux-based Fire TV platform using React Native; the current Fire TV Stick 4K Select generation is Vega OS 2.0. 

The project uses Amazon's W3C media package for hardware-accelerated Vega playback. Amazon documents `VideoPlayer`, `KeplerVideoSurfaceView`, captions, and the required media services for this architecture.

## Build

Vega development requires Amazon's Vega Developer Tools/SDK. The SDK and its registry are not redistributed here.

Use a macOS or Linux development machine with the Vega tooling installed, then:

```bash
npm install
npm run build:debug
```

For a release package:

```bash
npm run build:release
```

The current build scripts intentionally use Amazon's `react-native build-vega` flow. A local Vega SDK/device is required to produce and install the final package; this repository has not been able to run that proprietary toolchain in this environment.

## Install on the Fire TV Stick

After a successful Vega build, use the standard Vega Developer Tools device-install/debug workflow to deploy the generated package to the Fire TV device. The device must be a supported Vega OS Fire TV model with developer tooling enabled.

## Notes on playback

The client first asks Jellyfin for `PlaybackInfo`. If Jellyfin reports Direct Play or Direct Stream, that source is preferred. If not, a source with `TranscodingUrl` is used. This lets the Jellyfin server perform codec/container/subtitle adaptation instead of trying to decode unsupported media on the TV.

## License

The project code is GPL-2.0-only. It is an independent client and does not redistribute Amazon's proprietary Vega SDK.
