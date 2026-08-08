"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHealth = fetchHealth;
async function fetchHealth(baseUrl) { const res = await fetch(`${baseUrl}/api/health`); return res.json(); }
//# sourceMappingURL=index.js.map