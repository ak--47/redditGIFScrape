// this also requires FFMPEG to be installed!
const puppeteer = require('puppeteer');
const cmd = require('node-cmd');


const config = {
    site: "https://www.reddit.com/r/oddlysatisfying/",
    numItems: 8,
    directory: "bar"
}


function extractItems() {
    const extractedElements = document.querySelectorAll('video source');
    const items = [];
    for (let element of extractedElements) {
        if (element.src.indexOf('m3u8') !== -1) {
            items.push(element.src);
        }
    }
    return items;
}

async function scrapeInfiniteScrollItems(
    page,
    extractItems,
    itemTargetCount = 10,
    scrollDelay = 500,
) {
    let items = [];
    try {
        let previousHeight;
        while (items.length < itemTargetCount) {
            items = await page.evaluate(extractItems);
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
            await page.waitFor(scrollDelay);
        }
    } catch (e) {}
    return items;
}

(async() => {
    // Set up browser and page.
    console.log('starting up... \n')
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });

    // Navigate to the demo page.
    await page.goto(config.site);
    console.log(`navigating to ${config.site}\n`)

    // Scroll and extract items from the page.
    const items = await scrapeInfiniteScrollItems(page, extractItems, config.numItems);

    console.log(`looked for ${config.numItems} videos... found ${items.length} videos\n`)
    cmd.get(`rm -rf ~/Desktop/${config.directory};
        mkdir ~/Desktop/${config.directory};`)
    console.log(`now downloading media to ~/Desktop/${config.directory}\n`)

    //then use ffmpeg to download each item!
    items.forEach((url) => {

        console.log(`fetching ${url}`);
        cmd.get(
            `ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -i ${url} -c copy ~/Desktop/${config.directory}/${url.split("/").slice(-2, -1)[0]}.mp4`,
            function(err, data, stderr) {
                console.log('got it!\n')
            }
        );

    })
    
    // Close the browser.
    await browser.close().then(()=> console.log('browser closed'));
})();