import React from "react";
import { RealtimeAudioInput, RealtimeFormButton } from "@outspeed/react";
import { createConfig } from "@outspeed/react";
import { useOutletContext, useLocation } from "react-router-dom";
import { TLayoutOutletContext } from "./type";
import { HUMAN_AVATAR_APP_ROUTE } from "../constants/routes";

export function HumanAvatarTakeInput() {
  const { onSubmit } = useOutletContext<TLayoutOutletContext>();
  const [audioDeviceId, setAudioDeviceId] = React.useState("");
  const [videoDeviceId, setVideoDeviceId] = React.useState("");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const functionURL =
    queryParams.get("functionURL") ||
    "https://infra.outspeed.com/run/5ebbba494c7e7d18c4a1f0850eef3cbc";

  const [isMediaMissing, setIsMediaMissing] = React.useState(false);

  function handleOnMediaInputChange(kind: "audio" | "video", value: string) {
    setIsMediaMissing(false);

    switch (kind) {
      case "audio":
        setAudioDeviceId(value);
        break;
      case "video":
        setVideoDeviceId(value);
        break;
    }
  }

  function handleFormSubmit() {
    let isFormValid = true;
    if (!audioDeviceId && !videoDeviceId) {
      setIsMediaMissing(true);
      isFormValid = false;
    }

    if (!isFormValid) {
      return;
    }

    try {
      const config = createConfig({
        functionURL,
        audioDeviceId,
        videoCodec: "H264/90000",
        audioCodec: "opus/48000/2",
      });
      onSubmit(config, HUMAN_AVATAR_APP_ROUTE);
    } catch (error) {
      console.error("Unable to create config", error);
    }
  }

  return (
    <div className="space-y-6 max-w-lg relative z-10 flex flex-col overflow-hidden">
      <RealtimeAudioInput
        isError={isMediaMissing}
        label="Please select audio input device"
        value={audioDeviceId}
        onChange={(value) => handleOnMediaInputChange("audio", value)}
        description="Select the microphone you want to use. If you don't see your microphone, make sure it is plugged in."
        errorMsg={
          isMediaMissing ? "Either audio or video input is required." : ""
        }
      />

      <RealtimeFormButton className="mx-auto" onClick={handleFormSubmit}>
        Connect
      </RealtimeFormButton>
    </div>
  );
}
