import {useState, useEffect, useRef} from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { Contract, ethers } from "ethers";
import { decodeError } from "@ubiquity-os/ethers-decode-error";
import manifest from "../contracts/Auction.json";

export default function Home() {
  const contract = useRef(null);
  const [newBid, setNewBid] = useState(0);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [winner, setWinner] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let init = async () => {
      await configureBlockchain();
    }
    init();
  }, []);
  
  const configureBlockchain = async () => {
    const provider = await detectEthereumProvider();
    if(provider) {
      console.log("Ethereum provider detected");
      await provider.request({ method: "eth_requestAccounts" });
      const networkId = await provider.request({ method: "net_version" });
      console.log("Connected to network: ", networkId);

      let providerEthers = new ethers.providers.Web3Provider(provider);
      let signer = providerEthers.getSigner();
      
      contract.current = new Contract("0xb8DC0481A9c42E06e40eA2f0841781C6ECc89E49", manifest.abi, signer);
      setName(contract.current.getName());
      let temp = await contract.current.getDeadline();
      setDeadline(new Date(temp * 1000).toLocaleString());
      try {
        temp = await contract.current.getWinner();
        if (temp !== ethers.constants.AddressZero) {
          setWinner(temp);
        }
      } catch (error) {}      
    } else {
      console.log("Please install MetaMask!")
    }
  }

  const bid = async () => {
    try {
      setErrorMessage("");
      const tx = await contract.current.bid(newBid);
      await tx.wait();
      setNewBid(0);
    } catch (error) {
      let decoded = decodeError(error);
      setErrorMessage(decoded.error || "Error al realizar la puja");
    }
  }

  const refund = async () => {
    try {
      setErrorMessage("");
      const tx = await contract.current.refund();
      await tx.wait();
    } catch (error) {
      let decoded = decodeError(error);
      setErrorMessage(decoded.error || "Error al solicitar el reembolso");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Subasta</h1>

        {errorMessage && (
          <div className="error-box">
            {errorMessage}
          </div>
        )}

        <div className="info">
          <p className="label">Activo</p>
          <p className="value">{name || "—"}</p>

          <p className="label">Finaliza</p>
          <p className="value">{deadline || "—"}</p>

          {winner && (
            <>
              <p className="label">Ganador</p>
              <p className="value winner">{winner}</p>
            </>
          )}
        </div>

        <div className="bid-box">
          <input
            type="number"
            min="0"
            value={newBid}
            onChange={e => setNewBid(e.target.value)}
            placeholder="Cantidad a pujar"
          />
          <button className="primary" onClick={bid}>
            Pujar
          </button>
        </div>

        <button className="secondary" onClick={refund}>
          Obtener reembolso
        </button>
      </div>
    </div>
  );
}