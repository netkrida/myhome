# NextAuth.js Implementation Guide

## Overview

This document outlines the complete NextAuth.js authentication implementation following the 3-tier architecture pattern established in this project.

## Architecture

### 3-Tier Architecture Compliance

- **Tier-1**: API routes in `app/api/auth/` for NextAuth endpoints
- **Tier-2**: Application services in `server/api/auth.api.ts` for authentication use cases
- **Tier-3**: Domain services in `server/services/rbac.service.ts`, repositories in `server/repositories/user.repository.ts`

## Implementation Details

### 1. NextAuth Configuration (`src/server/auth/config.ts`)

- **Session Strategy**: JWT (for NextAuth v5 beta compatibility)
- **Providers**: Credentials and Discord OAuth
- **Security**: Proper cookie configuration, CSRF protection
- **Role Integration**: Custom role field in session and JWT

### 2. Database Integration

- **Models**: Account, Session, VerificationToken (Prisma schema)
- **User Model**: Extended with role-based fields (SUPERADMIN, ADMINKOS, RECEPTIONIST, CUSTOMER)
- **Validation**: Real-time user validation against database

### 3. Role-Based Access Control (RBAC)

- **Service**: `RBACService` for permission checking
- **Middleware**: Role-based routing and API protection
- **Context**: User context with role-specific data

## Environment Variables

### Required for Production

```env
AUTH_SECRET="your-secure-random-string-32-chars-minimum"
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="postgresql://user:pass@host:port/db"
DIRECT_URL="postgresql://user:pass@host:port/db"
```

### Optional OAuth Providers

```env
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"
```

## Security Features

### 1. Session Security
- Secure cookies in production
- HttpOnly and SameSite protection
- Automatic session validation
- Token expiration and refresh

### 2. CSRF Protection
- Built-in CSRF token handling
- Secure cookie naming
- Production-ready configurations

### 3. Role-Based Security
- Middleware-level role checking
- API route protection
- Resource-level permissions

## API Endpoints

### NextAuth Endpoints
- `GET/POST /api/auth/[...nextauth]` - Main NextAuth handler
- `GET /api/auth/session` - Session information
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Custom Auth Endpoints
- `GET/POST /api/auth/validate-session` - Session validation
- `POST /api/auth/logout` - Enhanced logout with cleanup
- `POST /api/auth/clear-session` - Session cleanup

## Role-Based Routing

### Dashboard Redirects
- SUPERADMIN → `/dashboard/superadmin`
- ADMINKOS → `/dashboard/adminkos`
- RECEPTIONIST → `/dashboard/receptionist`
- CUSTOMER → `/` (enhanced public pages)

### Middleware Protection
- Automatic role-based redirects
- API route protection
- Public route handling

## Production Deployment

### 1. Environment Setup
- Set secure AUTH_SECRET (32+ characters)
- Configure NEXTAUTH_URL with production domain
- Set up database connections
- Configure OAuth providers if needed

### 2. Security Checklist
- ✅ Secure cookies enabled
- ✅ HTTPS enforced
- ✅ CSRF protection active
- ✅ Session validation implemented
- ✅ Role-based access control

### 3. Database Migration
```bash
npm run db:migrate
```

### 4. Build and Deploy
```bash
npm run build
npm run start
```

## Testing

### Authentication Flow
1. User registration/login
2. Session creation and validation
3. Role-based redirects
4. API access control
5. Logout and cleanup

### Role Testing
- Test each role's access permissions
- Verify dashboard redirects
- Check API endpoint protection

## Troubleshooting

### Common Issues
1. **Session not persisting**: Check cookie configuration
2. **Role mismatch**: Verify database user roles
3. **OAuth errors**: Check provider configuration
4. **CSRF errors**: Verify secure cookie settings

### Debug Mode
Set `debug: true` in NextAuth config for development debugging.

## Migration Notes

### From NextAuth v4 to v5
- Updated import paths
- Changed session strategy to JWT for compatibility
- Updated cookie naming conventions
- Enhanced error handling

### Future Improvements
- Database sessions when NextAuth v5 stable is released
- Additional OAuth providers
- Enhanced session management
- Advanced RBAC features

## Support

For issues or questions:
1. Check NextAuth.js documentation
2. Review implementation logs
3. Verify environment configuration
4. Test with debug mode enabled
