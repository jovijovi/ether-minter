# Changelog

## [v0.6.28](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.28)

### Features
- Get floating gas price by default
- Increase verifySignature cache from 1k to 10k
- Add cache of NFT owner, tx response and tx receipt

### Build
- Bump packages

## [v0.6.26](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.26)

### Build
- (docker): Compile code in alpine
- Bump node version from 16.17 to 16.18
- Bump packages

## [v0.6.22](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.22)

### Features
- New API "Burn"

### Build
- Bump packages

## [v0.6.20](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.20)

### Features
- Custom contract owners

## [v0.6.19](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.19)

### Features
- Get the PK from keystore if it's undefined in batch transfer

### Build
- Bump packages

## [v0.6.17](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.17)

### Build
- Bump packages

## [v0.6.16](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.16)

### Build
- Bump node to v16.16.0
- Bump packages

## [v0.6.14](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.14)

### Features
- Add 'MAXSUPPLY' error code in response
- Deploy contract at floating gas price
- Get gasPriceC from the request, otherwise from config

### Build
- Bump packages

## [v0.6.10](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.10)

### Fixes
- Compare address in lower case
- Inspect PK by address in lower case

### Build
- Disable compiler optimizer
- Bump packages

## [v0.6.8](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.8)

### Chore
- Reduce logs

### Build
- Bump packages

## [v0.6.7](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.7)

### Features
- Get the balance of address as of the blockHash (archive node only)

### Build
- Bump @openzeppelin/contracts from 4.6.0 to 4.7.0

## [v0.6.5](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.5)

### Features
- (contracts/avatar): add operators, skip if operator already exists
- New API "SetMaxSupply"
- New API "GetMaxSupply"
- New API "GetContractOwner"
- New API "SetBaseTokenURI"

### Build
- Bump solidity compiler from 0.8.4 to 0.8.9
- Bump packages

## [v0.6.2](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.2)

### Features
- Check gas price before transfer

## [v0.6.0](https://github.com/jovijovi/ether-minter/releases/tag/v0.6.0)

### Features
- Estimate gas of BatchTransfer & BatchTransferN
- Custom tx gasLimitC & confirmations

## [v0.5.3](https://github.com/jovijovi/ether-minter/releases/tag/v0.5.3)

### Features
- Batch mint/transfer/burn NFTs
- Deploy contract by API
- API authorization via 2FA token

## [v0.2.2](https://github.com/jovijovi/ether-minter/releases/tag/v0.2.2)

### Test
- (contracts/avatar): test code for Avatar contract

### Build
- Bump node to v16.15.0

## [v0.2.1](https://github.com/jovijovi/ether-minter/releases/tag/v0.2.1)

### Test
- (devenv): update docker-compose file

### Chore
- Update .gitignore
- Lower log level

### Lint
- Remove useless imports

### Build
- Bump packages

## [v0.2.0](https://github.com/jovijovi/ether-minter/releases/tag/v0.2.0)

### Features
- More NFT APIs

## [v0.1.0](https://github.com/jovijovi/ether-minter/releases/tag/v0.1.0)

### Features
- NFT Minter APIs
- Avatar NFT contract
- Mint NFT by random minter
- Gas price circuit breaker
- RESTFul APIs for the Ethereum ecosystem
- Microservice run in Docker
