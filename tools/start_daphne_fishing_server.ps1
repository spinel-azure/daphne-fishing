param(
  [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WebRoot = Join-Path $ProjectRoot "daphne_fishing"

if (-not (Test-Path (Join-Path $WebRoot "index.html"))) {
  Write-Host "index.html was not found: $WebRoot" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

function Get-MimeType {
  param([string]$Path)
  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css"  { "text/css; charset=utf-8"; break }
    ".js"   { "application/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".png"  { "image/png"; break }
    ".jpg"  { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".gif"  { "image/gif"; break }
    ".webp" { "image/webp"; break }
    ".svg"  { "image/svg+xml"; break }
    ".woff" { "font/woff"; break }
    ".woff2"{ "font/woff2"; break }
    ".ttf"  { "font/ttf"; break }
    default { "application/octet-stream" }
  }
}

function Get-FreePort {
  param([int]$StartPort)
  for ($p = $StartPort; $p -lt ($StartPort + 20); $p++) {
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $p)
    try {
      $listener.Start()
      $listener.Stop()
      return $p
    } catch {
      try { $listener.Stop() } catch {}
    }
  }
  throw "No available port found from $StartPort."
}

$Port = Get-FreePort $Port
$Url = "http://127.0.0.1:$Port/"
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host ""
Write-Host "Daphne Fishing local server" -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Green
Write-Host "Root: $WebRoot"
Write-Host "Close this window to stop the server."
Write-Host ""

Start-Process $Url

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        $client.Close()
        continue
      }

      while (($line = $reader.ReadLine()) -ne $null -and $line.Length -gt 0) {}

      $parts = $requestLine.Split(" ")
      $method = $parts[0]
      $target = if ($parts.Length -gt 1) { $parts[1] } else { "/" }

      if ($method -ne "GET" -and $method -ne "HEAD") {
        $body = [Text.Encoding]::UTF8.GetBytes("405 Method Not Allowed")
        $header = "HTTP/1.1 405 Method Not Allowed`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $bytes = [Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($bytes, 0, $bytes.Length)
        if ($method -ne "HEAD") { $stream.Write($body, 0, $body.Length) }
        continue
      }

      $pathOnly = $target.Split("?")[0]
      $pathOnly = [Uri]::UnescapeDataString($pathOnly).Replace("/", [IO.Path]::DirectorySeparatorChar)
      if ($pathOnly -eq [IO.Path]::DirectorySeparatorChar) { $pathOnly = "index.html" }
      else { $pathOnly = $pathOnly.TrimStart([IO.Path]::DirectorySeparatorChar) }

      $fullPath = [IO.Path]::GetFullPath((Join-Path $WebRoot $pathOnly))
      $rootFullPath = [IO.Path]::GetFullPath($WebRoot)

      if (-not $fullPath.StartsWith($rootFullPath, [StringComparison]::OrdinalIgnoreCase)) {
        $body = [Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        $header = "HTTP/1.1 403 Forbidden`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $bytes = [Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($bytes, 0, $bytes.Length)
        if ($method -ne "HEAD") { $stream.Write($body, 0, $body.Length) }
        continue
      }

      if (-not (Test-Path $fullPath -PathType Leaf)) {
        $body = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $bytes = [Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($bytes, 0, $bytes.Length)
        if ($method -ne "HEAD") { $stream.Write($body, 0, $body.Length) }
        continue
      }

      $fileBytes = [IO.File]::ReadAllBytes($fullPath)
      $mime = Get-MimeType $fullPath
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($fileBytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
      $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($method -ne "HEAD") { $stream.Write($fileBytes, 0, $fileBytes.Length) }
    } catch {
      Write-Host $_.Exception.Message -ForegroundColor Yellow
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
