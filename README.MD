# Reddit Video Scraper
by AK

This is a small module to take a subreddit and download all GIFs and Videos as MP4. It makes use of Puppeteer, FFMPEG, and Node.

### Installation

Module requires [Node.js](https://nodejs.org/) v4+, [Puppeteer](https://github.com/GoogleChrome/puppeteer) (bundles) AND [ffmpeg](https://formulae.brew.sh/formula/ffmpeg) to run.

Clone the repo; install the dependencies:

```sh
$ git clone https://github.com/ak--47/redditGIFScrape
$ npm install
```

### Usage

Script takes 4 (optional) arguments

```sh
$ node index.js [reddit url] [folder to download to] [num of Videos] [timeout (for scrolling)]
```
example:
```sh
$ node index.js https://www.reddit.com/r/oddlysatisfying/ oddlySatisfying 200 250
```

files will be place on in the `./fetched/{{folder to download to}}` directory when script is complete
