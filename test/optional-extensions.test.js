const tap = require('tap');
const supertest = require('supertest');
const app = require('../app');
const server = supertest(app);

const mockUser = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password456',
    preferences: ['technology', 'science']
};

let token = '';
let testArticleId = 'test-article-123';

// Setup: Register and login
tap.test('Setup: Register user for optional extensions tests', async (t) => {
    const response = await server.post('/users/signup').send(mockUser);
    t.equal(response.status, 200);
    t.end();
});

tap.test('Setup: Login user', async (t) => {
    const response = await server.post('/users/login').send({
        email: mockUser.email,
        password: mockUser.password
    });
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'token');
    token = response.body.token;
    t.end();
});

// Search by keyword tests
tap.test('GET /news/search/:keyword - search by keyword', async (t) => {
    const response = await server
        .get('/news/search/technology')
        .set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'keyword');
    t.hasOwnProp(response.body, 'articles');
    t.equal(response.body.keyword, 'technology');
    t.end();
});

tap.test('GET /news/search/:keyword - without token', async (t) => {
    const response = await server.get('/news/search/technology');
    t.equal(response.status, 401);
    t.end();
});

tap.test('GET /news/search/:keyword - cached result', async (t) => {
    // Second request should come from cache
    const response = await server
        .get('/news/search/technology')
        .set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'source');
    // Could be 'cache' or 'api' depending on timing
    t.end();
});

// Mark as read tests
tap.test('POST /news/:id/read - mark article as read', async (t) => {
    const response = await server
        .post(`/news/${testArticleId}/read`)
        .set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'message');
    t.hasOwnProp(response.body, 'articleId');
    t.equal(response.body.articleId, testArticleId);
    t.end();
});

tap.test('POST /news/:id/read - mark same article as read again', async (t) => {
    const response = await server
        .post(`/news/${testArticleId}/read`)
        .set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.match(response.body.message, /already marked as read/i);
    t.end();
});

tap.test('POST /news/:id/read - without token', async (t) => {
    const response = await server.post(`/news/${testArticleId}/read`);
    t.equal(response.status, 401);
    t.end();
});

// Get read articles tests
tap.test('GET /news/read - get read articles', async (t) => {
    const response = await server
        .get('/news/read')
        .set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'readArticles');
    t.hasOwnProp(response.body, 'totalRead');
    t.ok(Array.isArray(response.body.readArticles));
    t.ok(response.body.readArticles.includes(testArticleId));
    t.end();
});

tap.test('GET /news/read - without token', async (t) => {
    const response = await server.get('/news/read');
    t.equal(response.status, 401);
    t.end();
});

// Mark as favorite tests
tap.test('POST /news/:id/favorite - add article to favorites', async (t) => {
    const articleData = {
        title: 'Test Article Title',
        description: 'This is a test article description',
        url: 'https://example.com/test-article',
        source: { name: 'Test Source' }
    };
    
    const response = await server
        .post(`/news/${testArticleId}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send(articleData);
    
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'message');
    t.hasOwnProp(response.body, 'article');
    t.equal(response.body.article.id, testArticleId);
    t.equal(response.body.article.title, articleData.title);
    t.hasOwnProp(response.body.article, 'savedAt');
    t.end();
});

tap.test('POST /news/:id/favorite - add same article again', async (t) => {
    const articleData = {
        title: 'Test Article Title',
        description: 'This is a test article description',
        url: 'https://example.com/test-article',
        source: { name: 'Test Source' }
    };
    
    const response = await server
        .post(`/news/${testArticleId}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send(articleData);
    
    t.equal(response.status, 200);
    t.match(response.body.message, /already in favorites/i);
    t.end();
});

tap.test('POST /news/:id/favorite - missing required fields', async (t) => {
    const response = await server
        .post(`/news/${testArticleId}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Only description' });
    
    t.equal(response.status, 400);
    t.hasOwnProp(response.body, 'error');
    t.end();
});

tap.test('POST /news/:id/favorite - without token', async (t) => {
    const articleData = {
        title: 'Test Article',
        url: 'https://example.com'
    };
    
    const response = await server
        .post(`/news/${testArticleId}/favorite`)
        .send(articleData);
    
    t.equal(response.status, 401);
    t.end();
});

// Get favorite articles tests
tap.test('GET /news/favorites - get favorite articles', async (t) => {
    const response = await server
        .get('/news/favorites')
        .set('Authorization', `Bearer ${token}`);
    
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'favorites');
    t.hasOwnProp(response.body, 'totalFavorites');
    t.ok(Array.isArray(response.body.favorites));
    t.ok(response.body.favorites.length > 0);
    
    // Check if our test article is in favorites
    const favoriteArticle = response.body.favorites.find(a => a.id === testArticleId);
    t.ok(favoriteArticle);
    t.equal(favoriteArticle.title, 'Test Article Title');
    t.end();
});

tap.test('GET /news/favorites - without token', async (t) => {
    const response = await server.get('/news/favorites');
    t.equal(response.status, 401);
    t.end();
});

// Additional test: Mark another article as read
tap.test('POST /news/:id/read - mark second article as read', async (t) => {
    const secondArticleId = 'test-article-456';
    const response = await server
        .post(`/news/${secondArticleId}/read`)
        .set('Authorization', `Bearer ${token}`);
    
    t.equal(response.status, 200);
    t.equal(response.body.articleId, secondArticleId);
    t.ok(response.body.totalRead >= 2);
    t.end();
});

// Additional test: Add another article to favorites
tap.test('POST /news/:id/favorite - add second article to favorites', async (t) => {
    const secondArticleId = 'test-article-789';
    const articleData = {
        title: 'Second Test Article',
        description: 'Another test article',
        url: 'https://example.com/test-article-2',
        source: { name: 'Another Source' }
    };
    
    const response = await server
        .post(`/news/${secondArticleId}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send(articleData);
    
    t.equal(response.status, 200);
    t.ok(response.body.totalFavorites >= 2);
    t.end();
});

// Verify both articles are in read list
tap.test('Verify multiple read articles', async (t) => {
    const response = await server
        .get('/news/read')
        .set('Authorization', `Bearer ${token}`);
    
    t.equal(response.status, 200);
    t.ok(response.body.totalRead >= 2);
    t.ok(response.body.readArticles.includes('test-article-123'));
    t.ok(response.body.readArticles.includes('test-article-456'));
    t.end();
});

// Verify both articles are in favorites
tap.test('Verify multiple favorite articles', async (t) => {
    const response = await server
        .get('/news/favorites')
        .set('Authorization', `Bearer ${token}`);
    
    t.equal(response.status, 200);
    t.ok(response.body.totalFavorites >= 2);
    
    const favoriteIds = response.body.favorites.map(a => a.id);
    t.ok(favoriteIds.includes('test-article-123'));
    t.ok(favoriteIds.includes('test-article-789'));
    t.end();
});

tap.teardown(() => {
    process.exit(0);
});
