// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract Auction {

    string public name;
    uint256 public deadline;
    mapping ( address => uint256 ) public bids;
    uint256 public topBid;
    address public winner;

    event NewBid(address indexed bidder, uint256 amount);

    constructor (string memory _name, uint256 _duration) {
        name = _name;
        deadline = block.timestamp + _duration * 1 minutes;
    }

    function getName() public view returns(string memory) {
        return name;
    }

    function getDeadline() public view returns(uint256) {
        return deadline;
    }
    function bid(uint256 amount) public payable {
        require(block.timestamp < deadline, "La subasta ha finalizado");
        require(bids[msg.sender] == 0, "Ya has participado en la subasta");
        require(amount > topBid, "La oferta debe ser superior a la mas alta");

        bids[msg.sender] = amount;
        topBid = amount;
        winner = msg.sender;
        emit NewBid(msg.sender, amount);
    }

    function getWinner() public view returns ( address )  {
        require(block.timestamp >= deadline, "La subasta no ha finalizado");

        return winner;
    }

    function refund() public payable {
        require(block.timestamp >= deadline, "La subasta no ha finalizado");
        require(bids[msg.sender] > 0, "No has participado en la subasta");
        require(msg.sender != winner, "Eres el ganador de la subasta");

        bids[msg.sender] = 0;

        address payable to = payable(msg.sender);
        (bool ok, ) = to.call{ value: bids[msg.sender]}("");
        require(ok, "Error al devolver el dinero");
    }
}