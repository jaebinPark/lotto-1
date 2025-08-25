# Apply integration patch (anti v3 + overlays) for lotto_kr_lab_pro_v7 (keeps .git)
param([Parameter(Mandatory=$true)][string]$ZipPath)
$ErrorActionPreference = "Stop"
$root = Get-Location
$work = Join-Path $root "_patch_tmp_v7"
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Path $work | Out-Null

Copy-Item $ZipPath $work\
Expand-Archive -Path (Join-Path $work (Split-Path $ZipPath -Leaf)) -DestinationPath (Join-Path $work "extracted") -Force
Copy-Item -Recurse -Force (Join-Path $work "extracted\*") $root

# inject scripts into index.html once (after main.js)
$index = Join-Path $root "index.html"
if (Test-Path $index) {
  $html = Get-Content -Path $index -Raw -Encoding UTF8
  $marker = '<script type="module" src="./js/main.js?v={{BUILD}}"></script>'
  $inserts = @(
    '<script src="./js/patch.chip.util.js?v={{BUILD}}"></script>',
    '<script src="./js/patch.saved.highlight.js?v={{BUILD}}"></script>',
    '<script src="./js/patch.exclude.enhancer.js?v={{BUILD}}"></script>',
    '<script src="./js/patch.anti.v3.js?v={{BUILD}}"></script>',
    '<script src="./js/patch.results.range.badge.js?v={{BUILD}}"></script>'
  )
  foreach($line in $inserts){
    if ($html -notmatch [regex]::Escape($line)) {
      $html = $html -replace [regex]::Escape($marker), ($marker + "`r`n  " + $line)
    }
  }
  Set-Content -Path $index -Value $html -Encoding UTF8
}

Write-Host "✅ Patch integrated (chip/saved/exclude/anti v3 + badge)."
