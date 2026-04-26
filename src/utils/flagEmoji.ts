export const getFlagEmoji = (isoCode: string): string =>
  isoCode.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  );
