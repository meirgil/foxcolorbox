// popup.js — runs only in popup.html context

const ALL_COLORS = ["LightCoral", "LightSalmon", "LightPink", "LightSalmon", "PeachPuff", "Khaki", "Thistle",
    "Violet", "LightGreen", "YellowGreen", "Turquoise", "LightSkyBlue", "Wheat", "Peru",
    "LightGray", "DarkGray"];

window.addEventListener("load", async () => {
    const current_window = await browser.windows.getLastFocused();

    // build color swatches
    const list = document.getElementById("button_list");
    for (const color of ALL_COLORS) {
        const b = document.createElement("button");
        b.title = color;
        b.style.background = color;
        b.dataset.color = color;
        b.onclick = () => {
            document.querySelectorAll("#button_list button").forEach(btn => btn.classList.remove("active"));
            b.classList.add("active");
            browser.runtime.sendMessage({ type: "set_color", color, windowId: current_window.id });
        };
        list.appendChild(b);
    }

    // reset button
    document.getElementById("reset").addEventListener("click", () => {
        document.querySelectorAll("#button_list button").forEach(btn => btn.classList.remove("active"));
        browser.runtime.sendMessage({ type: "reset_color", windowId: current_window.id });
    });

    // auto-color toggle
    const toggle = document.getElementById("change_new");
    const obj = await browser.storage.local.get("change_new");
    toggle.checked = obj["change_new"] !== false;
    toggle.addEventListener("change", () => {
        browser.storage.local.set({ change_new: toggle.checked });
    });
});
