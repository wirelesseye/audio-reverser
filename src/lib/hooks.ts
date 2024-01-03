import { useEffect, useRef, useState } from "react";

export const useAudioMediaStream = (onError?: () => void) => {
    const isRequested = useRef(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (!isRequested.current) {
            isRequested.current = true;
            navigator.mediaDevices
                .getUserMedia({
                    audio: true,
                })
                .then((stream) => setStream(stream))
                .catch(() => {
                    isRequested.current = false;
                    if (onError) onError();
                });
        }
    }, [onError]);

    return stream;
};

interface MediaRecorderOptions {
    onDataAvailable?: (this: MediaRecorder, ev: BlobEvent) => void;
}

export const useMediaRecorder = (
    stream: MediaStream | null,
    options?: MediaRecorderOptions,
) => {
    const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

    useEffect(() => {
        if (!recorder && stream) {
            const recorder = new MediaRecorder(stream);
            if (options) {
                if (options.onDataAvailable) {
                    recorder.ondataavailable = options.onDataAvailable;
                }
            }
            setRecorder(recorder);
        }
    }, [recorder, stream, options]);

    return recorder;
};

export const useAudioAnalyser = (stream: MediaStream | null) => {
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const buffer = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (stream) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            buffer.current = new Uint8Array(analyser.fftSize);
            setAnalyser(analyser);
        }
    }, [stream]);

    return [analyser, buffer.current] as
        | [AnalyserNode, Uint8Array]
        | [null, null];
};
