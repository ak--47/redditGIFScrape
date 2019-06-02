// this also requires FFMPEG to be installed!
const puppeteer = require('puppeteer');
const {
    spawn,
    exec
} = require('child_process');


//default to r/oddlysatisfying
const config = {
    site: process.argv[2] || "https://www.reddit.com/r/oddlysatisfying/",
    numItems: process.argv[4] || 300,
    directory: process.argv[3] || "oddlysatisfyingGifs",
    delayForScroll: process.argv[5] || 250
}

//extract items from page
function extractItems() {
    const extractedElements = document.querySelectorAll('video source');
    const items = [];

    //only get m3u8 playlist files
    for (let element of extractedElements) {
        if (element.src.indexOf('m3u8') !== -1) {
            items.push(element.src);
        }
    }
    return items;
}

//scrape with infinite scrolling
async function scrapeInfiniteScrollItems(
    page,
    extractItems,
    itemTargetCount = 10000,
    scrollDelay = 5000
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

//do everything
(async() => {
    console.log('starting up... \n')
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.setViewport({
        width: 1280,
        height: 926
    });

    // Navigate to the demo page.
    await page.goto(config.site);
    console.log(`navigating to ${config.site}\n`)

    // Scroll and extract items from the page.
    //TO DO add scroll delay
    const urls = await scrapeInfiniteScrollItems(page, extractItems, config.numItems).catch((err) => console.log(err));
    console.log(`looked for ${config.numItems} videos... found ${urls.length} videos\n`)


    // remove directory in fetched, and create a new One
    exec(`rm -rf ./fetched/${config.directory};
        mkdir ./fetched/${config.directory};`)

    console.log(`now downloading ${urls.length} files to ~/Desktop/${config.directory}\n`)

    //use ffmpeg to download each item!
    // TODO: for some unknown reason, this is NOT being run on every item :(
    urls.forEach((url) => {
        let uniqueFileName = `./fetched/${config.directory}/${url.split("/").slice(-2, -1)[0]}.mp4`
        var child = spawn('ffmpeg', [`-hide_banner`, `-loglevel`, `panic`,`-protocol_whitelist`, `file,http,https,tcp,tls,crypto`, `-i`, `${url}`, `-c`, `copy`, uniqueFileName]);

        // for logging console output
        child.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });


        child.on('close', function(code) {
            if (code == 0) {
                console.log(`success!!! created ${uniqueFileName}`)
            } else {
                console.error('ERROR!\n')
                console.log('child process exited with code ' + code);
            }
        });


    })

    // Close the browser.
    await browser.close().then(() => console.log('browser closed'));
})();