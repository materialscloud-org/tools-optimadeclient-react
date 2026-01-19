export const corsProxies = [
  {
    name: "allorigins",
    urlRule: (targetUrl) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  },
  {
    name: "cors-optimade-science",
    urlRule: (targetUrl) => {
      const match = targetUrl.match(/^https?:\/\/(.+)$/);
      if (!match) throw new Error("Invalid URL for proxy");
      const [, hostAndPath] = match;
      return `https://cors.optimade.science/https/${hostAndPath}`;
    },
  },
  {
    name: "cors-anywhere",
    urlRule: (targetUrl) => `https://cors-anywhere.com/${targetUrl}`,
  },
];
