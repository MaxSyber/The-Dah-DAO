const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {
    let token, dao, accounts
    let deployer, funder, recipient, investor1, investor2, investor3, investor4, investor5, user
 
    beforeEach(async () => {
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Dah', 'DAH', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        funder = accounts[1]
        recipient = accounts[3]
        investor1 = accounts[2]
        investor2 = accounts[4]
        investor3 = accounts[5]
        investor4 = accounts[6]
        investor5 = accounts[7]
        user = accounts[8]

        transaction = await token.connect(deployer).transfer(investor1.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor2.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor3.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor4.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor5.address, tokens(200000))
        await transaction.wait()

        const DAO = await ethers.getContractFactory('DAO')
        dao = await DAO.deploy(token.address, '500000000000000000000001')
    
        await funder.sendTransaction({to:dao.address, value: ether(100)})
    })

    describe('Deployment', () => {
        it('Returns Token Address', async () => {
            expect(await dao.token()).to.equal(token.address)
        })

        it('Returns Quorum', async () => {
            expect(await dao.quorum()).to.equal('500000000000000000000001')
        })

        it('Sends Ether to DAO Treasury', async () => {
            expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100))
        })
    })
    
    describe('Proposal Creation', () => {
        let transaction, result
        describe('Success', () => { 
            beforeEach(async () => {
                transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
                result = await transaction.wait()
            })

            it('Updates Proposal Count', async () => {
            expect(await dao.proposalCount()).to.equal(1)
            })

            it('Updates Proposal Mapping', async () => {
                const proposal = await dao.proposals(1)
                expect(proposal.id).to.equal(1)
                expect(proposal.amount).to.equal(ether(100))
                expect(proposal.recipient).to.equal(recipient.address)
            })

            it('Emits a Propose Event', async () => {
                await expect(transaction).to.emit(dao, 'Propose').withArgs(1, ether(100), recipient.address, investor1.address)
            })
        })

        describe('Failure', () => {
            
            it('Rejects Invalid Amount', async () => {
            await expect(dao.connect(investor1).createProposal('Proposal 1', ether(1000), recipient.address)).to.be.reverted
            })

            it('Rejects A Non-Investor', async () => {
            await expect(dao.connect(user).createProposal('Proposal 1', ether(100), recipient.address)).to.be.reverted
            })
        })
    })
    describe('Proposal Voting', () => {
        let transaction, result
        
        beforeEach(async () => {
                transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
                result = await transaction.wait()
        })
        
        describe('Success', () => { 
            beforeEach(async () => {
                transaction = await dao.connect(investor1).vote(1)
                result = await transaction.wait()
            })
            
            it('Updates Vote Count', async () => {
            const proposal = await dao.proposals(1)
            expect(proposal.votes).to.equal(tokens(200000))
            })

            it('Emits Vote Event', async () => {
                await expect(transaction).to.emit(dao, "Vote").withArgs(1, investor1.address)
            })
        })
        describe('Failure', () => {
            it('Rejects A Non-Investor', async () => {
            await expect(dao.connect(user).vote(1)).to.be.reverted
            })

            it('Rejects Double Voting', async () => {
                transaction = await dao.connect(investor1).vote(1)
                await transaction.wait()

                await expect(dao.connect(investor1).vote(1)).to.be.reverted
            })

        })
    })

    describe('Proposal Goverenance', () => {
        let transaction, result

        
        
        describe('Success', () => { 
            beforeEach(async () => {
                transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
                result = await transaction.wait()
                
                transaction = await dao.connect(investor1).vote(1)
                result = await transaction.wait()

                transaction = await dao.connect(investor2).vote(1)
                result = await transaction.wait()

                transaction = await dao.connect(investor3).vote(1)
                result = await transaction.wait()

                transaction = await dao.connect(investor1).finalizeProposal(1)
                result = await transaction.wait()
            })
            
            it('Transfers Funds to Recipient', async () => {
                expect(await ethers.provider.getBalance(recipient.address)).to.equal(tokens(10100))
            })

            it('Updates The Proposal', async () => {
                const proposal = await dao.proposals(1)
                expect(proposal.finalized).to.equal(true)
            })

            it('Emits Finalize Event', async () => {
                await expect(transaction).to.emit(dao, "Finalize").withArgs(1)
            })
        })
        describe('Failure', () => {

            beforeEach(async () => {
                transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
                result = await transaction.wait()
                
                transaction = await dao.connect(investor1).vote(1)
                result = await transaction.wait()

                transaction = await dao.connect(investor2).vote(1)
                result = await transaction.wait()

            })

            it('Rejects Proposal if Already Finalized', async () => {
                transaction = await dao.connect(investor3).vote(1)
                result = await transaction.wait()

                transaction = await dao.connect(investor1).finalizeProposal(1)
                result = await transaction.wait()

                await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
            })

            it('Rejects  Finalized if Not Enough Votes', async () => {
                await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
            })

            it('Rejects  Finalized From Non-Investor', async () => {
                transaction = await dao.connect(investor3).vote(1)
                result = await transaction.wait()

                await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted
            })
        })
    })
})
