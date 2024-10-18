import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { execa } from 'execa';
import stripAnsi from 'strip-ansi';
import http from 'http';

describe('CLI Integration Test', () => {
  let server
  let port = 9999

  const outputPaths = [
    './output',
    './output-merge',
    './output-no-merge',
    './output-quiet',
    './output-skip-empty',
    './output-no-skip-empty',
    './custom-output',
    './existing-output'
  ];

  beforeEach(() => {
    // Cleanup all potential outputs before each test
    outputPaths.forEach(outputPath => {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
      }
    });
  });

  afterEach(() => {
    // Ensure cleanup after each test
    outputPaths.forEach(outputPath => {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
      }
    });
    if (fs.existsSync('./test.map')) {
      fs.unlinkSync('./test.map');
    }
    if (fs.existsSync('./input-merge')) {
      fs.rmSync('./input-merge', { recursive: true, force: true });
    }
  });

  describe('Basic Commands', () => {
    it('should display message when no arguments are provided', async () => {
      try {
        await execa('node', ['./kaifu.mjs']);
      } catch (e) {
        expect(e.message).to.include('No input specified.');
      }
    });

    it('should display help message when --help flag is provided', async () => {
      const { stdout } = await execa('node', ['./kaifu.mjs', '--help']);
      expect(stdout).to.include('Usage: kaifu [options...] <url|file|directory>');
    });

    it('should process a local sourcemap file', async () => {
      // Prepare a mock sourcemap file
      fs.writeFileSync('./test.map', '{"version":3,"sources":["test.js"],"names":[],"mappings":"","file":"out.js","sourceRoot":""}');

      await execa('node', ['./kaifu.mjs', '-o', './output', '-m', './test.map']);

      const outputExists = fs.existsSync('./output/test.js');
      expect(outputExists).to.be.true;
    });
  });

  describe('--merge flag', () => {
    it('should merge all files into a single folder when --merge flag is used', async () => {
      // Prepare a mock sourcemap file with duplicate filenames in different paths
      const sourcemapSrcContent = JSON.stringify({
        version: 3,
        sources: ['src/common.js'],
        names: [],
        mappings: '',
        file: 'out.js',
        sourceRoot: '',
        sourcesContent: ['console.log("src");'],
      });

      const sourcemapLibContent = JSON.stringify({
        version: 3,
        sources: ['lib/common.js'],
        names: [],
        mappings: '',
        file: 'out.js',
        sourceRoot: '',
        sourcesContent: ['console.log("lib");'],
      });

      fs.mkdirSync('./input-merge');

      fs.writeFileSync('./input-merge/src.map', sourcemapSrcContent);
      fs.writeFileSync('./input-merge/lib.map', sourcemapLibContent);

      // Run the utility with --merge flag
      await execa('node', ['./kaifu.mjs', '-o', './output-merge', '--merge', './input-merge']);

      // Check that the output directory contains one common.js file (overwritten)
      const outputFiles = fs.readdirSync('./output-merge');
      expect(outputFiles)
        .to
        .include('src');
      expect(outputFiles)
        .to
        .include('lib');
      // expect(outputFiles).to.include('common.js');

      // Read the content of common.js to see which one it is
      const srcJsContent = fs.readFileSync('./output-merge/src/common.js', 'utf-8');
      expect(srcJsContent)
        .to
        .equal('console.log("src");');

      const libJsContent = fs.readFileSync('./output-merge/lib/common.js', 'utf-8');
      expect(libJsContent)
        .to
        .equal('console.log("lib");');
    });

    it('should keep files in separate folders when --merge flag is not used', async () => {
      // Prepare a mock sourcemap file with duplicate filenames in different paths
      const sourcemapContent = JSON.stringify({
        version: 3,
        sources: ['src/common.js', 'lib/common.js'],
        names: [],
        mappings: '',
        file: 'out.js',
        sourceRoot: '',
        sourcesContent: ['console.log("src");', 'console.log("lib");'],
      });

      fs.writeFileSync('./test.map', sourcemapContent);

      // Run the utility without --merge flag
      await execa('node', ['./kaifu.mjs', '-o', './output-no-merge', './test.map']);

      // Since by default, the output would be in a folder named 'test.map__unboxed'
      const unboxedDirPath = path.join('./output-no-merge', "test.map__unboxed");

      // Now check the files inside unboxedDirPath
      const unboxedFiles = fs.readdirSync(unboxedDirPath);

      // Should include 'src' and 'lib' directories
      expect(unboxedFiles)
        .to
        .include('src');
      expect(unboxedFiles)
        .to
        .include('lib');

      const srcFiles = fs.readdirSync(path.join(unboxedDirPath, 'src'));
      expect(srcFiles)
        .to
        .include('common.js');
      const srcContent = fs.readFileSync(path.join(unboxedDirPath, 'src', 'common.js'), 'utf-8');
      expect(srcContent)
        .to
        .equal('console.log("src");');

      const libFiles = fs.readdirSync(path.join(unboxedDirPath, 'lib'));
      expect(libFiles)
        .to
        .include('common.js');
      const libContent = fs.readFileSync(path.join(unboxedDirPath, 'lib', 'common.js'), 'utf-8');
      expect(libContent)
        .to
        .equal('console.log("lib");');
    });
  });

  describe('--quiet flag', () => {
    it('should suppress most output when --quiet flag is used', async () => {
      // Prepare a mock sourcemap file
      fs.writeFileSync(
        './test.map',
        '{"version":3,"sources":["test.js"],"names":[],"mappings":"","file":"out.js","sourceRoot":"","sourcesContent":["console.log(\'test\');"]}'
      );

      // Run the utility with --quiet flag
      const { stdout, stderr } = await execa('node', ['./kaifu.mjs', '-o', './output-quiet', '--quiet', './test.map']);

      // Check that stdout and stderr are minimal
      expect(stdout)
        .to
        .equal('');
      expect(stderr)
        .to
        .equal('');

      // Verify the output file exists
      const outputExists = fs.existsSync('./output-quiet');
      expect(outputExists).to.be.true;
    });
  });

  describe('--skip-empty flag', () => {
    it('should skip empty files when --skip-empty flag is used', async () => {
      // Prepare a mock sourcemap file with empty source content
      const sourcemapContent = JSON.stringify({
        version: 3,
        sources: ['empty.js', 'non-empty.js'],
        names: [],
        mappings: '',
        file: 'out.js',
        sourceRoot: '',
        sourcesContent: ['', 'console.log("not empty");'],
      });

      fs.writeFileSync('./test.map', sourcemapContent);

      // Run the utility with --skip-empty flag
      await execa('node', ['./kaifu.mjs', '-o', './output-skip-empty', '--skip-empty', './test.map']);

      // Check that non-empty.js exists and empty.js does not
      const outputFiles = fs.readdirSync('./output-skip-empty');
      const unboxedDirName = outputFiles[0];
      const unboxedDirPath = path.join('./output-skip-empty', unboxedDirName);
      const unboxedFiles = fs.readdirSync(unboxedDirPath);

      expect(unboxedFiles)
        .to
        .include('non-empty.js');
      expect(unboxedFiles)
        .to
        .not
        .include('empty.js');
    });

    it('should unpack empty files when --skip-empty flag is not used', async () => {
      // Prepare a mock sourcemap file with empty source content
      const sourcemapContent = JSON.stringify({
        version: 3,
        sources: ['empty.js', 'non-empty.js'],
        names: [],
        mappings: '',
        file: 'out.js',
        sourceRoot: '',
        sourcesContent: ['', 'console.log("not empty");'],
      });

      fs.writeFileSync('./test.map', sourcemapContent);

      // Run the utility without --skip-empty flag
      await execa('node', ['./kaifu.mjs', '-o', './output-no-skip-empty', './test.map']);

      // Check that both files exist
      const outputFiles = fs.readdirSync('./output-no-skip-empty');
      const unboxedDirName = outputFiles[0];
      const unboxedDirPath = path.join('./output-no-skip-empty', unboxedDirName);
      const unboxedFiles = fs.readdirSync(unboxedDirPath);

      expect(unboxedFiles)
        .to
        .include('empty.js');
      expect(unboxedFiles)
        .to
        .include('non-empty.js');
    });
  });

  describe('--output-dir flag', () => {
    it('should output files to the specified directory when --output-dir flag is used', async () => {
      // Prepare a mock sourcemap file
      fs.writeFileSync(
        './test.map',
        '{"version":3,"sources":["test.js"],"names":[],"mappings":"","file":"out.js","sourceRoot":"","sourcesContent":["console.log(\'test\');"]}'
      );

      // Run the utility with --output-dir flag
      await execa('node', ['./kaifu.mjs', '--output-dir', './custom-output', './test.map']);

      // Check that the output directory contains the expected files
      const outputExists = fs.existsSync('./custom-output');
      expect(outputExists).to.be.true;

      // Since the utility may create a subdirectory for the unboxed files
      const outputDirContent = fs.readdirSync('./custom-output');
      expect(outputDirContent.length)
        .to
        .be
        .greaterThan(0);
    });

    it('should throw an error if the output directory already exists and --overwrite flag is not used', async () => {
      // Prepare a mock sourcemap file
      fs.writeFileSync(
        './test.map',
        '{"version":3,"sources":["test.js"],"names":[],"mappings":"","file":"out.js","sourceRoot":"","sourcesContent":["console.log(\'test\');"]}'
      );

      // Create the output directory to simulate existing directory
      fs.mkdirSync('./existing-output');

      // Run the utility with --output-dir flag
      try {
        await execa('node', ['./kaifu.mjs', '--output-dir', './existing-output', './test.map']);
        throw new Error('Expected error was not thrown');
      } catch (e) {
        // Cleanup
        expect(e.message)
          .to
          .include("Error accessing output directory: Directory or file");
        expect(e.message)
          .to
          .include("already exists");
      }
    });
  });

  describe('--short flag', () => {
    it('should display a short summary when --short is used', async () => {
      // Prepare a mock sourcemap file
      const sourcemapContent = '{"version":3,"sources":["test.js"],"names":[],"mappings":"","file":"out.js","sourceRoot":"","sourcesContent":["console.log(\'Hello, World!\');"]}';
      fs.writeFileSync('./test.map', sourcemapContent);

      const { stdout } = await execa('node', ['./kaifu.mjs', '--short', '-o', './output', './test.map']);

      const cleanedOutput = stripAnsi(stdout);

      // Since --short is used, the output should contain a concise summary
      expect(cleanedOutput)
        .to
        .match(/^\s*▸ test\.map → .+ \[1 file\]/m);
    });
  })

  describe('Server processing', () => {
    before((done) => {
      const files = {
        'index.html': '<script src="test.js"></script>',
        'test.js': `//# sourceMappingURL=http://localhost:${port}/test.map`,
        'test.map': '{"version":3,"sources":["test.js"],"names":[],"mappings":"","file":"out.js","sourceRoot":"","sourcesContent":["console.log(\'Hello, World!\');"]}',
      };

      server = http.createServer((req, res) => {
        const fileName = path.basename(req.url);
        if (files[fileName]) {
          if (fileName === 'index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
          } else if (fileName === 'test.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
          }
          res.end(files[fileName]);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
        }
      });

      server.listen(port, done);
    })

    after((done) => {
      // Stop the server after tests in this block are done
      server.close(done);
    });

    it('should process a sourcemap file from an HTTP server', async () => {
      // Fetch and process a sourcemap file from the mock server
      await execa('node', ['./kaifu.mjs', '-o', './output', '-sm', `http://localhost:${port}/index.html`]);

      const outputExists = fs.existsSync('./output/test.js');
      expect(outputExists).to.be.true;
    });
  })
});
