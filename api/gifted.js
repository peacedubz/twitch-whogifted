const axios = require('axios');

module.exports = async (req, res) => {
    // 1. Get the requested game from the Twitch command
    const searchGame = req.query.game ? req.query.game.trim().toLowerCase() : '';
    
    if (!searchGame) {
        return res.send("Please specify a game name! Usage: !whogifted [gamename]");
    }

    try {
        // 2. Fetch the raw JSON data directly from RankOne's hidden API
        const { data } = await axios.get('https://gwaulww2tc.execute-api.eu-west-3.amazonaws.com/profile/peacedubz');

        // 3. Locate the "Super Sundays - Games from Chat" list in the collections array
        // We do this by looking for the list description to ensure we get the right one
        const collections = data.collections || {};
        let targetListId = null;
        let targetList = null;

        for (const [id, list] of Object.entries(collections)) {
            if (list.description && list.description.toLowerCase().includes('gifted games from twitch viewers')) {
                targetListId = id;
                targetList = list;
                break;
            }
        }

        if (!targetList) {
            return res.send("Error: Could not find the Super Sundays list data.");
        }

        // 4. Search through the games in that specific list for a title match
        const games = targetList.games || [];
        let foundGame = null;

        for (const game of games) {
            if (game.title && game.title.toLowerCase().includes(searchGame)) {
                foundGame = game;
                break;
            }
        }

        // 5. Handle the results
        if (!foundGame) {
            return res.send(`Could not find "${req.query.game}" in the Super Sundays list.`);
        }

        if (!foundGame.note) {
             return res.send(`"${foundGame.title}" is in Super Sundays, but there is no note attached!`);
        }
        
        // 6. Print the note!
        // We will output the game title exactly as it is formatted in the database, plus the note.
        return res.send(`This game (${foundGame.title}) was ${foundGame.note.trim()}!`);

    } catch (error) {
        console.error(error);
        return res.send("Oops! Something went wrong trying to read the RankOne database.");
    }
};
