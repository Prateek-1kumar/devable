import { useMemo } from "react";
import { IN_ROUTE, RISER, TERMINAL_NODE, TOP_ROUTE } from "./layout";
import { Node, Pulse, Route, RouteLine } from "./parts";
import { useStory } from "./story";

// The way in: from the terminal's floor node straight to the stack, up a trace
// on its front face past every channel band, then across the top into the
// engine core. A coral pulse runs it once per cycle.

export default function SignalPath() {
  const story = useStory();
  const routes = useMemo(() => ({ inbound: new Route(IN_ROUTE), riser: new Route(RISER), top: new Route(TOP_ROUTE) }), []);
  /** A node is coral while the pulse runs the route it starts. */
  const live = (f: (t: number) => number) => (t: number) => (f(t) >= 0 ? 1 : 0);

  return (
    <group>
      <RouteLine points={IN_ROUTE} />
      <RouteLine points={RISER} />
      <RouteLine points={TOP_ROUTE} />
      <Pulse route={routes.inbound} progress={(t) => story.inbound(t)} />
      <Pulse route={routes.riser} progress={(t) => story.climb(t)} />
      <Pulse route={routes.top} progress={(t) => story.top(t)} />
      <Node at={TERMINAL_NODE} active={live((t) => story.inbound(t))} />
      <Node at={RISER[0]} active={live((t) => story.climb(t))} />
      <Node at={TOP_ROUTE[1]} active={live((t) => story.top(t))} />
    </group>
  );
}
