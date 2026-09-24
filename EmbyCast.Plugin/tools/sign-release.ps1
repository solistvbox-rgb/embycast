<#
.SYNOPSIS
    Generates the EmbyCast release signing key and signs release DLLs for the self-update
    signature check (see ReleaseSignature.cs).

.DESCRIPTION
    One-time setup:
      1. .\tools\sign-release.ps1 -GenerateKey -PrivateKeyPath "$HOME\embycast-release-key.xml"
         Keep that file private and backed up - NEVER commit it or upload it anywhere. Anyone
         holding it can publish updates every installed EmbyCast will accept; losing it means
         existing installs can only be updated manually.
      2. Paste the printed modulus into ReleaseSignature.PublicKeyModulus, bump the version,
         build, sign (step below) and release as usual.

    Every release, after building:
      .\tools\sign-release.ps1 -DllPath bin\Release\netstandard2.0\EmbyCast.Plugin.dll -PrivateKeyPath "$HOME\embycast-release-key.xml"
      -> upload BOTH EmbyCast.Plugin.dll and the created EmbyCast.Plugin.dll.sig to the GitHub
         release. Once a key is configured, a release without a valid .sig is refused by the
         plugin's "Install update" button.

    Scheme: RSA 3072, PKCS#1 v1.5 over SHA-256 of the DLL bytes, base64 in the .sig file.
    Works with Windows PowerShell 5.1 and PowerShell 7+.
#>
[CmdletBinding(DefaultParameterSetName = 'Sign')]
param(
    [Parameter(ParameterSetName = 'Generate', Mandatory = $true)]
    [switch]$GenerateKey,

    [Parameter(ParameterSetName = 'Sign', Mandatory = $true)]
    [string]$DllPath,

    [Parameter(Mandatory = $true)]
    [string]$PrivateKeyPath
)

$ErrorActionPreference = 'Stop'

function Get-FullPath([string]$path) {
    if ([System.IO.Path]::IsPathRooted($path)) { return $path }
    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $path))
}

function New-Rsa {
    # RSACng on Windows (supports SHA-256 signing on every .NET Framework 4.6+ build); plain
    # RSA.Create() elsewhere (PowerShell 7 on Linux/macOS).
    try { return New-Object System.Security.Cryptography.RSACng } catch { return [System.Security.Cryptography.RSA]::Create() }
}

$sha256 = [System.Security.Cryptography.HashAlgorithmName]::SHA256
$pkcs1 = [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
$keyPath = Get-FullPath $PrivateKeyPath

if ($GenerateKey) {
    if (Test-Path -LiteralPath $keyPath) {
        throw "Refusing to overwrite existing key file '$keyPath'. Delete it yourself if you really want a new key (existing installs would then reject your updates)."
    }
    $rsa = New-Rsa
    $rsa.KeySize = 3072
    [System.IO.File]::WriteAllText($keyPath, $rsa.ToXmlString($true))
    $pub = $rsa.ExportParameters($false)

    Write-Host "Private key written to: $keyPath" -ForegroundColor Green
    Write-Host "Keep it private and backed up. Do NOT commit it." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Paste into ReleaseSignature.cs:"
    Write-Host ("    private const string PublicKeyModulus = `"{0}`";" -f [Convert]::ToBase64String($pub.Modulus))
    Write-Host ("    private const string PublicKeyExponent = `"{0}`";" -f [Convert]::ToBase64String($pub.Exponent))
    return
}

$dll = Get-FullPath $DllPath
if (-not (Test-Path -LiteralPath $dll)) { throw "DLL not found: $dll" }
if (-not (Test-Path -LiteralPath $keyPath)) { throw "Private key not found: $keyPath" }

$rsa = New-Rsa
$rsa.FromXmlString([System.IO.File]::ReadAllText($keyPath))
$bytes = [System.IO.File]::ReadAllBytes($dll)
$signature = $rsa.SignData($bytes, $sha256, $pkcs1)

# Self-check with the public half only, exactly like the plugin does.
$verifier = New-Rsa
$verifier.ImportParameters($rsa.ExportParameters($false))
if (-not $verifier.VerifyData($bytes, $signature, $sha256, $pkcs1)) { throw "Self-verification of the new signature failed." }

$sigPath = "$dll.sig"
[System.IO.File]::WriteAllText($sigPath, [Convert]::ToBase64String($signature))

$hash = [BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)).Replace('-', '')
Write-Host "Signed:    $dll" -ForegroundColor Green
Write-Host "SHA-256:   $hash"
Write-Host "Signature: $sigPath"
Write-Host "Upload both files to the GitHub release."
