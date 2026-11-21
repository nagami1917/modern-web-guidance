# Valorian Knight — 3D Asset & Interactive Studio

A classic medieval fantasy **3D Knight character asset** and interactive web studio built inside `modern-web-guidance`, applying the repository's modern web platform best practices.

## Quickstart

Serve the `knight-3d-asset/` directory with any static server:

```shell
python3 -m http.server 8080 --bind 0.0.0.0 --directory knight-3d-asset
# Open http://localhost:8080
```

To regenerate the standalone `.glb` and `.obj` files from the CLI:

```shell
node knight-3d-asset/export-cli.mjs
```

## Included 3D Asset Files

| File | Description |
| --- | --- |
| `assets/models/valorian-knight.glb` | Binary glTF 2.0 3D asset (92 sub-meshes, ~15k triangles, 10 named PBR metallic-roughness material slots, full joint hierarchy) ready for Unity, Unreal Engine, Godot, Blender, or Three.js. |
| `assets/models/valorian-knight.obj` | Universal Wavefront polygonal geometry export. |
| `knight-model.js` | Procedural Three.js character & skeletal rig builder (gothic cuirass, articulated houndskull visor, horsehair plume, layered pauldrons/faulds/tassets, poleyns, sabatons, cruciform longsword, heraldic kite shield, and royal cloak). |
| `index.html` / `styles.css` / `app.js` | Dependency-free modern web 3D asset customizer and live exporter. |

## Features

- **6 Skeletal Stances & Animations**: Heroic Idle, Shield Guard, Sword Cleave, Royal Salute, Vanguard March, and Rig T-Pose.
- **4 Heraldic PBR Palettes**: Royal Valorian, Crimson Templar, Obsidian Dragoon, and Sunforge Paladin.
- **Modular Gear & Articulation**: Raise/lower the houndskull visor, toggle cloak, kite shield, longsword, crest plume, stone pedestal, wireframe overlay, and turntable orbit.
- **Live Browser Export**: Export any customized armor color, gear loadout, and stance directly to `.glb`, `.obj`, or high-resolution `.png`.
