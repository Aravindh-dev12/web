# ARV Gen-02 — WebGPU / WebGL Immersive Portfolio

A ground-up implementation of an immersive cyberpunk portfolio architecture inspired by the interaction language of Samsy's Gen-02 site. It uses the same *publicly documented core technology choices* while keeping the code, branding, project content and generated visual assets original.

## Stack

- Vue 3 + Vite
- Three.js `WebGPURenderer`
- Three.js Shading Language (TSL)
- WebGPU with automatic WebGL 2 fallback
- TSL `RenderPipeline` bloom / film / RGB shift
- TSL planar reflector for the wet city floor
- GSAP for camera and interface choreography
- PartyKit + PartySocket for multiplayer presence and DJ sync
- Web Audio API for the personal DJ soundtrack

## Experience implemented

- Full-screen neon cyberpunk 3D city
- Third-person cat-like avatar
- WASD / arrow movement and Space jump
- Drag-to-look camera controls
- WebGPU-first renderer with WebGL 2 fallback
- Reflective floor and post-processing glow
- Central system display + project billboard district
- Clickable Works billboards
- Explore / Works / About UI
- Intro loader and tutorial
- NPC quest checklist
- Four avatar skins
- Interactive DJ booth and synchronized track requests
- PartyKit multiplayer avatar presence when configured
- Responsive desktop/mobile interface

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Multiplayer

Run PartyKit in a second terminal:

```bash
npm run party
```

Then create `.env.local`:

```bash
VITE_PARTYKIT_HOST=localhost:1999
```

Restart Vite. For production, deploy the PartyKit worker with `npm run party:deploy` and set `VITE_PARTYKIT_HOST` to the deployed PartyKit hostname before building the frontend.

## Production

```bash
npm run build
npm run preview
```

## Notes

The reference website's proprietary source code, 3D models, project imagery, music and branded assets are **not** included. The city, avatar, UI artwork and billboard graphics in this repository are generated specifically for this implementation.
