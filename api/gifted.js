const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const { data: html } = await axios.get('https://www.rankone.global/peacedubz/lists', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        // Diagnostic Check 1: What is the actual title of the page Vercel is seeing?
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].trim() : "No Title Found";

        // Diagnostic Check 2: Does Altf42 exist ANYWHERE in the raw, unformatted text?
        const cleanText = html.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const hasGame = cleanText.includes('altf42');

        return res.send(`Debug: Title is "${pageTitle}". Game found in HTML: ${hasGame}.`);

    } catch (error) {
        if (error.response) {
            return res.send(`Debug: RankOne blocked the request (Error ${error.response.status}).`);
        }
        return res.send(`Debug: Script completely failed to reach RankOne.`);
    }
};
