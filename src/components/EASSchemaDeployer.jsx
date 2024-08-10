import React, { useState } from "react";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const SchemaRegistryContractAddress =
  "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"; // Sepolia 0.26

const EASSchemaGenerator = () => {
  const [schemaDescription, setSchemaDescription] = useState("");
  const [generatedFields, setGeneratedFields] = useState([]);
  const [resolverAddress, setResolverAddress] = useState("");
  const [revocable, setRevocable] = useState(true);
  const [step, setStep] = useState("generate"); // 'generate', 'deploy'
  const [deploymentState, setDeploymentState] = useState("idle");
  const [transactionHash, setTransactionHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const generateSchema = async () => {
    setDeploymentState("generating");
    try {
      // This is a mock API call. Replace with actual GPT API call in production.
      const response = await mockGPTAPICall(schemaDescription);
      setGeneratedFields(response);
      setDeploymentState("idle");
      setStep("deploy");
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

      const schemaString = generatedFields
        .map((field) => `${field.type} ${field.name}`)
        .join(", ");

      const transaction = await schemaRegistry.register({
        schema: schemaString,
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
    return description.split(" ").map((word) => ({
      name: word.toLowerCase(),
      type: Math.random() > 0.5 ? "uint256" : "string",
    }));
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">
        EAS Schema Generator and Deployer
      </h1>

      {step === "generate" && (
        <>
          <Textarea
            placeholder="Describe what you're generating a schema for..."
            value={schemaDescription}
            onChange={(e) => setSchemaDescription(e.target.value)}
            disabled={deploymentState === "generating"}
            className="w-full"
          />

          <Button
            onClick={generateSchema}
            disabled={deploymentState === "generating" || !schemaDescription}
            className="w-full"
          >
            {deploymentState === "generating"
              ? "Generating..."
              : "Generate Schema"}
          </Button>
        </>
      )}

      {step === "deploy" && (
        <div className="space-y-4 bg-gray-100 p-4 rounded-lg">
          {generatedFields.map((field, index) => (
            <div key={index} className="flex justify-between">
              <div className="w-1/2 pr-2">
                <Input value={field.name} readOnly />
              </div>
              <div className="w-1/2 pl-2">
                <Input value={field.type} readOnly />
              </div>
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="revocable"
              checked={revocable}
              onCheckedChange={setRevocable}
            />
            <label htmlFor="revocable">Revokeable</label>
          </div>

          <Input
            placeholder="Resolver address (optional)"
            value={resolverAddress}
            onChange={(e) => setResolverAddress(e.target.value)}
          />

          <Button
            onClick={deploySchema}
            disabled={deploymentState === "deploying"}
            className="w-full"
          >
            {deploymentState === "deploying" ? "Deploying..." : "DEPLOY schema"}
          </Button>
        </div>
      )}

      {deploymentState === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
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
    </div>
  );
};

export default EASSchemaGenerator;
