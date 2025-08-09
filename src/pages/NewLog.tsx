import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CreateLogEntryForm from "@/components/CreateLogEntryForm";
import FloatingCounter from "@/components/ui/floating-counter";

const NewLog = () => {
  const handleSuccess = () => {
    // You could add navigation back to the log page here
    console.log("Log entry created successfully!");
  };

  const handleError = (error: string) => {
    console.error("Error creating log entry:", error);
  };

  return (
    <>
      <FloatingCounter />
      <div className="min-h-screen pt-20 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-20" />
        
        <div className="px-6 py-16 relative">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                asChild
                variant="ghost"
                className="mb-6 hover-lift"
              >
                <Link to="/log">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Log
                </Link>
              </Button>
              
              <div className="text-center mb-8">
                <h1 className="mb-4">
                  <span className="gradient-text-electric">Create New Log Entry</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Document your learning journey and share your insights with the world.
                </p>
              </div>
            </div>

            {/* Form */}
            <CreateLogEntryForm 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NewLog; 