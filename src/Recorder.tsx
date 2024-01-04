import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import {
    PauseIcon,
    ResumeIcon,
    StopIcon,
    TrashIcon,
} from "@radix-ui/react-icons";
import { cn } from "./lib/utils";
import { Progress } from "./components/ui/progress";
import {
    useAudioAnalyser,
    useAudioMediaStream,
    useMediaRecorder,
} from "./lib/hooks";
import { formatTime, parseTime } from "./lib/time";

interface RecorderProps {
    onFinish: (audio: Blob | null, duration?: number) => void;
}

export default function Recorder({ onFinish }: RecorderProps) {
    const audioChunks = useRef<Blob[]>([]);

    const stream = useAudioMediaStream();
    const recorder = useMediaRecorder(stream, {
        onDataAvailable: (e) => audioChunks.current.push(e.data),
    });
    const [analyser, analyseBuf] = useAudioAnalyser(stream);

    const [isPaused, setIsPaused] = useState(true);
    const [volume, setVolume] = useState(0);

    const startTime = useRef(new Date().getTime());
    const startDutation = useRef(0);
    const [displayDuration, setDisplayDuration] = useState(["00", "00", "0"]);

    const updateUI = useCallback(() => {
        if (analyser && recorder?.state === "recording") {
            analyser.getByteTimeDomainData(analyseBuf);
            const volume =
                analyseBuf.reduce(
                    (max, current) => Math.max(max, Math.abs(current - 127)),
                    0,
                ) / 128;
            setVolume(volume);

            const currTime = new Date().getTime();
            const duration =
                startDutation.current + currTime - startTime.current;

            setDisplayDuration(formatTime(parseTime(duration)));
            requestAnimationFrame(updateUI);
        }
    }, [analyser, analyseBuf, recorder]);

    useEffect(() => {
        if (recorder && recorder.state == "inactive") {
            recorder.start();
            startTime.current = new Date().getTime();
            setIsPaused(false);
            updateUI();
        }
    }, [recorder, updateUI]);

    const pauseRecord = useCallback(() => {
        if (recorder) {
            recorder.pause();
            const currTime = new Date().getTime();
            startDutation.current =
                startDutation.current + currTime - startTime.current;
            setIsPaused(true);
        }
    }, [recorder]);

    const resumeRecord = useCallback(() => {
        if (recorder) {
            recorder.resume();
            startTime.current = new Date().getTime();
            setIsPaused(false);
            updateUI();
        }
    }, [recorder, updateUI]);

    const stopRecord = useCallback(() => {
        if (recorder) {
            recorder.onstop = () => {
                const currTime = new Date().getTime();
                const duration =
                    startDutation.current + currTime - startTime.current;
                const audio = new Blob(audioChunks.current, {
                    type: "audio/wav",
                });
                onFinish(audio, duration);
            };
            recorder.stop();
        } else {
            onFinish(null);
        }

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
    }, [recorder, stream, onFinish]);

    const discardRecord = useCallback(() => {
        if (recorder) {
            recorder.stop();
        }

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        onFinish(null);
    }, [recorder, stream, onFinish]);

    return (
        <div className="flex flex-col gap-3">
            <div
                className={cn(
                    "my-3 flex justify-center transition-[font-size]",
                    isPaused ? "text-5xl" : "text-4xl",
                )}
            >
                {displayDuration[0]}:{displayDuration[1]}.{displayDuration[2]}
            </div>
            <Progress
                className={cn("transition-[height]", { "h-0": isPaused })}
                value={volume * 100}
            />
            <div className="flex items-center justify-center gap-3">
                <Button
                    className="rounded-3xl"
                    variant="outline"
                    size="icon"
                    onClick={discardRecord}
                >
                    <TrashIcon />
                </Button>
                <Button
                    className={cn("h-12 w-12 transition-[border-radius]", {
                        "rounded-3xl": isPaused,
                    })}
                    variant="destructive"
                    size="icon"
                    onClick={isPaused ? resumeRecord : pauseRecord}
                >
                    {isPaused ? (
                        <ResumeIcon className="h-5 w-5" />
                    ) : (
                        <PauseIcon className="h-5 w-5" />
                    )}
                </Button>
                <Button
                    className="rounded-3xl"
                    variant="outline"
                    size="icon"
                    onClick={stopRecord}
                >
                    <StopIcon />
                </Button>
            </div>
        </div>
    );
}
