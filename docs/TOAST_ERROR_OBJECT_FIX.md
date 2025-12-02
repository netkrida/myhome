# Toast Error Object Fix

## Problem
Runtime error occurred when displaying toast notifications:
```
Objects are not valid as a React child (found: object with keys {code, message})
```

This happened when API responses returned error objects instead of strings, and these objects were passed directly to `toast.error()`.

## Root Cause
- API routes return error responses in various formats:
  - Simple strings: `"Error message"`
  - Objects: `{ code: "ERROR_CODE", message: "Error message" }`
  - Validation errors: `{ error: "Validation error", details: [...] }`
- React cannot render objects as children, causing runtime errors
- Multiple components were calling `toast.error(result.error)` without checking if `result.error` was a string or object

## Solution

### 1. Created Utility Function (`src/lib/toast-utils.ts`)
Created `formatErrorMessage()` helper function that safely converts any error format to a string:
- Handles string errors (returns as-is)
- Handles object errors with `message` property
- Handles object errors with `code` property
- Handles Zod validation errors with `details` array
- Provides fallback message when error cannot be parsed

### 2. Updated Components
Updated all components that display toast errors to use `formatErrorMessage()`:
- ✅ `src/app/(protected-pages)/dashboard/adminkos/iklan/page.tsx`
- ✅ `src/components/dashboard/adminkos/iklan/advertisement-submit-dialog.tsx`
- ✅ `src/app/(protected-pages)/dashboard/superadmin/iklan/page.tsx`

### 3. Usage Pattern
Before:
```typescript
toast.error(result.error || "Fallback message");
```

After:
```typescript
import { formatErrorMessage } from "@/lib/toast-utils";
toast.error(formatErrorMessage(result.error, "Fallback message"));
```

## Files Modified
1. **Created**: `src/lib/toast-utils.ts` - Utility functions for safe error formatting
2. **Updated**: `src/app/(protected-pages)/dashboard/adminkos/iklan/page.tsx`
3. **Updated**: `src/components/dashboard/adminkos/iklan/advertisement-submit-dialog.tsx`
4. **Updated**: `src/app/(protected-pages)/dashboard/superadmin/iklan/page.tsx`

## Future Maintenance
When adding new toast error notifications:
1. Always import `formatErrorMessage` from `@/lib/toast-utils`
2. Wrap error objects with `formatErrorMessage()` before passing to toast
3. Provide appropriate fallback message as second parameter

## Testing
Test by:
1. Navigate to `http://localhost:3000/dashboard/adminkos/iklan`
2. Verify no React runtime errors appear
3. Trigger error scenarios (invalid form submission, API errors)
4. Confirm error messages display correctly as strings

## Related Files to Check
Other files that may need similar fixes (found via grep but not yet causing issues):
- `src/components/dashboard/adminkos/rooms-v2/room-edit-modal.tsx`
- `src/components/dashboard/adminkos/rooms-v2/add-room-modal.tsx`
- `src/app/(protected-pages)/dashboard/superadmin/transactions/page.tsx`
- `src/app/(protected-pages)/dashboard/adminkos/transaction/transaction-page-client.tsx`

These files already check for `result.error?.message`, which is safer but could be refactored to use `formatErrorMessage()` for consistency.
