# Integrity Public Site

This directory contains the public customer website for Integrity Transmission & Drivetrain. It is built through the repository-level production manifest; source scripts, partials, internal notes, environment examples, and staff material are never copied to the deployment.

Run all release gates from the repository root:

```bash
npm test
npm run build
```

See `docs/integrity/PRODUCTION_OPERATIONS.md` for the live commerce workflow and `admin/integrity-office/README.md` for the private operations-system activation gate.
