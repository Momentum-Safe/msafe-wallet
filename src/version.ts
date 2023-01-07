
/// Versions that introduces new features.
enum Version {
    ALLOWLIST = '2.0.5', // version that enable allowlist
};

/// Compare two version strings.
export function cmp(a: string, b: string): number {
    const parse = (version: string) => version.split('.').map(Number);
    const [majorA, minorA, batchA] = parse(a);
    const [majorB, minorB, batchB] = parse(b);
    if (majorA > majorB) return 1;
    if (majorA < majorB) return -1;
    if (minorA > minorB) return 1;
    if (minorA < minorB) return -1;
    if (batchA > batchB) return 1;
    if (batchA < batchB) return -1;
    return 0;
}

/// Check if the version is enable allowlist.
export function IsAllowList(version: string): boolean {
    return version !== undefined && cmp(version, Version.ALLOWLIST) >= 0;
}