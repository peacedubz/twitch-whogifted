const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // 1. Get the game name from the Twitch command argument
    const searchGame = req.query.game ? req.query.game.trim().toLowerCase() : '';
    
    if (!searchGame) {
        return res.send("Please specify a game name! Usage: !whogifted [gamename]");
    }

    try {
        // 2. Fetch the HTML from your RankOne lists page
        const targetUrl = 'https://www.rankone.global/peacedubz/lists';
        const { data: html } = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const $ = cheerio.load(html);
        
        // 3. Locate the Next.js data script block where the list data lives
        const nextDataScript = $('#__NEXT_DATA__').html();
        
        if (!nextDataScript) {
            return res.send("Error: Could not retrieve the list structure from RankOne.");
        }

        const parsedData = JSON.parse(nextDataScript);
        
        // Target where RankOne stores the user's specific games/lists in the page state
        // Note: exact property depth may vary slightly depending on their state object, 
        // but typically lives inside queries or pageProps.
        const pageProps = parsedData.props?.pageProps || {};
        
        // Fallback to searching the raw string if the object path shifts, 
        // but ideally we iterate through the game objects:
        let gamesList = [];
        if (pageProps.games) {
            gamesList = pageProps.games;
        } else {
            // Flatten lists if they separate them by categories (Playing, Backlog, etc.)
            const lists = pageProps.lists || [];
            lists.forEach(list => {
                if (list.games) gamesList.push(...list.games);
            });
        }

        // 4. Search for the game requested by chat
        // We match if the title contains the text provided in chat
        const foundGame = gamesList.find(g => g.title?.toLowerCase().includes(searchGame));

        if (!foundGame) {
            return res.send(`Could not find a game matching "${req.query.game}" on PeaceDubz's RankOne lists.`);
        }

        // 5. Extract the note text (e.g., "Gifted by Klombi" as seen in image_55c0e7.png)
        const notes = foundGame.notes || foundGame.description || '';

        if (!notes || !notes.toLowerCase().includes('gifted')) {
            return res.send(`${foundGame.title} is on the list, but there's no gifter note listed for it!`);
        }

        // 6. Return the finalized chat response to Twitch
        return res.send(`This game (${foundGame.title}) was ${notes.trim()}!`);

    } catch (error) {
        console.error(error);
        return res.send("Oops! Something went wrong trying to read the RankOne page.");
    }
};
