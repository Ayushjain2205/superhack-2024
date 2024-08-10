import React, { useState } from "react";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const SchemaRegistryContractAddress =
  "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"; // Sepolia 0.26

const EASSchemaDeployer = () => {
  const [schemaString, setSchemaString] = useState("");
  const [resolverAddress, setResolverAddress] = useState("");
  const [revocable, setRevocable] = useState(true);
  const [deploymentState, setDeploymentState] = useState("idle"); // 'idle', 'deploying', 'success', 'error'
  const [transactionHash, setTransactionHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const deploySchema = async () => {
    setDeploymentState("deploying");
    setTransactionHash("");
    setErrorMessage("");

    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const schemaRegistry = new SchemaRegistry(SchemaRegistryContractAddress);
      schemaRegistry.connect(signer);

      const transaction = await schemaRegistry.register({
        schema: schemaString,
        resolverAddress: resolverAddress || ethers.ZeroAddress,
        revocable,
      });

      console.log("Transaction:", transaction);
      console.log("Transaction hash:", transaction.hash);

      console.log("Waiting for transaction confirmation...");
      const receipt = await transaction.wait();
      console.log("Transaction receipt:");
      setTransactionHash(receipt);

      setDeploymentState("success");
    } catch (error) {
      console.error("Error deploying schema:", error);
      setDeploymentState("error");
      setErrorMessage(error.message || "An unknown error occurred");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">EAS Schema Deployer</h1>

      <Input
        placeholder="Schema string (e.g., 'uint256 eventId, uint8 voteIndex')"
        value={schemaString}
        onChange={(e) => setSchemaString(e.target.value)}
      />

      <Input
        placeholder="Resolver address (optional)"
        value={resolverAddress}
        onChange={(e) => setResolverAddress(e.target.value)}
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={revocable}
          onChange={(e) => setRevocable(e.target.checked)}
          id="revocable"
        />
        <label htmlFor="revocable">Revocable</label>
      </div>

      <Button
        onClick={deploySchema}
        disabled={deploymentState === "deploying" || !schemaString}
      >
        {deploymentState === "deploying" ? "Deploying..." : "Deploy EAS Schema"}
      </Button>

      {deploymentState === "deploying" && (
        <Alert>
          <AlertTitle>Deploying</AlertTitle>
          <AlertDescription>
            Deploying your schema. This may take a few moments...
          </AlertDescription>
        </Alert>
      )}

      {deploymentState === "success" && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            EAS schema deployed successfully!
            <div className="mt-2">
              <a
                href={`https://sepolia.easscan.org/schema/view/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View on EAS Scan
              </a>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {deploymentState === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EASSchemaDeployer;
