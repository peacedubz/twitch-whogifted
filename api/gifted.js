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

        // 1. Find exactly where your target list begins
        const targetList = "Super Sundays - Games from Chat";
        const startIndex = rawText.indexOf(targetList);
        
        if (startIndex === -1) {
            return res.send(`Error: Could not find the "${targetList}" list on the profile.`);
        }

        // 2. Find where the next list begins to create an airtight boundary
        const nextList = "Super Sundays - Games from Studios";
        let endIndex = rawText.indexOf(nextList, startIndex);
        
        // Fallback: If you ever delete/rename the 'Studios' list, just read to the end of the page
        if (endIndex === -1) {
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
