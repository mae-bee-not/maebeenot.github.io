document.addEventListener("DOMContentLoaded", () => {
    initCatExplosionButton();
    initRainbowCursor();
    initFakeBeeCursor();
    installOneko();
    setupReadMoreButtons();
    setupSpotifyUpdate();
    setupToggleAllBlogs();
});

function initCatExplosionButton() {
    const button = document.querySelector(".cat-explosion-pushable");
    if (button) {
        button.addEventListener("click", () => {
            const audio = document.getElementById("catBOOM");
            audio.currentTime = 0;
            audio.play();
            setTimeout(() => button.style.transform = "translateY(0px)", 200);
        });
    }
}

function initRainbowCursor() {
    const beeArea = document.querySelector(".bee-area");
    if (beeArea) {
        new cursoreffects.rainbowCursor({
            element: beeArea,
            length: 20,
            colors: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'],
            size: 3
        });
    }
}

function initFakeBeeCursor() {
    const beeCursor = document.createElement("div");
    Object.assign(beeCursor.style, {
        position: "absolute",
        pointerEvents: "none",
        zIndex: "1000",
        width: "57px",
        height: "53px",
        backgroundImage: "url('/media/minecraft_bee57x53.png')",
        backgroundSize: "contain",
        display: "none"
    });
    document.body.appendChild(beeCursor);

    document.addEventListener("mousemove", e => {
        const beeArea = document.querySelector(".bee-area");
        beeCursor.style.left = e.pageX - 30 + "px";
        beeCursor.style.top = e.pageY - 40 + "px";
        beeCursor.style.display = beeArea && beeArea.matches(":hover") ? "block" : "none";
    });
}

function installOneko() {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return;

    function initNeko() {
        const nekoEl = createNekoElement();
        document.body.appendChild(nekoEl);
        document.addEventListener("mousemove", e => updateMousePosition(e.clientX, e.clientY));
        window.requestAnimationFrame(onAnimationFrame);
    }

    function createNekoElement() {
        const nekoEl = document.createElement("div");
        Object.assign(nekoEl.style, {
            width: "32px",
            height: "32px",
            position: "fixed",
            pointerEvents: "none",
            imageRendering: "pixelated",
            zIndex: Number.MAX_VALUE,
            backgroundImage: `url(${document.currentScript?.dataset.cat || "./media/oneko.gif"})`
        });
        nekoEl.id = "oneko";
        nekoEl.ariaHidden = true;
        return nekoEl;
    }

    let nekoPosX = 32, nekoPosY = 32, mousePosX = 0, mousePosY = 0, idleTime = 0, idleAnimation = null, idleAnimationFrame = 0;
    const nekoSpeed = 15, frameCount = 0, spriteSets = { /* sprite sets here */ };

    function updateMousePosition(x, y) {
        mousePosX = x;
        mousePosY = y;
    }

    function onAnimationFrame(timestamp) {
        if (!document.getElementById("oneko")) return;
        requestFrame(() => {
            frame();
            window.requestAnimationFrame(onAnimationFrame);
        });
    }

    function requestFrame(callback) {
        requestAnimationFrame(callback => callback());
    }

    function frame() {
        const diffX = nekoPosX - mousePosX, diffY = nekoPosY - mousePosY;
        const distance = Math.hypot(diffX, diffY);
        idleTime = distance < nekoSpeed || distance < 48 ? idleCycle() : actionCycle(diffX, diffY, distance);
        updateNekoPosition();
    }

    function idleCycle() {
        idleTime += 1;
        if (idleTime > 10 && !idleAnimation && Math.random() < 0.005) {
            triggerRandomIdleAnimation();
        }
        idleAnimationFrame += 1;
        updateIdleAnimation();
    }

    function actionCycle(diffX, diffY, distance) {
        idleTime = Math.max(idleTime - 1, 0);
        moveNeko(diffX, diffY, distance);
    }

    function triggerRandomIdleAnimation() {
        const possibleAnimations = ["sleeping", "scratchSelf", "scratchWallW", "scratchWallN", "scratchWallE", "scratchWallS"]
            .filter(type => validIdleAnimation(type));
        idleAnimation = possibleAnimations[Math.floor(Math.random() * possibleAnimations.length)];
    }

    function moveNeko(diffX, diffY, distance) {
        resetIdleAnimation();
        setSprite(getDirection(diffX, diffY, distance), frameCount);
        nekoPosX -= (diffX / distance) * nekoSpeed;
        nekoPosY -= (diffY / distance) * nekoSpeed;
        nekoPosX = clamp(nekoPosX, 16, window.innerWidth - 16);
        nekoPosY = clamp(nekoPosY, 16, window.innerHeight - 16);
    }

    function validIdleAnimation(type) {
        switch (type) {
            case "scratchWallW": return nekoPosX < 32;
            case "scratchWallN": return nekoPosY < 32;
            case "scratchWallE": return nekoPosX > window.innerWidth - 32;
            case "scratchWallS": return nekoPosY > window.innerHeight - 32;
            default: return true;
        }
    }

    function getDirection(diffX, diffY, distance) {
        let direction = "";
        direction += diffY / distance > 0.5 ? "N" : "";
        direction += diffY / distance < -0.5 ? "S" : "";
        direction += diffX / distance > 0.5 ? "W" : "";
        direction += diffX / distance < -0.5 ? "E" : "";
        return direction;
    }

    function updateNekoPosition() {
        const nekoEl = document.getElementById("oneko");
        nekoEl.style.left = `${nekoPosX - 16}px`;
        nekoEl.style.top = `${nekoPosY - 16}px`;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function updateIdleAnimation() {
        if (idleAnimation) {
            setSprite(idleAnimation, idleAnimationFrame);
            if (idleAnimationFrame > 9 && idleAnimation !== 'sleeping' || idleAnimationFrame > 192) {
                resetIdleAnimation();
            }
        } else {
            setSprite('idle', 0);
        }
    }

    function resetIdleAnimation() {
        idleAnimation = null;
        idleAnimationFrame = 0;
    }

    function setSprite(name, frame) {
        const [x, y] = spriteSets[name][frame % spriteSets[name].length];
        document.getElementById('oneko').style.backgroundPosition = `${x * 32}px ${y * 32}px`;
    }

    initNeko();
}

function setupReadMoreButtons() {
    document.querySelectorAll('[id^="blogButton"]').forEach((btn, index) => {
        btn.addEventListener("click", () => blogButton(index + 1));
    });
}

function blogButton(blogNumber) {
    const dots = document.getElementById(`dots${blogNumber}`);
    const moreText = document.getElementById(`more${blogNumber}`);
    const btnText = document.getElementById(`blogButton${blogNumber}`);

    const isExpanded = dots.style.display === "none";
    dots.style.display = isExpanded ? "inline" : "none";
    moreText.style.display = isExpanded ? "none" : "inline";
    btnText.innerHTML = isExpanded ? "more!" : "less!";
}

async function setupSpotifyUpdate() {
    config && (await updateNowPlaying());
    setInterval(updateNowPlaying, 10000);
}

async function getAccessToken() {
    const response = await fetch(`${TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${config.refresh_token}`
    });
    const data = await response.json();
    return data.access_token;
}

async function getNowPlaying() {
    try {
        const access_token = await getAccessToken();
        const response = await fetch(NOW_PLAYING_ENDPOINT, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        console.error("Error fetching currently playing song: ", error);
        return null;
    }
}

function pad(n) {
    return n < 10 ? '0' + n : n;
}

async function updateNowPlaying() {
    const data = await getNowPlaying();
    if (!data) return;
    document.getElementById("album-image").src = data.item.album.images[0].url;
    document.getElementById("song-title").textContent = data.item.name;
    document.getElementById("artist-name").textContent = data.item.artists.map(artist => artist.name).join(", ");

    const secondsPlayed = Math.floor(data.progress_ms / 1000);
    const minutesPlayed = Math.floor(secondsPlayed / 60);
    const secondsTotal = Math.floor(data.item.duration_ms / 1000);
    const minutesTotal = Math.floor(secondsTotal / 60);

    document.getElementById("song-timer").textContent =
        `${pad(minutesPlayed)}:${pad(secondsPlayed % 60)} / ${pad(minutesTotal)}:${pad(secondsTotal % 60)}`;
}

function setupToggleAllBlogs() {
    document.getElementById("toggleAllBlogsButton").addEventListener("click", toggleAllBlogs);
}

function toggleAllBlogs() {
    const allDots = document.querySelectorAll("[id^='dots']");
    const allMoreText = document.querySelectorAll("[id^='more']");
    const allButtons = document.querySelectorAll("[id^='blogButton']");

    const firstPostExpanded = allDots[0].style.display === "none";

    allDots.forEach(dot => dot.style.display = firstPostExpanded ? "inline" : "none");
    allMoreText.forEach(more => more.style.display = firstPostExpanded ? "none" : "inline");
    allButtons.forEach(btn => btn.innerHTML = firstPostExpanded ? "more!" : "less!");

    document.getElementById("toggleAllBlogsButton").textContent = firstPostExpanded ? "Expand ALL!!" : "Collapse ALL!!";
}