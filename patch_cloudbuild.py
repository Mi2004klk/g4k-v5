import re

with open("cloudbuild.yaml", "r") as f:
    content = f.read()

# 1. Add MigrateStatus before Deploy
migrate_status_step = """
  - name: gcr.io/cloud-builders/docker
    id: MigrateStatus
    args:
      - run
      - --env=DB_CONNECTION=pgsql
      - --env=DB_HOST=aws-0-ap-south-1.pooler.supabase.com
      - --env=DB_PORT=6543
      - --env=DB_DATABASE=postgres
      - --env=DB_USERNAME=postgres.jtcgtjrqijdnecwtuspv
      - --env=DB_PASSWORD=g4Kings@gen2K2026
      - --env=DB_SSLMODE=require
      - asia-south1-docker.pkg.dev/${PROJECT_ID}/g4k/${_SERVICE}:latest
      - php
      - artisan
      - migrate:status
"""
content = content.replace(
    """  - name: google/cloud-sdk:slim\n    id: Deploy\n""",
    migrate_status_step + "\n" + """  - name: google/cloud-sdk:slim\n    id: Deploy\n"""
)

# 2. Add DeployWorker and DeployScheduler after the last --set-env-vars of Deploy
# Find SmokeCheck
smoke_idx = content.find("  - name: 'google/cloud-sdk:slim'\n    id: SmokeCheck")

worker_scheduler = """  - name: google/cloud-sdk:slim
    id: DeployWorker
    entrypoint: gcloud
    args:
      - run
      - deploy
      - g4k-worker
      - --image=asia-south1-docker.pkg.dev/${PROJECT_ID}/g4k/${_SERVICE}:latest
      - --region=${_REGION}
      - --platform=managed
      - --no-allow-unauthenticated
      - --memory=1Gi
      - --cpu=1
      - --min-instances=1
      - --max-instances=2
      - --command=php
      - --args=artisan,queue:work,database,--tries=3,--backoff=60,--max-time=3600,--sleep=3
      - --set-env-vars=APP_NAME=Games4King,APP_ENV=production,APP_DEBUG=false,APP_LOCALE=en,APP_MAINTENANCE_DRIVER=cache,APP_MAINTENANCE_STORE=database,BCRYPT_ROUNDS=12,LOG_CHANNEL=stderr,LOG_LEVEL=error,DB_CONNECTION=pgsql,DB_SSLMODE=require,DB_PORT=6543,DB_HOST=aws-0-ap-south-1.pooler.supabase.com,DB_DATABASE=postgres,DB_USERNAME=postgres.jtcgtjrqijdnecwtuspv,SESSION_DRIVER=database,CACHE_STORE=database,QUEUE_CONNECTION=database,FILESYSTEM_DISK=s3,BROADCAST_CONNECTION=pusher,AWS_DEFAULT_REGION=ap-south-1,AWS_USE_PATH_STYLE_ENDPOINT=true,OCTANE_HTTPS=true,OCTANE_SERVER=frankenphp
      - --set-env-vars=AWS_ENDPOINT=https://jtcgtjrqijdnecwtuspv.storage.supabase.co/storage/v1/s3,AWS_BUCKET=g4k,AWS_URL=https://jtcgtjrqijdnecwtuspv.supabase.co/storage/v1/object/public/g4k,SUPABASE_URL=https://jtcgtjrqijdnecwtuspv.supabase.co,PUSHER_APP_CLUSTER=ap2,FRONTEND_URL=https://g4k-v5.vercel.app,APP_URL=https://g4k-v5.vercel.app,SANCTUM_STATEFUL_DOMAINS=g4k-v5.vercel.app
      - --set-env-vars=APP_KEY=base64:191edXlctxCkEZatJZWinnsupmlrFMB39DNsZ8jETUI=,DB_PASSWORD=g4Kings@gen2K2026,AWS_ACCESS_KEY_ID=7bc873d6fd2b14ef8b2695c2edac1dae,AWS_SECRET_ACCESS_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y2d0anJxaWpkbmVjd3R1c3B2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE0NDg3NywiZXhwIjoyMTAxNzIwODc3fQ.W32AWd1vVCW3OOXbnlhsMR4Og6py89agY6BjhNFotJ4,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y2d0anJxaWpkbmVjd3R1c3B2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE0NDg3NywiZXhwIjoyMTAxNzIwODc3fQ.W32AWd1vVCW3OOXbnlhsMR4Og6py89agY6BjhNFotJ4,SUPABASE_JWT_SECRET=7SA+wffLzK9q8zym+7nVx14aHpFN3/dx+koP4cAofgZ4aN5rteR9sDGV3BAaw7bBlyLSy5v/rO+v59If2qa4Iw==,PUSHER_APP_ID=g4k_live_3829,PUSHER_APP_KEY=g4k_key_3829,PUSHER_APP_SECRET=g4k_secret_3829,REVERB_APP_ID=g4k_live_3829,REVERB_APP_KEY=g4k_key_3829,REVERB_APP_SECRET=g4k_secret_3829

  - name: google/cloud-sdk:slim
    id: DeployScheduler
    entrypoint: gcloud
    args:
      - run
      - jobs
      - deploy
      - g4k-scheduler
      - --image=asia-south1-docker.pkg.dev/${PROJECT_ID}/g4k/${_SERVICE}:latest
      - --region=${_REGION}
      - --command=php
      - --args=artisan,schedule:run
      - --set-env-vars=APP_NAME=Games4King,APP_ENV=production,APP_DEBUG=false,APP_LOCALE=en,APP_MAINTENANCE_DRIVER=cache,APP_MAINTENANCE_STORE=database,BCRYPT_ROUNDS=12,LOG_CHANNEL=stderr,LOG_LEVEL=error,DB_CONNECTION=pgsql,DB_SSLMODE=require,DB_PORT=6543,DB_HOST=aws-0-ap-south-1.pooler.supabase.com,DB_DATABASE=postgres,DB_USERNAME=postgres.jtcgtjrqijdnecwtuspv,SESSION_DRIVER=database,CACHE_STORE=database,QUEUE_CONNECTION=database,FILESYSTEM_DISK=s3,BROADCAST_CONNECTION=pusher,AWS_DEFAULT_REGION=ap-south-1,AWS_USE_PATH_STYLE_ENDPOINT=true,OCTANE_HTTPS=true,OCTANE_SERVER=frankenphp
      - --set-env-vars=AWS_ENDPOINT=https://jtcgtjrqijdnecwtuspv.storage.supabase.co/storage/v1/s3,AWS_BUCKET=g4k,AWS_URL=https://jtcgtjrqijdnecwtuspv.supabase.co/storage/v1/object/public/g4k,SUPABASE_URL=https://jtcgtjrqijdnecwtuspv.supabase.co,PUSHER_APP_CLUSTER=ap2,FRONTEND_URL=https://g4k-v5.vercel.app,APP_URL=https://g4k-v5.vercel.app,SANCTUM_STATEFUL_DOMAINS=g4k-v5.vercel.app
      - --set-env-vars=APP_KEY=base64:191edXlctxCkEZatJZWinnsupmlrFMB39DNsZ8jETUI=,DB_PASSWORD=g4Kings@gen2K2026,AWS_ACCESS_KEY_ID=7bc873d6fd2b14ef8b2695c2edac1dae,AWS_SECRET_ACCESS_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y2d0anJxaWpkbmVjd3R1c3B2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE0NDg3NywiZXhwIjoyMTAxNzIwODc3fQ.W32AWd1vVCW3OOXbnlhsMR4Og6py89agY6BjhNFotJ4,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y2d0anJxaWpkbmVjd3R1c3B2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE0NDg3NywiZXhwIjoyMTAxNzIwODc3fQ.W32AWd1vVCW3OOXbnlhsMR4Og6py89agY6BjhNFotJ4,SUPABASE_JWT_SECRET=7SA+wffLzK9q8zym+7nVx14aHpFN3/dx+koP4cAofgZ4aN5rteR9sDGV3BAaw7bBlyLSy5v/rO+v59If2qa4Iw==,PUSHER_APP_ID=g4k_live_3829,PUSHER_APP_KEY=g4k_key_3829,PUSHER_APP_SECRET=g4k_secret_3829,REVERB_APP_ID=g4k_live_3829,REVERB_APP_KEY=g4k_key_3829,REVERB_APP_SECRET=g4k_secret_3829

"""

content = content[:smoke_idx] + worker_scheduler + content[smoke_idx:]

# 3. Update smoke check endpoints
old_smoke = '''          if [ -n "$$TOKEN" ]; then
            echo "Authenticated successfully as $$EMAIL"
            DASH_RES=$$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $$TOKEN" -H "Accept: application/json" "$$URL/api/dashboard/init")
            if [ "$$DASH_RES" -ne 200 ]; then
              echo "Authenticated dashboard/init check failed for $$EMAIL with code $$DASH_RES"
              exit 1
            fi
          fi'''

new_smoke = '''          if [ -n "$$TOKEN" ]; then
            echo "Authenticated successfully as $$EMAIL"
            for ENDPOINT in "/api/dashboard/init" "/api/notifications" "/api/directory"; do
              DASH_RES=$$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $$TOKEN" -H "Accept: application/json" "$$URL$$ENDPOINT")
              if [ "$$DASH_RES" -ne 200 ]; then
                echo "Authenticated $$ENDPOINT check failed for $$EMAIL with code $$DASH_RES"
                exit 1
              fi
            done
          fi'''

content = content.replace(old_smoke, new_smoke)

with open("cloudbuild.yaml", "w") as f:
    f.write(content)
