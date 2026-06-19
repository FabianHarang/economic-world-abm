# Data

This folder separates raw, processed, static-site, and metadata artifacts.

- `raw`: source data. Usually gitignored unless small and openly redistributable.
- `processed`: derived data. Usually gitignored unless small and reproducible.
- `static-site`: small curated artifacts that GitHub Pages can load.
- `synthetic-populations`: generated population metadata and documented samples.
- `input-output`: input-output matrices and provenance notes.
- `metadata`: source, license, and transformation documentation.
- `sources`: official source registries for calibration and validation.

`sources/calibration_sources.json` registers official candidate sources for Milestone 7. It records provenance targets only; it does not ingest, scrape, or redistribute restricted data.

`static-site/milestone8_summary.json` is a small curated website artifact for the current Milestone 8 state. Large raw outputs remain excluded from git.

## Economy Priority

Norway is the first calibration target. EU / Euro area follows as a comparison and extension. Any mixed Norway + EU parameterization must state which assumptions come from which economy.
