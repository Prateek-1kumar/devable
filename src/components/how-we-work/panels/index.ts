import type { PanelModule } from "../PanelPlayer";
import content from "./Content";
import distribution from "./Distribution";
import intelligence from "./Intelligence";
import optimization from "./Optimization";
import strategy from "./Strategy";

/** One panel per step, in step order. */
export const PANELS: PanelModule[] = [intelligence, strategy, content, distribution, optimization];
