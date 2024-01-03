import { useCallback, useEffect, useMemo, useState } from "react";
import Recorder from "./Recorder";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
    DotFilledIcon,
    DownloadIcon,
    PauseIcon,
    PlayIcon,
    UpdateIcon,
    UploadIcon,
} from "@radix-ui/react-icons";
import { reverseAudio } from "./lib/audio";
import { Slider } from "./components/ui/slider";
import { cn } from "./lib/utils";
import { formatTime, parseTime } from "./lib/time";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./components/ui/tooltip";

export default function App() {
    const [isShowRecorder, setIsShowRecorder] = useState(false);

    const [audio, setAudio] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState("");
    const [duration, setDuration] = useState(0);

    const onRecordFinish = useCallback(
        (audio: Blob | null, duration?: number) => {
            setAudio(audio);
            if (duration !== undefined) setDuration(duration);
            setIsShowRecorder(false);
        },
        [],
    );

    const openRecorder = useCallback(() => setIsShowRecorder(true), []);

    useEffect(() => {
        setAudioUrl((audioUrl) => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            return audio ? URL.createObjectURL(audio) : "";
        });
    }, [audio]);

    return (
        <div className="mx-auto mt-3 max-w-[700px]">
            <Card className="p-5">
                {isShowRecorder ? (
                    <Recorder onFinish={onRecordFinish} />
                ) : (
                    <div className="flex flex-col">
                        {audioUrl ? (
                            <FileReadyPanel
                                audio={audio}
                                setAudio={setAudio}
                                audioUrl={audioUrl}
                                duration={duration}
                                setDuration={setDuration}
                                openRecorder={openRecorder}
                            />
                        ) : (
                            <InitPanel openRecorder={openRecorder} />
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}

interface InitPanelProps {
    openRecorder: () => void;
}

function InitPanel({ openRecorder }: InitPanelProps) {
    return (
        <TooltipProvider>
            <div className="flex items-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className="ml-auto mr-auto h-12 w-12 rounded-3xl"
                            variant="destructive"
                            size="icon"
                            onClick={openRecorder}
                        >
                            <DotFilledIcon className="h-8 w-8" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Record</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                            <UploadIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Upload</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

interface FileReadyPanelProps {
    audio: Blob | null;
    setAudio: (audio: Blob | null) => void;
    audioUrl: string;
    duration: number;
    setDuration: (duration: number) => void;
    openRecorder: () => void;
}

function FileReadyPanel({
    audio,
    setAudio,
    audioUrl,
    duration,
    setDuration,
    openRecorder,
}: FileReadyPanelProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const progress = currentTime / duration;
    const displayCurrentTime = formatTime(parseTime(currentTime));
    const displayDuration = formatTime(parseTime(duration));

    const onPlayerPlay = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const onPlayerPause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const onPlayerTimeUpdate = useCallback(
        (e: Event) => {
            const player = e.target as HTMLAudioElement;
            setCurrentTime(player.currentTime * 1000);
            if (
                Number.isFinite(player.duration) &&
                !Number.isNaN(player.duration)
            ) {
                setDuration(player.duration * 1000);
            }
        },
        [setDuration],
    );

    const player = useMemo(() => {
        const player = document.createElement("audio");
        player.addEventListener("play", onPlayerPlay);
        player.addEventListener("pause", onPlayerPause);
        player.addEventListener("timeupdate", onPlayerTimeUpdate);
        return player;
    }, [onPlayerPlay, onPlayerPause, onPlayerTimeUpdate]);

    useEffect(() => {
        player.src = audioUrl;
    }, [player, audioUrl]);

    const play = useCallback(() => {
        player.play();
    }, [player]);

    const pause = useCallback(() => {
        player.pause();
    }, [player]);

    const reverse = useCallback(() => {
        player.pause();
        if (audio) {
            reverseAudio(audio).then((reversed) => setAudio(reversed));
        }
    }, [audio, player, setAudio]);

    return (
        <div>
            <div className="mb-6 mt-3 flex gap-3">
                <div className="shrink-0">
                    {displayCurrentTime[0]}:{displayCurrentTime[1]}
                </div>
                <Slider value={[progress]} max={1} />
                <div className="shrink-0">
                    {displayDuration[0]}:{displayDuration[1]}
                </div>
            </div>
            <TooltipProvider>
                <div className="flex items-center">
                    <div className="flex items-center gap-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className={cn(
                                        "h-12 w-12 transition-[border-radius]",
                                        {
                                            "rounded-3xl": !isPlaying,
                                        },
                                    )}
                                    variant="outline"
                                    size="icon"
                                    onClick={isPlaying ? pause : play}
                                >
                                    {isPlaying ? (
                                        <PauseIcon className="h-5 w-5" />
                                    ) : (
                                        <PlayIcon className="h-5 w-5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isPlaying ? "Pause" : "Play"}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="rounded-3xl text-destructive hover:text-destructive"
                                    variant="outline"
                                    size="icon"
                                    onClick={openRecorder}
                                >
                                    <DotFilledIcon className="h-6 w-6" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Record</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="ml-auto flex gap-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <UploadIcon />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Upload</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a href={audioUrl} download tabIndex={-1}>
                                    <Button variant="outline" size="icon">
                                        <DownloadIcon />
                                    </Button>
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Download</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={reverse}
                                >
                                    <UpdateIcon />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reverse</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
