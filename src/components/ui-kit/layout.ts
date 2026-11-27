/*
 * Where windows go, the way core's WindowManager and layouts put them. All sizes are UI units. The stage is the screen
 * at 360 units high: the client at UI Scale 1.5 on a 16:9 screen (the game's own unit is framebuffer height / 540, times
 * UI Scale), large enough to read on a web page and still a setup players use.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export const SCREEN_H = 360;
export const SCREEN_W = 640;
/** ThemeSettings' defaults. */
export const BAR_H = 14;
export const GAPS_IN = 3;
export const GAPS_OUT = 6;
export const TITLE_H = 13;
export const BORDER = 1;
/** ColumnsLayout.MIN_WIDTH, also GroupWindows' MIN_TILE_WIDTH. */
export const MIN_TILE = 130;

const inset = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

/** WindowManager.workArea: the screen below the bar. */
export function workArea(width = SCREEN_W, height = SCREEN_H): Rect {
  return { x: 0, y: BAR_H, w: width, h: height - BAR_H };
}

/** GroupWindows.capacity: how many group windows a workspace takes before the next addon's go elsewhere. */
export function capacity(area = workArea()): number {
  const a = inset(area, GAPS_OUT);
  return Math.max(2, Math.floor((a.w + GAPS_IN) / (MIN_TILE + GAPS_IN)));
}

/**
 * The first-run grid (GroupWindows.openGroups on an empty Dwindle workspace): each new window splits the least recently
 * split one, for an even grid. Returns each window's rect, in the order given.
 */
export function firstRunGrid(count: number, area = workArea()): Rect[] {
  // Built directly as the tree openGroups makes: a queue of windows to split next.
  type Leaf = { id: number; box: Rect };
  const a = inset(area, GAPS_OUT);
  const leaves: Leaf[] = [];
  const queue: Leaf[] = [];
  for (let i = 0; i < count; i++) {
    const target = queue.shift();
    if (!target) {
      const leaf = { id: i, box: a };
      leaves.push(leaf);
      queue.push(leaf);
      continue;
    }
    const box = target.box;
    const horizontal = box.w >= box.h;
    const first = horizontal ? { ...box, w: box.w / 2 } : { ...box, h: box.h / 2 };
    const second = horizontal ? { ...box, x: box.x + box.w / 2, w: box.w / 2 } : { ...box, y: box.y + box.h / 2, h: box.h / 2 };
    target.box = first;
    const leaf = { id: i, box: second };
    leaves.push(leaf);
    queue.push(target, leaf);
  }
  return leaves.sort((x, y) => x.id - y.id).map((l) => inset(l.box, GAPS_IN / 2));
}

/** ColumnsLayout: side by side, equal widths, at least MIN_TILE each. */
export function columns(count: number, area = workArea()): Rect[] {
  const a = inset(area, GAPS_OUT);
  const w = Math.max(MIN_TILE, (a.w - GAPS_IN * (count - 1)) / count);
  return Array.from({ length: count }, (_, i) => ({ x: a.x + i * (w + GAPS_IN), y: a.y, w, h: a.h }));
}

/** WindowManager.contentRect's inset: inside the border, clear of the rounded corners. */
export function contentInset(rounding: number) {
  return BORDER + (rounding - BORDER) * (1 - 1 / Math.SQRT2);
}

/*
 * A Dwindle tree (DwindleLayout), immutable: each new window splits the focused one, the split's direction taken from
 * the box it splits (wide boxes split side by side) and kept from then on; closing a window gives its sibling the room.
 */
export type DNode = { w: string } | { a: DNode; b: DNode; h: boolean; r: number };

/** A divider between two tiles (DwindleLayout's splitters): `path` finds its split in the tree ("" the root, then a/b). */
export type Splitter = { path: string; vertical: boolean; bounds: Rect; box: Rect };

/** Every window's rect, the tree laid out over `area`, and the dividers between them. */
export function dwindleLayout(tree: DNode | null, area = workArea()): { rects: Map<string, Rect>; splitters: Splitter[] } {
  const rects = new Map<string, Rect>();
  const splitters: Splitter[] = [];
  const walk = (n: DNode, box: Rect, path: string) => {
    if ("w" in n) {
      rects.set(n.w, inset(box, GAPS_IN / 2));
      return;
    }
    if (n.h) {
      const wa = box.w * n.r;
      walk(n.a, { ...box, w: wa }, path + "a");
      walk(n.b, { ...box, x: box.x + wa, w: box.w - wa }, path + "b");
      splitters.push({ path, vertical: true, box, bounds: { x: box.x + wa - GAPS_IN / 2 - 2, y: box.y, w: GAPS_IN + 4, h: box.h } });
    } else {
      const ha = box.h * n.r;
      walk(n.a, { ...box, h: ha }, path + "a");
      walk(n.b, { ...box, y: box.y + ha, h: box.h - ha }, path + "b");
      splitters.push({ path, vertical: false, box, bounds: { x: box.x, y: box.y + ha - GAPS_IN / 2 - 2, w: box.w, h: GAPS_IN + 4 } });
    }
  };
  if (tree) walk(tree, inset(area, GAPS_OUT), "");
  return { rects, splitters };
}

export function dwindleRects(tree: DNode | null, area = workArea()): Map<string, Rect> {
  return dwindleLayout(tree, area).rects;
}

/** The split at `path` set to `ratio` (dragging its divider), kept between 0.1 and 0.9 as core keeps it. */
export function dwindleSetRatio(tree: DNode | null, path: string, ratio: number): DNode | null {
  if (!tree || "w" in tree) return tree;
  if (path === "") return { ...tree, r: Math.min(0.9, Math.max(0.1, ratio)) };
  return path[0] === "a" ? { ...tree, a: dwindleSetRatio(tree.a, path.slice(1), ratio)! } : { ...tree, b: dwindleSetRatio(tree.b, path.slice(1), ratio)! };
}

export type Side = "left" | "right" | "up" | "down";

/** DwindleLayout.insertBeside: `target`'s tile split evenly, `id` on `side` of it (a window dropped near its edge). */
export function dwindleInsertBeside(tree: DNode | null, id: string, target: string, side: Side): DNode | null {
  if (id === target || !leaves(tree).includes(target)) return tree;
  const rest = dwindleRemove(tree, id);
  const first = side === "left" || side === "up";
  const h = side === "left" || side === "right";
  const put = (n: DNode): DNode =>
    "w" in n ? (n.w === target ? { a: first ? { w: id } : n, b: first ? n : { w: id }, h, r: 0.5 } : n) : { ...n, a: put(n.a), b: put(n.b) };
  return rest ? put(rest) : { w: id };
}

/** WindowManager.splitSide: dropped within 30% of an edge it splits that side; towards the middle, null (a swap). */
export function splitSide(r: Rect, x: number, y: number): Side | null {
  const fx = (x - r.x) / r.w, fy = (y - r.y) / r.h;
  const d = { left: fx, right: 1 - fx, up: fy, down: 1 - fy };
  const nearest = Math.min(d.left, d.right, d.up, d.down);
  if (nearest > 0.3) return null;
  return nearest === d.left ? "left" : nearest === d.right ? "right" : nearest === d.up ? "up" : "down";
}

/** WindowManager.half: the half of `r` a window dropped on `side` takes. */
export function half(r: Rect, side: Side): Rect {
  return side === "left" ? { ...r, w: r.w / 2 } : side === "right" ? { ...r, x: r.x + r.w / 2, w: r.w / 2 } : side === "up" ? { ...r, h: r.h / 2 } : { ...r, y: r.y + r.h / 2, h: r.h / 2 };
}

/** `id` added beside `target` (the last window when there's none). */
export function dwindleAdd(tree: DNode | null, id: string, target?: string, area = workArea()): DNode {
  if (!tree) return { w: id };
  const at = target && leaves(tree).includes(target) ? target : leaves(tree).at(-1)!;
  const box = inset(dwindleRects(tree, area).get(at)!, -GAPS_IN / 2);
  const split = (n: DNode): DNode =>
    "w" in n ? (n.w === at ? { a: n, b: { w: id }, h: box.w >= box.h, r: 0.5 } : n) : { ...n, a: split(n.a), b: split(n.b) };
  return split(tree);
}

export function dwindleRemove(tree: DNode | null, id: string): DNode | null {
  if (!tree) return null;
  if ("w" in tree) return tree.w === id ? null : tree;
  if ("w" in tree.a && tree.a.w === id) return tree.b;
  if ("w" in tree.b && tree.b.w === id) return tree.a;
  return { ...tree, a: dwindleRemove(tree.a, id)!, b: dwindleRemove(tree.b, id)! };
}

/** The split holding `id` flipped (Alt + J). */
export function dwindleToggle(tree: DNode | null, id: string): DNode | null {
  if (!tree || "w" in tree) return tree;
  if (("w" in tree.a && tree.a.w === id) || ("w" in tree.b && tree.b.w === id)) return { ...tree, h: !tree.h };
  return { ...tree, a: dwindleToggle(tree.a, id)!, b: dwindleToggle(tree.b, id)! };
}

/** `id` grown by `amount` of its split (Alt + = / -). */
export function dwindleResize(tree: DNode | null, id: string, amount: number): DNode | null {
  if (!tree || "w" in tree) return tree;
  const inA = "w" in tree.a && tree.a.w === id, inB = "w" in tree.b && tree.b.w === id;
  if (inA || inB) return { ...tree, r: Math.min(0.9, Math.max(0.1, tree.r + (inA ? amount : -amount))) };
  return { ...tree, a: dwindleResize(tree.a, id, amount)!, b: dwindleResize(tree.b, id, amount)! };
}

export function dwindleSwap(tree: DNode | null, x: string, y: string): DNode | null {
  if (!tree) return null;
  if ("w" in tree) return tree.w === x ? { w: y } : tree.w === y ? { w: x } : tree;
  return { ...tree, a: dwindleSwap(tree.a, x, y)!, b: dwindleSwap(tree.b, x, y)! };
}

/** The windows in order, left to right and top to bottom: also Columns' order, so a layout change keeps it. */
export function leaves(tree: DNode | null): string[] {
  if (!tree) return [];
  return "w" in tree ? [tree.w] : [...leaves(tree.a), ...leaves(tree.b)];
}

/** The first-run tree for these windows: each splits the least recently split one (GroupWindows.openGroups). */
export function firstRunTree(ids: string[], area = workArea()): DNode | null {
  let tree: DNode | null = null;
  const queue: string[] = [];
  for (const id of ids) {
    const target = queue.shift();
    tree = dwindleAdd(tree, id, target, area);
    if (target) queue.push(target);
    queue.push(id);
  }
  return tree;
}
