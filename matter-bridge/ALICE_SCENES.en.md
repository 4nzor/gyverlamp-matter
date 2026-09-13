# Alice / Home scenes → Gyver effects

**Language:** [Русский](ALICE_SCENES.md) | **English**

In an Alice (or Home) scene/automation, set the **exact color** and **brightness %** from the table.
The bridge picks an effect when hue is within ±15° and brightness within ~±7 pp.

Brightness is always sent as `BRI`. Low saturation (white/grey) → effect **0 White light**.

| Scene | Color (Hue°) | Brightness | EFF | Lamp effect |
|---|---:|---:|---:|---|
| Candle | 30 (orange) | 25% | 18 | Flame |
| Fire | 0 (red) | 40% | 19 | Fire 2021 |
| Lava | 20 | 70% | 5 | Lava |
| Fire bright | 0 (red) | 80% | 42 | Fire |
| Reading | 45 (yellow-orange) | 70% | 1 | Color |
| Comet | 60 (yellow) | 80% | 56 | Comet |
| Forest | 90 (lime) | 50% | 10 | Forest |
| Matrix | 120 (green) | 40% | 38 | Matrix |
| Rainbow | 120 (green) | 80% | 7 | Rainbow 3D |
| Rainbow stripe | 150 | 70% | 84 | Rainbow |
| Aurora | 160 | 50% | 32 | Northern lights |
| Butterflies | 180 (cyan) | 60% | 25 | Butterflies |
| Ocean | 200 | 45% | 11 | Ocean |
| Night | 220 (blue) | 20% | 21 | Shadows |
| Quiet ocean | 220 | 55% | 20 | Pacific |
| Cinema | 240 (blue) | 35% | 66 | Smoke |
| Plasma | 270 (purple) | 75% | 6 | Plasma |
| Party | 300 (magenta) | 90% | 64 | Confetti |
| Fireworks | 320 | 100% | 86 | Fireworks |
| Pulse | 330 (pink) | 60% | 51 | Rainbow pulse |
| White | white / pale | any | 0 | White light |

Example “Night”: lamp → blue ≈ hue 220° → 20% → on.
