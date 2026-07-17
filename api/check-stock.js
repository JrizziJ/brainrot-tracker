module.exports = async (request, response) => {
  const authHeader = request.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized request' });
  }

  try {
    // 1. Fetch through the proxy to bypass the firewall
    const targetUrl = 'https://api.crazygames.com/v1/games/brainrot-arena-online/shop';
       const gameShopResponse = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(targetUrl));

const activeInventory = await gameShopResponse.json();
    

    // 3. Scan the shop rotation for your items
    const TRACKED_ITEMS = ["Black Hole", "Vines", "Rolling Snowball", "Snowman Guardian", "Gold", "Coins", "Default"];

const itemsList = activeInventory.items || activeInventory || [];
const matchingItems = Array.isArray(itemsList) ? itemsList.filter(item => item && TRACKED_ITEMS.includes(item.name)) : [];


    if (matchingItems.length > 0) {
      const fields = matchingItems.map(item => ({
        name: `🚨 ${item.name}`,
        value: `Rarity: High-Tier | Price: ${item.cost || 'Gold'}`,
        inline: true
      }));

      // 4. Send the alert layout straight to Discord
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
