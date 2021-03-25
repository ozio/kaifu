Kaifū
-----

Kaifū is an easy-to-use command-line tool to grab and unpack SourceMap files.

Kaifū means "unboxing" in Japanese.

## Installation

```bash
npm install -g kaifu
```

## Usage 

```text
█▄▀ ▄▀█ █ █▀▀ █░█
█░█ █▀█ █ █▀░ █▄█

Usage: kaifu [options...] <url|file|directory>
   -o,  --output-dir <dir>   Output directory.
   -z,  --zip <file>         Put unpacked sources to zip-archive.
   -w,  --overwrite          Overwrite files if already exist.
   -s,  --skip-empty         Don't create a file if sourcemap is empty.
   -l,  --list <file>        Use a list of several inputs.
        --verbose            Show everything.
   -v,  --version
   
Examples:
   kaifu --output-dir ./reddit https://reddit.com
```

MIT &copy; Nikolay Solovyov
