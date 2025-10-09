# Dockerfile untuk Cron Container
# Minimal Alpine image dengan curl, bash, dan crond

FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache \
    curl \
    bash \
    busybox-suid \
    tzdata

# Set timezone (optional, default UTC)
ENV TZ=UTC

# Copy crontab file
COPY crontab /etc/crontabs/root

# Copy cleanup script
COPY cleanup.sh /usr/local/bin/cleanup.sh

# Make script executable
RUN chmod +x /usr/local/bin/cleanup.sh

# Create log directory
RUN mkdir -p /var/log/cron

# Start crond in foreground
CMD ["crond", "-f", "-l", "2"]

