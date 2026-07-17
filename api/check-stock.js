module.exports = async (request, response) => {
  // Pull authorization header from Vercel's edge network request
  const authHeader = request.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized request' });
  }

  try {
    // Queries CrazyGames public game manifest API for Brainrot Arena active state parameters
    const gameShopResponse = await fetch('https://crazygames.com');
    const activeInventory = await gameShopResponse.json(); 

    const TRACKED_ITEMS = ["Black Hole", "Vines", "Rolling Snowball", "Snowman Guardian"];
    const matchingItems = activeInventory.items.filter(item => TRACKED_ITEMS.includes(item.name));

    if (matchingItems.length > 0) {
      const fields = matchingItems.map(item => ({
        name: `🚨 ${item.name}`,
        value: `Rarity: High-Tier | Price: ${item.cost || 'Gold'}`,
        inline: true
      }));

      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: "⚠️ **Brainrot Arena Stock Tracker Update!**",
          embeds: [{
            title: "Rare Shop Rotation Active!",
            description: "The tracked items are currently available in the arena rotation:",
            color: 16711765,
            fields: fields,
            timestamp: new Date()
          }]
        })
      });
    }

    return response.status(200).json({ success: true, alerted: matchingItems.length > 0 });
  } catch (error) {
    console.error('Tracker Error:', error.message);
    return response.status(500).json({ error: error.message });
  }
};
