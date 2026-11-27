/*
 * The tutorial's chapters. Each step is a goal: it's done when the menu reaches the state it teaches, however someone
 * got there (the keys are core's defaults, UiBinds; a chip can be clicked when the browser keeps a key for itself).
 * "Show me" plays the step's actions instead. Every chapter starts from a known state, so any step can be opened.
 */
import { leaves } from "@/components/ui-kit/layout";
import { initialState, launcherEntries, MODULE_WINDOW, reduce, windowsOf, type Action, type MenuState } from "./engine";

export type Step = {
  text: string;
  /** The keys, as chips; "mod" is the mod key (Alt unless changed). */
  keys?: string[][];
  done: (s: MenuState) => boolean;
  show: Action[];
  /** What to pulse in the stage. */
  hint?: { card?: string; setting?: string };
  /** What the instruction card draws its line to: a selector in the stage, or none. */
  target?: string | ((s: MenuState) => string | null);
};

const FOCUSED = "[data-win][data-focused]";
const LAUNCHER = (s: MenuState) => (s.launcher.open ? "[data-launcher]" : null);
const win = (id: string) => `[data-win="${id}"]`;

export type Chapter = { slug: string; title: string; summary: string; start: () => MenuState; steps: Step[] };

const opened = () => reduce(initialState(), { type: "open", workspace: 1 });
const run = (s: MenuState, actions: Action[]) => actions.reduce(reduce, s);

export const CHAPTERS: Chapter[] = [
  {
    slug: "opening-the-menu",
    title: "Opening the menu",
    summary: "The mod key, workspaces, and closing it again.",
    start: initialState,
    steps: [
      {
        text: "Myriad's menu opens over the game. Its keys use the mod key, Alt by default. Press Alt + 1 to open it on workspace 1.",
        keys: [["mod", "1"]],
        done: (s) => s.open && s.active === 1,
        show: [{ type: "workspace", n: 1 }],
      },
      {
        text: "Esc closes it. So does the same key again.",
        keys: [["Esc"]],
        done: (s) => !s.open,
        show: [{ type: "close" }],
      },
      {
        text: "Alt and any number opens the menu on that workspace. Open workspace 1 again.",
        keys: [["mod", "1"]],
        done: (s) => s.open,
        show: [{ type: "workspace", n: 1 }],
      },
    ],
  },
  {
    slug: "modules-and-settings",
    title: "Modules and settings",
    summary: "Turning modules on, and their settings.",
    start: opened,
    steps: [
      {
        text: "Each window holds one addon's modules of one kind. Click Kill Aura to turn it on: the tinted bar means it's on.",
        keys: [["Click"]],
        hint: { card: "Kill Aura" },
        target: '[data-card="Kill Aura"] .mk-card-head',
        done: (s) => s.on.includes("Kill Aura"),
        show: [{ type: "toggle", name: "Kill Aura" }],
      },
      {
        text: "Right-click it, or click its arrow, to unfold its settings.",
        keys: [["Right-click"]],
        hint: { card: "Kill Aura" },
        target: '[data-card="Kill Aura"] .mk-chevron',
        done: (s) => s.unfolded.includes("Kill Aura"),
        show: [{ type: "unfold", name: "Kill Aura" }],
      },
      {
        text: "Drag Turn Speed. A setting you've changed has its name tinted.",
        keys: [["Drag"]],
        hint: { setting: "Turn Speed" },
        target: '[data-setting="Turn Speed"] .mk-slider',
        done: (s) => s.settings.turnSpeed > 0,
        show: [{ type: "setting", key: "turnSpeed", value: 90 }],
      },
      {
        text: "Click Weapon and pick another.",
        keys: [["Click"]],
        hint: { setting: "Weapon" },
        target: '[data-setting="Weapon"] .mk-field',
        done: (s) => s.settings.weapon !== "Holding",
        show: [{ type: "setting", key: "weapon", value: "Switch" }],
      },
      {
        text: "Right-click Kill Aura again to fold it.",
        keys: [["Right-click"]],
        hint: { card: "Kill Aura" },
        target: '[data-card="Kill Aura"] .mk-card-head',
        done: (s) => !s.unfolded.includes("Kill Aura"),
        show: [{ type: "unfold", name: "Kill Aura" }],
      },
    ],
  },
  {
    slug: "the-launcher",
    title: "The launcher",
    summary: "Finding and running anything by name.",
    start: opened,
    steps: [
      {
        text: "Alt + Space opens the launcher, in game or in the menu.",
        keys: [["mod", "Space"]],
        done: (s) => s.launcher.open,
        show: [{ type: "launcher", open: true }],
      },
      {
        text: "Type to search. It's fuzzy: frlo finds Free Look.",
        keys: [["f"], ["r"], ["l"], ["o"]],
        target: LAUNCHER,
        done: (s) => s.launcher.open && launcherEntries(s)[0]?.title === "Free Look",
        show: [{ type: "launcher", open: true }, { type: "type", query: "frlo" }],
      },
      {
        text: "Enter runs the top result: Free Look turns on.",
        keys: [["Enter"]],
        target: (s) => (s.launcher.open ? '[data-entry="Free Look"]' : null),
        done: (s) => s.on.includes("Free Look"),
        show: [{ type: "run" }],
      },
      {
        text: "Shift + Enter, or a right-click, opens a module's own settings window instead. Open the launcher, type kill, then Shift + Enter.",
        keys: [["mod", "Space"], ["kill"], ["Shift", "Enter"]],
        target: (s) => (s.launcher.open ? '[data-entry="Kill Aura"]' : null),
        done: (s) => windowsOf(s, s.active).includes(MODULE_WINDOW + "Kill Aura"),
        show: [{ type: "launcher", open: true }, { type: "type", query: "kill" }, { type: "run", alt: true }],
      },
      {
        text: "#kind and @addon narrow it down. Open it again and type #render.",
        keys: [["mod", "Space"], ["#render"]],
        target: LAUNCHER,
        done: (s) => s.launcher.open && s.launcher.query.includes("#render"),
        show: [{ type: "launcher", open: true }, { type: "type", query: "#render" }],
      },
      {
        text: "Ctrl + J and Ctrl + K, or the arrows, move through the results. Esc closes it.",
        keys: [["Esc"]],
        target: LAUNCHER,
        done: (s) => !s.launcher.open,
        show: [{ type: "launcher", open: false }],
      },
    ],
  },
  {
    slug: "windows",
    title: "Windows",
    summary: "Focus, swap, float, full screen, close.",
    start: opened,
    steps: [
      {
        text: "Alt + → moves the focus right. The bright border marks the focused window.",
        keys: [["mod", "→"]],
        target: win("Movement"),
        done: (s) => s.workspaces[1].focused === "Movement",
        show: [{ type: "focusDir", dir: "right" }],
      },
      {
        text: "Alt + Shift + ← swaps it with the window on its left.",
        keys: [["mod", "Shift", "←"]],
        target: FOCUSED,
        done: (s) => leaves(s.workspaces[1].tree)[0] === "Movement",
        show: [{ type: "swapDir", dir: "left" }],
      },
      {
        text: "Alt + T floats it over the others. Alt + T again puts it back.",
        keys: [["mod", "T"]],
        target: FOCUSED,
        done: (s) => s.history.includes("float") && s.last === "tile",
        show: [{ type: "float" }, { type: "float" }],
      },
      {
        text: "Alt + F makes it fill the workspace. Alt + F again to go back.",
        keys: [["mod", "F"]],
        target: FOCUSED,
        done: (s) => s.history.includes("fullscreen") && s.last === "unfullscreen",
        show: [{ type: "fullscreen" }, { type: "fullscreen" }],
      },
      {
        text: "Alt + W closes it.",
        keys: [["mod", "W"]],
        target: FOCUSED,
        done: (s) => !windowsOf(s, 1).includes("Movement"),
        show: [{ type: "closeWindow", id: "Movement" }],
      },
      {
        text: "The launcher opens it again: Alt + Space, type mov, Enter.",
        keys: [["mod", "Space"], ["mov"], ["Enter"]],
        target: LAUNCHER,
        done: (s) => windowsOf(s, s.active).includes("Movement"),
        show: [{ type: "launcher", open: true }, { type: "type", query: "mov" }, { type: "openGroup", name: "Movement" }],
      },
    ],
  },
  {
    slug: "resizing-and-arranging",
    title: "Resizing and arranging",
    summary: "Dragging windows into place, and sizing them.",
    start: opened,
    steps: [
      {
        text: "Drag the gap between two windows to resize them.",
        keys: [["Drag"]],
        target: ".mk-splitter[data-vertical]",
        done: (s) => s.history.includes("resize-drag"),
        show: [{ type: "ratio", path: "", r: 0.62 }],
      },
      {
        text: "Alt + = grows the focused window and Alt + - shrinks it. Holding Alt, a right-drag anywhere in a window resizes it too.",
        keys: [["mod", "="], ["mod", "-"]],
        target: FOCUSED,
        done: (s) => s.history.includes("resize"),
        show: [{ type: "resize", amount: 0.1 }],
      },
      {
        text: "Alt + J turns the focused window's split the other way: side by side becomes one above the other.",
        keys: [["mod", "J"]],
        target: FOCUSED,
        done: (s) => s.history.includes("split"),
        show: [{ type: "split" }],
      },
      {
        text: "Drag a window by its title bar onto the middle of another: the two swap.",
        keys: [["Drag"]],
        target: (s) => `${win(s.workspaces[s.active].focused ?? "Combat")} .mk-title`,
        done: (s) => s.history.includes("drop-swap"),
        show: [{ type: "drop", id: "Combat", target: "Player", side: null }],
      },
      {
        text: "Drop it near another window's edge instead and it takes that half. Holding Alt, you can drag from anywhere in a window.",
        keys: [["Drag"]],
        target: (s) => `${win(s.workspaces[s.active].focused ?? "Combat")} .mk-title`,
        done: (s) => s.history.includes("drop-split"),
        show: [{ type: "drop", id: "Combat", target: "Movement", side: "down" }],
      },
      {
        text: "A floating window goes wherever you drag it. Float one with Alt + T, then move it.",
        keys: [["mod", "T"], ["Drag"]],
        target: FOCUSED,
        done: (s) => s.history.includes("float-move"),
        show: [{ type: "focus", id: "Combat" }, { type: "float" }, { type: "place", id: "Combat", rect: { x: 230, y: 70, w: 220, h: 210 } }],
      },
    ],
  },
  {
    slug: "workspaces-and-layouts",
    title: "Workspaces and layouts",
    summary: "Nine workspaces, and how windows tile.",
    start: opened,
    steps: [
      {
        text: "Alt + L switches the workspace's layout. Columns puts every window side by side.",
        keys: [["mod", "L"]],
        target: ".mk-bar-layout",
        done: (s) => s.workspaces[1].layout === "columns",
        show: [{ type: "layout" }],
      },
      {
        text: "Alt + L again goes back to Dwindle, where each window splits the one before.",
        keys: [["mod", "L"]],
        target: ".mk-bar-layout",
        done: (s) => s.workspaces[1].layout === "dwindle",
        show: [{ type: "layout" }],
      },
      {
        text: "There are nine workspaces. Alt + 2 switches to workspace 2, where the rest of Essentials' windows went.",
        keys: [["mod", "2"]],
        target: '[data-ws="2"]',
        done: (s) => s.active === 2,
        show: [{ type: "workspace", n: 2 }],
      },
      {
        text: "Alt + Shift + 3 sends the focused window to workspace 3.",
        keys: [["mod", "Shift", "3"]],
        target: FOCUSED,
        done: (s) => windowsOf(s, 3).length > 0,
        show: [{ type: "move", n: 3 }],
      },
      {
        text: "Alt + Tab goes to the next workspace, Alt + Shift + Tab to the one before.",
        keys: [["mod", "Tab"]],
        target: '[data-ws="3"]',
        done: (s) => s.active === 3,
        show: [{ type: "cycle", dir: 1 }],
      },
    ],
  },
  {
    slug: "without-a-mouse",
    title: "Without a mouse",
    summary: "Working a window from the keyboard.",
    start: opened,
    steps: [
      {
        text: "Inside a window, J and K (or the arrow keys) move the selection.",
        keys: [["J"], ["K"]],
        target: FOCUSED,
        done: (s) => s.keyboard && s.selection.Combat !== undefined,
        show: [{ type: "nav", delta: 1 }, { type: "nav", delta: 1 }],
      },
      {
        text: "Enter or Space turns the selected module on or off.",
        keys: [["Enter"]],
        target: "[data-selected]",
        done: (s) => s.history.includes("toggle-keyboard"),
        show: [{ type: "toggle", name: "Offhand", how: "keyboard" }],
      },
      {
        text: "O unfolds its settings, and H folds them again.",
        keys: [["O"], ["H"]],
        target: "[data-selected]",
        done: (s) => s.history.includes("unfold-keyboard"),
        show: [{ type: "unfold", name: "Offhand", how: "keyboard" }],
      },
    ],
  },
  {
    slug: "themes",
    title: "Themes",
    summary: "Changing the whole look at once.",
    start: opened,
    steps: [
      {
        text: "Open the launcher and type theme.",
        keys: [["mod", "Space"], ["theme"]],
        target: LAUNCHER,
        done: (s) => s.launcher.open && launcherEntries(s).some((e) => e.title.startsWith("Theme:")) && s.launcher.query.length > 1,
        show: [{ type: "launcher", open: true }, { type: "type", query: "theme" }],
      },
      {
        text: "Pick Tokyo Night. It applies at once, to this whole site too.",
        keys: [["Click"]],
        target: (s) => (s.launcher.open ? '[data-entry="Theme: Tokyo Night"]' : null),
        done: (s) => s.theme === "tokyo_night",
        show: [{ type: "theme", id: "tokyo_night" }],
      },
      {
        text: "The Theme window changes any colour, gap or curve, and saves your changes on top of the preset. Go back to Myriad the same way.",
        keys: [["mod", "Space"], ["myriad"], ["Enter"]],
        done: (s) => s.theme === "myriad",
        show: [{ type: "theme", id: "myriad" }],
      },
    ],
  },
];

/** The state at a step: its chapter's start, with every earlier step of the chapter done. */
export function stateAt(chapter: Chapter, step: number): MenuState {
  let s = chapter.start();
  for (const st of chapter.steps.slice(0, step)) s = run(s, st.show);
  return { ...s, launcher: { ...s.launcher, open: false }, history: [], last: "" };
}

/** The keys core binds by default, for the cheat sheet. */
export const CHEATS: [string, string][] = [
  ["mod + 1 … 9", "Open the menu on a workspace, or switch to it"],
  ["mod + Space", "Launcher, in game too"],
  ["mod + ← ↑ → ↓", "Focus the window that way"],
  ["mod + Shift + ← ↑ → ↓", "Swap with the window that way"],
  ["mod + Shift + 1 … 9", "Send the window to a workspace"],
  ["mod + Tab", "Next workspace (Shift: previous, Ctrl: last)"],
  ["mod + L", "Switch layout: Dwindle, Columns"],
  ["mod + T", "Float or tile the window"],
  ["mod + F", "Full screen"],
  ["mod + W", "Close the window"],
  ["mod + J", "Turn the window's split the other way"],
  ["mod + left-drag", "Move a window, or drop it on another to swap or split"],
  ["mod + right-drag", "Resize a window"],
  ["mod + = / -", "Grow or shrink the window"],
  ["mod + S", "The HUD workspace"],
  ["mod + K", "Keybinds"],
  ["mod + Enter", "Console"],
  ["mod + Shift + Space", "Hide the bar"],
  ["mod + Shift + Backspace", "Take the gaps away"],
];
