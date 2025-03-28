// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

function setupRandomAudioPlayer() {
    const pageSongs = {
        // Use full paths or ensure relative paths are correct from HTML file location
        "index.html": "/media/nyan.mp3",
        "home.html": "/media/nyan.mp3", // Assuming home.html might be used too
        "about.html": "/media/antonympth.mp3",
        "blog.html": "/media/spookwave.mp3",
        "socials.html": "/media/you-deer.mp3",
        "minecraft.html": "/media/stal.mp3"
    };

    const currentPage = getCurrentPage();
    // Provide a default even if getCurrentPage fails somehow
    const audioSrc = pageSongs[currentPage] || "/media/nyan.mp3";

    // Check if an audio element for this purpose already exists
    let audioElement = document.getElementById('backgroundAudioPlayer');
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'backgroundAudioPlayer'; // Give it an ID
        Object.assign(audioElement, {
            // src: audioSrc, // Set src later to ensure autoplay works after user interaction if needed
            loop: true,
            // autoplay: true, // Autoplay might be blocked by browsers initially
            preload: "auto" // Preload the audio file
        });
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
    }

    // Set the source
    if (audioElement.currentSrc !== new URL(audioSrc, document.baseURI).href) {
         audioElement.src = audioSrc;
    }


    // Attempt to play, handle potential errors silently or with a specific UI prompt
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Autoplay started!
        }).catch(error => {
            // Autoplay was prevented.
            console.log("Background audio autoplay prevented. Waiting for user interaction.", error);
            // Optionally, add a 'click anywhere to enable audio' listener
            // document.body.addEventListener('click', () => audioElement.play(), { once: true });
        });
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1);
    // Handle cases where the root might be '/' or empty
    return pageName || 'index.html'; // Default to index.html if empty
}