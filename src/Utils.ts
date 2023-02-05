export const findUrl = (description: string) => {
    const urlRegex = /(https?:\/\/[^ ]*)/g;
    const match = description.match(urlRegex);
    return match ? match[match.length - 1] : '';
}
