/**
 * The vocabulary of a project, in one place.
 *
 * The table and the form both name the build stages, and two copies is how a
 * filter ends up offering a stage the form cannot produce.
 */
export const STAGES = [
  { value: "Planning", label: "Planning" },
  { value: "Processing", label: "Processing" },
  { value: "Completed", label: "Completed" },
];

/** Antd Tag colours, so a stage reads the same on every screen. */
export const STAGE_COLOUR: Record<string, string> = {
  Planning: "default",
  Processing: "blue",
  Completed: "green",
};

/**
 * Upload sizes that fill the website's frames without cropping.
 *
 * The project page shows images in fixed shapes; an upload in a different
 * shape gets its edges cut off. Keep these in step with the frontend
 * (`project-showcase.tsx`, `project-specs.tsx`, `project-features.tsx`).
 */
export const BANNER_SIZE_HINT =
  "Recommended: 1344 × 527 px (or larger at the same shape, e.g. 2688 × 1054). Other shapes get cropped.";

/**
 * Features cycle through five layouts on the website (`index % 5`), and each
 * layout frames its image in a different shape.
 */
const FEATURE_SIZE_HINTS = [
  "Recommended: 1200 × 900 px (4:3, landscape)",
  "Recommended: 1200 × 900 px (4:3, landscape)",
  "Recommended: 1200 × 900 px (4:3, landscape)",
  "Recommended: 1200 × 800 px (3:2, landscape)",
  "Recommended: 900 × 1200 px (3:4, portrait)",
];

export const featureSizeHint = (index: number) =>
  `${FEATURE_SIZE_HINTS[index % FEATURE_SIZE_HINTS.length]}. Other shapes get cropped.`;
