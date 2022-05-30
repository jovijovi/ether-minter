// Check if topics is ERC721 transfer
export function CheckTopics(topics: any): boolean {
	if (!topics) {
		return false;
	} else if (topics.length === 4
		&& topics[0]
		&& topics[1]
		&& topics[2]
		&& topics[3]) {
		return true;
	}

	return false;
}
