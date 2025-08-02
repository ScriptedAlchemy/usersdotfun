- tanstack start app with near-sign-verify
- login, connect to twitter, create workspace -> then navigate to it authenticated
- query the twitter and transform to create project and tweets
- simple just display the feed of items before they get sent to whatever -- this can disappear, be totally cached on users.fun side, doesn't actually need to persist. Maybe the queue

### High-Priority Tasks

- __Create `WorkflowView` Component:__

  - Create a `workflow-view.tsx` component that displays workflow details in a read-only format.
  - Integrate this component into `WorkflowSheet` to handle the `view` mode.

- __Refactor `run` Schemas and Types:__

  - Move all run-related schemas (e.g., `workflowRunSchema`, `pluginRunSchema`) from `.../schemas/workflows.ts` to `.../schemas/runs.ts`.
  - Move run-related API schemas to `.../schemas/api/runs.ts`.
  - Update the corresponding type definition files (`.../types/runs.ts`, `.../types/workflows.ts`) to reflect these changes.

- __Regenerate Route Tree:__

  - Run `bun run dev` in the `apps/app` directory to regenerate `routeTree.gen.ts` and fix all stale router type errors.

### Medium-Priority Tasks

- __Add Item-Specific Query:__

  - Create a new gateway route to fetch a single source item by its ID.
  - Add a corresponding `getWorkflowItemDetails(itemId: string)` function to the front-end API client.
  - Create a `useWorkflowItemQuery` hook.
  - Update the `.../items/$itemId.tsx` route to use this new hook for better performance.

- __Create `ItemDetailsSheet` Content:__

  - Flesh out the `ItemDetailsSheet` to show an item's processing history and add a button to reprocess it.

### Low-Priority / Future Improvements

- __Database Indexing:__

  - Review Drizzle schemas in `packages/shared-db` and add indexes to frequently queried columns (e.g., foreign keys, status columns, timestamps) to improve database performance.

- __UI/UX Polish:__

  - Add color-coding to status badges in data tables for better visual feedback.
  - Improve the form UI in `WorkflowForm` to use more specific inputs instead of raw textareas for JSON objects.
