import { Track } from "@outspeed/core";
import { Mic, MicOff } from "lucide-react";
import { VideContainer } from "./video-container";
import { MediaAction } from "./push-to-talk";
import { ChatAction } from "./chat-action";
import { DisconnectAction } from "./disconnect-action";
import { DataChannel } from "@outspeed/core";
import React from "react";
import { RealtimeAudio } from "@outspeed/react";
import { AudioVisualizerContainer } from "./audio-visualzier-container";
import { Chat } from "./chat";

export type TMeetingLayoutProps = {
  remoteTrack: Track | null;
  remoteAudioTrack: Track | null;
  localAudioTrack: Track | null;
  onCallEndClick: () => void;
  dataChannel?: DataChannel<unknown> | null;
  title: string;
};

export function MeetingLayout(props: TMeetingLayoutProps) {
  const {
    localAudioTrack,
    remoteAudioTrack,
    remoteTrack,
    onCallEndClick,
    dataChannel,
    title,
  } = props;

  const [isChatOpened, setIsChatOpened] = React.useState(false);
  const container = React.useRef<HTMLDivElement>(null);

  const handleResize = React.useCallback(() => {
    if (!container.current) return;

    const parent = container.current.parentElement;
    if (!parent) return;

    container.current.style.maxWidth = parent.clientWidth + "px";
  }, []);

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <div className="flex flex-col flex-1 relative max-w-[calc(100vw-32px)]">
      {/* Video section */}
      <div className="flex-1 items-center flex py-4" ref={container}>
        <div className="flex-1 justify-center overflow-hidden flex flex-col space-y-6 sm:flex-row sm:space-x-6 sm:space-y-0">
          {remoteTrack && (
            <VideContainer
              track={remoteTrack}
              label="Outspeed"
              hasControls={{ audio: remoteAudioTrack }}
            />
          )}
          {!remoteTrack && (
            <>
              <AudioVisualizerContainer
                track={remoteAudioTrack}
                label="Outspeed"
                hasControls
                threshold={120}
              />
              <RealtimeAudio track={remoteAudioTrack} />
            </>
          )}
        </div>
        {dataChannel && (
          <Chat
            onRequestClose={() => setIsChatOpened(false)}
            dataChannel={dataChannel}
            isOpen={isChatOpened}
          />
        )}
      </div>

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
