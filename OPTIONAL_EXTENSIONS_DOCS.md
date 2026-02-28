# News Aggregator API - Optional Extensions Documentation

## ✨ New Features Implemented

### 1. ✅ Caching Mechanism
- **Enhanced in-memory caching** for all news fetches
- **Async/await** for cache retrieval and updates
- **15-minute cache duration** to reduce API calls
- **Smart cache keys** based on user preferences
- **Background cache refresh** every 10 minutes

### 2. ✅ Mark Articles as Read/Favorite
- **POST `/news/:id/read`** - Mark article as read
- **POST `/news/:id/favorite`** - Add article to favorites
- **GET `/news/read`** - Get all read articles
- **GET `/news/favorites`** - Get all favorite articles
- Per-user storage for read/favorite tracking

### 3. ✅ Search Functionality
- **GET `/news/search/:keyword`** - Search by keyword
- **Cached search results** for performance
- **Mock data fallback** if API unavailable

### 4. ✅ Periodic Cache Updates
- **Background update every 10 minutes**
- **Automatic cache refresh** for all users
- **Rate limiting protection** with delays
- **Runs on server startup** after 5 seconds

---

## 📚 API Endpoints Reference

### Authentication Required for All Endpoints
Include JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔍 Search Endpoints

### 1. Search by Keyword (Path Parameter)
**GET** `/news/search/:keyword`

Search for news articles using a keyword in the URL path.

**Request:**
```http
GET /news/search/technology
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Search results fetched successfully",
  "source": "api",
  "keyword": "technology",
  "articles": [
    {
      "title": "Latest Tech Innovation",
      "description": "...",
      "url": "https://...",
      "source": { "name": "TechCrunch" }
    }
  ],
  "totalResults": 15
}
```

**Cache:** Results cached for 15 minutes

---

### 2. Search with Query Parameters
**GET** `/news/search?query=keyword`

Search with additional filters using query parameters.

**Request:**
```http
GET /news/search?query=artificial intelligence&sortBy=publishedAt
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Search results fetched successfully",
  "source": "api",
  "query": "artificial intelligence",
  "articles": [...],
  "totalResults": 20
}
```

---

## 📖 Read Articles Endpoints

### 1. Mark Article as Read
**POST** `/news/:id/read`

Mark a specific article as read for the current user.

**Request:**
```http
POST /news/article-123/read
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Article marked as read successfully",
  "articleId": "article-123",
  "totalRead": 5
}
```

**If already read:**
```json
{
  "message": "Article already marked as read",
  "articleId": "article-123"
}
```

---

### 2. Get All Read Articles
**GET** `/news/read`

Retrieve all articles marked as read by the current user.

**Request:**
```http
GET /news/read
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Read articles retrieved successfully",
  "readArticles": ["article-123", "article-456", "article-789"],
  "totalRead": 3
}
```

---

## ⭐ Favorite Articles Endpoints

### 1. Mark Article as Favorite
**POST** `/news/:id/favorite`

Add an article to the user's favorites list.

**Request Body:**
```json
{
  "title": "Amazing Tech Innovation",
  "description": "This is an amazing article about technology",
  "url": "https://example.com/article",
  "source": { "name": "TechCrunch" }
}
```

**Request:**
```http
POST /news/article-123/favorite
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Amazing Tech Innovation",
  "description": "This is an amazing article",
  "url": "https://example.com/article",
  "source": { "name": "TechCrunch" }
}
```

**Response:** `200 OK`
```json
{
  "message": "Article added to favorites successfully",
  "article": {
    "id": "article-123",
    "title": "Amazing Tech Innovation",
    "description": "This is an amazing article",
    "url": "https://example.com/article",
    "source": { "name": "TechCrunch" },
    "savedAt": "2026-02-28T10:30:00.000Z"
  },
  "totalFavorites": 3
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "Article title and URL are required"
}
```

**If already favorited:**
```json
{
  "message": "Article already in favorites",
  "article": {...}
}
```

---

### 2. Get All Favorite Articles
**GET** `/news/favorites`

Retrieve all favorite articles for the current user.

**Request:**
```http
GET /news/favorites
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Favorite articles retrieved successfully",
  "favorites": [
    {
      "id": "article-123",
      "title": "Amazing Tech Innovation",
      "description": "This is an amazing article",
      "url": "https://example.com/article",
      "source": { "name": "TechCrunch" },
      "savedAt": "2026-02-28T10:30:00.000Z"
    },
    {
      "id": "article-456",
      "title": "Another Great Article",
      "description": "...",
      "url": "https://example.com/article2",
      "source": { "name": "BBC News" },
      "savedAt": "2026-02-28T11:00:00.000Z"
    }
  ],
  "totalFavorites": 2
}
```

---

## 🔧 Utility Endpoints

### Clear Cache
**POST** `/news/clear-cache`

Manually clear all cached news data.

**Request:**
```http
POST /news/clear-cache
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Cache cleared successfully"
}
```

---

## 🔄 Caching System Details

### Cache Strategy
1. **Primary Cache**: User preference-based news (15 min)
2. **Search Cache**: Keyword search results (15 min)
3. **Background Updates**: Automatic refresh every 10 min

### Async/Await Implementation
```javascript
// Cache retrieval with async/await
const getCachedData = async () => {
    return new Promise((resolve) => {
        if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
                resolve(cachedData);
            }
        }
        resolve(null);
    });
};

const cachedData = await getCachedData();
```

### Background Cache Update Process
```javascript
// Updates run every 10 minutes
setInterval(updateCacheInBackground, 10 * 60 * 1000);

// Update process:
1. Find all users with preferences
2. Check if cache needs refresh
3. Fetch new data from API
4. Update cache with timestamp
5. Add 1-second delay between users (rate limiting)
```

---

## 📊 Data Models

### Read Articles Model
```javascript
// Map structure: userId -> [articleIds]
{
  1: ["article-123", "article-456"],
  2: ["article-789"]
}
```

### Favorite Articles Model
```javascript
// Map structure: userId -> [articleObjects]
{
  1: [
    {
      id: "article-123",
      title: "...",
      description: "...",
      url: "...",
      source: {...},
      savedAt: "2026-02-28T10:30:00.000Z"
    }
  ]
}
```

---

## 🎯 Complete API Testing Examples

### Using cURL

**1. Search by Keyword:**
```bash
curl -X GET "http://localhost:3000/news/search/technology" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**2. Mark as Read:**
```bash
curl -X POST "http://localhost:3000/news/article-123/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Add to Favorites:**
```bash
curl -X POST "http://localhost:3000/news/article-123/favorite" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Article",
    "description": "Amazing tech news",
    "url": "https://example.com",
    "source": {"name": "TechCrunch"}
  }'
```

**4. Get Read Articles:**
```bash
curl -X GET "http://localhost:3000/news/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**5. Get Favorites:**
```bash
curl -X GET "http://localhost:3000/news/favorites" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Complete Workflow Example

### Step-by-Step User Journey

**1. Register & Login:**
```bash
# Register
curl -X POST http://localhost:3000/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "preferences": ["technology", "science"]
  }'

# Response includes token
# Save token for subsequent requests
```

**2. Get Personalized News:**
```bash
curl -X GET http://localhost:3000/news \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Search for Specific Topic:**
```bash
curl -X GET "http://localhost:3000/news/search/artificial-intelligence" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Mark Articles as Read:**
```bash
curl -X POST http://localhost:3000/news/article-1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
  
curl -X POST http://localhost:3000/news/article-2/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**5. Save Favorites:**
```bash
curl -X POST http://localhost:3000/news/article-3/favorite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Favorite Article",
    "description": "This is amazing",
    "url": "https://example.com/article-3",
    "source": {"name": "Tech News"}
  }'
```

**6. View Reading History:**
```bash
# Get read articles
curl -X GET http://localhost:3000/news/read \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get favorites
curl -X GET http://localhost:3000/news/favorites \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚡ Performance Features

### 1. Cache Benefits
- **Reduced API Calls**: 15-minute cache prevents repeated requests
- **Faster Response**: Cached data returned immediately
- **Cost Savings**: Fewer external API calls = lower costs

### 2. Background Updates
- **Real-time Feel**: Cache stays fresh automatically
- **No User Wait**: Updates happen in background
- **Smart Scheduling**: Only updates when needed

### 3. Async/Await Benefits
- **Non-blocking**: Cache operations don't block requests
- **Better Performance**: Efficient promise handling
- **Error Handling**: Clean try-catch structure

---

## 🛡️ Error Handling

All endpoints include comprehensive error handling:

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | Article marked as read |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid/missing token |
| 404 | Not Found | User not found |
| 500 | Server Error | Internal error |
| 502 | Bad Gateway | External API error |
| 504 | Gateway Timeout | Request timeout |

---

## 🔐 Security Considerations

1. **Authentication Required**: All endpoints require valid JWT
2. **User Isolation**: Each user's read/favorite lists are separate
3. **Input Validation**: Article data validated before storage
4. **Rate Limiting**: Background updates include delays

---

## 📈 Monitoring & Logging

Console logs for background updates:
```
[Background Update] Starting cache refresh...
[Background Update] Cache updated for user 1
[Background Update] Cache updated for user 2
[Background Update] Cache refresh completed
```

---

## 🎓 Summary of Optional Extensions

| Feature | Status | Endpoints |
|---------|--------|-----------|
| **Caching Mechanism** | ✅ | All news endpoints |
| **Mark as Read** | ✅ | `POST /news/:id/read`, `GET /news/read` |
| **Mark as Favorite** | ✅ | `POST /news/:id/favorite`, `GET /news/favorites` |
| **Search by Keyword** | ✅ | `GET /news/search/:keyword` |
| **Periodic Updates** | ✅ | Background process (10 min) |
| **Async/Await Cache** | ✅ | All cache operations |

---

**All Optional Extensions Successfully Implemented! 🎉**
