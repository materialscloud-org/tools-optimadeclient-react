// a simple configuration file for polling cors workarounds.
// we deploy a tiny nginx workaround on cors.materialscloud.org, however this only allows origin on
// optimadeclient.materialscloud.io
export const corsProxies = [
  {
    name: "cors-materialscloud",
    urlRule: (targetUrl) => {
      return `https://cors.materialscloud.org/${targetUrl}`;
    },
  },
  // {
  //   name: "allorigins",
  //   urlRule: (targetUrl) =>
  //     `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  // },
  // {
  //   name: "cors-anywhere",
  //   urlRule: (targetUrl) => `https://cors-anywhere.com/${targetUrl}`,
  // },
];
