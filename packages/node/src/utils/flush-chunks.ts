export const usedChunks = new Set();
//@ts-ignore
global.usedChunks = usedChunks;

export const flushChunks = async () => {
  const allFlushed = await Promise.all(
    //@ts-ignore
    Array.from(usedChunks).map(async (chunk: any) => {
      const chunks = new Set();
      const [remote, request] = chunk.split('->');
      if (!global.__remote_scope__._config[remote]) {
        return;
      }
      // fetch the json file
      try {
        const statsFile = global.__remote_scope__._config[remote].replace(
          'remoteEntry.js',
          'federated-stats.json'
        );
        const stats = await fetch(statsFile).then(
          async (res) => await res.json()
        );
        chunks.add(
          global.__remote_scope__._config[remote].replace('ssr', 'chunks')
        );
        const [prefix] =
          global.__remote_scope__._config[remote].split('static/');
        if (stats.federatedModules) {
          stats.federatedModules.forEach((modules: any) => {
            if (modules.exposes?.[request]) {
              modules.exposes[request].forEach((chunk: any) => {
                Object.values(chunk).forEach((chunk) => {
                  //@ts-ignore
                  chunk.forEach((chunk: any) => {
                    chunks.add(prefix + chunk);
                  });
                });
              });
            }
          });
        }

        return Array.from(chunks);
      } catch (e) {
        console.log(e);
      }
    })
  );

  const dedupe = Array.from(new Set([...allFlushed.flat()]));

  usedChunks.clear();
  return dedupe.filter(Boolean);
};