import React, { useState } from "react";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const EASSchemaDeployer = () => {
  const [schemaString, setSchemaString] = useState("");
  const [resolverAddress, setResolverAddress] = useState("");
  const [revocable, setRevocable] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [deployedSchemaUID, setDeployedSchemaUID] = useState("");

  const deploySchema = async () => {
    setIsDeploying(true);
    setDeploymentStatus(null);
    setDeployedSchemaUID("");

    try {
      // Connect to the Ethereum network (replace with your preferred method)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // EAS contract address (replace with the correct address for your network)
      const EAS_CONTRACT_ADDRESS = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia testnet

      // Initialize the EAS SDK
      const eas = new EAS(EAS_CONTRACT_ADDRESS);
      eas.connect(signer);

      // Create a SchemaEncoder instance
      const schemaEncoder = new SchemaEncoder(schemaString);

      // Register the schema
      const transaction = await eas.registerSchema(
        schemaString,
        resolverAddress,
        revocable,
        schemaEncoder.encodeSchema()
      );

      const receipt = await transaction.wait();

      // Get the SchemaUID from the transaction receipt
      const schemaUID = receipt.events[0].args.uid;

      setDeployedSchemaUID(schemaUID);
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
        placeholder="Schema string (e.g., 'uint256 eventId,uint8 voteIndex')"
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
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            EAS schema deployed successfully!
            <br />
            Schema UID: {deployedSchemaUID}
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
