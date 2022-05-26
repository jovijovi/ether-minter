# Ether Minter

[![GitHub Actions](https://github.com/jovijovi/ether-minter/workflows/Test/badge.svg)](https://github.com/jovijovi/ether-minter)

An NFT minter microservice inspired by [ether-goblin](https://https://github.com/jovijovi/ether-goblin).

## Features

- NFT Minter APIs
- [Avatar NFT contract](./contracts/Avatar)
- RESTFul APIs for the Ethereum ecosystem
- Microservice
- Run in Docker

## Supported Chains

- [Ethereum](https://ethereum.org/)
- [Polygon](https://polygon.technology/)

## Development Environment

- typescript `4.7.2`
- node `v16.15.0`
- ts-node `v10.8.0`
- yarn `v1.22.18`

## Contract Dependencies

- @openzeppelin/contracts: [`4.6.0`](https://www.npmjs.com/package/@openzeppelin/contracts/v/4.6.0)
- erc721a: [`4.0.0`](https://www.npmjs.com/package/erc721a/v/4.0.0)

## Quick Guide

- Install dependency

  ```shell
  yarn
  ```

- Build code

  Install all dependencies and compile code.

  ```shell
  make build
  ```

- Build docker image

  ```shell
  make docker
  ```

- Run

    - Params

        - `--config` Config filepath. Example:

          ```shell
          ts-node ./src/main/index.ts --config ./conf/app.config.yaml
          ```

    - Run code directly by `ts-node`

      ```shell
      yarn dev-run --config ./conf/app.config.yaml
      ```

    - Run compiled code by `node`

      ```shell
      yarn dist-run --config ./conf/app.config.yaml
      ```

- Clean

  ```shell
  make clean
  ```

## Roadmap

- Documents

## License

[MIT](LICENSE)
