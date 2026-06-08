// background.js — runs as a persistent background script (MV3 non-SW for Firefox)

const ALL_COLORS = ["LightCoral", "LightSalmon", "LightPink", "LightSalmon", "PeachPuff", "Khaki", "Thistle",
    "Violet", "LightGreen", "YellowGreen", "Turquoise", "LightSkyBlue", "Wheat", "Peru",
    "LightGray", "DarkGray"];

// TimedColor tracks last-used time per color for LRU selection
class TimedColor {
    constructor(color) {
        this.color = color;
        this.last_access = new Date().toISOString();
    }
}

let all_timed_colors = ALL_COLORS.map(c => new TimedColor(c));

function getOldestColorTheme() {
    const oldest = all_timed_colors[0];
    oldest.last_access = new Date().toISOString();
    all_timed_colors.sort((a, b) => a.last_access > b.last_access ? 1 : -1);
    return { colors: { frame: oldest.color, tab_background_text: "#000" } };
}

async function applyWindowTheme(new_window) {
    const saved_color = await browser.sessions.getWindowValue(new_window.id, "color");
    if (saved_color) {
        browser.theme.update(new_window.id, { colors: { frame: saved_color, tab_background_text: "#000" } });
        return;
    }

    const obj = await browser.storage.local.get();
    if (!obj.hasOwnProperty("change_new")) {
        await browser.storage.local.set({ change_new: true });
    }
    if (obj["change_new"] !== false) {
        const theme = getOldestColorTheme();
        browser.theme.update(new_window.id, theme);
        browser.sessions.setWindowValue(new_window.id, "color", theme.colors.frame);
    }
}

// restore session colors on startup
(async () => {
    const windows = await browser.windows.getAll();
    for (const win of windows) {
        const saved_color = await browser.sessions.getWindowValue(win.id, "color");
        if (saved_color) {
            browser.theme.update(win.id, { colors: { frame: saved_color, tab_background_text: "#000" } });
        }
    }
})();

browser.windows.onCreated.addListener(applyWindowTheme);

// listen for color picks and resets from popup
browser.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === "set_color") {
        const { color, windowId } = msg;
        browser.theme.update(windowId, { colors: { frame: color, tab_background_text: "#000" } });
        browser.sessions.setWindowValue(windowId, "color", color);
        const tc = all_timed_colors.find(t => t.color === color);
        if (tc) tc.last_access = new Date().toISOString();
        all_timed_colors.sort((a, b) => a.last_access < b.last_access ? 1 : -1);
    } else if (msg.type === "reset_color") {
        browser.theme.reset(msg.windowId);
        browser.sessions.removeWindowValue(msg.windowId, "color");
    }
});
