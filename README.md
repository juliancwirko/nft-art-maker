### NFT art maker

The tool generates a randomized set of images or encoded SVGs from provided PNG layers.

- [Quick demo (video)](https://youtu.be/uU10k6q79P8)

#### Based on:
- [HashLips art engine](https://github.com/HashLips/hashlips_art_engine) - only main functionality (output metadata.json is not standarized in any way)
- [Pixels to SVG](https://codepen.io/shshaw/pen/XbxvNj) - SVG code from images
- [SVGO](https://github.com/svg/svgo) - SVG optimization and base64 data uri generation

This lib is a customized and simplified version of the [HashLips art engine](https://github.com/HashLips/hashlips_art_engine). If you need more options and functionality, please use HashLips.

#### How to use it:
- create a project directory -> `mkdir my-nft-collection ; cd my-nft-collection`
- in that directory, create the `layers` directory with all of your layers split into proper directories
- create a configuration file `touch .nftartmakerrc` (other file names also allowed, check out [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more info). This file should be a JSON formatted config file. You'll find all configuration options below.
- run `npx nft-art-maker generate`
- you can also generate preview - run `npx nft-art-maker preview`

You can also install it globally by `npm install nft-art-maker -g` and then use it like `nft-art-maker generate`.

#### Configuration options

You should use the config file at least for layers configuration. But there are also other configuration options. Whole config example: 

```json
{
  "description": "Your collection name",
  "svgBase64DataOnly": true,
  "layerConfigurations": [
    {
      "growEditionSizeTo": 100,
      "layersOrder": [{ "name": "face" }, { "name": "head" }, { "name": "eyes" }]
    }
  ],
  "format": {
    "width": 20,
    "height": 20
  },
  "rarityDelimiter": "#",
  "uniqueDnaTorrance": 10000,
  "layersDirName": "layers",
  "outputDirName": "output",
  "outputJsonDirName": "json",
  "outputImagesDirName": "images",
  "outputJsonFileName": "metadata.json",
  "editionNameFormat": "#",
  "preview": {
    "thumbPerRow": 20,
    "thumbWidth": 60,
    "imageRatio": 1,
    "imageName": "preview.png"
  }
}
```

##### layers configuration

Every subdirectory in your `layers` directory should be named after the type of the layer, and inside, you should put your png files. The name structure should be as follows: `filename1#100.png`, which means this part isn't rare.

##### Output type configuration

You can decide if you want to have encoded SVGs or standard PNGs files. Use `svgBase64DataOnly` setting. This is what differentiates this library from HashLips.

The example of output `metadata.json` file structure with empty values:

```json
{
  "editions": [{
    "dna": "",
      "name": "",
      "description": "",
      "image": "",
      "edition": 0,
      "date": 0,
      "attributes": [
        {
          "trait_type": "",
          "value": ""
        },
      ]
  }],
  "provenanceHash": ''
}
```

##### Layers directory structure (example)

Here is an example of the `layers` directory structure with the configuration from the example above.

```bash
layers/
├── eyes
│   ├── eyes1#100.png
│   ├── eyes2#100.png
│   ├── eyes3#100.png
│   ├── eyes4#100.png
│   ├── eyes5#100.png
│   └── eyes6#100.png
├── face
│   ├── face1#100.png
│   ├── face2#100.png
│   ├── face3#100.png
│   ├── face4#100.png
│   └── face5#100.png
└── head
    ├── head1#100.png
    ├── head2#100.png
    ├── head3#100.png
    ├── head4#100.png
    ├── head5#100.png
    ├── head6#100.png
    ├── head7#100.png
    └── head8#100.png
```

#### How is it different?
- It uses sha256 instead of sha1 because it is also used as validation for downloaded images (PNG or SVG), and also it is used to generate the provenance hash of all hashes in order
- It has support for optimized SVGs generation and base64 encoding - ready for on-chain NFTs. But you can still switch to using standard PNG files.
- It is simplified. You can choose if you need real images or just encoded SVG in a JSON file.
- There is no functionality of blending.
- It generates only one output JSON file. You can incorporate it with your NFT minting process. I will work on an example with Elrond blockchain in separate tools.
- It is adjusted using TypeScript
- It is served as an NPM library

#### Why custom approach?
- I want to have a tool to be able to create my test workflows with Elrond blockchain
- The most crucial part was to get encoded SVGs
- I wanted to have only basic functionality, without blending modes, etc
- I also wanted it to be an npm cli tool
- I will probably improve it in the future. For now, it does what it should.

#### License

MIT

#### Contact

- [Twitter](https://twitter.com/JulianCwirko)
- [WWW](https://www.julian.io)
