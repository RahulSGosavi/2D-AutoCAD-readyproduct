## Catalog Gap Analysis vs 2020

### Current Furniture/Block Coverage
- Hard-coded tool palette in `AdvancedCanvas` (`furnitureTools`) provides 20 generic categories (bed, sofa, table, wardrobe, TV unit, WC, wash basin, shower panel, drain, mirror, base/wall cabinet, sink/hob/refrigerator/microwave/dishwasher, electrical points, water lines, drain pipes).
- Drag-and-drop blocks reuse the same renderer with simple rectangles/circles and fixed default dimensions.
- No notion of modules, carcass depth, door style, hardware, finishes, manufacturers, or cost metadata.

### 2020 Reference Features
1. **Cabinet Families** – Base, wall, tall, vanity, corner, appliance garages with preset modules per 1\" increments; configurable width, depth, height.
2. **Parametric Variants** – Drawers vs doors, open shelves, angled/corner units, blind panels, fillers, toe kicks, crown molding.
3. **Accessory Catalog** – Pull-outs, organizers, lighting, plumbing fixtures with manufacturer SKUs and pricing.
4. **Materials & Finishes** – Carcass material, door style, hardware, countertop libraries, texture previews.
5. **Metadata** – SKU, vendor, cost, lead time, BOM export, rules that enforce compatible options.
6. **3D/2D Assets** – Detailed plan, elevation, and 3D geometry for client renders and CNC exports.

### Gap Summary
| Area | Current Tool | 2020 Capability | Gap | Priority |
| --- | --- | --- | --- | --- |
| Cabinet families | Only `base-cabinet`, `wall-cabinet`, `sink-unit`, `hob-unit`; single default size | Full catalog of base/wall/tall/corner/vanity modules with 1\" increments | Need taxonomy + presets for dozens of cabinet types | P0 |
| Parametric fields | width/height only, no depth, divisions, doors/drawers | Parametric doors/drawers/shelves, toe kicks, fillers | Extend schema for moduleType, depth, sections, fronts | P0 |
| Accessories | None beyond major appliances and plumbing | Pull-outs, fillers, trims, lighting, countertop edges | Add accessory categories and rendering | P1 |
| Metadata | No manufacturer/SKU/cost info | Rich metadata for pricing & ordering | Add metadata fields, backend storage, export | P0 |
| Materials/finishes | Global stroke/fill only | Finish libraries per component | Need finish catalogs + preview swatches | P1 |
| Layout rules | Manual placement | Rule-based runs, compliance checks | Integrate constraints + automation | P1 |
| 3D assets | 2D plan glyphs only | 2D + 3D + render-ready meshes | Need asset pipeline for 3D | P2 |

### Recommended Next Steps
1. **Define Canonical Catalog Schema** covering cabinetModule (type, widthRange, depth, sections), materialSet, hardwarePack, pricing.
2. **Inventory Priority Families** – Start with kitchen base, wall, tall, vanity, and corner units plus fillers and panels.
3. **Capture Manufacturer Data** – Identify top brands (e.g., IKEA, KraftMaid, Hacker) and import CSV/JSON exports into new catalog service.
4. **Prototype Configurator** – UI for selecting module + adjusting width/depth, picking door/drawer splits, finishes, and handles.
5. **Enhance Renderer** – Update `renderFurnitureElement` to show door/drawer lines, toe kicks, and orientation based on metadata.
6. **Metadata Persistence** – Extend editor state + backend to persist cabinet configs, SKUs, cost, and attachments for BOM export.
7. **Roadmap Accessories** – After core cabinets, add countertop, backsplash, lighting, and organizational accessories to close catalog gaps.

