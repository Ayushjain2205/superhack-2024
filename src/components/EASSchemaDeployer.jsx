import React, { useState } from "react";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SchemaRegistryContractAddress =
  "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"; // Sepolia 0.26

const EASSchemaGenerator = () => {
  const [schemaDescription, setSchemaDescription] = useState("");
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [resolverAddress, setResolverAddress] = useState("");
  const [revocable, setRevocable] = useState(true);
  const [deploymentState, setDeploymentState] = useState("idle"); // 'idle', 'generating', 'preview', 'deploying', 'success', 'error'
  const [transactionHash, setTransactionHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const generateSchema = async () => {
    setDeploymentState("generating");
    try {
      // This is a mock API call. Replace with actual GPT API call in production.
      const response = await mockGPTAPICall(schemaDescription);
      setGeneratedSchema(response);
      setDeploymentState("preview");
    } catch (error) {
      console.error("Error generating schema:", error);
      setDeploymentState("error");
      setErrorMessage("Failed to generate schema. Please try again.");
    }
  };

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
        schema: generatedSchema,
        resolverAddress: resolverAddress || ethers.ZeroAddress,
        revocable,
      });

      console.log("Transaction:", transaction);
      console.log("Transaction hash:", transaction.hash);
      setTransactionHash(transaction.hash);

      console.log("Waiting for transaction confirmation...");
      const receipt = await transaction.wait();
      console.log("Transaction receipt:", receipt);
      setTransactionHash(receipt);

      setDeploymentState("success");
    } catch (error) {
      console.error("Error deploying schema:", error);
      setDeploymentState("error");
      setErrorMessage(error.message || "An unknown error occurred");
    }
  };

  // Mock GPT API call - replace with actual API call in production
  const mockGPTAPICall = async (description) => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
    // This is a simplistic mock. A real GPT model would provide more sophisticated responses.
    const fields = description.split(" ").map((word) => {
      const type = Math.random() > 0.5 ? "uint256" : "string";
      return `${type} ${word.toLowerCase()}`;
    });
    return fields.join(", ");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">EAS Schema Generator and Deployer</h1>

      <Textarea
        placeholder="Describe what you're generating a schema for..."
        value={schemaDescription}
        onChange={(e) => setSchemaDescription(e.target.value)}
        disabled={deploymentState !== "idle" && deploymentState !== "preview"}
      />

      <Button
        onClick={generateSchema}
        disabled={
          (deploymentState !== "idle" && deploymentState !== "preview") ||
          !schemaDescription
        }
      >
        Generate Schema
      </Button>

      {deploymentState === "generating" && (
        <Alert>
          <AlertTitle>Generating Schema</AlertTitle>
          <AlertDescription>
            Generating your schema based on the description. This may take a
            moment...
          </AlertDescription>
        </Alert>
      )}

      {deploymentState === "preview" && (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Generated Schema Preview</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 whitespace-pre-wrap">{generatedSchema}</pre>
            </AlertDescription>
          </Alert>

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

          <Button onClick={deploySchema}>Deploy Generated Schema</Button>
        </div>
      )}

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

export default EASSchemaGenerator;
