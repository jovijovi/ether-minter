#!/bin/bash

set -e

CONTRACT_ADDRESS=0x112233
TO_ADDRESS=0x445566

index=0
for ((;;)); do
    if [ ${index} -gt 200 ]; then
        echo "## Done"
        break;
    fi

    hash=0x`openssl rand -hex 32`
    body="{\"contractAddress\": \"${CONTRACT_ADDRESS}\",\"toAddress\": \"${TO_ADDRESS}\", \"contentHash\": \"${hash}\"}"
    #echo ${body}

    curl -H 'Content-Type:application/json' \
    -XPOST -d "${body}" \
    http://localhost:27550/api/v3/contracts/mint
    echo

    index=`expr ${index} + 1`
done
