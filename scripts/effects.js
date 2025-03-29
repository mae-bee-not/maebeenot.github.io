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

// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

// Trailing Cursor Logic
// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

let trailingCursorInstance = null; 

function createTrailingCursor() {
    if (!trailingCursorInstance && typeof cursoreffects !== 'undefined') {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (!mediaQuery || !mediaQuery.matches) {
            trailingCursorInstance = new cursoreffects.trailingCursor({
                // Add any customizations from the docs here if you want
                 particles: 10,
                 rate: 0.8,
                 baseImageSrc: "/media/purple-cursor.png"
            });
            // console.log("Trailing cursor created"); // For debugging
        } else {
            // console.log("Trailing cursor not created due to prefers-reduced-motion."); // For debugging
        }
    }
}

// Function to destroy the trailing cursor
function destroyTrailingCursor() {
    if (trailingCursorInstance) {
        trailingCursorInstance.destroy();
        trailingCursorInstance = null; 
        // console.log("Trailing cursor destroyed"); // For debugging
    }
}

function setupTrailingCursorExclusion() {
    const beeArea = document.querySelector(".bee-container");

    createTrailingCursor();

    if (beeArea) {
        beeArea.addEventListener("mouseenter", () => {
            // console.log("Mouse entered bee-container"); // For debugging
            destroyTrailingCursor();
        });

        beeArea.addEventListener("mouseleave", () => {
            // console.log("Mouse left bee-container"); // For debugging
            createTrailingCursor();
        });
    } else {
        console.warn(".bee-container not found. Trailing cursor will remain active everywhere.");
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery) {
        mediaQuery.addEventListener("change", () => {
            if (mediaQuery.matches) {
                destroyTrailingCursor();
            } else {
                if (!beeArea || !beeArea.matches(':hover')) {
                     createTrailingCursor();
                }
            }
        });
    }
}