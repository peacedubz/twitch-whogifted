const axios = require('axios');

module.exports = async (req, res) => {
    const searchGame = req.query.game ? req.query.game.trim().toLowerCase() : '';
    
    if (!searchGame) {
        return res.send("Please specify a game name! Usage: !whogifted [gamename]");
    }

    try {
        const { data: html } = await axios.get('https://www.rankone.global/peacedubz/lists', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        // Strip out annoying escape characters that modern web frameworks use
        const rawText = html.replace(/\\"/g, '"').replace(/&quot;/g, '"');

        // 1. Find the list header flexibly, ignoring case and potential extra spaces
        const listHeaderRegex = /Super Sundays\s*-\s*Games from Chat/i;
        const matchHeader = rawText.match(listHeaderRegex);
        
        if (!matchHeader) {
            return res.send("Error: Could not find the 'Super Sundays - Games from Chat' list header on the profile.");
        }
        const startIndex = matchHeader.index;

        // 2. Find where the next list begins to create an airtight boundary
        // Applying the same flexible regex approach here to ensure it doesn't break
        const nextListRegex = /Super Sundays\s*-\s*Games from Studios/i;
        const matchNext = rawText.substring(startIndex).match(nextListRegex);
        
        let endIndex;
        if (matchNext) {
            // Add the index of the next list relative to where we started cutting
            endIndex = startIndex + matchNext.index;
        } else {
            // Fallback: If you ever delete/rename the 'Studios' list, just read to the end of the page
            endIndex = rawText.length; 
        }

        // 3. Slice out ONLY the text belonging to the "Games from Chat" list
        const listChunk = rawText.substring(startIndex, endIndex);

        // 4. Search for the game specifically inside this isolated chunk
        const searchRegex = new RegExp(searchGame, 'gi');
        let match;
        let finalNote = null;

        while ((match = searchRegex.exec(listChunk)) !== null) {
            // Grab the chunk of text immediately following the game name
            const noteChunk = listChunk.substring(match.index, match.index + 1500);
            
            // Scan that specific chunk for your "Gifted by" phrase
            const noteMatch = noteChunk.match(/(Gifted by [a-zA-Z0-9_ -]+)/i);
            
            if (noteMatch) {
                finalNote = noteMatch[1];
                break; // Stop looking once we find the note!
            }
        }

        if (!finalNote) {
            // Distinguish between "game found but no note" and "game not in this specific list at all"
            if (listChunk.toLowerCase().includes(searchGame)) {
                return res.send(`"${req.query.game}" is in Super Sundays, but there is no gifter note!`);
            }
            return res.send(`Could not find "${req.query.game}" in the Super Sundays - Games from Chat list.`);
        }

        return res.send(`This game was ${finalNote.trim()}!`);

    } catch (error) {
        console.error(error);
        return res.send("Oops! Something went wrong trying to read the RankOne page.");
    }
};
