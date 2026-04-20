import { Table } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { ethers } from 'ethers';

const Proposal = ({ provider, dao, proposals, quorum, setIsLoading}) => {
    const voteHandler = async (id) => {
        try {
            const signer = await provider.getSigner()
            const transaction = await dao.connect(signer).vote(id)
            await transaction.wait()
            
        } catch {
            window.alert('User Rejectd of Transaction Reverted')
        }
        setIsLoading(true)
    }

    const finalizeHandler = async (id) => {
        try {
            const signer = await provider.getSigner()
            const transaction = await dao.connect(signer).finalizeProposal(id)
            await transaction.wait()
        } catch {
            window.alert('User Rejectd of Transaction Reverted')
        }
        setIsLoading(true)
    }
        
  return (
    <Table striped bordered hover responsive>
        <thead>
            <tr>
                <th>#</th>
                <th>Proposal Name</th>
                <th>Recipient Address</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Total Votes</th>
                <th>Cast Vote</th>
                <th>Finalize</th>
            </tr>
        </thead>
        <tbody>
            {proposals.map((proposal, index)=>(
                <tr key={index}>
                    <th>{proposal.id.toString()}</th>
                    <th>{proposal.name}</th>
                    <th>{proposal.recipient}</th>
                    <th>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</th>
                    <th>{proposal.finalized ? 'Approved' : 'In Progress'}</th>
                    <th>{proposal.votes.toString()}</th>
                    <th>
                        {!proposal.finalized && (
                            <Button 
                                variant="primary" 
                                style={{ width: '100%' }}
                                onClick={() => voteHandler(proposal.id)}
                            >
                            Vote
                            </Button>
                        )}                  
                    </th> 
                    <th>
                        {!proposal.finalized && proposal.votes > quorum &&(
                            <Button variant='primary' style={{width:'100%'}} onClick={() => finalizeHandler(proposal.id)}>
                                Finalize
                            </Button>
                        )}
                    </th>
                </tr>
            ))}
            
        </tbody>
    </Table>
  );
}

export default Proposal;
