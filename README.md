# Vishal S I — Interactive 3D Portfolio

**Live:** https://vishal171104.github.io/

A portfolio built as a genome. The landing page presents a 3D DNA helix; hitting
**Decode My Genome** scans it into four strands — Skills, Experience, Projects,
Education — and each strand opens a scroll-driven cinematic travelled from
*inside* the double helix: twin sugar-phosphate backbones spiral around the
camera with real B-DNA groove asymmetry, base-pair rungs pass in textbook
A-T / G-C colours, and every chapter opens a "replication bubble" where that
part of the genome is read.

## Highlights

- **Scroll-driven 3D storytelling** — wheel/touch input eases a single progress
  value that drives both the camera dolly and the HTML chapter cards from one
  animation frame, so the two layers can never drift apart
- **Custom cursor physics** — a core dot with a trailing ring that swells over
  interactive elements, magnetic buttons, cursor-parallax on the 3D camera
- **One text layer** — all copy lives in glass HTML cards; the 3D stays quiet
  (instanced geometry, restrained bloom, deep fog)
- **Domain signatures** — a synapsed neuron for skills, company gates flown
  through for experience, primitive project totems (dumbbell, sorted tickets,
  crates, map pin), an open book crowned by a graduation cap for education
- **Guided tour** — each dive's completion report chains into the next strand

## Stack

React 19 · TypeScript · Vite · Three.js / React Three Fiber · drei ·
@react-three/postprocessing · Framer Motion · Tailwind CSS

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Engineering notes

- R3F scenes are statically imported on purpose: `React.lazy`/`Suspense` and
  `AnimatePresence` around a `<Canvas>` both break GL initialisation in
  production builds (the boundary mounts the subtree hidden, so the canvas
  measures 0×0 and never creates a context)
- 3D fonts are self-hosted (`public/fonts/`) — troika `<Text>` suspends forever
  on a dead font URL and takes the whole scene down with it
- The main canvas pauses its frameloop while a dive's canvas is live; two
  active WebGL contexts of this weight cost context-loss crashes
