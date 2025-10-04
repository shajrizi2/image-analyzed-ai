import { router } from "./trpc";
import { uploadRouter } from "./routers/upload";
import { metadataRouter } from "./routers/metadata";
import { searchRouter } from "./routers/search";

export const appRouter = router({
  upload: uploadRouter,
  metadata: metadataRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
