const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

const TARGET_URL = 'https://www.espncricinfo.com/live-cricket-score'; // Replace if needed

async function scrapeCricketData() {
    try {
        const response = await axios.get(TARGET_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const matchData = {
            timestamp: new Date().toISOString(),
            matches: []
        };

        $('.ds-px-4.ds-py-3').each((index, element) => { // Adjust selector for ESPN Cricinfo
            const match = {
                teams: $(element).find('.ci-team-score .ds-text-tight-m').map((i, el) => $(el).text().trim()).get(),
                scores: $(element).find('.ds-text-compact-s').map((i, el) => $(el).text().trim()).get(),
                status: $(element).find('.ds-text-tight-s').text().trim(),
                overs: $(element).find('.ds-text-compact-xxs').text().trim()
            };
            matchData.matches.push(match);
        });

        return matchData;

    } catch (error) {
        console.error('Scraping error:', error.message);
        return { error: 'Failed to scrape data', timestamp: new Date().toISOString() };
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    const cachedData = cache.get('cricketData');
    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    try {
        const data = await scrapeCricketData();
        cache.set('cricketData', data);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
