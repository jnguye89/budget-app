// money.ts
export function formatUSDFromCents(cents: number, locale = 'en-US') {
    if (!Number.isFinite(cents)) return '';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        // cents are exact, so 2 fraction digits is correct
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

// money.parse.ts
export function parseUSDToCents(
    input: string | number,
    opts: { allowRounding?: boolean } = {}
): number | null {
    const { allowRounding = false } = opts;

    // If a number is passed programmatically, avoid float drift by formatting to string
    if (typeof input === 'number') {
        // Convert to string with up to 15 digits and reuse the string path
        input = String(input);
    }

    if (typeof input !== 'string') return null;

    let s = input.trim();

    // Accounting negatives like "(1,234.56)"
    let negative = false;
    if (/^\(.*\)$/.test(s)) {
        negative = true;
        s = s.slice(1, -1);
    }

    // Explicit +/- sign
    if (s.startsWith('+')) s = s.slice(1);
    if (s.startsWith('-')) {
        negative = !negative ? true : false; // double-negatives become positive
        s = s.slice(1);
    }

    // Remove $ and commas and whitespace
    s = s.replace(/[\s$,]/g, '');

    // Now s should be digits with optional single dot
    if (!/^\d*(\.\d*)?$/.test(s)) return null;
    if (s === '' || s === '.') return null;

    const [wholeRaw, fracRaw = ''] = s.split('.');
    const whole = wholeRaw === '' ? '0' : wholeRaw; // ".99" => "0.99"

    if (fracRaw.length <= 2) {
        const cents =
            Number(whole) * 100 +
            Number((fracRaw + '00').slice(0, 2)); // pad to 2 digits
        return negative ? -cents : cents;
    }

    // More than 2 decimals → either reject or round
    if (!allowRounding) return null;

    // Round using string math (no float drift)
    const firstTwo = fracRaw.slice(0, 2);
    const rest = fracRaw.slice(2);
    let cents =
        Number(whole) * 100 +
        Number(firstTwo);
    // round half-up if third decimal >= 5
    if (rest[0] && rest[0] >= '5') {
        cents += 1;
    }
    return negative ? -cents : cents;
}
