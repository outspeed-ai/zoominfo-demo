import React from "react";
import {
  RealtimeFunctionURLInput,
  RealtimeAudioInput,
  RealtimeVideoInput,
  RealtimeFormButton,
} from "@outspeed/react";
import { createConfig } from "@outspeed/core";
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
    "https://us0-dev.outspeed.com/run/333fede65db918130ca947074ddb3a43";
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
        videoDeviceId,
        videoCodec: "H264/90000",
      });
      onSubmit(config, HUMAN_AVATAR_APP_ROUTE);
    } catch (error) {
      console.error("Unable to create config", error);
    }
  }

  return (
    <div className="space-y-6 max-w-lg relative z-10 flex flex-col">
      <div className="font-bold text-2xl mb-8 md:text-3xl">Human Avatar</div>
      <RealtimeAudioInput
        isError={isMediaMissing}
        value={audioDeviceId}
        onChange={(value) => handleOnMediaInputChange("audio", value)}
        description="Select the microphone you want to use. If you don't see your microphone, make sure it is plugged in."
        errorMsg={
          isMediaMissing ? "Either audio or video input is required." : ""
        }
      />
      <RealtimeVideoInput
        isError={isMediaMissing}
        value={videoDeviceId}
        onChange={(value) => handleOnMediaInputChange("video", value)}
        description="Select the camera you want to use. If you don't see your camera, make sure it is plugged in."
        errorMsg={
          isMediaMissing ? "Either audio or video input is required." : ""
        }
      />
      <RealtimeFormButton className="!mt-auto" onClick={handleFormSubmit}>
        Run
      </RealtimeFormButton>
    </div>
  );
}
