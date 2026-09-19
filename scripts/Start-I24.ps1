
param(
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BaseUrl = "http://localhost:$Port/"
$CRLF = [Environment]::NewLine

function Get-MimeType([string]$Path) {
  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".js"   { "text/javascript; charset=utf-8" }
    ".css"  { "text/css; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".svg"  { "image/svg+xml" }
    ".png"  { "image/png" }
    ".jpg"  { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".ico"  { "image/x-icon" }
    default { "application/octet-stream" }
  }
}

function Send-Response($Stream, [int]$Status, [string]$Reason, [string]$ContentType, [byte[]]$Body, [bool]$HeadOnly = $false) {
  $header =
    "HTTP/1.1 $Status $Reason" + $CRLF +
    "Content-Type: $ContentType" + $CRLF +
    "Content-Length: $($Body.Length)" + $CRLF +
    "Cache-Control: no-store" + $CRLF +
    "X-Content-Type-Options: nosniff" + $CRLF +
    "Referrer-Policy: no-referrer" + $CRLF +
    "Connection: close" + $CRLF + $CRLF
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly) { $Stream.Write($Body, 0, $Body.Length) }
}

$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host ""
Write-Host "CREABUNDALO I24 LOCAL" -ForegroundColor Cyan
Write-Host "Open: $($BaseUrl)branch-ui.html"
Write-Host "Laat dit venster open. Ctrl+C stopt I24." -ForegroundColor Yellow
Write-Host "Scaleway cloud-sync werkt lokaal pas wanneer de API-backend apart draait." -ForegroundColor DarkYellow
Write-Host ""

Start-Process "$($BaseUrl)branch-ui.html"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }

      $parts = $requestLine.Split(" ")
      $method = $parts[0]
      $rawPath = $parts[1]
      $headOnly = ($method -eq "HEAD")

      if ($method -ne "GET" -and $method -ne "HEAD") {
        Send-Response $stream 405 "Method Not Allowed" "text/plain; charset=utf-8" ([Text.Encoding]::UTF8.GetBytes("Method Not Allowed")) $headOnly
        continue
      }

      $pathOnly = $rawPath.Split("?")[0]
      $decoded = [Uri]::UnescapeDataString($pathOnly).TrimStart("/")
      if ([string]::IsNullOrWhiteSpace($decoded)) { $decoded = "branch-ui.html" }

      if ($decoded.StartsWith("api/")) {
        $body = [Text.Encoding]::UTF8.GetBytes('{"error":"LOCAL_STATIC_MODE","message":"Scaleway API backend is not running locally."}')
        Send-Response $stream 503 "Service Unavailable" "application/json; charset=utf-8" $body $headOnly
        continue
      }

      $candidate = [IO.Path]::GetFullPath((Join-Path $Root $decoded))
      if (-not $candidate.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $candidate -PathType Leaf)) {
        Send-Response $stream 404 "Not Found" "text/plain; charset=utf-8" ([Text.Encoding]::UTF8.GetBytes("Not Found")) $headOnly
        continue
      }

      $bytes = [IO.File]::ReadAllBytes($candidate)
      Send-Response $stream 200 "OK" (Get-MimeType $candidate) $bytes $headOnly
    }
    catch {
      Write-Host "Request error: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
      $client.Close()
    }
  }
}
finally {
  $listener.Stop()
}
