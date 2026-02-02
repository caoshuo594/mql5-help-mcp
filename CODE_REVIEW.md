# Code Review Notes

Scope: `src/index.ts`, `src/smart-query.ts`, `src/error-db.ts`.

## ✅ Strengths
- **Clear separation of concerns**: the MCP server, smart query engine, and error database are cleanly separated into different modules, which makes maintenance easier.
- **Helpful operator output**: the server logs index and DB stats on startup, which is useful for troubleshooting and operational visibility.
- **Local-first design**: document indexing and error storage are fully local, avoiding external dependencies and reducing runtime costs.

## ⚠️ Findings & Recommendations
1. **`related_docs` parsing could crash on malformed JSON**
   - In the smart query path, `related_docs` is parsed with `JSON.parse` without validation. Any malformed value can throw and fail the request.
   - ✅ **Addressed**: added safe parsing logic that accepts JSON arrays or single strings and fails gracefully.

2. **Index collisions for same-named files across multiple roots**
   - The index is keyed by filename without extension; identical names across repositories will overwrite earlier entries.
   - **Suggestion**: consider extending keys with repo namespace or retaining a list of matches per key.

3. **Broad `LIKE` queries in error search**
   - `searchSimilarErrors` combines terms with `AND`, which can be too strict for multi-term queries and may miss relevant errors.
   - **Suggestion**: consider `OR` or a weighted scoring approach to balance recall and precision.

4. **Document truncation thresholds are fixed**
   - Truncation limits (10k/15k characters) are hard-coded; this could be tuned per mode or exposed as configuration.

## Summary
- The core architecture is solid and easy to follow.
- The most important runtime risk (JSON parsing in smart query) has been mitigated.
- Future improvements should focus on index collision handling and search flexibility.
