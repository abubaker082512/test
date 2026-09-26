async function inspectDirectPayJS() {
  try {
    const html = await (await fetch('https://payin-pwa.directpay.pro/pay')).text();
    console.log('HTML length:', html.length);
    const chunkMatches = html.match(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g);
    if (chunkMatches) {
      for (const m of chunkMatches) {
        const scriptPath = m.replace('src="', '').replace('"', '');
        const scriptUrl = `https://payin-pwa.directpay.pro${scriptPath}`;
        console.log('Fetching chunk:', scriptUrl);
        const code = await (await fetch(scriptUrl)).text();
        const apiMatches = code.match(/["'](\/api\/[^"']+)["']/g) || code.match(/["'](\/pay\/[^"']+)["']/g);
        if (apiMatches) {
          console.log('Found endpoints in', scriptPath, ':', Array.from(new Set(apiMatches)));
        }
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

inspectDirectPayJS();
