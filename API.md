# API Documentation

Base URL: `https://api.sarcasticrobo.online`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Health Check

#### GET /health
Check if API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### Initiate OAuth Login

#### GET /auth/google
Redirects to Google OAuth consent screen.

**Parameters:** None

**Response:** Redirect to Google

---

### OAuth Callback

#### GET /auth/google/callback
Google OAuth callback endpoint.

**Parameters:** Handled by OAuth flow

**Response:** Redirect to frontend with token

---

### Get Current User

#### GET /auth/me
Get information about currently authenticated user.

**Auth Required:** Yes

**Response:**
```json
{
  "id": 1,
  "google_id": "123456789",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### Logout

#### POST /auth/logout
Logout current user.

**Auth Required:** No

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Comment Endpoints

### Get Comments

#### GET /api/comments
Get public approved comments.

**Auth Required:** No

**Query Parameters:**
- `siteSection` (string, default: "general") - Filter by section
- `limit` (number, default: 50, max: 100) - Number of results
- `offset` (number, default: 0) - Pagination offset

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "user_id": 1,
      "content": "Great post!",
      "site_section": "blog",
      "status": "approved",
      "ai_suggested_rating": 4,
      "final_rating": 5,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "display_name": "John Doe",
      "email": "user@example.com",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  ]
}
```

---

### Submit Comment

#### POST /api/comments
Submit a new comment for AI moderation.

**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "This is my comment",
  "siteSection": "blog"
}
```

**Success Response (Approved):**
```json
{
  "status": "approved",
  "comment": {
    "id": 1,
    "user_id": 1,
    "content": "This is my comment",
    "site_section": "blog",
    "status": "approved",
    "ai_suggested_rating": 4,
    "created_at": "2024-01-01T00:00:00.000Z",
    "display_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "moderation": {
    "approved": true,
    "suggestedRating": 4,
    "feedback": "Constructive and respectful comment"
  }
}
```

**Rejection Response:**
```json
{
  "status": "rejected",
  "commentId": 1,
  "moderation": {
    "approved": false,
    "reason": "Comment contains inappropriate language",
    "feedback": "Please revise and resubmit"
  }
}
```

**Error Response:**
```json
{
  "error": "Comment content is required"
}
```

---

### Update Comment Rating

#### PUT /api/comments/:id/rating
Update the final rating for an approved comment.

**Auth Required:** Yes (must be comment owner)

**URL Parameters:**
- `id` (number) - Comment ID

**Request Body:**
```json
{
  "rating": 5
}
```

**Response:**
```json
{
  "comment": {
    "id": 1,
    "final_rating": 5,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "error": "Rating must be between 1 and 5"
}
```

---

### Get My Comments

#### GET /api/comments/my-comments
Get all comments by the authenticated user.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (number, default: 50)
- `offset` (number, default: 0)

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "content": "My comment",
      "status": "approved",
      "ai_suggested_rating": 4,
      "final_rating": 5,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Delete Comment

#### DELETE /api/comments/:id
Delete a comment.

**Auth Required:** Yes (must be comment owner)

**URL Parameters:**
- `id` (number) - Comment ID

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

**Error Response:**
```json
{
  "error": "Comment not found or not authorized"
}
```

---

### Get Statistics

#### GET /api/comments/stats
Get comment statistics.

**Auth Required:** No

**Query Parameters:**
- `siteSection` (string, optional) - Filter by section

**Response:**
```json
{
  "stats": {
    "total": 100,
    "approved": 85,
    "rejected": 10,
    "pending": 5,
    "avg_rating": 4.2
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

API rate limits:
- 100 requests per 15 minutes per IP
- Applies to all `/api/*` endpoints

When rate limited, you'll receive a 429 status code.

---

## CORS

Allowed origins:
- `https://deepak4395.github.io`
- `https://comments.sarcasticrobo.online`
- `http://localhost:3000`
- `http://localhost:5500`

---

## AI Moderation Guidelines

Comments are moderated based on:
- No offensive or discriminatory language
- No profanity or vulgar content
- No personal attacks or harassment
- No spam or promotional content
- Be respectful and constructive
- Stay on topic

AI returns a rating from 1-5:
- 1: Poor quality
- 2: Below average
- 3: Average
- 4: Good quality
- 5: Excellent quality

---

## Webhook Support

Currently not supported. Future feature.

---

## SDK Support

Currently not available. Use fetch or axios for API calls.

Example with fetch:

```javascript
// Submit comment
const response = await fetch('https://api.sarcasticrobo.online/api/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'My comment',
    siteSection: 'blog'
  })
});

const data = await response.json();
```

---

## Support

For API support:
- GitHub Issues: https://github.com/deepak4395/Comments/issues
- Email: api-support@sarcasticrobo.online
