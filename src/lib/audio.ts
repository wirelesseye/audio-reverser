export function reverseAudio(audio: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onloadend = () => {
            const arrayBuffer = fileReader.result as ArrayBuffer;
            const audioContext = new AudioContext();

            audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
                for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                    const channelData = audioBuffer.getChannelData(i);
                    channelData.reverse();
                }

                const reversedAudio = audioBufferToBlob(
                    audioBuffer,
                    "audio/wav",
                );
                resolve(reversedAudio);
            });
        };
        fileReader.onerror = reject;

        fileReader.readAsArrayBuffer(audio);
    });
}

function audioBufferToBlob(audioBuffer: AudioBuffer, type: string) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const interleaved = new Float32Array(length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            interleaved[i * numberOfChannels + channel] = channelData[i];
        }
    }
    const dataView = encodeWAV(interleaved, numberOfChannels, sampleRate);
    const blob = new Blob([dataView], { type: type });
    return blob;
}

function encodeWAV(
    samples: Float32Array,
    channels: number,
    sampleRate: number,
) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);
    return view;
}

function floatTo16BitPCM(
    output: DataView,
    offset: number,
    input: Float32Array,
) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
