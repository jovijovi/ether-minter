# README

## Examples

`NOTICE` ***DEVELOPER_PK AND PROXY_CONTRACT ARE EXAMPLES, REPLACE WITH YOUR OWN.***

### Deploy immutable contract

```shell
 DEVELOPER_PK=1234567890123456789012345678901234567890123456789012345678901234 yarn deploy
```

### Deploy upgradeable contract

```shell
 DEVELOPER_PK=1234567890123456789012345678901234567890123456789012345678901234 yarn deploy-upgradeable
```

### Upgrade contract

```shell
 PROXY_CONTRACT=0x1234567890123456789012345678901234567890 \
 DEVELOPER_PK=1234567890123456789012345678901234567890123456789012345678901234 \
 yarn upgrade-contract
```