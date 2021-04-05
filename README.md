# Kaifū

Kaifū is an easy-to-use command-line tool to grab and unpack SourceMap files.

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

Kaifū means "unboxing" in Japanese.

MIT &copy; Nikolay Solovyov
