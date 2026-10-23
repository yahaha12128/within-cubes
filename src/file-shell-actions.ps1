param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("properties", "runas", "pinQuickAccess", "unpinQuickAccess")]
  [string]$Action,

  [Parameter(Mandatory = $true)]
  [string]$FilePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $FilePath)) {
  exit 2
}

$fullPath = [System.IO.Path]::GetFullPath($FilePath)
$shell = $null

try {
  switch ($Action) {
    "properties" {
      $parent = [System.IO.Path]::GetDirectoryName($fullPath)
      $leaf = [System.IO.Path]::GetFileName($fullPath)

      if ([string]::IsNullOrWhiteSpace($parent) -or [string]::IsNullOrWhiteSpace($leaf)) {
        exit 3
      }

      $shell = New-Object -ComObject Shell.Application
      $folder = $shell.Namespace($parent)

      if (-not $folder) {
        exit 4
      }

      $item = $folder.ParseName($leaf)

      if (-not $item) {
        exit 5
      }

      $item.InvokeVerb("properties")
    }

    "runas" {
      Start-Process -FilePath $fullPath -Verb RunAs
    }

    "pinQuickAccess" {
      $shell = New-Object -ComObject Shell.Application
      $folder = $shell.Namespace($fullPath)

      if (-not $folder) {
        exit 6
      }

      $folder.Self.InvokeVerb("pintohome")
    }

    "unpinQuickAccess" {
      $shell = New-Object -ComObject Shell.Application
      $quickAccess = $shell.Namespace(
        "shell:::{679f85cb-0220-4080-b29b-5540cc05aab6}"
      )

      if (-not $quickAccess) {
        exit 7
      }

      $removed = $false

      foreach ($item in @($quickAccess.Items())) {
        if ([string]::Equals(
          $item.Path,
          $fullPath,
          [System.StringComparison]::OrdinalIgnoreCase
        )) {
          $item.InvokeVerb("unpinfromhome")
          $removed = $true
        }
      }

      if (-not $removed) {
        exit 8
      }
    }
  }
} catch {
  exit 1
} finally {
  if ($shell) {
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($shell)
  }
}

exit 0
