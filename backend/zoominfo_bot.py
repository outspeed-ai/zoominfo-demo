import asyncio
import base64
import json
import logging
import threading
import time
import uuid
from typing import Any, Dict, List, Tuple


import websockets
from PIL import Image

import outspeed as sp

# Set up basic logging configuration
logging.basicConfig(level=logging.INFO)
FRAME_RATE = 25


class DeepreelPlugin:
    """
    A plugin for processing audio input and generating video output using a WebSocket connection.
    """

    def __init__(self, websocket_url: str):
        """
        Initialize the DeepreelPlugin.

        Args:
            websocket_url (str): The URL of the WebSocket server to connect to.
        """
        self.websocket_url: str = websocket_url
        self.audio_samples: int = 0
        self.audio_input_stream: sp.AudioStream
        self.image_output_stream: sp.VideoStream
        self.audio_output_stream: sp.AudioStream
        self._ws: websockets.WebSocketClientProtocol
        self._audio_library: List[Tuple[float, sp.AudioData]] = []
        self._ws = None
        self._loop = asyncio.get_running_loop()
        self._stop_event = threading.Event()
        self._speaking = False
        self._interrupted = False

    def run(
        self,
        audio_input_stream: sp.AudioStream,
    ) -> Tuple[sp.VideoStream, sp.AudioStream]:
        """
        Set up the plugin and start processing audio input.

        Args:
            audio_input_stream (AudioStream): The input audio stream to process.

        Returns:
            Tuple[VideoStream, AudioStream]: The output video and audio streams.
        """
        self.audio_input_stream = audio_input_stream
        self.image_output_stream = sp.VideoStream()
        self.audio_output_stream = sp.AudioStream()
        self._send_thread = threading.Thread(target=self.send_task)
        self._send_thread.start()
        self._recv_thread = threading.Thread(target=self.recv_task)
        self._recv_thread.start()
        self._last_frame_idx = 0

        return self.image_output_stream, self.audio_output_stream

    async def _connect_ws(self):
        """
        Coroutine to establish a WebSocket connection.
        """
        ws = await websockets.connect(self.websocket_url)
        await ws.send(json.dumps({"metadata": {"sent_frame_buffer": 20}}))
        return ws

    def connect(self):
        """
        Establish a WebSocket connection using the provided URL.
        """
        try:
            # Ensure the event loop is set in the current thread
            self._ws = asyncio.run_coroutine_threadsafe(
                self._connect_ws(), self._loop
            ).result()
        except Exception as e:
            logging.error(f"Error connecting to websocket: {e}")
            return

    def send_task(self):
        """
        Continuously send audio data to the WebSocket server.
        """
        try:
            buffer = b""
            while not self._stop_event.is_set():
                try:
                    audio_data: sp.AudioData = asyncio.run_coroutine_threadsafe(
                        asyncio.wait_for(self.audio_input_stream.get(), timeout=0.2),
                        self._loop,
                    ).result()
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logging.error(f"Error getting audio data: {e}")
                    break
                if not self._ws:
                    self.connect()
                if audio_data is None:
                    if len(buffer) > 0:
                        audio_json = {
                            "audio_data": base64.b64encode(buffer).decode("utf-8"),
                            "start_seconds": 0,
                            "duration": 0,
                            "audio_format": "pcm_16000",
                            "id": str(uuid.uuid4()),
                        }
                        asyncio.run_coroutine_threadsafe(
                            self._ws.send(json.dumps(audio_json)), self._loop
                        )
                        buffer = b""
                    continue
                if isinstance(audio_data, sp.SessionData):
                    continue
                audio_duration = audio_data.get_duration_seconds()
                audio_bytes = audio_data.resample(16000).get_bytes()
                buffer += audio_bytes
                if len(buffer) < 12800:
                    continue
                audio_start = audio_data.get_start_seconds()
                audio_json = {
                    "audio_data": base64.b64encode(buffer).decode("utf-8"),
                    "start_seconds": audio_start,
                    "duration": audio_duration,
                    "audio_format": "pcm_16000",
                    "id": str(uuid.uuid4()),
                }
                audio_start += audio_duration
                asyncio.run_coroutine_threadsafe(
                    self._ws.send(json.dumps(audio_json)), self._loop
                )
                buffer = b""
        except Exception as e:
            logging.error(f"Error sending audio data: {e}")
            raise asyncio.CancelledError()
        except asyncio.CancelledError:
            pass
        finally:
            self._stop_event.set()

    def recv_task(self):
        """
        Continuously receive and process video data from the WebSocket server.
        """
        start_time = 0.0
        silence_flag = True
        try:
            while not self._stop_event.is_set():
                if not self._ws:
                    time.sleep(0.1)
                    continue

                try:
                    msg = asyncio.run_coroutine_threadsafe(
                        asyncio.wait_for(self._ws.recv(), timeout=0.2), self._loop
                    ).result()
                except asyncio.TimeoutError:
                    continue

                first_image = (
                    self.image_output_stream.get_first_element_without_removing()
                )
                if (
                    first_image
                    and first_image.extra_tags["silence_flag"]
                    and self._speaking
                ):
                    self._speaking = False

                response_data: Dict[str, Any] = json.loads(msg)
                images = response_data.get("image_data", [])
                # print("received frames: ", [x["frame_idx"] for x in images], time.time())
                for image in images:
                    # Decode the base64 string to bytes
                    if image["silence_flag"] and not silence_flag:
                        print("silence flag to true", time.time())
                        silence_flag = True
                    elif not image["silence_flag"] and silence_flag:
                        print("silence flag to false", time.time())
                        self._speaking = True
                        silence_flag = False
                        temp_audio = []
                        temp_video = []
                        while self.audio_output_stream.qsize() > 0:
                            temp_audio.append(self.audio_output_stream.get_nowait())
                        while self.image_output_stream.qsize() > 0:
                            temp_video.append(self.image_output_stream.get_nowait())
                        temp_start_time = (
                            temp_audio[0].relative_start_time if temp_audio else 0
                        )
                        for i, audio_data in enumerate(temp_audio):
                            if i % 2 == 0:
                                audio_data.relative_start_time = temp_start_time
                                temp_start_time += 1.0 / FRAME_RATE
                                asyncio.run_coroutine_threadsafe(
                                    self.audio_output_stream.put(audio_data), self._loop
                                )
                        temp_start_time = (
                            temp_video[0].relative_start_time if temp_video else 0
                        )
                        for i, image_data in enumerate(temp_video):
                            if i % 2 == 0:
                                image_data.relative_start_time = temp_start_time
                                temp_start_time += 1.0 / FRAME_RATE
                                asyncio.run_coroutine_threadsafe(
                                    self.image_output_stream.put(image_data), self._loop
                                )
                    elif image["silence_flag"] and self._interrupted:
                        print("silence flag to false", time.time())
                        self._speaking = True
                        silence_flag = False
                        temp_audio = []
                        temp_video = []
                        while self.audio_output_stream.qsize() > 0:
                            temp_audio.append(self.audio_output_stream.get_nowait())
                        while self.image_output_stream.qsize() > 0:
                            temp_video.append(self.image_output_stream.get_nowait())

                        t = [
                            v
                            for v in temp_video
                            if v.extra_tags["frame_idx"] < image["frame_idx"]
                        ]
                        for v in t:
                            asyncio.run_coroutine_threadsafe(
                                self.image_output_stream.put(v), self._loop
                            )
                        self._interrupted = False

                    start_time = max(sp.Clock.get_playback_time(), start_time)
                    # print([image[x] for x in image if x != "image" and x != "audio"], time.time())
                    image_bytes = base64.b64decode(image["image"])
                    audio_bytes = base64.b64decode(image["audio"])

                    self._last_frame_idx = image["frame_idx"]

                    image_data = sp.ImageData(
                        data=image_bytes,
                        format="jpeg",
                        frame_rate=FRAME_RATE,
                        relative_start_time=start_time,
                        extra_tags={
                            "frame_idx": image["frame_idx"],
                            "silence_flag": image["silence_flag"],
                        },
                    )
                    audio_data = sp.AudioData(
                        data=audio_bytes,
                        sample_rate=16000,
                        channels=1,
                        sample_width=2,
                        format="wav",
                        relative_start_time=start_time,
                    )
                    asyncio.run_coroutine_threadsafe(
                        self.image_output_stream.put(image_data), self._loop
                    )
                    asyncio.run_coroutine_threadsafe(
                        self.audio_output_stream.put(audio_data), self._loop
                    )
                    start_time += 1.0 / FRAME_RATE
        except Exception as e:
            logging.error(f"Error receiving video data: {e}")
            raise asyncio.CancelledError()
        except asyncio.CancelledError:
            pass
        finally:
            self._stop_event.set()

    def set_interrupt_stream(self, interrupt_stream: sp.VADStream):
        if isinstance(interrupt_stream, sp.VADStream):
            self.interrupt_queue = interrupt_stream
        else:
            raise ValueError("Interrupt stream must be a VADStream")
        self._interrupt_task = asyncio.create_task(self._interrupt())

    async def _interrupt(self):
        print(self._speaking, self.audio_input_stream.empty())
        try:
            if self._speaking or not self.audio_input_stream.empty():
                logging.info("Interrupting Deepreel")
                while self.audio_input_stream.qsize() > 0:
                    self.audio_input_stream.get_nowait()
                diff = max(
                    self.image_output_stream.qsize() - self.audio_output_stream.qsize(),
                    0,
                )
                i = FRAME_RATE // 3
                if self.image_output_stream.qsize() > 0:
                    first_frame_idx = self.image_output_stream.get_first_element_without_removing().extra_tags[
                        "frame_idx"
                    ]
                else:
                    first_frame_idx = self._last_frame_idx + 1
                temp = None
                while True:
                    if not self.audio_output_stream.get_element_at_index(i):
                        break
                    temp = self.image_output_stream.get_element_at_index(i + diff)
                self._interrupted = True
                await self._ws.send(
                    json.dumps(
                        {
                            "interrupt": True,
                            "start_frame_idx": temp.extra_tags["frame_idx"]
                            if temp
                            else first_frame_idx + i,
                        }
                    )
                )

                logging.info("Done cancelling Deepreel")
        except Exception as e:
            logging.error(f"Error interrupting Deepreel: {e}")
        except asyncio.CancelledError:
            logging.info("Interruption cancelled")


@sp.App()
class ZoomInfoBot:
    """
    A bot that processes audio input, generates responses, and produces video output.
    """

    async def setup(self):
        """
        Set up the bot. Currently empty, but can be used for initialization if needed.
        """
        self.deepreel_node = DeepreelPlugin(websocket_url="ws://13.89.58.206:8008/ws")
        self.llm_node = sp.OpenAIRealtime(
            initiate_conversation_with_greeting="Hi. How are you?",
            voice_id="shimmer",
            system_prompt="You are a helpful AI sales agent for ZoomInfo embedded in ZoomInfo's website. No special characters in responses. Keep responses short and concise.",
        )

    @sp.streaming_endpoint()
    async def run(
        self,
        audio_input_stream: sp.AudioStream,
        message_stream: sp.TextStream,
        video_input_stream: sp.VideoStream,
    ):
        """
        The main processing pipeline for the bot.

        Args:
            audio_input_stream (sp.AudioStream): The input audio stream.
            message_stream (sp.TextStream): The input text message stream.

        Returns:
            Tuple[sp.VideoStream, sp.AudioStream]: The output video and audio streams.
        """

        async def look_for_interrupt():
            while True:
                msg = await message_stream.get()
                print(msg)
                msg = json.loads(msg)
                if msg.get("type") == "interrupt":
                    await self.llm_node._interrupt_all()
                    await self.deepreel_node._interrupt()

        asyncio.create_task(look_for_interrupt())

        audio_output_stream, chat_history_stream = self.llm_node.run(
            sp.TextStream(), audio_input_stream
        )

        video_stream, audio_stream = self.deepreel_node.run(audio_output_stream)

        return video_stream, audio_stream, chat_history_stream

    async def teardown(self):
        """
        Clean up resources when the bot is shutting down. Currently empty, but can be implemented if needed.
        """
        self.deepreel_node._stop_event.set()


if __name__ == "__main__":
    try:
        bot = ZoomInfoBot()
        bot.start()
    except Exception:
        pass
    except KeyboardInterrupt:
        pass
