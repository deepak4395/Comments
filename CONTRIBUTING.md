# Contributing to Comments & Feedback System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node version)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been suggested
2. Use the feature request template
3. Explain:
   - The problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Any additional context

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- Git

### Local Setup

```bash
# Clone repository
git clone https://github.com/deepak4395/Comments.git
cd Comments

# Install backend dependencies
cd server
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
createdb comments_db_dev
psql -d comments_db_dev -f scripts/init-db.sql

# Start development server
npm run dev
```

### Frontend Development

```bash
# Open public/index.html in browser
# Or use a local server
cd public
python3 -m http.server 5500
# Open http://localhost:5500
```

## Code Style

### JavaScript
- Use ES6+ features
- Use const/let, avoid var
- Use async/await over callbacks
- Follow existing code style
- Add comments for complex logic

### Naming Conventions
- camelCase for variables and functions
- PascalCase for classes
- UPPER_CASE for constants
- Descriptive names

### File Organization
```
server/src/
  ├── config/       # Configuration files
  ├── controllers/  # Request handlers
  ├── models/       # Database models
  ├── routes/       # Route definitions
  ├── services/     # Business logic
  └── middleware/   # Express middleware
```

## Testing

### Manual Testing
```bash
# Test backend
cd server
npm start

# Test API endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/comments
```

### Integration Testing
- Test OAuth flow
- Test comment submission
- Test AI moderation
- Test rating system

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add user profile page
fix: resolve OAuth redirect issue
docs: update API documentation
style: format code with prettier
refactor: simplify comment controller
test: add unit tests for auth
chore: update dependencies
```

## Pull Request Guidelines

### Before Submitting
- [ ] Code follows project style
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No merge conflicts

### PR Description Should Include
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (if UI changes)
- Related issue numbers

### Review Process
1. Automated checks run
2. Maintainer reviews code
3. Changes requested (if needed)
4. Approval and merge

## Areas for Contribution

### High Priority
- [ ] Unit tests for backend
- [ ] E2E tests for frontend
- [ ] Better error handling
- [ ] Performance optimization
- [ ] Accessibility improvements

### Medium Priority
- [ ] Admin dashboard
- [ ] Comment editing
- [ ] Reply to comments
- [ ] Email notifications
- [ ] Rate limiting per user

### Low Priority
- [ ] Dark mode
- [ ] Multiple languages (i18n)
- [ ] Export comments as JSON/CSV
- [ ] Comment search
- [ ] Rich text editor

## Getting Help

- Open a discussion on GitHub
- Check existing issues
- Review documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Credited in commits

Thank you for contributing! 🎉
