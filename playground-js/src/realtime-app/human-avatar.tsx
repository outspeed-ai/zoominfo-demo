import React from "react";
import { useWebRTC, useRealtimeToast } from "@outspeed/react";
import { Loader2 } from "lucide-react";
import { Button } from "../components/button";
import { HumanAvatarLayout } from "../components/human-avatar-layout";
import { TRealtimeAppContext } from "./types";
import { useOutletContext } from "react-router-dom";
import { ConsoleLogger } from "@outspeed/core";

export function HumanAvatarRealtimeApp() {
  const { config, onDisconnect } = useOutletContext<TRealtimeAppContext>();
  const { toast } = useRealtimeToast();

  const {
    connectionStatus,
    response,
    connect,
    disconnect,
    getRemoteAudioTrack,
    getLocalAudioTrack,
    getRemoteVideoTrack,
    dataChannel,
  } = useWebRTC({ config: { ...config, logger: ConsoleLogger.getLogger() } });

  React.useEffect(() => {
    switch (connectionStatus) {
      case "SetupCompleted":
        connect();
        break;
      case "Disconnected":
        onDisconnect();
        break;
    }

    if (connectionStatus === "Failed") {
      toast({
        title: "Connection Status",
        description: "Failed to connect.",
        variant: "destructive",
      });
    }
  }, [connectionStatus, connect, onDisconnect, config]);

  function handleDisconnect() {
    if (connectionStatus === "Connected") {
      disconnect();
    }

    onDisconnect();
  }

  if (connectionStatus === "Connecting") {
    return (
      <div className="h-full flex flex-1 justify-center items-center flex-col">
        <Loader2 size={48} className="animate-spin" />
        <br />
        Connecting
      </div>
    );
  }

  if (connectionStatus === "Failed") {
    return (
      <div className="h-full flex flex-1 justify-center items-center">
        <div className="flex items-center space-y-4 flex-col">
          <h2 className="text-3xl font-light">
            Failed to connect.{" "}
            {(response?.data as any)?.detail || "Please try again."}
          </h2>
          <details className="max-w-lg overflow-auto">
            <summary>See Response</summary>
            <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code className="language-js text-sm">
                {JSON.stringify(response, undefined, 2)}
              </code>
            </pre>
          </details>
          <Button
            className="inline-flex max-w-24"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-1">
      <HumanAvatarLayout
        title="AI Agent"
        onCallEndClick={handleDisconnect}
        remoteTrack={getRemoteVideoTrack()}
        localAudioTrack={getLocalAudioTrack()}
        remoteAudioTrack={getRemoteAudioTrack()}
        dataChannel={dataChannel}
      />
    </div>
  );
}
