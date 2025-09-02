
# Deploy Guides

## Render / Railway / Heroku quick notes
- For Render/Railway: use their managed Postgres add-on, set DATABASE_URL in service environment.
- For Heroku: provision `heroku-postgresql` and Heroku sets DATABASE_URL automatically.

## Docker Compose (production)
On a server with Docker installed:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
Then open `http://<server-ip>/`.
