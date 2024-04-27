// cat explosion

document.querySelector(".cat-explosion-pushable").addEventListener("click", function () {
    
    var audio = document.getElementById("catBOOM");
    audio.currentTime = 0; // Reset the audio to start
    audio.play();

    
    setTimeout(() => {
        this.style.transform = "translateY(0px)";
    }, 200); 
});

document.addEventListener("DOMContentLoaded", () => {
    const beeArea = document.querySelector(".bee-area");

    // Initialize the rainbow cursor in the bee-area only
    if (beeArea) {
        new cursoreffects.rainbowCursor({
            element: beeArea, // Target the bee-area specifically
            length: 20,
            colors: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
            size: 3
        });
    }

    // Create and append the bee cursor
    const beeCursor = document.createElement("div");
    beeCursor.style.position = "absolute";
    beeCursor.style.pointerEvents = "none";
    beeCursor.style.zIndex = "1000";
    beeCursor.style.width = "57px";
    beeCursor.style.height = "53px";
    beeCursor.style.backgroundImage = "url('/media/minecraft_bee57x53.png')";
    beeCursor.style.backgroundSize = "contain";
    beeCursor.style.display = "none"; // Start hidden
    document.body.appendChild(beeCursor);

    // Move the bee cursor with the mouse
    document.addEventListener("mousemove", function (e) {
        // Only show the bee cursor in the bee-area
        if (beeArea.matches(':hover')) {
            beeCursor.style.left = e.pageX - 30 + "px";
            beeCursor.style.top = e.pageY - 40 + "px";
            beeCursor.style.display = "block";
        } else {
            beeCursor.style.display = "none";
        }
    });
});


