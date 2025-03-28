// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

function setupRainbowCursor() {
    const beeArea = document.querySelector(".bee-container");
    if (beeArea && typeof cursoreffects !== 'undefined') {
        new cursoreffects.rainbowCursor({
            element: beeArea,
            length: 20,
            colors: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
            size: 3
        });
    }
}

// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

function setupBeeCursor() {
    const beeArea = document.querySelector(".bee-container");
    const beeCursor = document.createElement("div");
    beeCursor.style.position = "absolute";
    beeCursor.style.pointerEvents = "none";
    beeCursor.style.zIndex = "1000";
    beeCursor.style.width = "57px";
    beeCursor.style.height = "53px";
    beeCursor.style.backgroundImage = "url('/media/minecraft_bee57x53.png')";
    beeCursor.style.backgroundSize = "contain";
    beeCursor.style.display = "none";
    document.body.appendChild(beeCursor);

    document.addEventListener("mousemove", function (e) {
        // Check if beeArea exists before matching
        if (beeArea && beeArea.matches(":hover")) {
            beeCursor.style.left = e.pageX - 30 + "px";
            beeCursor.style.top = e.pageY - 40 + "px";
            beeCursor.style.display = "block";
        } else {
            beeCursor.style.display = "none";
        }
    });
}