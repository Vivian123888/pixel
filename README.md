{
# Navigate to your project root
cd pixel

# Install dependencies (this generates package-lock.json)
npm install

# Commit and push the lock file to GitHub
git add package-lock.json
git commit -m "Add package-lock.json lockfile"
git push origin main
}
