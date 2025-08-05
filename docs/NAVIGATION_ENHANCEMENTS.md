# Navigation Configuration Enhancements

## Changes Made to NavigationConfig.tsx

### 1. **Improved Context Filtering Logic**

- Changed the filtering approach to properly handle all three contexts (Company, Brand, Store)
- Updated `filterSectionByContext` to return `NavigationSection | null` instead of `boolean`
- Moved all filtering logic to the filter function instead of pre-filtering at definition

### 2. **Updated Section Permissions**

- Changed "조직 관리" (Organization) from `permission: 'manager'` to `permission: 'read'`
- Changed "마케팅" (Marketing) from `permission: 'write'` to `permission: 'read'`
- Changed "운영 관리" (Operations) from `permission: 'write'` to `permission: 'read'`
- This ensures sections are visible to more users, with individual items controlling access

### 3. **Added Context Restrictions**

- Added `showOnContext: ['company', 'brand']` to "재고 이동" (Inventory Transfers)
  - Store level users don't need inter-store transfer functionality
- Added `showOnContext: ['company', 'brand']` to "메뉴 관리" (Menu Management)
  - Menu management should be done at brand level, not individual stores

### 4. **Enhanced Filtering Algorithm**

```typescript
// New filtering logic
return allSections
  .map((section) => filterSectionByContext(section, context))
  .filter((section) => section !== null && section.items.length > 0) as NavigationSection[];
```

### 5. **Unified Menu Structure**

The menu now maintains the same 8-section structure across all dashboards:

1. 현황 관리 (Overview & Monitoring)
2. 조직 관리 (Organization)
3. 재고 관리 (Inventory)
4. 매출 관리 (Sales & Orders)
5. 마케팅 (Marketing)
6. 분석 & 리포트 (Analytics)
7. 운영 관리 (Operations)
8. 시스템 관리 (System)

## Result

- **Company Dashboard**: Shows all menu items (full access)
- **Brand Dashboard**: Shows brand and store management items (no company-only items)
- **Store Dashboard**: Shows operational items relevant to store management (no cross-store features)

The hierarchy is properly respected:

- Company > Brand > Store
- Each level sees only what's relevant to their scope of operations
