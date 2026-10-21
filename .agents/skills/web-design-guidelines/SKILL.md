---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

---

## Nota del proyecto Sistema Textilería (agregada localmente)

- Si no se puede descargar la URL de las guías, usar la copia local: [references/command.md](./references/command.md) (descargada el 2026-10-21).
- En este proyecto se usa en la **Fase 3 en adelante**, después de terminar cada pantalla, sobre los archivos de `frontend/src/features/<modulo>/`.
- Prestar atención especial a: `tabular-nums` en montos y stock, estados de carga/vacío/error, foco de teclado visible, formularios (labels, autocompletado, errores en línea) y textos en español.
- Los hallazgos se corrigen antes de marcar la pantalla como terminada en `docs/03-plan-fases.md`.
