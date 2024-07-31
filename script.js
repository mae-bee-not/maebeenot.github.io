// Ensure the config file is loaded before this script
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
            colors: [
                "red",
                "orange",
                "yellow",
                "green",
                "blue",
                "indigo",
                "violet"
            ],
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
        if (beeArea.matches(":hover")) {
            beeCursor.style.left = e.pageX - 30 + "px";
            beeCursor.style.top = e.pageY - 40 + "px";
            beeCursor.style.display = "block";
        } else {
            beeCursor.style.display = "none";
        }
    });

    setupRandomAudioPlayer(); // Added line to setup random audio player
});

// oneko.js: https://github.com/adryd325/oneko.js

(function oneko() {
    const isReducedMotion =
        window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
        window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

    if (isReducedMotion) return;

    const nekoEl = document.createElement("div");

    let nekoPosX = 32;
    let nekoPosY = 32;

    let mousePosX = 0;
    let mousePosY = 0;

    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation = null;
    let idleAnimationFrame = 0;

    const nekoSpeed = 15;
    const spriteSets = {
        idle: [[-3, -3]],
        alert: [[-7, -3]],
        scratchSelf: [
            [-5, 0],
            [-6, 0],
            [-7, 0]
        ],
        scratchWallN: [
            [0, 0],
            [0, -1]
        ],
        scratchWallS: [
            [-7, -1],
            [-6, -2]
        ],
        scratchWallE: [
            [-2, -2],
            [-2, -3]
        ],
        scratchWallW: [
            [-4, 0],
            [-4, -1]
        ],
        tired: [[-3, -2]],
        sleeping: [
            [-2, 0],
            [-2, -1]
        ],
        N: [
            [-1, -2],
            [-1, -3]
        ],
        NE: [
            [0, -2],
            [0, -3]
        ],
        E: [
            [-3, 0],
            [-3, -1]
        ],
        SE: [
            [-5, -1],
            [-5, -2]
        ],
        S: [
            [-6, -3],
            [-7, -2]
        ],
        SW: [
            [-5, -3],
            [-6, -1]
        ],
        W: [
            [-4, -2],
            [-4, -3]
        ],
        NW: [
            [-1, 0],
            [-1, -1]
        ]
    };

    function init() {
        nekoEl.id = "oneko";
        nekoEl.ariaHidden = true;
        nekoEl.style.width = "32px";
        nekoEl.style.height = "32px";
        nekoEl.style.position = "fixed";
        nekoEl.style.pointerEvents = "none";
        nekoEl.style.imageRendering = "pixelated";
        nekoEl.style.left = `${nekoPosX - 16}px`;
        nekoEl.style.top = `${nekoPosY - 16}px`;
        nekoEl.style.zIndex = Number.MAX_VALUE;

        let nekoFile = "./media/oneko.gif";
        const curScript = document.currentScript;
        if (curScript && curScript.dataset.cat) {
            nekoFile = curScript.dataset.cat;
        }
        nekoEl.style.backgroundImage = `url(${nekoFile})`;

        document.body.appendChild(nekoEl);

        document.addEventListener("mousemove", function (event) {
            mousePosX = event.clientX;
            mousePosY = event.clientY;
        });

        window.requestAnimationFrame(onAnimationFrame);
    }

    let lastFrameTimestamp;

    function onAnimationFrame(timestamp) {
        // Stops execution if the neko element is removed from DOM
        if (!nekoEl.isConnected) {
            return;
        }
        if (!lastFrameTimestamp) {
            lastFrameTimestamp = timestamp;
        }
        if (timestamp - lastFrameTimestamp > 100) {
            lastFrameTimestamp = timestamp;
            frame();
        }
        window.requestAnimationFrame(onAnimationFrame);
    }

    function setSprite(name, frame) {
        const sprite = spriteSets[name][frame % spriteSets[name].length];
        nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    }

    function resetIdleAnimation() {
        idleAnimation = null;
        idleAnimationFrame = 0;
    }

    function idle() {
        idleTime += 1;

        // every ~ 20 seconds
        if (
            idleTime > 10 &&
            Math.floor(Math.random() * 200) == 0 &&
            idleAnimation == null
        ) {
            let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
            if (nekoPosX < 32) {
                avalibleIdleAnimations.push("scratchWallW");
            }
            if (nekoPosY < 32) {
                avalibleIdleAnimations.push("scratchWallN");
            }
            if (nekoPosX > window.innerWidth - 32) {
                avalibleIdleAnimations.push("scratchWallE");
            }
            if (nekoPosY > window.innerHeight - 32) {
                avalibleIdleAnimations.push("scratchWallS");
            }
            idleAnimation =
                avalibleIdleAnimations[
                    Math.floor(Math.random() * avalibleIdleAnimations.length)
                ];
        }

        switch (idleAnimation) {
            case "sleeping":
                if (idleAnimationFrame < 8) {
                    setSprite("tired", 0);
                    break;
                }
                setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
                if (idleAnimationFrame > 192) {
                    resetIdleAnimation();
                }
                break;
            case "scratchWallN":
            case "scratchWallS":
            case "scratchWallE":
            case "scratchWallW":
            case "scratchSelf":
                setSprite(idleAnimation, idleAnimationFrame);
                if (idleAnimationFrame > 9) {
                    resetIdleAnimation();
                }
                break;
            default:
                setSprite("idle", 0);
                return;
        }
        idleAnimationFrame += 1;
    }

    function frame() {
        frameCount += 1;
        const diffX = nekoPosX - mousePosX;
        const diffY = nekoPosY - mousePosY;
        const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

        if (distance < nekoSpeed || distance < 48) {
            idle();
            return;
        }

        idleAnimation = null;
        idleAnimationFrame = 0;

        if (idleTime > 1) {
            setSprite("alert", 0);
            // count down after being alerted before moving
            idleTime = Math.min(idleTime, 7);
            idleTime -= 1;
            return;
        }

        let direction;
        direction = diffY / distance > 0.5 ? "N" : "";
        direction += diffY / distance < -0.5 ? "S" : "";
        direction += diffX / distance > 0.5 ? "W" : "";
        direction += diffX / distance < -0.5 ? "E" : "";
        setSprite(direction, frameCount);

        nekoPosX -= (diffX / distance) * nekoSpeed;
        nekoPosY -= (diffY / distance) * nekoSpeed;

        nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
        nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

        nekoEl.style.left = `${nekoPosX - 16}px`;
        nekoEl.style.top = `${nekoPosY - 16}px`;
    }

    init();
})();

//read more buttons
function blogButton(blogNumber) {
    var dots = document.getElementById("dots" + blogNumber);
    var moreText = document.getElementById("more" + blogNumber);
    var btnText = document.getElementById("blogButton" + blogNumber);

    if (dots.style.display === "none") {
        dots.style.display = "inline";
        btnText.innerHTML = "more!";
        moreText.style.display = "none";
    } else {
        dots.style.display = "none";
        btnText.innerHTML = "less!";
        moreText.style.display = "inline";
    }
}

const { client_id, client_secret, refresh_token } = config;

const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

async function getAccessToken() {
    const basic = btoa(`${client_id}:${client_secret}`);
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`
    });
    const data = await response.json();
    return data.access_token;
}

async function getNowPlaying() {
    try {
        const access_token = await getAccessToken();
        const response = await fetch(NOW_PLAYING_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        if (response.status === 204) {
            throw new Error('No Content');
        }

        const song = await response.json();
        const albumImageUrl = song.item.album.images[0].url;
        const artist = song.item.artists.map(artist => artist.name).join(', ');
        const title = song.item.name;
        const timePlayed = song.progress_ms;
        const timeTotal = song.item.duration_ms;

        return {
            albumImageUrl,
            artist,
            title,
            timePlayed,
            timeTotal
        };
    } catch (error) {
        console.error('Error fetching currently playing song: ', error);
    }
}

function pad(n) {
    return n < 10 ? '0' + n : n;
}

function updateNowPlaying() {
    getNowPlaying().then(data => {
        if (data) {
            document.getElementById('album-image').src = data.albumImageUrl;
            document.getElementById('song-title').textContent = data.title;
            document.getElementById('artist-name').textContent = data.artist;

            const secondsPlayed = Math.floor(data.timePlayed / 1000);
            const minutesPlayed = Math.floor(secondsPlayed / 60);
            const secondsTotal = Math.floor(data.timeTotal / 1000);
            const minutesTotal = Math.floor(secondsTotal / 60);

            document.getElementById('song-timer').textContent =
                `${pad(minutesPlayed)}:${pad(secondsPlayed % 60)} / ${pad(minutesTotal)}:${pad(secondsTotal % 60)}`;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateNowPlaying();
    setInterval(updateNowPlaying, 10000);  // Update every 10 seconds
});

function toggleAllBlogs() {
    const allDots = document.querySelectorAll('[id^="dots"]');
    const allMoreText = document.querySelectorAll('[id^="more"]');
    const allButtons = document.querySelectorAll('button[id^="blogButton"]');

    // Use the state of the first blog post to toggle all
    const firstPostExpanded = allDots[0].style.display === "none";

    allDots.forEach((dot, index) => {
        if (firstPostExpanded) {
            dot.style.display = "inline";
            allMoreText[index].style.display = "none";
            allButtons[index].innerHTML = "more!";
        } else {
            dot.style.display = "none";
            allMoreText[index].style.display = "inline";
            allButtons[index].innerHTML = "less!";
        }
    });

    // Update the button text based on the action performed
    document.getElementById('toggleAllBlogsButton').textContent = firstPostExpanded ? "Expand ALL!!" : "Collapse ALL!!";
}

// Random Audio Player
function setupRandomAudioPlayer() {
    const audioFiles = [
        '/media/antonympth.mp3',
        '/media/puppycat.mp3',
        '/media/spaces-inbetween.mp3',
        '/media/nyan.mp3',
        '/media/m@gical-cure.mp3',
        '/media/you-deer.mp3',
        '/media/spookwave.mp3',
        '/media/Brb.mp3',
        '/media/stal.mp3',

        // Add more mp3 file paths as needed
    ];

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    const randomIndex = getRandomInt(audioFiles.length);
    const randomAudioSrc = audioFiles[randomIndex];

    const audioElement = document.createElement('audio');
    audioElement.src = randomAudioSrc;
    audioElement.autoplay = true;
    audioElement.loop = true; // Optionally, you can loop the audio
    audioElement.style.display = 'none';  // Hide the audio element
    document.body.appendChild(audioElement);
}