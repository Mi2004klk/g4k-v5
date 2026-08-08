# Deployment & Environment Guide

## Environments
| Environment | Frontend (Vercel) | Backend (Railway) | Database (Supabase) |
|---|---|---|---|
| Development | http://localhost:3000 | http://localhost:8000 | Postgres Local / Remote Dev |
| Staging | Preview Deployments | Staging Environment | Staging DB Project |
| Production | https://g4-k-web.vercel.app | Railway Production | Supabase Production Project |

## Rollback & Backup Procedures
1. **Supabase Postgres**: Automated daily snapshots + Point-In-Time-Recovery (PITR). Restore via Supabase Dashboard.
2. **Vercel Frontend**: Use `vercel rollback` or deploy previous commit instant rollback via Vercel Dashboard.
3. **Railway Backend**: Use Railway deployment history tab to instantly revert to previous release build.
