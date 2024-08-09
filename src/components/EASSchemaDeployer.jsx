import React, { useState } from "react";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const SchemaRegistryContractAddress =
  "0x4200000000000000000000000000000000000020"; // Sepolia 0.26

const EASSchemaDeployer = () => {
  const [schemaString, setSchemaString] = useState("");
  const [resolverAddress, setResolverAddress] = useState("");
  const [revocable, setRevocable] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);

  const deploySchema = async () => {
    setIsDeploying(true);
    setDeploymentStatus(null);

    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const schemaRegistry = new SchemaRegistry(SchemaRegistryContractAddress);
      schemaRegistry.connect(signer);

      console.log("Deploying schema:", schemaString);
      console.log("Resolver address:", resolverAddress || ethers.ZeroAddress);
      console.log("Revocable:", revocable);

      const transaction = await schemaRegistry.register({
        schema: schemaString,
        resolverAddress: resolverAddress || ethers.ZeroAddress,
        revocable,
      });

      console.log("Transaction:", transaction);
      console.log("Transaction hash:", transaction.hash);

      const receipt = await transaction.wait();
      console.log("Transaction receipt:", receipt);

      setDeploymentStatus("success");
    } catch (error) {
      console.error("Error deploying schema:", error);
      setDeploymentStatus("error");
    } finally {
      setIsDeploying(false);
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

      <Button onClick={deploySchema} disabled={isDeploying || !schemaString}>
        {isDeploying ? "Deploying..." : "Deploy EAS Schema"}
      </Button>

      {deploymentStatus === "success" && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            EAS schema deployed successfully! Check the console for details.
          </AlertDescription>
        </Alert>
      )}

      {deploymentStatus === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to deploy EAS schema. Check the console for more details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EASSchemaDeployer;
