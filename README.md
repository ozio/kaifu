# Kaifū

An easy-to-use command-line tool to grab and unpack SourceMap files.

```bash
npm install -g kaifu
```

```text
Usage: kaifu [options...] <url|file|directory>
   -o,  --output-dir <dir>   Output directory.
   -w,  --overwrite          Overwrite files if already exist.
   -s,  --skip-empty         Don't create a file if it's empty.
   -m,  --merge              Unsafe merge all recovered trees in one folder.
        --short              Short summary.
   -v,  --verbose            Show everything.
        --version            Show current version.
   
Examples:
   kaifu --output-dir ./mdn https://developer.mozilla.org/
```

```
$ npx kaifu --merge --output-dir ./ngrok http://6f0f744027c8.ngrok.io

Kaifū v1.2.0

Loading resources:

 ▸ http://6f0f744027c8.ngrok.io/
 ▸ http://6f0f744027c8.ngrok.io/index.js
 ▸ http://6f0f744027c8.ngrok.io/index.js.map

Unboxing Source Maps files:

 📦 http://6f0f744027c8.ngrok.io/index.js.map
 ├─ node_modules
 │  ├─ preact
 │  │  ├─ compat
 │  │  │  └─ dist
 │  │  │     └─ compat.mjs [8778 bytes]
 │  │  ├─ dist
 │  │  │  └─ preact.mjs [10097 bytes]
 │  │  └─ hooks
 │  │     └─ dist
 │  │        └─ hooks.mjs [2641 bytes]
 │  ├─ wouter
 │  │  ├─ index.js [4772 bytes]
 │  │  ├─ matcher.js [2073 bytes]
 │  │  └─ use-location.js [2986 bytes]
 │  └─ zustand
 │     └─ index.js [4202 bytes]
 └─ src
    ├─ api
    │  └─ client.js [1189 bytes]
    ├─ pages
    │  ├─ AuthPage
    │  │  └─ index.jsx [84 bytes]
    │  └─ DashboardPage
    │     ├─ index.jsx [673 bytes]
    │     └─ store.js [620 bytes]
    ├─ utils
    │  └─ useWillUnmount.js [136 bytes]
    ├─ App.jsx [560 bytes]
    └─ index.jsx [150 bytes]

1 sourcemap file found, 14 files unboxed.
```

Kaifū means "unboxing" in Japanese.

MIT &copy; Nikolay Solovyov
