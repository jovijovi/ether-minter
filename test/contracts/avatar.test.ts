const {ethers} = require('hardhat');
import {expect} from 'chai';
import {BigNumber, Signer, Wallet} from 'ethers';
import {Confirmations, StatusSuccessful} from '../../src/contracts/Avatar/abi/params';
import {Avatar, Avatar__factory} from '../../typechain-types';

describe("NFT Contract", function () {
	const mockTokenId1 = 1;
	const mockMaxSupply = 5;
	const defaultMaxSupply = 1000;

	const contractName = "Avatar";
	const nftName = "AvatarNFT"
	const nftSymbol = "AvatarNFTSymbol";
	const nftBaseTokenURI = "https://localhost:2022/nft/"
	const newNFTBaseTokenURI = "https://localhost:2023/nft/"

	const newContractURI = "https://localhost/contract"

	const contentHashList1 = ["0x7465737400000000000000000000000000000000000000000000000000000001"];
	const contentHashList2 = ["0x7465737400000000000000000000000000000000000000000000000000000002"];
	const contentHashList3 = ["0x7465737400000000000000000000000000000000000000000000000000000003"];

	let contractAddress: string;

	let owner: Signer, signer1: Signer, signer2: Signer;
	let ownerAddress: string, signer1Address: string, signer2Address: string;

	async function getAccounts() {
		[owner, signer1, signer2] = await ethers.getSigners();

		ownerAddress = await owner.getAddress();
		console.debug("## ContractOwner=", ownerAddress);

		signer1Address = await signer1.getAddress();
		console.debug("## Address1=", signer1Address);

		signer2Address = await signer2.getAddress();
		console.debug("## Address2=", signer2Address);
	}

	async function attachContract(name: string, address: string): Promise<Avatar> {
		const contractFactory = await ethers.getContractFactory(name);
		return contractFactory.attach(address);
	}

	function getWallet(pk: string): Wallet {
		return new Wallet(pk, ethers.provider);
	}

	async function connectContract(address: string): Promise<Avatar> {
		return Avatar__factory.connect(contractAddress, await ethers.getSigner(address));
	}

	before("tear up", async function () {
		await getAccounts();
	})

	// Deploy NFT contract
	it("deploy", async function () {
		const contractFactory = await ethers.getContractFactory(contractName);
		const contract = await contractFactory.deploy(nftName, nftSymbol, nftBaseTokenURI);
		contractAddress = contract.address;
		console.debug("## Contract address=", contractAddress);
		console.debug("## Contract signer=", await contract.signer.getAddress());
		console.debug("## Contract owner=", await contract.owner());
	})

	// GET NFT name
	it("name", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const name = await contract.name();
		console.debug("## NFT Name=", name);
		expect(name).to.equal(nftName);
	})

	// Get NFT symbol
	it("symbol", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const symbol = await contract.symbol();
		console.debug("## NFT Symbol=", symbol);
		expect(symbol).to.equal(nftSymbol);
	})

	// Mint to signer1
	it("mintForCreator", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.mintForCreator(signer1Address, 1, contentHashList1);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Receipt Logs=%o", receipt.logs);
		expect(receipt.status).to.equal(StatusSuccessful);
		console.debug("## MintForCreator %s completed, tx=", signer1Address, receipt.transactionHash);
	});

	// Mint to signer2
	it("mintTo", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.mintTo(signer2Address, 2);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Receipt Logs=%o", receipt.logs);
		expect(receipt.status).to.equal(StatusSuccessful);
		console.debug("## MintTo %s completed, tx=", signer2Address, receipt.transactionHash);
	});

	// Mint to contract owner
	it("mint", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.mint(3);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Receipt Logs=%o", receipt.logs);
		expect(receipt.status).to.equal(StatusSuccessful);
		console.debug("## Mint completed, tx=", receipt.transactionHash);
	});

	// Get total supply (ERC721)
	it("totalSupply", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const rspTotalSupply = await contract.totalSupply();
		console.debug("## TotalSupply=", rspTotalSupply.toString());
		expect(rspTotalSupply.toString()).to.equal(BigNumber.from(6).toString());
	});

	// Get balance of address (ERC721)
	it("balanceOf", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const balance = await contract.balanceOf(await signer1.getAddress());
		console.debug("## Balance(%s)=%s", signer1Address, balance.toString());
		expect(balance.toString()).to.equal(BigNumber.from(1).toString());
	})

	// Check if contentHash exists
	it("contentHashExists", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const isExist = await contract.contentHashExists(contentHashList1[0]);
		expect(isExist).to.equal(true);
		if (isExist) {
			console.debug("## ContentHash(%s) exists", contentHashList1[0]);
		}
	})

	// Get tokenId by contentHash
	it("getTokenIdByContentHash", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tokenId = await contract.getTokenIdByContentHash(contentHashList1[0]);
		console.debug("## Token(%d)'s content hash is %s", tokenId, contentHashList1[0]);
		expect(tokenId.toNumber()).to.equal(mockTokenId1);
	})

	// Check if tokenId exists
	it("exists", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const isExist = await contract.exists(mockTokenId1);
		expect(isExist).to.equal(true);
		console.debug("## TokenId(%d) exists", mockTokenId1);
	})

	// Transfer NFT
	it("transfer", async function () {
		const contract = await connectContract(await signer1.getAddress());
		const tx = await contract.transferFrom(signer1Address, signer2Address, mockTokenId1);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Receipt Logs=%o", receipt.logs);
		expect(receipt.status).to.equal(StatusSuccessful);
		console.debug("## Transfer from %s to %s completed, tx=", signer1Address, signer2Address, receipt.transactionHash);
	})

	// Get owner of NFT
	it("ownerOf", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const owner = await contract.ownerOf(mockTokenId1);
		console.debug("## Token(%s) owner=%s", mockTokenId1, owner);
		expect(owner).to.equal(signer2Address);
	})

	// Get tokenURI
	it("tokenURI", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tokenURI = await contract.tokenURI(mockTokenId1);
		console.debug("## Token(%d) tokenURI=%s", mockTokenId1, tokenURI);
		expect(tokenURI).to.equal(nftBaseTokenURI + "1");
	})

	// Burn NFT
	it("burn", async function () {
		const contract = await connectContract(await signer2.getAddress());
		const tx = await contract.burn(mockTokenId1);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Receipt Logs=%o", receipt.logs);
		expect(receipt.status).to.equal(StatusSuccessful);
		const isExist = await contract.exists(mockTokenId1);
		expect(isExist).to.equal(false);
		console.debug("## Token(%s) burned, tx=%s", mockTokenId1, receipt.transactionHash);
	})

	// Set max supply
	it("setMaxSupply", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.setMaxSupply(mockMaxSupply);
		const receipt = await tx.wait(Confirmations);
		const maxSupply = await contract.maxSupply();
		expect(maxSupply.toNumber()).to.equal(mockMaxSupply);
		console.debug("## SetMaxSupply completed, maxSupply=%d, tx=%s", maxSupply.toNumber(), receipt.transactionHash);

		try {
			await contract.mint(1)
		} catch (e) {
			console.debug("## Expected error=", e.message);
		}

		const tx2 = await contract.setMaxSupply(defaultMaxSupply);
		const receipt2 = await tx2.wait(Confirmations);
		const maxSupply2 = await contract.maxSupply();
		expect(maxSupply2.toNumber()).to.equal(defaultMaxSupply);
		console.debug("## Restore to default max supply(%d), tx=%s", defaultMaxSupply, receipt2.transactionHash);
	})

	// Set baseTokenURI
	it("setBaseTokenURI", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.setBaseTokenURI(newNFTBaseTokenURI);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Set new baseTokenURI completed, tx=", receipt.transactionHash);
		const tokenURI = await contract.tokenURI(2);
		console.debug("## Token(%d) tokenURI=%s", 2, tokenURI);
		expect(tokenURI).to.equal(newNFTBaseTokenURI + "2");
	})

	// Change contractURI
	it("changeContractURI", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.changeContractURI(newContractURI);
		const receipt = await tx.wait(Confirmations);
		console.debug("## Change contractURI completed, tx=", receipt.transactionHash);
		const contractURI = await contract.contractURI();
		console.debug("## New contractURI=%s", contractURI);
		expect(contractURI).to.equal(newContractURI);
	})

	// Add mint operator
	it("addOperator", async function () {
		const contract = await attachContract(contractName, contractAddress);
		let operatorList = await contract.getOperatorList();
		console.debug("## OperatorList(Before add)=", operatorList);

		console.debug("## Adding operator(%s)...", signer1Address);
		const tx = await contract.addOperator(signer1Address);
		const receipt = await tx.wait(Confirmations);

		operatorList = await contract.getOperatorList();
		console.debug("## OperatorList(After add)=", operatorList);

		const isOperator = operatorList.includes(signer1Address);
		expect(isOperator).to.equal(true);

		console.debug("## Add operator(%s) completed, tx=", signer1Address, receipt.transactionHash);
	})

	// Mint by new operator
	it("mintByNewOperator", async function () {
		const contract = await connectContract(await signer1.getAddress());
		const tx = await contract.mintForCreator(signer2Address, 1, contentHashList2);
		const receipt = await tx.wait(Confirmations);
		expect(receipt.status).to.equal(StatusSuccessful);
		console.debug("## Mint token by operator(%s) completed, tx=", signer1Address, receipt.transactionHash);
	})

	// Remove mint operator
	it("removeOperator", async function () {
		const contract = await attachContract(contractName, contractAddress);
		let operatorList = await contract.getOperatorList();
		console.debug("## OperatorList(Before remove)=", operatorList);

		console.debug("## Removing operator(%s)...", signer1Address);
		const tx = await contract.removeOperator(signer1Address);
		const receipt = await tx.wait(Confirmations);

		operatorList = await contract.getOperatorList();
		console.debug("## OperatorList(After remove)=", operatorList);

		const isOperator = operatorList.includes(signer1Address);
		expect(isOperator).to.equal(false);

		console.debug("## Remove operator(%s) completed, tx=", signer1Address, receipt.transactionHash);
	})

	// Mint by removed operator
	it("mintByRemovedOperator", async function () {
		const contract = await connectContract(await signer1.getAddress());
		try {
			await contract.mintForCreator(signer2Address, 1, contentHashList3);
		} catch (e) {
			console.debug("## Expected error=%o", e.reason);
		}
	})

	// Operator retire
	it("retire", async function () {
		const contract = await attachContract(contractName, contractAddress);
		let operatorList = await contract.getOperatorList();
		console.debug("## OperatorList(Before retire)=", operatorList);

		console.debug("## Operator(%s) retiring...", ownerAddress);
		const tx = await contract.retire();
		const receipt = await tx.wait(Confirmations);

		operatorList = await contract.getOperatorList();
		console.debug("## OperatorList(After retire)=", operatorList);

		const isOperator = operatorList.includes(signer1Address);
		expect(isOperator).to.equal(false);

		console.debug("## Operator(%s) retired, tx=%s", ownerAddress, receipt.transactionHash);
	})

	// Finalize contract
	it("finalize", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.finalize();
		const receipt = await tx.wait(Confirmations);
		const isFinalization = await contract.finalization();
		expect(isFinalization).to.equal(true);
		console.debug("## Contract finalized, tx=", receipt.transactionHash);

		try {
			await contract.mint(1)
		} catch (e) {
			console.debug("## Expected error=", e.message);
		}
	})
});
