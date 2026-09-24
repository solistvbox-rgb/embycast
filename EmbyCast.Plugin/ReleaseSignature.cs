using System;
using System.Security.Cryptography;

namespace EmbyCast.Plugin
{
    /// <summary>
    /// Verifies that a downloaded update DLL was signed with the release key - the part of the
    /// self-update integrity check that a compromised GitHub account can NOT fake. The SHA-256
    /// digest checked in Plugin.InstallUpdateAsync comes from the same GitHub API response as
    /// the download itself, so an attacker with write access to the repo could replace both
    /// together; the private key behind the public key below never touches GitHub at all.
    ///
    /// Scheme: RSA (>= 2048 bit), PKCS#1 v1.5 signature over SHA-256 of the raw DLL bytes,
    /// uploaded base64-encoded as the release asset "EmbyCast.Plugin.dll.sig". Generate the key
    /// pair and sign releases with tools/sign-release.ps1 (see the comment at its top).
    ///
    /// Rollout: while PublicKeyModulus is empty, signatures are not required and the update
    /// behaves exactly as before (checksum only). Once a key is filled in and shipped, every
    /// later update MUST come with a valid .sig asset or it is refused - so fill it in only
    /// after tools/sign-release.ps1 is part of your release process. The first release that
    /// contains the key is itself still installed via the old checksum-only path.
    /// </summary>
    public static class ReleaseSignature
    {
        /// <summary>Base64 RSA modulus of the release public key (printed by
        /// tools/sign-release.ps1 -GenerateKey). Empty = signature check disabled.</summary>
        private const string PublicKeyModulus = "1iXfsbRZnx7XDvToTXWjQq0OYIIdYSiBTuhT7nqcSLmwFUnTAUtF9n3S4flYKFHFlRcfxcXU9FjHfbV76MPF9zHe42K2e9kUd+fn57F2PqnVOnt0adSlEVYTI89JPn2//yTtwLToBpGNoqIp9ntVGTQFhdbGKf8O4gtqgRuLSiYrpIrpj39utabbQLMB78VaQiE+mCVio+NisgKtSsuELB/YJ03iKrjreSS+RmdGAmaFbkwBTf1Ant7IWFSOcrLmrp/RFWA/umT5O252DDjhCkSu6RtiOmv1ABvQTRHI4aKJapnRo5B7VbEdbcsXJ7WrQinrrW2HpNs01s4WhNNzzojzFxDUfgLzOhziBqPHczk1BeqQBgHEpxbh2hcd29P7di5uXcwgirQnkAfnkNRxUMpDerXVGNVlHdG3Oobz/x81LIrVlIvMjzEgWD46Yjm7jDdnaBkUQqbAeR4hp3pwME6i1SYnLheAjpDxBs6Asn34c2krTm484zpCkFcc8Xh5";
        /// <summary>Base64 RSA public exponent (almost always "AQAB").</summary>
        private const string PublicKeyExponent = "AQAB";

        public const string SignatureAssetName = "EmbyCast.Plugin.dll.sig";

        private const int MinKeySizeBits = 2048;

        public static bool IsConfigured => !string.IsNullOrWhiteSpace(PublicKeyModulus);

        /// <summary>True only if <paramref name="signatureText"/> (base64, surrounding whitespace
        /// ignored) is a valid signature over <paramref name="data"/> for the configured key.
        /// Returns false - never throws - for a missing key, malformed input or a bad signature.</summary>
        public static bool Verify(byte[] data, string signatureText)
        {
            return Verify(data, signatureText, PublicKeyModulus, PublicKeyExponent);
        }

        internal static bool Verify(byte[] data, string signatureText, string modulusBase64, string exponentBase64)
        {
            if (data == null || string.IsNullOrWhiteSpace(signatureText) || string.IsNullOrWhiteSpace(modulusBase64))
                return false;
            try
            {
                var modulus = Convert.FromBase64String(modulusBase64.Trim());
                if (modulus.Length * 8 < MinKeySizeBits) return false;
                var signature = Convert.FromBase64String(signatureText.Trim());

                using (var rsa = RSA.Create())
                {
                    rsa.ImportParameters(new RSAParameters
                    {
                        Modulus = modulus,
                        Exponent = Convert.FromBase64String(exponentBase64.Trim())
                    });
                    return rsa.VerifyData(data, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
                }
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
