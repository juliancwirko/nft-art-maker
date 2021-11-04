### [2.2.1](https://github.com/juliancwirko/nft-art-maker/releases/tag/v2.2.1) (2021-11-04)
- bugfix: there was a problem with `shuffleLayerConfigurations` which randomized the entries in the metadata.json file but not the actual order of images. From now the order in the metadata.json is by edition, but then the images are correctly randomly ordered

### [2.2.0](https://github.com/juliancwirko/nft-art-maker/releases/tag/v2.2.0) (2021-10-29)
- possibility to update the image path base in metadata.json - useful when you need to update your paths after uploading, for example, when uploading a CAR file using IPFS, but it can be anything.

### [2.1.0](https://github.com/juliancwirko/nft-art-maker/releases/tag/v2.1.0) (2021-10-28)
- bring back `shuffleLayerConfigurations` it has a valid use case even if we want only basic functionality
- fix for preview generation

### [2.0.0](https://github.com/juliancwirko/nft-art-maker/releases/tag/v2.0.0) (2021-10-23)
- changes in the output JSON file
- replace sha1 with sha256, which is now also used for provenance hash
- there will be a possibility to download the image (PNG or SVG) and validate the sha256 hash. You can save this hash on a blockchain with other info like block number and timestamp etc.
- there will also be a possibility to validate provenance hash (hash of hashes)
- it can still get breaking changes in the future. In such a case, there will always be a major version

### [1.0.1](https://github.com/juliancwirko/nft-art-maker/releases/tag/v1.0.1) (2021-10-17)
- initial code
