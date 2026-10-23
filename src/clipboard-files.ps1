param(
  [Parameter(Mandatory = $true)]
  [string]$Payload,

  [switch]$Cut
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms

try {
  $json = [System.Text.Encoding]::UTF8.GetString(
    [System.Convert]::FromBase64String($Payload)
  )
  $decoded = $json | ConvertFrom-Json
  $paths = @($decoded | Where-Object {
    $_ -is [string] -and
    -not [string]::IsNullOrWhiteSpace($_) -and
    (Test-Path -LiteralPath $_)
  })

  if ($paths.Count -eq 0) {
    exit 2
  }

  $files = New-Object System.Collections.Specialized.StringCollection

  foreach ($filePath in $paths) {
    [void]$files.Add($filePath)
  }

  $data = New-Object System.Windows.Forms.DataObject
  $data.SetFileDropList($files)
  $data.SetText(($paths -join "`r`n"))

  $effect = 1
  if ($Cut) {
    $effect = 2
  }

  $effectBytes = [System.BitConverter]::GetBytes([int]$effect)
  $effectStream = New-Object System.IO.MemoryStream(,$effectBytes)
  $data.SetData("Preferred DropEffect", $effectStream)

  [System.Windows.Forms.Clipboard]::SetDataObject($data, $true)
} catch {
  exit 1
} finally {
  if ($effectStream) { $effectStream.Dispose() }
}

exit 0
