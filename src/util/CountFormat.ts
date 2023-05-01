export function countFormat(n: number): string {
    if (n < 0.1)
        return '0';
    else if (n < 1)
        return n.toFixed(1);
    else if (n < 1000)
        return n.toFixed(0);
    else if (n < 1000000)
        return (n / 1000).toFixed(0) + 'K';
    else if (n < 1000000000)
        return (n / 1000000).toFixed(0) + 'M';
    else
        return '!!!';
}