### NFT art maker 3.0 (Work in progress)

The tool generates a randomized set of images or encoded SVGs from provided PNG layers.

**Please test it before using it for the real stuff. It can always be buggy, and blockchain doesn't forget anything.**

#### Older versions:
- [v2](https://github.com/juliancwirko/nft-art-maker/tree/v2.2.2) [Video for v2.0](https://youtu.be/A_Qw9SLVT6M)
- [v1](https://github.com/juliancwirko/nft-art-maker/tree/v1.0.1) [Video for v1.0](https://youtu.be/uU10k6q79P8)

#### Based on:
- [HashLips art engine](https://github.com/HashLips/hashlips_art_engine) - only main functionality (output metadata.json is not standarized in any way)
- [Pixels to SVG](https://codepen.io/shshaw/pen/XbxvNj) - SVG code from images
- [SVGO](https://github.com/svg/svgo) - SVG optimization and base64 data uri generation
- [ipfs-car](https://github.com/web3-storage/ipfs-car) - optionally for handling ipfs .car archives

This lib is a customized and simplified version of the [HashLips art engine](https://github.com/HashLips/hashlips_art_engine). If you need more options and functionality, please use HashLips.

#### How to use it:
- minimum version of Node is **14.14.0**, doesn't work on v17 yet
- create a project directory -> `mkdir my-nft-collection ; cd my-nft-collection`
- in that directory, create the `layers` directory with all of your layers split into proper directories
- create a configuration file `.nftartmakerrc` (other file names also allowed, check out [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more info). This file should be a JSON formatted config file. You'll find all configuration options below.
- run `npx nft-art-maker generate` - it will generate all files or encoded SVG, plus it will generate one big metadata file with all editions and provenance hash. This is helpful for further use with nft minters—tools that can iterate through it. Additionally, there is also an option to pack all images into an ipfs car file and also generate metadata.json files for each of them with updated ipfs paths to files. And also pack these metadata files. See below.

You can always install it globally by `npm install nft-art-maker -g` and then use it like `nft-art-maker generate`.

Updating: when using npx, make sure that it takes the new version. You can always install it globally using `npm install nft-art-maker@latest -g`.

#### Additionally you can:
- generate a preview - run `npx nft-art-maker preview`
- you can also pack files using `npx nft-art-maker pack` - this will pack all files using ipfs-car, iterate through CIDs and generate separate metadata files for each file, plus it will also pack them and generate the list of CIDs to be used with the minting tools.

**Basically, the tool offers two different outputs:**
1. all data with encoded svgs in one big metadata.json file, without any additional files. This will be useful when you want to have non-standard on-chain only nfts.
2. png files packed into the ipfs .car file, plus metadata.json file for each image. This way, you can mint every NFT with a different CID, so it won't be possible to know the location of all files before the mint process is over. But at the same time, you will be able to upload the whole archive as a .car file at once.

nft-art-maker tool doesn't assume any way of uploading to ipfs, but I would recommend [nft.storage](https://nft.storage/) where you can upload whole .car file. All of them are then pinned and even distributed to the Filecoin network for free. So even if you delete it there or nft.storage stops working for some reason, the data will persist. Of course, learn about it first. They have a friendly UI, but you can also use the CLI tool for that.

#### Configuration options

You should use the config file at least for layers configuration. But there are also other configuration options. Whole config example: 

```javascript
{
  "description": "Your collection name",
  "svgBase64DataOnly": true,
  "layerConfigurations": [
    // 100 artworks
    {
      "growEditionSizeTo": 100,
      "layersOrder": [{ "name": "face" }, { "name": "head" }, { "name": "eyes" }]
    },
    // additional 10 artworks with pinky face
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
  "editionNameFormat": "#",
  "tags": "tag1,tag2,tag3",
  "preview": {
    "thumbPerRow": 20,
    "thumbWidth": 60,
    "imageRatio": 1,
    "imageName": "preview.png"
  },
}
```

##### layers configuration

Every subdirectory in your `layers` directory should be named after the type of the layer, and inside, you should put your png files. The name structure should be as follows: `filename1#100.png`, where the `#100` is a rarity level from 0 to 100.

##### shuffleLayerConfigurations

Disabled by default, but you can always enable it to shuffle items from different `layerConfigurations`.

##### Output type configuration

You can decide if you want to have encoded SVGs or standard PNGs files. Use `svgBase64DataOnly` setting.

The example of output `metadata.json` file structure with empty values (this is one big file with all editions):

```json
{
  "editions": [
    {
      "name": "",
      "description": "",
      "properties": {
        "edition": 0,
        "attributes": [
          {
            "trait_type": "",
            "value": ""
          }
        ],
        "base64SvgDataUri": "",
      },
      "image": {
        "href": "",
        "hash": ""
      }
    }
  ],
  "provenanceHash": ""
}

```

If you decide to pack .png files into ipfs .car files, you will also get separate metadata.json files for each file. The structure is similar.

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
