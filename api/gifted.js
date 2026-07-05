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

        // RankOne uses a modern framework (Next.js App Router) which hides data inside complex script chunks.
        // We will scan the raw webpage text directly instead of looking for a clean JSON block.
        
        // 1. Sanitize the HTML string slightly to make searching it easier
        const rawText = html.replace(/\\"/g, '"').replace(/&quot;/g, '"');

        // 2. Find the game title in the raw code
        const titleRegex = new RegExp(`"title"\\s*:\\s*"([^"]*${searchGame}[^"]*)"`, 'i');
        const titleMatch = rawText.match(titleRegex);

        if (!titleMatch) {
            return res.send(`Could not find a game matching "${req.query.game}" on the list.`);
        }

        const foundTitle = titleMatch[1];

        // 3. Grab the chunk of text immediately surrounding the title to find its specific notes
        const textChunk = rawText.substring(titleMatch.index, titleMatch.index + 1200);
        
        // 4. Look for the "notes" key, or directly for the phrase "Gifted by"
        const notesRegex = /"notes"\s*:\s*"([^"]+)"/i;
        const fallbackRegex = /(Gifted by [a-zA-Z0-9_ -]+)/i;
        
        const notesMatch = textChunk.match(notesRegex);
        const fallbackMatch = textChunk.match(fallbackRegex);

        let finalNote = '';
        if (notesMatch && notesMatch[1].toLowerCase().includes('gifted')) {
            finalNote = notesMatch[1];
        } else if (fallbackMatch) {
            finalNote = fallbackMatch[1];
        } else {
            return res.send(`${foundTitle} is on the list, but there's no gifter note!`);
        }

        return res.send(`This game (${foundTitle}) was ${finalNote.trim()}!`);

    } catch (error) {
        console.error(error);
        return res.send("Oops! Something went wrong trying to read the RankOne page.");
    }
};
