#!/bin/bash

# Database Backup Script for MyHome
# Creates automated backups of PostgreSQL database

set -e

BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
DOMAIN="myhome.co.id"

echo "💾 MyHome Database Backup"
echo "========================"
echo "Domain: $DOMAIN"
echo "Date: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Load environment variables
load_env() {
    if [ -f ".env" ]; then
        source .env
        print_success "Environment variables loaded"
    else
        print_error ".env file not found!"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    mkdir -p $BACKUP_DIR
    print_status "Backup directory: $BACKUP_DIR"
}

# Backup database
backup_database() {
    print_status "Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/myhome_db_$DATE.sql"
    
    # Check if database container is running
    if ! docker-compose ps db | grep -q "Up"; then
        print_error "Database container is not running!"
        exit 1
    fi
    
    # Create backup
    docker-compose exec -T db pg_dump -U "${POSTGRES_USER:-myhome}" "${POSTGRES_DB:-db_myhome}" > "$BACKUP_FILE"
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        print_success "Database backup created: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        print_success "Backup compressed: $BACKUP_FILE.gz"
        
        # Show backup size
        BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
        print_status "Backup size: $BACKUP_SIZE"
    else
        print_error "Backup failed or empty!"
        exit 1
    fi
}

# Backup uploaded files (if any)
backup_uploads() {
    print_status "Checking for uploaded files..."
    
    if [ -d "uploads" ]; then
        UPLOADS_BACKUP="$BACKUP_DIR/myhome_uploads_$DATE.tar.gz"
        tar -czf "$UPLOADS_BACKUP" uploads/
        print_success "Uploads backup created: $UPLOADS_BACKUP"
    else
        print_status "No uploads directory found (using Cloudinary)"
    fi
}

# Backup environment and config
backup_config() {
    print_status "Backing up configuration..."
    
    CONFIG_BACKUP="$BACKUP_DIR/myhome_config_$DATE.tar.gz"
    
    # Create temporary config directory
    mkdir -p temp_config
    
    # Copy important config files (without secrets)
    cp .env.example temp_config/
    cp docker-compose.yml temp_config/ 2>/dev/null || true
    cp docker-compose.prod.yml temp_config/ 2>/dev/null || true
    cp next.config.js temp_config/
    cp package.json temp_config/
    cp -r prisma/ temp_config/ 2>/dev/null || true
    cp -r nginx/ temp_config/ 2>/dev/null || true
    
    # Create archive
    tar -czf "$CONFIG_BACKUP" temp_config/
    rm -rf temp_config/
    
    print_success "Configuration backup created: $CONFIG_BACKUP"
}

# Clean old backups
clean_old_backups() {
    print_status "Cleaning old backups..."
    
    # Keep last 7 days of backups
    find $BACKUP_DIR -name "myhome_*.gz" -mtime +7 -delete 2>/dev/null || true
    find $BACKUP_DIR -name "myhome_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    print_success "Old backups cleaned (kept last 7 days)"
}

# List backups
list_backups() {
    print_status "Available backups:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
        ls -lh $BACKUP_DIR/ | grep -E "\.(sql\.gz|tar\.gz)$" | while read line; do
            echo "  $line"
        done
    else
        print_warning "No backups found"
    fi
}

# Restore database
restore_database() {
    if [ -z "$1" ]; then
        print_error "Please specify backup file to restore"
        echo "Usage: $0 restore <backup_file>"
        list_backups
        exit 1
    fi
    
    RESTORE_FILE="$1"
    
    if [ ! -f "$RESTORE_FILE" ]; then
        print_error "Backup file not found: $RESTORE_FILE"
        exit 1
    fi
    
    print_warning "This will REPLACE the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    print_status "Restoring database from: $RESTORE_FILE"
    
    # Check if file is compressed
    if [[ "$RESTORE_FILE" == *.gz ]]; then
        gunzip -c "$RESTORE_FILE" | docker-compose exec -T db psql -U "${POSTGRES_USER:-myhome}" -d "${POSTGRES_DB:-db_myhome}"
    else
        docker-compose exec -T db psql -U "${POSTGRES_USER:-myhome}" -d "${POSTGRES_DB:-db_myhome}" < "$RESTORE_FILE"
    fi
    
    print_success "Database restored successfully!"
}

# Setup automated backups
setup_cron() {
    print_status "Setting up automated backups..."
    
    SCRIPT_PATH=$(realpath "$0")
    CRON_JOB="0 2 * * * cd $(pwd) && $SCRIPT_PATH backup >/dev/null 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    print_success "Automated backup scheduled for 2 AM daily"
    print_status "Current crontab:"
    crontab -l | grep -E "(myhome|backup)" || print_warning "No backup jobs found in crontab"
}

# Show backup status
show_status() {
    echo ""
    print_success "💾 Backup Status for MyHome"
    echo "============================"
    echo ""
    
    # Database status
    if docker-compose ps db | grep -q "Up"; then
        print_success "✅ Database is running"
    else
        print_warning "⚠️  Database is not running"
    fi
    
    # Backup directory
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_COUNT=$(ls -1 $BACKUP_DIR/*.gz 2>/dev/null | wc -l)
        print_status "📁 Backup directory: $BACKUP_DIR ($BACKUP_COUNT files)"
    else
        print_warning "📁 Backup directory not found"
    fi
    
    # Disk space
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}')
    print_status "💽 Disk usage: $DISK_USAGE"
    
    # Last backup
    LAST_BACKUP=$(ls -t $BACKUP_DIR/myhome_db_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LAST_BACKUP" ]; then
        LAST_DATE=$(stat -c %y "$LAST_BACKUP" | cut -d' ' -f1)
        print_status "🕒 Last backup: $LAST_DATE"
    else
        print_warning "🕒 No backups found"
    fi
    
    echo ""
    list_backups
}

# Main function
main() {
    case "${1:-status}" in
        "backup")
            load_env
            create_backup_dir
            backup_database
            backup_uploads
            backup_config
            clean_old_backups
            print_success "🎉 Backup completed successfully!"
            ;;
        "restore")
            load_env
            restore_database "$2"
            ;;
        "list")
            list_backups
            ;;
        "cron")
            setup_cron
            ;;
        "status"|*)
            show_status
            ;;
    esac
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  backup  - Create full backup"
    echo "  restore - Restore from backup file"
    echo "  list    - List available backups"
    echo "  cron    - Setup automated backups"
    echo "  status  - Show backup status (default)"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore backups/myhome_db_20241003_120000.sql.gz"
    echo "  $0 cron"
fi

main "$@"
