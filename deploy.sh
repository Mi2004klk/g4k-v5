#!/bin/bash
echo "Deploying Backend to Google Cloud Run..."
cd apps/api
gcloud run deploy g4k-api --source . --region asia-south1 --project jtcgtjrqijdnecwtuspv
cd ../..

echo "Deploying Frontend to Vercel..."
cd apps/web
npx vercel --prod
cd ../..
echo "Deployment Complete."
