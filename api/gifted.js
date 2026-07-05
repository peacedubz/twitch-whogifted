const axios = require('axios');

module.exports = async (req, res) => {
    const searchGame = req.query.game ? req.query.game.trim().toLowerCase() : '';
    
    if (!searchGame) {
        return res.send("Please specify a game name! Usage: !whogifted [gamename]");
    }

    try {
        const { data: html } = await axios.get('https://www.rankone.global/peacedubz/lists', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        // Strip out annoying escape characters that modern web frameworks use
        const rawText = html.replace(/\\"/g, '"').replace(/&quot;/g, '"');

        // 1. Anchor to the list description instead of the title. 
        // This guarantees we are in the main body and bypasses hidden title formatting!
        const startRegex = /Gifted games from Twitch Viewers/i;
        const matchStart = rawText.match(startRegex);
        
        if (!matchStart) {
            return res.send("Error: Could not find the Super Sundays description anchor on the profile.");
        }
        const startIndex = matchStart.index;

        // 2. Find the boundary for the next list using an ultra-forgiving search
        // This allows up to 100 characters of invisible HTML tags between the words
        const nextListRegex = /Super[\s\S]{0,100}?Sundays[\s\S]{0,100}?Games[\s\S]{0,100}?Studios/i;
        const matchNext = rawText.substring(startIndex).match(nextListRegex);
        
        let endIndex;
        if (matchNext) {
            endIndex = startIndex + matchNext.index;
        } else {
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
            const noteChunk = listChunk.substring(match.index, match.index + 2000);
            
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
            return res.send(`Could not find "${req.query.game}" in the Super Sundays list.`);
        }

        return res.send(`This game was ${finalNote.trim()}!`);

    } catch (error) {
        console.error(error);
        return res.send("Oops! Something went wrong trying to read the RankOne page.");
    }
};
