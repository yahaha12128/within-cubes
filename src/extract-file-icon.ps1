param(
  [string]$TargetPath = "",
  [string]$IconPath = "",
  [int]$IconIndex = 0,
  [string]$ShortcutPath = ""
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class FileIconExtractor {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern uint PrivateExtractIcons(
    string lpszFile,
    int nIconIndex,
    int cxIcon,
    int cyIcon,
    IntPtr[] phicon,
    uint[] piconid,
    uint nIcons,
    uint flags
  );

  [DllImport("user32.dll")]
  public static extern bool DestroyIcon(IntPtr hIcon);
}
"@

function Convert-IconHandleToBase64 {
  param([IntPtr]$Handle)

  if ($Handle -eq [IntPtr]::Zero) {
    return $null
  }

  $icon = $null
  $bitmap = $null
  $stream = $null

  try {
    $icon = [System.Drawing.Icon]::FromHandle($Handle)
    $bitmap = $icon.ToBitmap()
    $stream = New-Object System.IO.MemoryStream
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    return [Convert]::ToBase64String($stream.ToArray())
  } catch {
    return $null
  } finally {
    if ($stream) { $stream.Dispose() }
    if ($bitmap) { $bitmap.Dispose() }
    if ($icon) { $icon.Dispose() }
  }
}

function Extract-IconFileBase64 {
  param(
    [string]$FilePath,
    [int]$Index
  )

  if ([string]::IsNullOrWhiteSpace($FilePath)) {
    return $null
  }

  if (-not [System.IO.File]::Exists($FilePath)) {
    return $null
  }

  foreach ($size in @(256, 128, 64, 48, 32)) {
    $handles = New-Object IntPtr[] 1
    $ids = New-Object UInt32[] 1

    try {
      $count = [FileIconExtractor]::PrivateExtractIcons(
        $FilePath,
        $Index,
        $size,
        $size,
        $handles,
        $ids,
        1,
        0
      )

      if ($count -gt 0 -and $handles[0] -ne [IntPtr]::Zero) {
        $encoded = Convert-IconHandleToBase64 -Handle $handles[0]

        if ($encoded) {
          return $encoded
        }
      }
    } catch {
      # Try the next size or candidate.
    } finally {
      if ($handles[0] -ne [IntPtr]::Zero) {
        [void][FileIconExtractor]::DestroyIcon($handles[0])
      }
    }
  }

  return $null
}

$candidates = @(
  @{ Path = $TargetPath; Index = 0 },
  @{ Path = $IconPath; Index = $IconIndex },
  @{ Path = $ShortcutPath; Index = 0 }
)

foreach ($candidate in $candidates) {
  $base64 = Extract-IconFileBase64 -FilePath $candidate.Path -Index $candidate.Index

  if ($base64) {
    [Console]::Out.Write($base64)
    exit 0
  }
}

exit 1
