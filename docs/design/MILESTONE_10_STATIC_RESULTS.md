# Milestone 10 Static Results

Milestone 10 adds a Results view to the AMOR research workspace.

The design goal is to make precomputed model artifacts inspectable without turning the page back into a long undifferentiated report.

## Workspace Role

- Overview explains the research workflow and points to artifact status.
- Simulator remains the live browser companion with controls and paired treatment charts.
- Results presents curated offline artifacts.
- Networks and Labor keep mechanism exploration separate.
- Manuscript keeps assumptions, limitations, and reproducibility notes close to the model.

## Results View Content

The Results view should show:

- artifact identity: schema version, parameter hash, scenario name, diagnostics, and raw-microstate policy;
- scale: households, firms, banks, sectors, periods, and supplier edges;
- final-period outcomes: inflation, policy rate, mortgage rate, output, unemployment, consumption, housing, equity, and bank tightness;
- production-network summary: sparse representation, degree, delivery failures, and rewiring;
- ranked sector stress;
- Norway-first and EU-second assumption notes;
- limitations that prevent smoke artifacts from being mistaken for calibrated results.

## Presentation Rules

- Keep static artifacts compact and scannable.
- Do not load raw microstate into the browser.
- Label reduced-scale artifacts as smoke artifacts.
- Keep parameter hash and diagnostics visible before economic interpretation.
- Use the same AMOR restraint as the rest of the workspace: dense, calm, and research-facing.
