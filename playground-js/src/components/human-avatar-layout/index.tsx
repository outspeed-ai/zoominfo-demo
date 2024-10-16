import { Track } from "@outspeed/core";
import { Mic, MicOff } from "lucide-react";
import { MediaAction } from "./push-to-talk";
import { ChatAction } from "./chat-action";
import { DisconnectAction } from "./disconnect-action";
import { DataChannel } from "@outspeed/core";
import React from "react";
import { RealtimeAudio } from "@outspeed/react";
import { AudioVisualizerContainer } from "./audio-visualzier-container";
import { Avatar } from "./Avatar";
import { Canvas } from "@react-three/fiber";

export type THumanAvatarLayoutProps = {
  remoteTrack: Track | null;
  remoteAudioTrack: Track | null;
  localAudioTrack: Track | null;
  onCallEndClick: () => void;
  dataChannel?: DataChannel<unknown> | null;
  title: string;
};

export function HumanAvatarLayout(props: THumanAvatarLayoutProps) {
  const {
    localAudioTrack,
    remoteAudioTrack,
    onCallEndClick,
    dataChannel,
    title,
  } = props;

  const [isChatOpened, setIsChatOpened] = React.useState(false);

  return (
    <div className="flex flex-col flex-1 relative">
      {/* Video section */}
      <div className="flex flex-1 justify-center items-center p-4">
        <div className="h-full max-h-96 w-full max-w-96">
          {/* <AudioVisualizerContainer
            track={remoteAudioTrack}
            label="Outspeed"
            hasControls
            threshold={120}
          /> */}
          <Canvas
            className="border rounded-md"
            style={{ pointerEvents: "none", height: "100%", width: "100%" }}
            shadows
            camera={{ position: [0, 0, 0], fov: 25 }}
          >
            <Avatar isLoading={false} />
          </Canvas>
        </div>
      </div>
      <RealtimeAudio track={remoteAudioTrack} />

      {/* Call Section */}
      <div className="pb-4 flex">
        <div className="flex flex-1 p-4 rounded-md">
          <div className="flex flex-1 space-x-4 justify-center">
            <DisconnectAction onClick={onCallEndClick} />
            <MediaAction
              track={localAudioTrack}
              On={Mic}
              Off={MicOff}
              dataChannel={dataChannel}
            />
            <ChatAction
              isEnabled={isChatOpened}
              setIsEnabled={setIsChatOpened}
            />
          </div>
          <div className="flex-1 justify-end items-center hidden sm:flex">
            <span className="font-bold text-muted">{title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
