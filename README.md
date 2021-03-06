# KaifÅ«

Easy-to-use command-line tool to grab and unpack SourceMap files.

### Installation

```bash
npm install -g kaifu
```

### Usage
```text
Usage: kaifu [options...] <url|file|directory>
   -o,  --output-dir <dir>   Output directory
   -m,  --merge              Unsafe merge all unboxed trees in one folder
   -s,  --short              Short summary
   -v,  --verbose            Make the operation more talkative
   -q,  --quiet              Make the operation less talkative
        --skip-empty         Do not unbox empty files
        --version            Show version number and exit
   
Examples:
   kaifu --output-dir ./mdn https://developer.mozilla.org/
```
### Preview
```
$ npx kaifu --merge --output-dir ./ngrok http://6f0f744027c8.ngrok.io

Loading resources:

 â¸ http://6f0f744027c8.ngrok.io/
 â¸ http://6f0f744027c8.ngrok.io/index.js
 â¸ http://6f0f744027c8.ngrok.io/index.js.map

Unboxing resources:

 ð¦ http://6f0f744027c8.ngrok.io/index.js.map
 ââ node_modules
 â  ââ preact
 â  â  ââ compat
 â  â  â  ââ dist
 â  â  â     ââ compat.mjs [8778 bytes]
 â  â  ââ dist
 â  â  â  ââ preact.mjs [10097 bytes]
 â  â  ââ hooks
 â  â     ââ dist
 â  â        ââ hooks.mjs [2641 bytes]
 â  ââ wouter
 â  â  ââ index.js [4772 bytes]
 â  â  ââ matcher.js [2073 bytes]
 â  â  ââ use-location.js [2986 bytes]
 â  ââ zustand
 â     ââ index.js [4202 bytes]
 ââ src
    ââ api
    â  ââ client.js [1189 bytes]
    ââ pages
    â  ââ AuthPage
    â  â  ââ index.jsx [84 bytes]
    â  ââ DashboardPage
    â     ââ index.jsx [673 bytes]
    â     ââ store.js [620 bytes]
    ââ utils
    â  ââ useWillUnmount.js [136 bytes]
    ââ App.jsx [560 bytes]
    ââ index.jsx [150 bytes]

1 sourcemap file found, 14 files unboxed.
```

### Short version preview

```
$ kaifu --merge --short --output-dir ./mdn https://developer.mozilla.org/

Loading resources:
 â¸ https://developer.mozilla.org/static/js/runtime-main.bcb5cedd.js.map
 â¸ https://developer.mozilla.org/static/js/2.b0186e16.chunk.js.map
 â¸ https://developer.mozilla.org/static/js/main.e2b366ea.chunk.js.map
 â¸ https://developer.mozilla.org/static/css/main.e7962908.chunk.css.map

Unboxing resources:
 â¸ runtime-main.bcb5cedd.js.map â ./mdn [1 file]
 â¸ 2.b0186e16.chunk.js.map â ./mdn [39 files]
 â¸ main.e2b366ea.chunk.js.map â ./mdn [41 files]
 â¸ main.e7962908.chunk.css.map â ./mdn [71 files]

4 sourcemap files found, 152 files unboxed.
```

KaifÅ« means "unboxing" in Japanese.

MIT &copy; Nikolay Solovyov
