# UI Design Document for Developers

This document standardizes how we implement core UI features across the app. It references in-repo component pages and provides copy-paste snippets that match our stack (React, Reactstrap, DashLite components, NioIcon icons) and current conventions.

Keep this doc open while building new pages.

Quick index
- Icons — Use Icon component (NioIcon) or approved SVG sets
- Spinners — Colored spinners (loading states)
- Alerts — Inline feedback by situation
- Buttons — Primary actions, size and icon rules
- Cards — Card structure and variants
- DataTables (Grids) — Required feature set for all grids
- New Blank Pages — Base layout to start a new page
- Tabs — Tabbed interfaces with icons
- Toast — Translucent, contextual notifications
- Forms — Pick the right layout and validation pattern
- Right Slide-out Panels — Prefer over modals, integrate with Actions
- Left Navigation — When and how to add sections and sublinks

---

## 1) Icons

Primary source
- Use the Icon component: client/src/components/icon/Icon.jsx
  Example: <Icon name="alert-circle" />
- Browse and copy names from
  • NioIcon page: route “/nioicon” (client/src/pages/components/crafted-icons/NioIcon.jsx)
  • SVG icons page: route “/svg-icons” (client/src/pages/components/crafted-icons/SvgIcons.jsx)

Optional sources
- Project sometimes references Lucide/React icons in docs. If a required glyph doesn’t exist in NioIcon/SVG sets, you may use a one-off React icon, but wrap consistently:
  - Keep sizes consistent with text (use utility classes or inline style)
  - Add aria-label or visually hidden text for important meaning

Sizing and color
- Use font-size utilities or inline style for scale (e.g., className="h-4 w-4" in Tailwind style docs translates to equivalent CSS if needed)
- Use color via contextual text utilities (text-primary, text-soft) or inline style

Accessibility
- If the icon conveys meaning, pair with text or add aria-label
- Icons used purely decoratively should have role="img" and be understandable without them

---

## 2) Spinners

Reference: /components/spinner (client/src/pages/components/Spinner.jsx)

Usage
- Prefer Reactstrap Spinner with color variants for brand alignment
- For page-level loading, center within a card:

```jsx
<div className="card card-bordered">
  <div className="card-inner text-center py-5">
    <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
      <span className="sr-only">Loading...</span>
    </div>
    <div className="mt-3 text-soft">Loading...</div>
  </div>
</div>
```

Inline loading in buttons
```jsx
<Button disabled color="primary">
  <Spinner size="sm" />
  <span> Loading... </span>
</Button>
```

Do/Don’t
- Do: choose color to match context (primary, info, etc.)
- Don’t: block entire page if only a small section loads; use inline spinner

---

## 3) Alerts

Reference: /components/alerts (client/src/pages/components/Alerts.jsx)

Mapping
- success: operation succeeded
- info: general info
- warning: user attention required, non-blocking
- danger: errors/failures

Usage
```jsx
<Alert className="alert-icon" color="success">
  <Icon name="check-circle" />
  <strong>Saved</strong>. Your settings have been updated.
</Alert>
```

Dismissible
- Use UncontrolledAlert or add a close button when user control is needed

When to use Alerts vs Toasts
- Alerts live inline on the page near the related content
- Toasts are ephemeral overlays for background actions or cross-page events

---

## 4) Buttons

Reference: /components/buttons (client/src/pages/components/Buttons.jsx)

Patterns
- Primary/secondary buttons from Reactstrap (color prop)
- Use icon alignment patterns shown in Buttons.jsx
  - Left icon: <Icon name="setting" /> <span>Label</span>
  - Right icon: <span>Label</span> <Icon name="chevron-down" />
- Sizes: sm, default, lg, xl available

Example
```jsx
<Button color="primary">
  <Icon name="setting" />
  <span>Save</span>
</Button>
```

---

## 5) Cards

Reference: /components/cards (client/src/pages/components/Cards.jsx)

Standard structure
```jsx
<Card className="card-bordered">
  <CardBody className="card-inner">
    <CardTitle tag="h5">Card title</CardTitle>
    <CardSubtitle tag="h6" className="mb-2 ff-base">
      Card subtitle
    </CardSubtitle>
    <CardText>
      Some quick example text to build on the card title and make up
      the bulk of the card's content.
    </CardText>
    <CardLink href="#">Card Link</CardLink>
    <CardLink href="#">Another Link</CardLink>
  </CardBody>
</Card>
```

Guidelines
- Prefer card-bordered + card-inner
- Use CardHeader/CardFooter sparingly for titles/meta
- Keep actions aligned to right within card-inner when applicable

---

## 6) DataTables (Grids)

Gold standard reference: /assets/inventory (client/src/pages/assets/AssetInventory.jsx) with AssetDataTable (client/src/pages/assets/components/AssetDataTable.jsx)

All grids/tables must include
- Search (client-side or server-side)
- Sortable columns (asc/desc)
- Pagination with per-page selector (10/25/50/100)
- Row selection (single + bulk select all)
- Export buttons (CSV, PDF, Excel) aligned with current export utility
- Actions column with dropdown (view/edit/etc.)
- Loading and empty states with appropriate colored spinner and muted text
- Optional: filter drawer (toggle) with common field filters

Recommended implementation
- Use the ReactDataTable or a feature wrapper like AssetDataTable when you need the full set
- Export example available in AssetDataTable.jsx via handleExport('csv'|'pdf'|'excel')

Minimal usage example (pseudocode)
```jsx
<AssetDataTable
  data={rows}
  columns={columns}
  loading={loading}
  onSelectedRowsChange={setSelected}
  clearSelectedRows={() => setSelected([])}
/>
```

Actions column pattern
- Use UncontrolledDropdown with Icon name="more-h"
- Each action should open a Right Slide-out Panel (see section 11)

---

## 7) New Blank Pages

Reference: /admin/distribution-groups (client/src/pages/admin/distribution-groups/DistributionGroups.jsx)

Skeleton to start a new admin page
```jsx
<Head title="Admin - Page Title" />
<Content>
  <BlockHead size="sm">
    <BlockBetween>
      <BlockHeadContent>
        <BlockTitle tag="h3" page>Page Title</BlockTitle>
        <BlockDes className="text-soft"><p>Short description.</p></BlockDes>
      </BlockHeadContent>
    </BlockBetween>
  </BlockHead>
  <Block>
    <div className="card card-stretch">
      <div className="card-inner">
        {/* Your content */}
      </div>
    </div>
  </Block>
</Content>
```

---

## 8) Tabs (with icons)

References
- Components example: /components/tabs (client/src/pages/components/Tabs.jsx)
- In production: /admin/email-management (client/src/pages/admin/email-management/EmailManagement.jsx)

Guidelines
- Use Reactstrap Nav + TabContent/TabPane
- Include icons in tab labels using <Icon name="..." />
- Keep labels short; show 3–6 tabs per view maximum

Example (with icon)
```jsx
<Nav tabs>
  <NavItem>
    <NavLink className={classnames({ active: activeTab === "logs" })} onClick={() => setActiveTab("logs")}> 
      <Icon name="file-text" /> <span>Logs</span>
    </NavLink>
  </NavItem>
  {/* ...more tabs */}
</Nav>
<TabContent activeTab={activeTab}>
  <TabPane tabId="logs">{/* content */}</TabPane>
</TabContent>
```

---

## 9) Toast (translucent)

Reference: /components/toast (client/src/pages/components/Toast.jsx)

Rules
- Use for transient notifications that don’t need space in main layout
- Prefer top-right placement; use Toast container for stacking
- Use translucent backgrounds per component styles; keep text legible

Example
```jsx
<div className="toast-container" style={{ position: "absolute", top: 0, right: 0 }}>
  <Toast isOpen>
    <ToastHeader close={<button className="close"><Icon name="cross-sm" /></button>}>
      <strong className="text-primary">System</strong>
    </ToastHeader>
    <ToastBody>Settings saved.</ToastBody>
  </Toast>
</div>
```

When to prefer Alerts instead
- Inline validation or persistent, contextual messaging on the page content

---

## 10) Forms

Reference: /components/form-layouts (client/src/pages/components/forms/FormLayouts.jsx)

Layout selection
- One column: short/simple forms or mobile-first pages
- Two columns: medium data density, balanced reading flow
- Full-width grouped rows: settings panels with labels left, inputs right (see examples)

Patterns
- Label every input with htmlFor
- Use form notes for helper text
- Use custom switches/checkboxes per examples
- Include validation styling (is-invalid + invalid-feedback)
- Place primary submit on right; destructive secondary on left

---

## 11) Right Slide-out Panels (preferred over modals)

Components
- SlideOutPanel: client/src/components/partials/SlideOutPanel.jsx
- Common styles: client/src/pages/assets/components/AssetSlideOutPanels.css, and per-panel CSS when needed

Rules
- Any content traditionally presented in a modal should be implemented as a right slide-out panel
- When an item is selected from a grid’s “Actions” column, open a related slide-out
- Provide a clear title, subtitle (context), and a large close hit area
- Keep panel sizes: default, md, lg; only use larger for heavy detail

Wiring pattern
```jsx
// In grid Actions
<DropdownItem onClick={(e) => { e.preventDefault(); setSelected(item); setPanelOpen(true); }}>
  <Icon name="eye" /><span>View Details</span>
</DropdownItem>

// In page
<SlideOutPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Details" subtitle={item?.name} size="lg">
  <div className="p-4">{/* panel content */}</div>
</SlideOutPanel>
```

Loading inside a panel
```jsx
{loading && (
  <div className="text-center p-4">
    <Icon name="spinner" className="spinning" />
    <p>Loading...</p>
  </div>
)}
```

Tabs inside a panel
- Use the same Tabs guidelines; keep content scrollable within the panel

---

## 12) Left Navigation

File: client/src/layout/sidebar/MenuData.jsx

When to add
- New product area with multiple pages: add a new heading + section
- Related content to an existing area: add a subMenu item under the closest section

Conventions
- Keep icon names consistent (NioIcon name strings)
- Title case for text labels
- Route paths should correspond to route/Index.jsx configuration

Example sublink addition
```js
{
  icon: "mail",
  text: "Communication",
  subMenu: [
    {
      text: "Email Management",
      link: "/admin/email-management",
      icon: "mail",
    },
  ],
}
```

---

## 13) Component Reference Index

Use these pages while developing to copy exact markup patterns used in production:
- Icons: /nioicon, /svg-icons
- Spinners: /components/spinner
- Alerts: /components/alerts
- Buttons: /components/buttons
- Cards: /components/cards
- Tabs: /components/tabs
- Toast: /components/toast
- Form Layouts: /components/form-layouts
- DataTables: /assets/inventory (end-to-end example), /table-datatable (component demo)
- Right Slide-out Panels: See Asset panels under client/src/pages/assets/components/*Panel.jsx
- New Blank Page: /admin/distribution-groups

---

## 14) Success Criteria

- Every new grid includes: search, sorting, pagination, per-page selector, selection, export, actions column, and proper loading/empty states
- Tabs include icons and follow our Reactstrap patterns
- Alerts vs Toasts are chosen according to guidance
- Right slide-out panels are used for actions instead of modals and are triggered from the grid’s Actions column
- Forms follow the chosen layout (1 or 2 columns) and validation patterns from Form Layouts
- Cards use card-bordered + card-inner and match typography
- Left nav is updated when new sections/pages are added, following naming and icon conventions

If something you need isn’t covered, extend this document with a brief proposal and examples before building.
