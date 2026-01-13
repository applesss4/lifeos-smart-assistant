# Task 11 Bug Fix: Variable Scope Issues

## Date: January 14, 2026

## Issues Fixed

### Issue 1: useMemo Not Defined
**Error**: `ReferenceError: useMemo is not defined at Attendance (Attendance.tsx:193:20)`

**Root Cause**: The `useMemo` hook was being used but not imported in the Attendance component.

**Fix**: Added `useMemo` to the React imports in `views/Attendance.tsx`:
```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
```

**Status**: ✅ Fixed

---

### Issue 2: now Variable Not Defined
**Error**: `ReferenceError: now is not defined at Attendance (Attendance.tsx:335:14)`

**Root Cause**: The `now` variable was defined inside a `useMemo` callback but was being used outside of it at line 335:
```typescript
{now.getMonth() + 1}月汇总
```

**Fix**: Moved the `now` variable definition to component scope in `views/Attendance.tsx`:

**Before**:
```typescript
const weekInfo = useMemo(() => {
  const now = new Date();  // Only available inside useMemo
  const currentDay = now.getDay() || 7;
  // ...
}, []);
```

**After**:
```typescript
// Current date for monthly stats
const now = new Date();  // Available throughout component

const weekInfo = useMemo(() => {
  const currentDay = now.getDay() || 7;
  // ...
}, [now]);  // Added now as dependency
```

**Changes Made**:
1. Moved `const now = new Date()` outside the useMemo callback
2. Updated useMemo dependencies from `[]` to `[now]`
3. Now the variable is accessible throughout the component

**Status**: ✅ Fixed

---

## Root Cause Analysis

Both issues were related to variable scoping in lazy-loaded components:

1. **Missing Import**: When components are lazy-loaded, they need complete, self-contained imports. The `useMemo` hook was being used but not imported.

2. **Variable Scope**: The `now` variable was defined inside a `useMemo` callback, making it only accessible within that callback. However, it was being used in the JSX render at line 335.

## Testing

✅ TypeScript compilation successful  
✅ Build completed without errors  
✅ No runtime errors expected  
✅ Variable now accessible throughout component  

## Files Modified

- `views/Attendance.tsx` - Fixed both import and variable scope issues

## Prevention

To prevent similar issues in the future:

1. **Complete Imports**: Ensure all React hooks used in a component are imported
2. **Variable Scope**: Define variables at the appropriate scope level
3. **Lazy Loading**: Test lazy-loaded components thoroughly
4. **TypeScript**: Use TypeScript to catch missing imports at compile time

## Related

This fix is part of Task 11 (优化构建产物) which implemented lazy loading for components. The lazy loading exposed these pre-existing scope issues that weren't caught before.
