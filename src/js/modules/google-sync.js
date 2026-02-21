const GoogleSync = {
    // IMPORTANT: Replace with your actual Google Cloud Project Client ID
    // You obtain this from Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', 
    
    // IMPORTANT: If you enable an API Key for public data access (e.g., Google Maps), put it here.
    // For accessing user's private Drive, OAuth is primary.
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY', 

    GOOGLE_DISCOVERY_DOCS: [
        "https://sheets.googleapis.com/$discovery/rest?version=v4",
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
    ],
    // Scopes for accessing user's Drive files and Google Sheets
    // drive.file: Allows access to files created or opened by the app
    // spreadsheets: Allows full access to Google Sheets
    GOOGLE_SCOPES: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',

    gapiInited: false,
    gisInited: false,
    tokenClient: null,
    spreadsheetId: null, // To store the ID of the user's sync spreadsheet

    // --- Initialization ---
    init: () => {
        // This function will be called by main.js after the app is loaded.
        // It primarily waits for GAPI and GIS to load.
        console.log('GoogleSync initialized');
    },

    /**
     * Callback for gapi.client initialisation.
     */
    intializeGapiClient: async () => {
        await gapi.client.init({
            apiKey: GoogleSync.GOOGLE_API_KEY,
            discoveryDocs: GoogleSync.GOOGLE_DISCOVERY_DOCS,
        });
        GoogleSync.gapiInited = true;
        GoogleSync.maybeEnableSyncFeatures();
    },

    /**
     * Callback for GIS initialisation.
     */
    gisLoaded: () => {
        GoogleSync.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GoogleSync.GOOGLE_CLIENT_ID,
            scope: GoogleSync.GOOGLE_SCOPES,
            callback: '', // Will be set dynamically during auth flow
        });
        GoogleSync.gisInited = true;
        GoogleSync.maybeEnableSyncFeatures();
    },

    /**
     * Enables sync buttons and checks for existing tokens once both GAPI and GIS are loaded.
     */
    maybeEnableSyncFeatures: () => {
        if (GoogleSync.gapiInited && GoogleSync.gisInited) {
            console.log('Google API client and Identity Services loaded.');
            const storedToken = localStorage.getItem('google_access_token');
            if (storedToken) {
                gapi.client.setToken(JSON.parse(storedToken));
                console.log('Existing Google access token loaded.');
                // Optionally, verify token or attempt silent refresh here
                GoogleSync.checkAuthStatus();
            }
            // Update UI to show sync available
            document.dispatchEvent(new CustomEvent('googleSyncReady'));
        }
    },

    // --- Authentication ---
    /**
     * Handles the Google Sign-In/Authorization flow.
     */
    handleAuthClick: async () => {
        GoogleSync.tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error('Auth error:', resp);
                alert('Google Drive-Autorisierung fehlgeschlagen. Bitte erneut versuchen.');
                return;
            }
            // Store the access token and its expiry for future use
            localStorage.setItem('google_access_token', JSON.stringify(gapi.client.getToken()));
            console.log('Google Access token acquired:', gapi.client.getToken());
            GoogleSync.syncData(); // Trigger sync after successful auth
        };

        if (gapi.client.getToken() === null || gapi.client.getToken().expires_at < Date.now()) {
            // Prompt the user to select a Google account and authorize your app.
            // Use 'consent' for first-time or when permissions might have changed.
            // Use '' for silent re-authentication if possible.
            GoogleSync.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // Token exists and is valid, proceed directly to sync or silent refresh
            GoogleSync.syncData();
        }
    },

    /**
     * Checks if a user is currently authenticated and updates UI.
     */
    checkAuthStatus: async () => {
        const token = gapi.client.getToken();
        if (token && token.expires_at > Date.now()) {
            console.log('Google Drive authenticated.');
            document.dispatchEvent(new CustomEvent('googleAuthStatus', { detail: { authenticated: true } }));
            // Start automatic sync if authenticated
            GoogleSync.startAutoSync();
            return true;
        } else {
            console.log('Google Drive not authenticated or token expired.');
            document.dispatchEvent(new CustomEvent('googleAuthStatus', { detail: { authenticated: false } }));
            GoogleSync.stopAutoSync();
            return false;
        }
    },

    /**
     * Signs out the user from Google Drive.
     */
    handleSignoutClick: () => {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token, () => {
                console.log('Google Access token revoked.');
                gapi.client.setToken(null);
                localStorage.removeItem('google_access_token');
                GoogleSync.spreadsheetId = null;
                document.dispatchEvent(new CustomEvent('googleAuthStatus', { detail: { authenticated: false } }));
                GoogleSync.stopAutoSync();
                alert('Erfolgreich von Google Drive abgemeldet.');
            });
        }
    },

    // --- Google Drive/Sheets Operations ---
    /**
     * Finds the StudyApp sync spreadsheet or creates one if it doesn't exist.
     * Returns the spreadsheet ID.
     */
    findOrCreateStudySpreadsheet: async () => {
        if (GoogleSync.spreadsheetId) return GoogleSync.spreadsheetId;

        try {
            // Search for existing spreadsheet
            const searchResponse = await gapi.client.drive.files.list({
                q: "mimeType='application/vnd.google-apps.spreadsheet' and name='StudyApp Learning Data'",
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (searchResponse.result.files.length > 0) {
                GoogleSync.spreadsheetId = searchResponse.result.files[0].id;
                console.log('Found existing spreadsheet:', GoogleSync.spreadsheetId);
                return GoogleSync.spreadsheetId;
            } else {
                // Create new spreadsheet if not found
                const createResponse = await gapi.client.sheets.spreadsheets.create({
                    resource: {
                        properties: {
                            title: 'StudyApp Learning Data'
                        }
                    },
                    fields: 'spreadsheetId'
                });
                GoogleSync.spreadsheetId = createResponse.result.spreadsheetId;
                console.log('Created new spreadsheet:', GoogleSync.spreadsheetId);
                return GoogleSync.spreadsheetId;
            }
        } catch (error) {
            console.error('Error finding or creating spreadsheet:', error);
            throw error;
        }
    },

    /**
     * Reads all data from a specific sheet.
     * @param {string} sheetName The name of the sheet (e.g., 'Flashcards').
     * @returns {Array<Array<string>>} The sheet values.
     */
    readSheetData: async (sheetName) => {
        try {
            const spreadsheetId = await GoogleSync.findOrCreateStudySpreadsheet();
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A:Z`, // Read a broad range to cover all data
            });
            return response.result.values || [];
        } catch (error) {
            console.error(`Error reading data from sheet ${sheetName}:`, error);
            return [];
        }
    },

    /**
     * Writes data to a specific sheet, overwriting existing content.
     * @param {string} sheetName The name of the sheet.
     * @param {Array<Array<string>>} values The data to write.
     */
    writeSheetData: async (sheetName, values) => {
        try {
            const spreadsheetId = await GoogleSync.findOrCreateStudySpreadsheet();
            // Ensure the sheet exists. If not, this will create it implicitly or fail if permissions are off.
            // For robust creation, you'd check/create sheets explicitly with gapi.client.sheets.spreadsheets.batchUpdate
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A1`, // Start writing from A1
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            });
            console.log(`Sheet ${sheetName} updated:`, response.result);
        } catch (error) {
            console.error(`Error writing data to sheet ${sheetName}:`, error);
            throw error;
        }
    },

    // --- Data Serialization/Deserialization (PLACEHOLDERS) ---
    /**
     * Serializes flashcard data from local storage/app state to Google Sheet format.
     * This is a placeholder and needs to be implemented based on your actual data structure.
     */
    serializeFlashcards: () => {
        // Example: localStorage.getItem('flashcards') might return a JSON string
        const flashcards = JSON.parse(localStorage.getItem('studyFlashcards') || '[]');
        // Convert to array of arrays, with headers
        const header = ['id', 'question', 'answer', 'lastReviewed', 'nextReview', 'interval', 'repetition', 'efactor']; // Example headers
        const dataRows = flashcards.map(card => [
            card.id, card.question, card.answer, card.lastReviewed, card.nextReview,
            card.interval, card.repetition, card.efactor
        ]);
        return [header, ...dataRows];
    },

    /**
     * Deserializes flashcard data from Google Sheet format to local storage/app state.
     * This is a placeholder and needs to be implemented.
     */
    deserializeFlashcards: (sheetValues) => {
        if (!sheetValues || sheetValues.length < 2) return [];
        const headers = sheetValues[0]; // Assuming first row is headers
        const dataRows = sheetValues.slice(1);
        return dataRows.map(row => {
            const card = {};
            headers.forEach((header, i) => {
                card[header] = row[i];
            });
            return card;
        });
    },

    // --- Synchronization Logic ---
    /**
     * Main synchronization function. Pushes local data to Drive and pulls data from Drive.
     */
    syncData: async () => {
        if (!(await GoogleSync.checkAuthStatus())) {
            console.log('Not authenticated, cannot sync.');
            document.dispatchEvent(new CustomEvent('googleSyncStatus', { detail: { status: 'error', message: 'Nicht authentifiziert.' } }));
            return;
        }

        document.dispatchEvent(new CustomEvent('googleSyncStatus', { detail: { status: 'syncing', message: 'Synchronisiere...' } }));
        try {
            const spreadsheetId = await GoogleSync.findOrCreateStudySpreadsheet();
            if (!spreadsheetId) throw new Error('Could not find or create spreadsheet.');

            // --- Push local data to Drive ---
            const flashcardData = GoogleSync.serializeFlashcards();
            await GoogleSync.writeSheetData('Flashcards', flashcardData);
            
            // Add similar logic for 'For You' preferences, spaced repetition settings, etc.
            // Example:
            // const forYouData = GoogleSync.serializeForYouPreferences();
            // await GoogleSync.writeSheetData('ForYouPreferences', forYouData);

            // --- Pull data from Drive (and merge/update local state) ---
            const remoteFlashcardData = await GoogleSync.readSheetData('Flashcards');
            const deserializedRemoteFlashcards = GoogleSync.deserializeFlashcards(remoteFlashcardData);
            // Example: Merge remoteFlashcardData with local flashcards, handling conflicts
            // For simplicity, here we'll just log it. In a real app, you'd have merge logic.
            console.log('Remote Flashcard Data:', deserializedRemoteFlashcards);
            // localStorage.setItem('studyFlashcards', JSON.stringify(deserializedRemoteFlashcards));
            // You would then update your app's state if this data changes significantly.
            
            document.dispatchEvent(new CustomEvent('googleSyncStatus', { detail: { status: 'success', message: 'Synchronisierung erfolgreich.', lastSynced: new Date().toLocaleString() } }));
            console.log('Google Drive sync complete!');
        } catch (error) {
            console.error('Google Drive sync failed:', error);
            document.dispatchEvent(new CustomEvent('googleSyncStatus', { detail: { status: 'error', message: 'Synchronisierung fehlgeschlagen.' } }));
        }
    },

    // --- Automatic Synchronization ---
    AUTO_SYNC_INTERVAL_MS: 3 * 60 * 60 * 1000, // 3 hours
    syncIntervalId: null,

    startAutoSync: () => {
        if (GoogleSync.syncIntervalId) clearInterval(GoogleSync.syncIntervalId); // Clear any existing interval
        GoogleSync.syncIntervalId = setInterval(() => {
            console.log('Initiating automatic Google Drive sync...');
            GoogleSync.syncData();
        }, GoogleSync.AUTO_SYNC_INTERVAL_MS);
        console.log('Automatic Google Drive sync started.');
    },

    stopAutoSync: () => {
        if (GoogleSync.syncIntervalId) {
            clearInterval(GoogleSync.syncIntervalId);
            GoogleSync.syncIntervalId = null;
            console.log('Automatic Google Drive sync stopped.');
        }
    },
};

// Make it globally accessible (assuming 'app' is your global app object)
if (window.app) {
    window.app.googleSync = GoogleSync;
} else {
    window.app = { googleSync: GoogleSync };
}

// Global functions for GAPI and GIS to load
function handleClientLoad() {
    gapi.load('client', app.googleSync.intializeGapiClient);
}

function gisLoaded() {
    app.googleSync.gisLoaded();
}
