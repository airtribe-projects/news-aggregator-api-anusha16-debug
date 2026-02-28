// In-memory storage for read articles
// Format: { userId: [articleIds] }
const readArticles = new Map();

// In-memory storage for favorite articles
// Format: { userId: [{ id, title, description, url, source, savedAt }] }
const favoriteArticles = new Map();

module.exports = {
    readArticles,
    favoriteArticles
};
