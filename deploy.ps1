$repo = "boat-race-prediction"
$user = (gh api user --jq ".login" 2>&1)
Write-Host "GitHubユーザー: $user"

if (!(Test-Path ".git")) {
    git init
    git add .
    git commit -m "first commit"
    git branch -M main
    git remote add origin "https://github.com/$user/$repo.git"
}

gh repo create $repo --public --source=. --remote=origin --push 2>&1
gh api repos/$user/$repo/pages -X POST -f build_preset=legacy --field "source[branch]=main" --field "source[path]=/" 2>&1

$url = "https://$user.github.io/$repo"
Write-Host ""
Write-Host "デプロイ完了！" -ForegroundColor Green
Write-Host "URL: $url" -ForegroundColor Cyan
