import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { ethers } from 'ethers'

const Create = ({ provider, dao, setIsLoading}) => {
    const [name, setName] = useState('')
    const [amount, setAmount] = useState(0)
    const [address, setAddress] = useState('')
    const [isWaiting, setIsWaiting] = useState(false)

    const createHandler = async (e) => {
        e.preventDefault()
        setIsWaiting(true)
        try {
            const signer = await provider.getSigner()
            const formattedAmount = ethers.utils.parseUnits(amount.toString(), 'ether')

            const transaction = await dao.connect(signer).createProposal(name, formattedAmount, address)
            await transaction.wait()
        } catch {
            window.alert('User Rejected or Transaction Reverted')
        }
        setIsLoading(true)
    }
    return (
        <Form onSubmit={createHandler}>
            <Form.Group style={{maxWidth: '450px', margin: '50px auto'}}>
                <Form.Control type='text' className="my-2" placeholder= "Enter Name"
                onChange={(e) => setName(e.target.value)}
                />
                <Form.Control type='number' className="my-2" placeholder= "Enter Amount"
                onChange={(e) => setAmount(e.target.value)}
                />
                <Form.Control type='text' className="my-2" placeholder= "Enter Address"
                onChange={(e) => setAddress(e.target.value)}
                />
                {isWaiting ? (
                    <Spinner animation="border" style={{ display: 'block', margin: '0 auto'}}/>
                ) : (
                    <Button variant='primary' type = 'submit' style={{width: '100%'}}>Create Proposal</Button>
                )}
                
            </Form.Group>
        </Form>
    )
}

export default Create
