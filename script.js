// cat-explosion button
document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".cat-explosion-pushable");
    if (button) {
        button.addEventListener("click", function () {
            var audio = document.getElementById("catBOOM");
            audio.currentTime = 0; 
            audio.play();

            setTimeout(() => {
                this.style.transform = "translateY(0px)";
            }, 200);
        });
    }

    // rainbow cursor
    const beeArea = document.querySelector(".bee-area");
    if (beeArea) {
        new cursoreffects.rainbowCursor({
            element: beeArea, 
            length: 20,
            colors: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
            size: 3
        });
    }

    // fake bee cursor
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
        if (beeArea.matches(':hover')) {
            beeCursor.style.left = e.pageX - 30 + "px";
            beeCursor.style.top = e.pageY - 40 + "px";
            beeCursor.style.display = "block";
        } else {
            beeCursor.style.display = "none";
        }
    });
});
