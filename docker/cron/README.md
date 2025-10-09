# 🕐 Cron Service for Cleanup Tasks

Lightweight Alpine-based cron container untuk menjalankan cleanup tasks secara terjadwal.

## 📁 Files

- `Dockerfile` - Alpine-based image dengan curl, bash, dan crond
- `crontab` - Cron schedule configuration (setiap 5 menit)
- `cleanup.sh` - Script untuk memanggil cleanup API endpoint

## 🏗️ Build

```bash
# Build dari root project
docker build -t myhome-cron -f docker/cron/Dockerfile docker/cron

# Atau via docker-compose
docker-compose build cron
```

## 🚀 Run

```bash
# Standalone (requires app service running)
docker run -d \
  --name myhome-cron \
  --network myhome \
  -e CRON_SECRET="your-secret" \
  -e APP_URL="http://app:3000" \
  myhome-cron

# Via docker-compose (recommended)
docker-compose up -d cron
```

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CRON_SECRET` | Yes | - | Secret token untuk autentikasi API |
| `APP_URL` | No | `http://app:3000` | URL internal app service |
| `TZ` | No | `UTC` | Timezone untuk cron execution |

## 📊 Monitoring

```bash
# View logs
docker logs -f myhome-cron

# Last 50 lines
docker logs --tail 50 myhome-cron

# Execute cleanup manually
docker exec myhome-cron /usr/local/bin/cleanup.sh
```

## 🔧 Troubleshooting

### Cron tidak berjalan

```bash
# Check crontab
docker exec myhome-cron cat /etc/crontabs/root

# Check crond process
docker exec myhome-cron ps aux | grep crond

# Restart container
docker restart myhome-cron
```

### Script error

```bash
# Test script manually
docker exec myhome-cron /usr/local/bin/cleanup.sh

# Check script permissions
docker exec myhome-cron ls -la /usr/local/bin/cleanup.sh
```

## 📝 Notes

- Cron runs in foreground mode (`crond -f`)
- Logs are sent to STDOUT (visible via `docker logs`)
- Script includes retry logic (3 retries, 2s delay)
- Timeout set to 20 seconds per request
- Uses internal Docker network (no internet dependency)

## 🔗 Related

- [Deployment Guide](../../README-CRON-DEPLOYMENT.md)
- [API Documentation](../../docs/API-CRON-CLEANUP.md)

