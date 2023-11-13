import { run } from 'hardhat'

async function verify(contractAddress: string, args: any[]) {
    console.log('Verifying contract...')

    try {
        await run('verify:verify', {
            address: contractAddress,
            constructorArguments: args
        })
    } catch (error: any) {
        console.log(
            error.message.toLowerCase().includes('already verified')
                ? 'Contract already verified'
                : error
        )
    }
}

export default verify
