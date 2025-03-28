// spotify.js

// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

// --- Make getAccessToken standalone ---
async function getSpotifyAccessToken() {
    // Ensure config is loaded and available
    if (typeof config === 'undefined') {
        console.error('Spotify config not found. Ensure config.js is loaded.');
        return null; // Indicate failure
    }
    const { client_id, client_secret, refresh_token } = config;

    // Add simple caching to avoid redundant token requests within a short time
    // IMPORTANT: This is very basic; a robust solution would handle expiry better.
    if (getSpotifyAccessToken.cachedToken &&
        getSpotifyAccessToken.cacheTime &&
        (Date.now() - getSpotifyAccessToken.cacheTime < 3000 * 1000)) { // Cache for 50 mins (tokens last 60)
          // console.log("Using cached Spotify token");
          return getSpotifyAccessToken.cachedToken;
    }

    const basic = btoa(`${client_id}:${client_secret}`);
    const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

    try {
        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=refresh_token&refresh_token=${refresh_token}`
        });

        if (!response.ok) {
            const errorData = await response.text();
            let errorDesc = `Status ${response.status}`;
            try {
                const errorJson = JSON.parse(errorData);
                errorDesc = errorJson.error_description || errorDesc;
            } catch (e) { /* ignore */ }
            console.error(`Error fetching access token: ${errorDesc}`);
            getSpotifyAccessToken.cachedToken = null; // Clear cache on error
            return null;
        }

        const data = await response.json();
        getSpotifyAccessToken.cachedToken = data.access_token; // Cache the token
        getSpotifyAccessToken.cacheTime = Date.now(); // Record cache time
        // console.log("Fetched new Spotify token");
        return data.access_token;
    } catch (error) {
        console.error('Network or other error in getSpotifyAccessToken:', error);
        getSpotifyAccessToken.cachedToken = null; // Clear cache on error
        return null;
    }
}
// Initialize static properties for caching
getSpotifyAccessToken.cachedToken = null;
getSpotifyAccessToken.cacheTime = null;


// --- Now Playing Functionality ---
async function setupSpotifyNowPlaying() {
    // Check if necessary display elements exist
    if (!document.getElementById('album-image') ||
        !document.getElementById('song-title') ||
        !document.getElementById('artist-name') ||
        !document.getElementById('song-timer')) {
          return; // Don't run if elements aren't present
        }

    const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

    // --- GetNowPlaying (uses the standalone token function) ---
    async function getNowPlaying() {
        try {
            const access_token = await getSpotifyAccessToken(); // Use standalone function
            if (!access_token) return null;

            const response = await fetch(NOW_PLAYING_ENDPOINT, {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            if (response.status === 204) {
                return null; // Nothing playing or no active device
            }
            if (!response.ok) {
               console.error(`Error fetching currently playing song: Status ${response.status}`);
               return null;
            }
            const contentType = response.headers.get("content-type");
             if (!contentType || !contentType.includes("application/json")) {
                console.error('Received non-JSON response from Spotify API (Now Playing)');
                return null;
            }
            const song = await response.json();
            if (!song || !song.item || !song.item.album || !song.item.album.images || !song.item.album.images.length) {
                console.log('Spotify: Incomplete song data received.');
                return null;
            }

            // Extract details
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
                timeTotal,
                isPlaying: song.is_playing // Also get playback state
            };
        } catch (error) {
            console.error('Error in getNowPlaying:', error);
            return null;
        }
    }

    // --- Helper and Update Logic (mostly unchanged) ---
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    let intervalId = null;
    async function updateNowPlaying() {
        const data = await getNowPlaying();
        requestAnimationFrame(() => { // Update UI in animation frame
            try {
                const imgEl = document.getElementById('album-image');
                const titleEl = document.getElementById('song-title');
                const artistEl = document.getElementById('artist-name');
                const timerEl = document.getElementById('song-timer');
                const playPauseButton = document.getElementById('spotifyPlayPause'); // Get play/pause button

                if (!imgEl || !titleEl || !artistEl || !timerEl) return;

                if (data) {
                    imgEl.src = data.albumImageUrl;
                    titleEl.textContent = data.title;
                    artistEl.textContent = data.artist;

                    const secondsPlayed = Math.floor(data.timePlayed / 1000);
                    const minutesPlayed = Math.floor(secondsPlayed / 60);
                    const secondsTotal = Math.floor(data.timeTotal / 1000);
                    const minutesTotal = Math.floor(secondsTotal / 60);
                    timerEl.textContent =
                        `${pad(minutesPlayed)}:${pad(secondsPlayed % 60)} / ${pad(minutesTotal)}:${pad(secondsTotal % 60)}`;

                    // Update Play/Pause button based on state
                    if(playPauseButton) {
                       playPauseButton.textContent = data.isPlaying ? '⏸ Pause' : '▶ Play';
                    }

                } else {
                    imgEl.src = "/media/pink-default-album.png";
                    titleEl.textContent = "Nothing!";
                    artistEl.textContent = "Check back soon";
                    timerEl.textContent = "0:00 / 0:00";
                     if(playPauseButton) {
                       playPauseButton.textContent = '▶ Play'; // Default to Play if nothing loads
                    }
                }
            } catch (error) {
                console.error('Error updating Spotify DOM elements:', error);
            }
        });
    }
    updateNowPlaying();
    intervalId = setInterval(updateNowPlaying, 10000); // Keep updating display
}


// --- NEW Playback Control Functions ---

async function spotifyControl(endpoint, method = 'PUT') { // Default to PUT
    const access_token = await getSpotifyAccessToken();
    if (!access_token) {
        console.error("Cannot control Spotify: No access token.");
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        // Check for common errors
        if (response.status === 401) {
             console.error("Spotify Control Error: Unauthorized (Token likely expired or invalid scope).");
             getSpotifyAccessToken.cachedToken = null; // Clear bad token cache
        } else if (response.status === 403) {
             console.error("Spotify Control Error: Forbidden (Missing scope or premium required?).");
             // Check if refresh token includes 'user-modify-playback-state' scope
        } else if (response.status === 404) {
             console.error("Spotify Control Error: No active device found.");
             // Maybe display a message to the user?
        } else if (!response.ok) {
             console.error(`Spotify Control Error: Status ${response.status}`);
        } else {
            // console.log(`Spotify action ${method} ${endpoint} successful.`);
             // Optional: Force an immediate UI update after control action
             if (typeof updateNowPlaying === 'function') { // Check if update function is available
                setTimeout(updateNowPlaying, 500); // Update after slight delay
             }
        }

    } catch (error) {
        console.error('Network or other error during Spotify control:', error);
    }
}

function playSpotify() {
    console.log("Attempting to Play Spotify");
    spotifyControl('https://api.spotify.com/v1/me/player/play', 'PUT');
}

function pauseSpotify() {
    console.log("Attempting to Pause Spotify");
    spotifyControl('https://api.spotify.com/v1/me/player/pause', 'PUT');
}

function skipSpotifyNext() {
    console.log("Attempting to Skip Spotify Track");
    spotifyControl('https://api.spotify.com/v1/me/player/next', 'POST');
}

// --- NEW Setup function for controls ---
function setupSpotifyControls() {
    const playPauseButton = document.getElementById('spotifyPlayPause');
    const skipButton = document.getElementById('spotifySkip');

    if (playPauseButton) {
        playPauseButton.addEventListener('click', () => {
            // Basic toggle logic - assumes button text reflects current state
            if (playPauseButton.textContent.includes('Play')) {
                playSpotify();
            } else {
                pauseSpotify();
            }
        });
    } else {
        // console.log("Spotify Play/Pause button not found.");
    }

    if (skipButton) {
        skipButton.addEventListener('click', skipSpotifyNext);
    } else {
         // console.log("Spotify Skip button not found.");
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSpotifyControls);
} else {
    setupSpotifyControls();
}