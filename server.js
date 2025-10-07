const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// These are now read from docker-compose.yml
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

let accessToken = null;

// Function to get a new access token using your refresh token
async function refreshAccessToken() {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(`${clientId}:${clientSecret}`).toString('base64'))
            }
        });
        accessToken = response.data.access_token;
        console.log("Access Token Refreshed!");
    } catch (error) {
        console.error("Could not refresh access token:", error.response ? error.response.data : error.message);
    }
}

// Universal API call wrapper
async function spotifyApiRequest(method, url, data = {}) {
    if (!accessToken) {
        await refreshAccessToken();
    }
    try {
        const response = await axios({
            method: method,
            url: `https://api.spotify.com/v1${url}`,
            headers: { 'Authorization': `Bearer ${accessToken}` },
            data: data
        });
        return { status: response.status, data: response.data };
    } catch (error) {
        // If token is expired, refresh it and try the request one more time
        if (error.response && error.response.status === 401) {
            console.log("Access token expired, refreshing...");
            await refreshAccessToken();
            const response = await axios({
                method: method,
                url: `https://api.spotify.com/v1${url}`,
                headers: { 'Authorization': `Bearer ${accessToken}` },
                data: data
            });
            return { status: response.status, data: response.data };
        }
        throw error;
    }
}


// --- API Endpoints ---
app.get('/api/now-playing', async (req, res) => {
    try {
        const result = await spotifyApiRequest('get', '/me/player/currently-playing');
        if (result.status === 200 && result.data && result.data.item) {
            res.json({
                song: result.data.item.name,
                artist: result.data.item.artists.map(a => a.name).join(', ')
            });
        } else {
            res.status(200).send('Nothing is currently playing.');
        }
    } catch (error) {
        res.status(500).send('Error fetching current song.');
    }
});

app.post('/api/skip', async (req, res) => {
    try {
        await spotifyApiRequest('post', '/me/player/next');
        res.send('Skipped to the next song.');
    } catch (error) {
        res.status(500).send('Failed to skip song.');
    }
});

app.post('/api/pause', async (req, res) => {
    try {
        await spotifyApiRequest('put', '/me/player/pause');
        res.send('Playback paused.');
    } catch (error) {
        res.status(500).send('Failed to pause song.');
    }
});

app.post('/api/play', async (req, res) => {
    try {
        const songQuery = req.body.song;
        let playData = {};
        
        // If a song name is provided, search for it
        if (songQuery) {
            const searchResult = await spotifyApiRequest('get', `/search?q=${encodeURIComponent(songQuery)}&type=track&limit=1`);
            if (searchResult.data.tracks.items.length > 0) {
                playData = { uris: [searchResult.data.tracks.items[0].uri] };
            } else {
                return res.status(404).send(`Song "${songQuery}" not found.`);
            }
        }
        // If no song, just resume playback. If there's a song, play it.
        await spotifyApiRequest('put', '/me/player/play', playData);
        res.send(songQuery ? `Now playing: ${songQuery}` : 'Playback resumed.');
        
    } catch (error) {
        res.status(500).send('Failed to play. Is a device active?');
    }
});


// Start the server
const PORT = 8189;
app.listen(PORT, () => {
    console.log(`Spotify control server listening on port ${PORT}`);
    refreshAccessToken(); // Get the first access token on startup
});