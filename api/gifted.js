const axios = require('axios');

module.exports = async (req, res) => {
    const searchGame = req.query.game ? req.query.game.trim().toLowerCase() : '';
    
    if (!searchGame) {
        return res.send("Please specify a game name! Usage: !whogifted [gamename]");
    }

    try {
        const { data } = await axios.get('https://gwaulww2tc.execute-api.eu-west-3.amazonaws.com/profile/peacedubz', {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "eyJraWQiOiJ4Q2lScU84WkhUMklucUJGMkg4eHQ1YUJ3Y0NWSnRVeWxMQnpxdHFrT1djPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX2VkQmxQUkVMNjZpbWthMG5vcWRCdyIsInN1YiI6ImU2YmY3NDdiLWY5NjctNDVlYi1hNjYwLWFkNDE5OGI0Yjk3YSIsImNvZ25pdG86Z3JvdXBzIjpbImV1LWNlbnRyYWwtMV9RZEJ3NmtJbnBfVHdpdGNoIl0sImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC5ldS1jZW50cmFsLTEuYW1hem9uYXdzLmNvbS9ldS1jZW50cmFsLTFfUWRCdzZrSW5wIiwiY29nbml0bzp1c2VybmFtZSI6IlR3aXRjaF8xMTk2NzY1NjYiLCJhdWQiOiI2cXRxMDU5cXM4cTV2dDRzaTZkZ3B1MWU2ciIsImlkZW50aXRpZXMiOlt7ImRhdGVDcmVhdGVkIjoiMTcxNTI3ODYzMDYzOCIsInVzZXJJZCI6IjExOTY3NjU2NiIsInByb3ZpZGVyTmFtZSI6IlR3aXRjaCIsInByb3ZpZGVyVHlwZSI6Ik9JREMiLCJpc3N1ZXIiOm51bGwsInByaW1hcnkiOiJ0cnVlIn1dLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTc4MjEzNjI0NCwiY3VzdG9tOnByb2ZpbGVLc3VpZCI6IjJnRjFvY0JtZjhxNjNFYjI2VE5lZUx0YmdsMSIsImV4cCI6MTc4MzMyNzAxOSwiaWF0IjoxNzgzMzIzNDE5LCJlbWFpbCI6InBlYWNld29sZmNyZWF0aW9uc0BnbWFpbC5jb20ifQ.d6d_FgZJwYBptEk2Dd8Osu67B9MPyaSnD06ZrDj9c97RX4emaHmHxrQA3t8Fxx73wNVMlukNxcGV_VosOatS1-HkHpxkGPsZyYlpWPueB1JNqPUL5nvJZmnBjomsNIpDPE_SFmU2BFBamF8Bmflb6-3SdwAQK302DfOerPvOwHOCp0cdptHkczTtENxlmoaIq4TLV5tyEi4p_qN28NcAVflayG_lYxOdxid4FYQLyiZJbiCih6AkFDbS4TSMMs3wUHIhduptjkgV7JBi4GIc3dnff-9S4dBloSrgtdkJzOeA6K7AlJ82UQciKfe542HEE_W_kZTvdmQMPLb7AoUQXw",
                "x-auth-type": "GlobalApiOptionalAuth",
                "Referer": "https://www.rankone.global/"
            }
        });

        const collections = data.collections || {};
        let targetLists = [];

        // Safely check descriptions and names without triggering punctuation bugs
        for (const list of Object.values(collections)) {
            const desc = list.description ? list.description.toLowerCase() : '';
            const title = list.title ? list.title.toLowerCase() : ''; 
            const name = list.name ? list.name.toLowerCase() : ''; 
            
            if (
                desc.includes('gifted games from twitch viewers') || 
                desc.includes('really going to play these') || 
                title.includes('stinky sundays') || 
                name.includes('stinky sundays')
            ) {
                targetLists.push(list);
            }
        }

        if (targetLists.length === 0) {
            return res.send("Error: Could not find the data for your target lists.");
        }

        let foundEntry = null;

        for (const list of targetLists) {
            const entries = Object.values(list.games || {});
            
            for (const entry of entries) {
                if (entry.game && entry.game.title && entry.game.title.toLowerCase().includes(searchGame)) {
                    foundEntry = entry;
                    break;
                }
            }
            
            if (foundEntry) {
                break;
            }
        }

        // Cleaned up the error output so stray spaces in the chat command don't look weird
        if (!foundEntry) {
            return res.send(`Could not find "${searchGame}" in the Super or Stinky Sundays lists.`);
        }

        if (!foundEntry.note) {
             return res.send(`"${foundEntry.game.title}" is on the list, but there is no note attached!`);
        }
        
        return res.send(`This game (${foundEntry.game.title}) was ${foundEntry.note.trim()}!`);

    } catch (error) {
        return res.send(`API Error: ${error.message}`);
    }
};
