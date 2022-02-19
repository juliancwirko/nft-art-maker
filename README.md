### NFT art maker v5.0

The primary task of this tool is to generate a randomized set of images from provided PNG layers and pack them into .car files. Then you can upload them to IPFS using [nft.storage](https://nft.storage/) or other tools.

**Please test it before using it for the real stuff. It can always be buggy.**

- PNG layers for testing: https://ipfs.io/ipfs/bafkreicwfzj7f3xc6mjkyaqknd4gsosscznelpiwdtwmdp773irwuv2lqu
- Latest walkthrough video: https://youtu.be/resGP6a7_34

#### Older versions (check changelog):
- [v4](https://github.com/juliancwirko/nft-art-maker/tree/v4.0.0)
- [v3](https://github.com/juliancwirko/nft-art-maker/tree/v3.0.0) | [Video for v3.0](https://youtu.be/MnRjOlT60nc)
- [v2](https://github.com/juliancwirko/nft-art-maker/tree/v2.2.2) | [Video for v2.0](https://youtu.be/A_Qw9SLVT6M)
- [v1](https://github.com/juliancwirko/nft-art-maker/tree/v1.0.1) | [Video for v1.0](https://youtu.be/uU10k6q79P8)

#### Based on:
- [HashLips art engine](https://github.com/HashLips/hashlips_art_engine) - only main functionality (output metadata schema should be suitable for most of the marketplaces)
- [Pixels to SVG](https://codepen.io/shshaw/pen/XbxvNj) - SVG code from images
- [SVGO](https://github.com/svg/svgo) - SVG optimization and base64 data uri generation
- [ipfs-car](https://github.com/web3-storage/ipfs-car) - optionally for handling ipfs .car archives

This lib is a customized and simplified version of the [HashLips art engine](https://github.com/HashLips/hashlips_art_engine). If you need more options and functionality, please use HashLips.

#### How to use it:
- minimum version of Node is **14.14.0**
- create a project directory -> `mkdir my-nft-collection ; cd my-nft-collection`
- in that directory, create the `layers` directory with all of your layers split into proper directories. Read more about it below.
- create a configuration file `.nftartmakerrc` (other file names also allowed, check out [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more info). This file should be a JSON formatted config file. You'll find all configuration options below.
- run `npx nft-art-maker generate` or if installed globally `nft-art-maker generate` - it will generate all files or encoded SVG with metadata json file for each, plus it will generate one big metadata file with all editions and provenance hash. Additionally, there is also an option to pack all images and metadata files into an ipfs car files. Then every CIDs will be also actual in metadata files.

You can always install it globally by `npm install nft-art-maker -g` and then use it like `nft-art-maker generate`.

Updating: when using npx, make sure that it takes the new version. You can always install it globally using `npm install nft-art-maker@latest -g`.

#### Additionally you can:
- generate a preview - run `npx nft-art-maker preview`
- you can also pack files using `npx nft-art-maker pack` (always recommended!) - this will pack all files using ipfs-car into one images.car and metadata.car files, which you can upload using services like nft.storage

**Basically, the tool offers two different outputs:**
1. png and metadata files packed into the ipfs .car files. Base image CID will be updated in all metadata files automatically after running `nft-art-maker pack` and base CID for metadata files will be added to the summary metadata json file.
2. (experimental) all data with encoded svgs in one big metadata.json file, without any additional files. This will be useful when you want to have non-standard on-chain only nfts. Be aware that the SVG output can be buggy on very complicated and big images. This experimental option is for small simple images, like pixel art etc.

nft-art-maker tool doesn't assume any way of uploading to ipfs, but I would recommend [nft.storage](https://nft.storage/) where you can upload whole .car file. They offer free pinning service and Filecoin storage. So even if you delete it there or nft.storage stops working for some reason, the data will persist. Of course, learn about it first. They have a friendly UI, but you can also use the CLI tool for that.

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
    },
    {
      "growEditionSizeTo": 110,
      "layersOrder": [{ "name": "pinkyFace" }, { "name": "head" }, { "name": "eyes" }]
    }
  ],
  "shuffleLayerConfigurations": false,
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
  "outputImagesCarFileName": "images.car",
  "outputMetadataCarFileName": "metadata.car",
  "editionNameFormat": "#",
  "tags": "tag1,tag2,tag3",
  "preview": {
    "thumbPerRow": 20,
    "thumbWidth": 60,
    "imageRatio": 1,
    "imageName": "preview.png"
  }
}
```

##### layers configuration

Every subdirectory in your `layers` directory should be named after the type of the layer, and inside, you should put your png files. The name structure should be as follows: `filename1#100.png`, where the `#100` is a rarity weight. Good explainer in Hashlips repo: [here](https://github.com/HashLips/hashlips_art_engine/issues/251#issuecomment-969911889).

##### shuffleLayerConfigurations

Enabled by default, but you can always enable it to shuffle items from different `layerConfigurations`.

##### Output type configuration

You can decide if you want to have encoded SVGs or standard PNGs files. Use `svgBase64DataOnly` setting. **Be aware** that these are totally separate use cases, not the option to choose the file format.

The example of output `metadata.json` file structure with empty values (this is one big file with all editions):

```json
{
  "editions": [
    {
      "name": "",
      "description": "",
      "edition": 0,
      "attributes": [
        {
          "trait_type": "",
          "value": ""
        }
      ],
      "base64SvgDataUri": "",
      "image": {
        "href": "",
        "hash": "",
        "ipfsUri": "",
        "ipfsCid": "",
        "fileName": ""
      }
    }
  ],
  "provenanceHash": "",
  "metadataFilesIpfsBaseCid": ""
}

```

The example of a single output metadata file (for example 1.json):

```json
{
  "name": "",
  "description": "",
  "edition": 0,
  "attributes": [
    {
      "trait_type": "",
      "value": ""
    }
  ],
  "base64SvgDataUri": "",
  "image": {
    "href": "",
    "hash": "",
    "ipfsUri": "",
    "ipfsCid": "",
    "fileName": ""
  }
}
```

**Important!**
Some of the `image` fields will be populated appropriately after running the `pack` command. All JSON files will get an update. They will be also updated in the final `metadata.car` file. This is why it is always recommended to use the `pack` command. But you can also update all paths with your own scripts.

**The example of an actual single metadata file**: https://ipfs.io/ipfs/bafybeied5z3gndksdmbeaqxgbxryax6xp27nqfj3wy7c5x3usrol4sngam/149.json (the image is just for tests, poor quality, but also generated using the tool, there is a whole collection of 200 pieces so that you can change numbers to preview them).

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

#### License

MIT

#### Contact

- [Twitter](https://twitter.com/JulianCwirko)
- [WWW](https://www.julian.io)
- [Elven Tools - Elrond blockchain NFT launches - Open Source tools](https://www.elven.tools)
