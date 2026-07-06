const axios = require('axios');

module.exports = async (req, res) => {
    const searchGame = req.query.game ? req.query.game.trim().toLowerCase() : '';
    
    if (!searchGame) {
        return res.send("Please specify a game name! Usage: !whogifted [gamename]");
    }

    try {
        const { data } = await axios.get('https://gwaulww2tc.execute-api.eu-west-3.amazonaws.com/profile/peacedubz');

        const collections = data.collections || {};
        let targetList = null;

        // Find the Super Sundays list by its description
        for (const list of Object.values(collections)) {
            if (list.description && list.description.toLowerCase().includes('gifted games from twitch viewers')) {
                targetList = list;
                break;
            }
        }

        if (!targetList) {
            return res.send("Error: Could not find the Super Sundays list data.");
        }

        // THE FIX: Convert RankOne's dictionary object of games into a searchable list
        const games = Object.values(targetList.games || {});
        let foundGame = null;

        for (const game of games) {
            if (game.title && game.title.toLowerCase().includes(searchGame)) {
                foundGame = game;
                break;
            }
        }

        if (!foundGame) {
            return res.send(`Could not find "${req.query.game}" in the Super Sundays list.`);
        }

        if (!foundGame.note) {
             return res.send(`"${foundGame.title}" is in Super Sundays, but there is no note attached!`);
        }
        
        return res.send(`This game (${foundGame.title}) was ${foundGame.note.trim()}!`);

    } catch (error) {
        // If it fails now, it will print the exact JavaScript or Server error to your chat
        return res.send(`API Error: ${error.message}`);
    }
};
