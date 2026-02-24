# The Anamorphic Lens Profile: "Tall Grass" Distortion

## 🎥 Camera Configuration: RED Komodo
The film is captured on the RED Komodo 6K global shutter sensor, utilizing a $2\times$ anamorphic squeeze factor to achieve the $2.39:1$ aspect ratio.

### Technical Infobox
| Parameter | Setting |
| :--- | :--- |
| **Sensor Mode** | 6K 17:9 (Anamorphic $2\times$) |
| **Resolution** | $6144 \times 3240$ (Pre-Desqueeze) |
| **Format** | R3D MQ / HQ |
| **Colorspace** | REDWideGamutRGB / Log3G10 |

---

## 🔍 Lens Profile: "The Vertical Stretch"
The visual identity of *Creatures in the Tall Grass* is defined by a heavy vertical distortion and extreme edge softness, simulating a vintage or "distressed" anamorphic look.

### Distortion Characteristics
1. **Vertical Stretching:** Objects at the frame edges exhibit a $1.2\times$ vertical elongation.
2. **Edge Softness:** Resolution drops significantly beyond the central $50\%$ of the frame.
3. **Flaring:** Asymmetric blue/amber flares corresponding to creature "Glow Logic."

### The "Tall Grass" Overlay Matrix
To simulate textured glass, the following overlay parameters are applied in post-processing:
- **Grain Density:** $0.04$
- **Micro-Scratches:** Vertical orientation, $80\%$ transparency.
- **Vignette:** Elliptical, $-1.5$ stops at edges.

---

## 📐 Optics Math
The desqueezed horizontal resolution ($R_h$) is calculated as:
$$R_h = W_{pixel} \times S_f$$
Where $W_{pixel}$ is the pixel width and $S_f$ is the squeeze factor ($2.0$).

Due to the $2.39:1$ crop from the desqueezed frame:
$$Aspect = \frac{R_h}{R_v \times \text{CropFactor}}$$

---

[[README]] | [[Lore]] | [[Optics]]
