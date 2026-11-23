# Remote Jackbox Player

![GitHub last commit (branch)](https://img.shields.io/github/last-commit/yak-was-here/remote-jackbox-player/master?label=last%20update) ![GitHub deployments](https://img.shields.io/github/deployments/yak-was-here/remote-jackbox-player/production?label=status) ![GitHub](https://img.shields.io/github/license/yak-was-here/remote-jackbox-player)

Find and play Jackbox games remotely (even if you don't own any) all on a single screen! This website allows you to simultaneously watch a Jackbox stream and join the fun from one mobile device. You can find random game sessions hosted on Twitch and join or directly enter a stream URL (if your friend or family member is streaming their game)!

Try it on your phone 📲

[![Launch Remote Jackbox Player](https://img.shields.io/badge/Launch-Remote%20Jackbox%20Player%20↗%EF%B8%8F-blue?style=for-the-badge&color=319795)](https://remote-jackbox-player.isaacyakl.com)

Created by [yak](https://isaacyakl.com)

[![X Follow](https://img.shields.io/twitter/follow/yak_was_here?style=social)](https://x.com/yak_was_here) [![GitHub followers](https://img.shields.io/github/followers/yak-was-here?style=social)](https://github.com/yak-was-here)

---

## Streaming Platform Support

| Platform           | Status                                                                               |
| ------------------ | ------------------------------------------------------------------------------------ |
| Twitch             | ✅ Supported                                                                         |
| YouTube            | If [requested](https://github.com/yak-was-here/remote-jackbox-player/issues/new/choose) |
| Steam Broadcasting | ❎ Unsupported (Stream delay, Lack of iOS support)                                   |

Found a 🐛? Create a [new issue](https://github.com/yak-was-here/remote-jackbox-player/issues/new/choose).

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## To-Do

-  Add a clear button for stream URL
-  Rename how to pane
-  Implement language localization **(I am looking for someone to help with this)**
-  Add left-hand / right-hand control orientation option
-  Detect lag in stream and reload it automagically
