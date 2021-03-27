# Kaifū

Kaifū is an easy-to-use command-line tool to grab and unpack SourceMap files.

![output](https://user-images.githubusercontent.com/1009876/112725572-f57d6900-8f29-11eb-8d52-f3af0fc6772b.gif)

```bash
npm install -g kaifu
```

```text
Usage: kaifu [options...] <url|file|directory>
   -o,  --output-dir <dir>   Output directory.
   -w,  --overwrite          Overwrite files if already exist.
   -s,  --skip-empty         Don't create a file if it's empty.
        --short              Short summary.
   -v,  --verbose            Show everything.
        --version            Show current version.
   
Examples:
   kaifu --output-dir ./github https://github.com/
```

Kaifū means "unboxing" in Japanese.

MIT &copy; Nikolay Solovyov
