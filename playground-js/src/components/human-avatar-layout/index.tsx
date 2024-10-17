import { Track } from "@outspeed/core";
import { Mic, MicOff } from "lucide-react";
import { MediaAction } from "./push-to-talk";
import { DisconnectAction } from "./disconnect-action";
import { DataChannel } from "@outspeed/core";
import { RealtimeAudio } from "@outspeed/react";
import { AudioVisualizerContainer } from "./audio-visualzier-container";
import { VideContainer } from "./video-container";

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
    remoteTrack,
  } = props;

  return (
    <div className="flex flex-col flex-1 relative">
      {/* Video section */}
      <div className="flex flex-1 justify-center items-center p-4">
        <div className="h-full max-h-96 w-full max-w-96">
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
      </div>

      {/* Call Section */}
      <div className="pb-4 flex">
        <div className="flex flex-1 p-4 rounded-md">
          <div className="flex flex-1 space-x-4 justify-between items-center">
            <DisconnectAction onClick={onCallEndClick} />
            <MediaAction
              track={localAudioTrack}
              On={Mic}
              Off={MicOff}
              dataChannel={dataChannel}
              remoteAudioTrack={remoteAudioTrack}
            />
            <div className="invisible">
              <DisconnectAction onClick={onCallEndClick} />
            </div>
          </div>
          <div className="flex-1 justify-end items-center hidden sm:flex">
            <span className="font-bold text-muted">{title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
