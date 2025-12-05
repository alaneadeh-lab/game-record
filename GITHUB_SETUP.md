# GitHub Repository Setup

## Quick Setup Commands

Replace `YOUR_USERNAME` with your GitHub username:

```bash
cd /Users/alaeadeh/game-record

# Add remote (if not already added)
git remote add origin https://github.com/YOUR_USERNAME/game-record.git

# Or if remote exists, update it:
git remote set-url origin https://github.com/YOUR_USERNAME/game-record.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `game-record`
3. Description: "Hand Game Tracker - Card game results tracker with MongoDB"
4. Choose: Public or Private
5. **DO NOT** check any boxes (no README, .gitignore, or license)
6. Click "Create repository"
7. Copy the repository URL
8. Use the commands above to connect and push

## Verify Push

After pushing, verify:
```bash
git remote -v
```

Should show:
```
origin  https://github.com/YOUR_USERNAME/game-record.git (fetch)
origin  https://github.com/YOUR_USERNAME/game-record.git (push)
```

## Repository URL

Your repository will be available at:
```
https://github.com/YOUR_USERNAME/game-record
```

