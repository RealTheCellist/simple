param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [Parameter(Mandatory = $true)]
  [string]$Topic
)

$cleanTopic = ($Topic.ToLower() -replace "[^a-z0-9\-]", "-").Trim("-")
if ([string]::IsNullOrWhiteSpace($cleanTopic)) {
  Write-Error "Topic must contain at least one alphanumeric character."
  exit 1
}

$branch = "hotfix/v$Version-$cleanTopic"
Write-Host "Creating branch: $branch"
git checkout -b $branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Next recommended steps:"
Write-Host "1) Apply minimal fix"
Write-Host "2) npm run test"
Write-Host "3) npm run build"
Write-Host "4) npm run check:perf"
Write-Host "5) npm run check:smoke"
Write-Host "6) Update CHANGELOG and release note file"
