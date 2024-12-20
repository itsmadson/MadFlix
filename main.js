const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // For local file checking

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ---------------------------
// Search Functionality with New Links
// ---------------------------
ipcMain.handle('search-links', async (event, { type, query }) => {
    const sanitizedQuery = query.trim().replace(/\s+/g, '-').toLowerCase();
    const formattedQueryForFmovies = query.trim().replace(/\s+/g, '+').toLowerCase();


    //search links
    const sflix2Link = `https://sflix2.to/search/${sanitizedQuery}`;
    const movies2watchLink = `https://movies2watch.tv/search/${sanitizedQuery}`;
    const fmoviesLink = `https://ww4.fmovies.co/search/?q=${formattedQueryForFmovies}`;
    const stremio = `https://web.stremio.com/#/search?search=${query.toLowerCase()}`;
    const m4uhdLink = `https://ww2.m4uhd.tv/search/${query.replace(/\s+/g, '-').toLowerCase()}.html`;

    // Add database search for anime or movie (from local file)
    const fileName = type === 'anime' ? 'anime.txt' : 'movie.txt';
    const urls = await readDatabaseFile(fileName);

    const matchingLinks = [];
    for (const url of urls) {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            const html = response.data;

            if (html.toLowerCase().includes(query.toLowerCase())) {
                matchingLinks.push(url);
            }
            if (html.toLowerCase().includes(query.replace(/\s+/g, '.').toLowerCase())) {
                matchingLinks.push(url);
            }
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error.message);
        }
    }

    // Combine results
    return [
        m4uhdLink, 
        sflix2Link, 
        movies2watchLink, 
        fmoviesLink,
        stremio,
        ...matchingLinks
    ];
});

// Function to Read Database Files
async function readDatabaseFile(fileName) {
    const filePath = path.join(__dirname, 'resources', fileName);

    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return content.split('\n').map(line => line.trim()).filter(line => line !== '');
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
}
