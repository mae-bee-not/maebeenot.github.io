// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

async function setupSpotifyNowPlaying() {
    // Ensure config is loaded and available
    if (typeof config === 'undefined') {
        console.error('Spotify config not found. Ensure config.js is loaded before spotify.js');
        return;
    }
    const { client_id, client_secret, refresh_token } = config;

    // Check if necessary elements exist before proceeding
    if (!document.getElementById('album-image') ||
        !document.getElementById('song-title') ||
        !document.getElementById('artist-name') ||
        !document.getElementById('song-timer')) {
          // console.log('Spotify elements not found on this page. Skipping setup.');
          return; // Don't run if elements aren't present
        }

    const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
    const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

    async function getAccessToken() {
        const basic = btoa(`${client_id}:${client_secret}`);
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
                // Handle rate limiting or other recoverable errors differently?
                const errorData = await response.text(); // Read as text first
                let errorDesc = `Status ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorData);
                    errorDesc = errorJson.error_description || errorDesc;
                } catch (e) {
                    // Ignore if parsing fails, use status code
                }
                // Avoid throwing for common issues like no active device?
                console.error(`Error fetching access token: ${errorDesc}`);
                // Instead of throwing, maybe return null or a specific error object
                return null;
                // throw new Error(`Error fetching access token: ${errorDesc}`);
            }

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Network or other error in getAccessToken:', error);
            return null; // Return null on fetch failure
        }
    }

    async function getNowPlaying() {
        try {
            const access_token = await getAccessToken();
            if (!access_token) return null; // Don't proceed if token failed

            const response = await fetch(NOW_PLAYING_ENDPOINT, {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });

            // 204 No Content means nothing is playing (or no active device) - This is normal
            if (response.status === 204) {
                // console.log('Spotify: No content playing.');
                return null; // Return null instead of throwing error
            }

            if (!response.ok) {
               console.error(`Error fetching currently playing song: Status ${response.status}`);
               return null; // Return null on other errors
            }

            // Add check for response content-type? Sometimes API might return unexpected things
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Received non-JSON response from Spotify API');
                return null;
            }


            const song = await response.json();

            // Add safety checks for potentially null data from Spotify API
            if (!song || !song.item || !song.item.album || !song.item.album.images || !song.item.album.images.length) {
                console.log('Spotify: Incomplete song data received.');
                // Potentially set UI to a default "Nothing Playing" state here
                return null;
            }


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
            // Catch errors from getAccessToken or fetch/json parsing
            console.error('Error in getNowPlaying:', error);
            return null;
        }
    }

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

    // Store interval ID to potentially clear later if needed
    let intervalId = null;

    async function updateNowPlaying() {
        const data = await getNowPlaying();

        // Use requestAnimationFrame for DOM updates
        requestAnimationFrame(() => {
          try {
              const imgEl = document.getElementById('album-image');
              const titleEl = document.getElementById('song-title');
              const artistEl = document.getElementById('artist-name');
              const timerEl = document.getElementById('song-timer');

              // Double check elements exist inside rAF
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
              } else {
                  // Handle case where nothing is playing or data fetch failed
                  imgEl.src = "/media/pink-default-album.png"; // Default image
                  titleEl.textContent = "Nothing!";
                  artistEl.textContent = "Check back soon";
                  timerEl.textContent = "0:00 / 0:00";
              }
          } catch (error) {
              console.error('Error updating Spotify DOM elements:', error);
              // Potentially clear interval if errors persist?
              // if (intervalId) clearInterval(intervalId);
          }
        });
    }

    // Initial call
    updateNowPlaying();
    // Set interval
    intervalId = setInterval(updateNowPlaying, 10000);  // Update every 10 seconds
}