### NFT art maker

The primary task of this tool is to generate a randomized set of images from provided PNG layers and pack them into .car files. Then you can upload them to IPFS using [nft.storage](https://nft.storage/) or other tools.

**Please test it before using it for the real stuff. It can always be buggy.**

- PNG layers for testing: https://ipfs.io/ipfs/bafkreicwfzj7f3xc6mjkyaqknd4gsosscznelpiwdtwmdp773irwuv2lqu (or check the [example](https://github.com/juliancwirko/nft-art-maker/tree/main/example) directory)
- Latest walkthrough video: https://youtu.be/S26Zskop-aU
- Older video, as part of bigger process on Elrond blockchain: https://youtu.be/resGP6a7_34

#### For older versions (check changelog):
- [CHANGELOG](https://github.com/juliancwirko/nft-art-maker/blob/main/CHANGELOG.md)

#### Based on:
- [HashLips art engine](https://github.com/HashLips/hashlips_art_engine) - only main functionality (output metadata schema should be suitable for most of the marketplaces)
- [Pixels to SVG](https://codepen.io/shshaw/pen/XbxvNj) - SVG code from images
- [SVGO](https://github.com/svg/svgo) - SVG optimization and base64 data uri generation
- [ipfs-car](https://github.com/web3-storage/ipfs-car) - optionally for handling ipfs .car archives
- [dotProp](https://github.com/sindresorhus/dot-prop) - for better managing the metadata schema mapper

The random assets generation is a customized and simplified version of the [HashLips art engine](https://github.com/HashLips/hashlips_art_engine) logic. If you need more options and functionality, please use HashLips.

**The tool offers two different outputs:**
1. png and metadata files packed into the ipfs .car files. Base image CID will be updated in all metadata files automatically after running `nft-art-maker pack` and base CID for metadata files will be added to the summary metadata json file.
2. (experimental) all data with encoded svgs in one big metadata.json file, without any additional files. This will be useful when you want to have non-standard on-chain only nfts. Be aware that the SVG output can be buggy on very complicated and big images. This experimental option is for small simple images, like pixel art etc.

nft-art-maker tool doesn't assume any way of uploading to ipfs, but I would recommend [nft.storage](https://nft.storage/) where you can upload whole .car file. They offer free pinning service and Filecoin storage. So even if you delete it there or nft.storage stops working for some reason, the data will persist. Of course, learn about it first. They have a friendly UI, but you can also use the CLI tool for that.

### Table of Contents  
- [How to use it](#how-to-use-it)  
- [Configuration options](#configuration-options)
- [Layers configuration](#layers-configuration)
- [Shuffle layers](#shufflelayerconfigurations)
- [Output types](#output-types-configuration)
- [Output metadata schema configuration](#output-metadata-schema-configuration)
- [Layers directory structure (example)](#layers-directory-structure-example)
- [Upload packed car files to nft.storage](#upload-packed-car-files-to-nftstorage)
- [Update images base CID](#update-images-base-cid)
- [Try the example](#try-the-example)

#### How to use it:
- minimum version of Node is **14.14.0**. Best **18**.
- create a project directory -> `mkdir my-nft-collection ; cd my-nft-collection`
- in that directory, create the `layers` directory with all of your layers split into proper directories. Read more about it below.
- create a configuration file `.nftartmakerrc` (other file names also allowed, check out [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more info). This file should be a JSON formatted config file. You'll find all configuration options below.
- run `npx nft-art-maker generate` or if installed globally `nft-art-maker generate` - it will generate all files or encoded SVG with metadata json file for each, plus it will generate one big metadata file with all editions and provenance hash. Additionally, there is also an option to pack all images and metadata files into an ipfs car files. Then every CIDs will be also actual in metadata files.

You can always install it globally by `npm install nft-art-maker -g` and then use it like `nft-art-maker generate`.

Updating: when using npx, make sure that it takes the new version. You can always install it globally using `npm install nft-art-maker@latest -g`.

#### Additionally you can:
- generate a preview - run `npx nft-art-maker preview`
- you can also pack files using `npx nft-art-maker pack` (always recommended!) - this will pack all files using ipfs-car into one images.car and metadata.car files, which you can upload using services like nft.storage
- check how many unique assets is generated. `npx nft-art-maker check` Sometimes the names of files can be misleading when there are not enough layers to achieve the required amount of assets. This probably needs some rewrites in the future.
- upload packed car files to nft.storage. `npx nft-art-maker upload` - this will upload all packed ipfs-car files to nft.storage. Set "nftStorageApiToken" config option to your API token
- overwrite image CID. `npx nft-art-maker updateImageCID` - this will update all metadata files based on the config option `overwriteImageCID`

#### Configuration options

You should use the config file at least for layers configuration. But there are also other configuration options. Whole config example:

```json
{
  "description": "Your collection name",
  "svgBase64DataOnly": true,
  "layerConfigurations": [
    {
      "growEditionSizeTo": 100,
      "layersOrder": [
        {
          "name": "face"
        },
        {
          "name": "head"
        },
        {
          "name": "eyes"
        }
      ]
    },
    {
      "growEditionSizeTo": 110,
      "layersOrder": [
        {
          "name": "pinkyFace"
        },
        {
          "name": "head"
        },
        {
          "name": "eyes"
        }
      ]
    }
  ],
  "shuffleLayerConfigurations": false,
  "format": {
    "width": 20,
    "height": 20
  },
  "metadataSchemaMapper": {
    "name": "name",
    "description": "description",
    "edition": "edition",
    "attributes": "attributes",
    "base64SvgDataUri": "base64SvgDataUri",
    "image.href": "image.href",
    "image.hash": "image.hash",
    "image.ipfsUri": "image.ipfsUri",
    "image.ipfsCid": "image.ipfsCid",
    "image.fileName": "image.fileName"
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
  "outputMetadataFileExtension": ".json",
  "editionNameFormat": "#",
  "tags": "tag1,tag2,tag3",
  "preview": {
    "thumbPerRow": 20,
    "thumbWidth": 60,
    "imageRatio": 1,
    "imageName": "preview.png"
  },
  "nftStorageApiToken": "Your nft.storage API token",
  "overwriteImageCID": "Your image CID after upload to your IPFS storage."
}
```

##### layers configuration

Every subdirectory in your `layers` directory should be named after the type of the layer, and inside, you should put your png files. The name structure should be as follows: `filename1#100.png`, where the `#100` is a rarity weight. Good explainer in Hashlips repo: [here](https://github.com/HashLips/hashlips_art_engine/issues/251#issuecomment-969911889).

##### shuffleLayerConfigurations

Enabled by default, but you can always enable it to shuffle items from different `layerConfigurations`.

##### Output types configuration

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

##### Output metadata schema configuration

From v5.2.0, you can modify the structure of the final metadata files. For now, if you would like to do that, you should configure all fields. Here is the default configuration (check how to use it in the .nftartmakerrc config file above):

```json
{
  "metadataSchemaMapper": {
    "name": "name",
    "description": "description",
    "edition": "edition",
    "attributes": "attributes",
    "base64SvgDataUri": "base64SvgDataUri",
    "image.href": "image.href",
    "image.hash": "image.hash",
    "image.ipfsUri": "image.ipfsUri",
    "image.ipfsCid": "image.ipfsCid",
    "image.fileName": "image.fileName"
  }
}
```

As you can see here, we have a `key:value` object. All keys are currently required variables, which should all be in the configuration if you decide to use the `metadataSchemaMapper`.

So, for example, let's change the structure to match the OpenSea requirements. Because not all fields are required by OpenSea, we will put them in a separate key.

OpenSea metadata mapper proposition example:
```json
{
  "metadataSchemaMapper": {
    "name": "name",
    "description": "description",
    "edition": "edition",
    "attributes": "attributes",
    "base64SvgDataUri": "base64SvgDataUri",
    "image.href": "external_url",
    "image.hash": "image_additional_info.hash",
    "image.ipfsUri": "image",
    "image.ipfsCid": "image_additional_info.ipfsCid",
    "image.fileName": "image_additional_info.fileName"
  }
}
```

We changed the `image.href` to be `external_url` in our metadata files and `image.ipfsUri` to `image` in our metadata files. We also moved all other data from the default `image` key to the separate `image_additional_info` key. So now our final structure looks like this: 

OpenSea final metadata form example:
```json
{
  "name": "",
  "description": "",
  "edition": 1,
  "attributes": [
    {
      "trait_type": "",
      "value": ""
    }
  ],
  "external_url": "",
  "image_additional_info": {
    "hash": "",
    "ipfsCid": "",
    "fileName": ""
  },
  "image": ""
}
```

Deployed example: https://bafybeih6ii5v2hmeqsiwzkvqqw7oearegyysr6ibgpzfgmlf3ancjtghku.ipfs.nftstorage.link/111.json

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

### Upload packed car files to nft.storage

This package has a small helper to upload the packed car files to nft.storage. To archive the only requirement is addition in the .nftartmakerrc config file: `"nftStorageApiToken": "Your nft.storage API token"`. See the example above.

### Update images base CID

**Important!** It is not a part of the standard flow! `pack` command will do this for you too.

This is useful when you want to upload image folder with NFT UP or Pinata (or any other 3rd party IPFS storage provider.)

In case you are dealing with a very large collection and the ipfs upload failed for some reasons you can first upload the images to an IPFS provider.

After you received the CID of the image location following steps are required: 

1. update your config file `overwriteImageCID` option with your CID.
2. run `nft-art-maker updateImageCID` which will re-generate your metadata files with the image CID.
3. upload your metadata json folder to your preferred location. 

### Try the example

1. Install the `nft-art-maker` globally: `npm install -g nft-art-maker`
2. Go to the `example` directory and run `nft-art-maker generate`
3. Check the output directory which will be created.
4. Test other commands.

### Development

1. clone the repository
2. run `npm install`
3. link the package locally `npm link`
4. rebuild the project with every change `npm run build`
5. you can run tests by `npm run test` (more integration than unit, you would need to provide the nft.storage api key in the `tests/.nftartmakerrc`)

#### License

MIT

#### Contact

- [Twitter](https://twitter.com/JulianCwirko)
- [WWW](https://www.julian.io)
- [Elven Tools - Elrond blockchain NFT launches - Open Source tools](https://www.elven.tools)
