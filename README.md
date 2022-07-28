# Ether Minter

[![GitHub Actions](https://github.com/jovijovi/ether-minter/workflows/Test/badge.svg)](https://github.com/jovijovi/ether-minter)

An NFT minter microservice inspired by [ether-goblin](https://github.com/jovijovi/ether-goblin).

## Features

- Avatar NFT contracts
  - [Avatar Contract (Immutable)](./contracts/Avatar)
  - [Avatar-Upgradeable Contract](./contracts/AvatarUpgradeable)
- NFT Minter APIs
  - Mint NFT by random minter
  - Gas price circuit breaker
  - Batch mint/transfer/burn NFTs
  - Deploy upgradeable/immutable contract
  - Support proxy contract (ERC-1967)
- API authorization via 2FA token
- RESTFul APIs for the Ethereum ecosystem
- Microservice run in Docker

## Supported Chains

- [Ethereum](https://ethereum.org/)
- [Polygon](https://polygon.technology/)

## Development Environment

- typescript `4.7.4`
- node `v16.16.0`
- ts-node `v10.9.1`
- yarn `v1.22.19`

## Contract Dependencies

### Upgradeable Contract

- @openzeppelin/contracts-upgradeable [`4.7.2`](https://www.npmjs.com/package/@openzeppelin/contracts-upgradeable/v/4.7.2)
- erc721a-upgradeable [`4.2.1`](https://www.npmjs.com/package/erc721a-upgradeable/v/4.2.1)

### Immutable Contract

- @openzeppelin/contracts [`4.7.2`](https://www.npmjs.com/package/@openzeppelin/contracts/v/4.7.2)
- erc721a [`4.2.0`](https://www.npmjs.com/package/erc721a/v/4.2.0)

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

- Test

  ```shell
  yarn test
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
- Upgradeable contract

## License

[MIT](LICENSE)
