# User Rating Feature

This document describes the new user rating feature that allows users to rate each other based on their interactions and comment quality.

## Overview

The user rating feature enables logged-in users to rate other users on a scale of 1-5 stars. Each user's profile displays their average rating, total number of ratings received, and a detailed breakdown of rating distribution.

## Database Schema

### New Table: `user_ratings`

```sql
CREATE TABLE user_ratings (
    id SERIAL PRIMARY KEY,
    rater_id INTEGER NOT NULL REFERENCES users(id),
    rated_user_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rater_id, rated_user_id)
);
```

**Constraints:**
- Each user can only rate another user once (enforced by UNIQUE constraint)
- Users cannot rate themselves (enforced by application logic)
- Ratings must be between 1 and 5 stars

### Updated Table: `users`

Added columns:
- `avg_rating` (DECIMAL(3,2)) - Automatically calculated average rating
- `total_ratings` (INTEGER) - Count of ratings received

## Database Migration

To add the user rating feature to an existing database, run:

```bash
psql -d comments_db -f server/scripts/add-user-ratings.sql
```

This script will:
1. Add rating columns to the users table
2. Create the user_ratings table
3. Set up triggers to automatically update average ratings
4. Create helper functions for rating calculations

## API Endpoints

### Public Endpoints

#### `GET /api/users/:id/profile`
Get a user's profile with rating information and statistics.

**Response:**
```json
{
  "profile": {
    "id": 1,
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://...",
    "avgRating": 4.5,
    "totalRatings": 10,
    "totalComments": 25,
    "approvedComments": 20,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "ratingStats": {
    "totalRatings": 10,
    "avgRating": 4.5,
    "fiveStars": 6,
    "fourStars": 3,
    "threeStars": 1,
    "twoStars": 0,
    "oneStar": 0
  }
}
```

#### `GET /api/users/:id/ratings`
Get all ratings received by a user.

**Query Parameters:**
- `limit` (default: 50, max: 100) - Number of ratings to return
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "userId": 1,
  "ratings": [
    {
      "id": 1,
      "rating": 5,
      "rater": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatarUrl": "https://..."
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### `GET /api/users/:id/comments`
Get comments by a specific user.

**Query Parameters:**
- `limit` (default: 20, max: 100) - Number of comments to return
- `offset` (default: 0) - Pagination offset

### Protected Endpoints (Require Authentication)

#### `POST /api/users/:id/ratings`
Rate a user or update an existing rating.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 5
}
```

**Validations:**
- Rating must be an integer between 1 and 5
- User cannot rate themselves
- User must be authenticated

**Response:**
```json
{
  "message": "User rated successfully",
  "rating": {
    "id": 1,
    "rating": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "updatedProfile": {
    "avgRating": 4.5,
    "totalRatings": 10
  }
}
```

#### `GET /api/users/:id/my-rating`
Get the current user's rating for a specific user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "hasRated": true,
  "rating": {
    "id": 1,
    "rating": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `DELETE /api/users/:id/ratings`
Delete the current user's rating for a specific user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Rating deleted successfully"
}
```

## Frontend

### Profile Page

Access user profiles at: `profile.html?id=<user_id>`

**Features:**
- View user's avatar, name, and email
- See user statistics (total comments, approved comments)
- View average rating with star display
- See rating distribution (breakdown by star count)
- Rate the user (if logged in and not viewing own profile)
- View user's comments
- See all ratings received by the user
- Tabbed interface for different sections

**Tabs:**
1. **User Rating** - Display average rating, rating breakdown, and rating form
2. **Comments** - List of user's comments with status
3. **Ratings Received** - List of all ratings given by other users

### Integration with Comments Page

User names in comments are now clickable links that navigate to their profile pages.

## Usage Examples

### Rating a User

1. Navigate to a user's profile page
2. Click on the "User Rating" tab
3. Click on the star rating (1-5 stars)
4. Click "Submit Rating"

### Updating a Rating

1. Navigate to the user's profile page
2. Your existing rating will be displayed
3. Click on a different star rating
4. Click "Submit Rating" to update

### Deleting a Rating

1. Navigate to the user's profile page
2. Click "Delete My Rating" button
3. Confirm the deletion

## Security Considerations

1. **Authentication Required**: Rating operations require JWT authentication
2. **Self-Rating Prevention**: Users cannot rate themselves
3. **One Rating Per User**: Each user can only rate another user once (enforced by database constraint)
4. **Input Validation**: All inputs are validated on both frontend and backend
5. **SQL Injection Prevention**: All queries use parameterized statements
6. **XSS Prevention**: All user-generated content is escaped before display

## Automatic Rating Updates

The system uses PostgreSQL triggers to automatically update user rating statistics:

- When a new rating is added, the user's `avg_rating` and `total_ratings` are recalculated
- When a rating is updated, the calculations are refreshed
- When a rating is deleted, the statistics are updated accordingly

This ensures that displayed ratings are always accurate and up-to-date.

## Testing

### Manual Testing Checklist

- [ ] Create a new user rating
- [ ] Update an existing rating
- [ ] Delete a rating
- [ ] View user profile with ratings
- [ ] Verify rating statistics are correct
- [ ] Verify users cannot rate themselves
- [ ] Verify users can only rate once (or update existing rating)
- [ ] Test pagination for ratings list
- [ ] Test profile page with no ratings
- [ ] Test profile page with multiple ratings

### API Testing with curl

```bash
# Get user profile
curl https://api.sarcasticrobo.online/api/users/1/profile

# Rate a user (requires authentication)
curl -X POST https://api.sarcasticrobo.online/api/users/1/ratings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"rating": 5}'

# Get ratings for a user
curl https://api.sarcasticrobo.online/api/users/1/ratings

# Delete your rating (requires authentication)
curl -X DELETE https://api.sarcasticrobo.online/api/users/1/ratings \
  -H "Authorization: Bearer <your_token>"
```

## Future Enhancements

Potential improvements for the user rating feature:

1. **Rating Comments**: Allow users to add text comments with their ratings
2. **Rating History**: Track rating changes over time
3. **Rating Notifications**: Notify users when they receive a new rating
4. **Rating Badges**: Award badges for high-rated users
5. **Rating Filters**: Filter users by rating range
6. **Rating Analytics**: Provide detailed analytics on rating trends
7. **Mutual Ratings**: Encourage mutual rating between interacting users

## Troubleshooting

### Issue: Ratings not updating

**Solution:** Check that database triggers are properly installed by running the migration script again.

### Issue: Users can rate themselves

**Solution:** Verify that the backend validation is working correctly in `userController.js`.

### Issue: Profile page not loading

**Solution:** Check browser console for errors and verify the API is accessible.

### Issue: Rating statistics incorrect

**Solution:** Manually trigger a rating recalculation:
```sql
SELECT update_user_avg_rating(<user_id>);
```
