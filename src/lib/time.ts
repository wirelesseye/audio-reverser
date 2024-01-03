export const parseTime = (time: number): [number, number, number] => {
    const min = Math.floor(time / 60000);
    const sec = Math.floor((time % 60000) / 1000);
    const mil = Math.floor((time % 1000) / 100);
    return [min, sec, mil];
};

export const formatTime = (
    time: [number, number, number],
): [string, string, string] => {
    const [min, sec, mil] = time;
    return [
        min.toString().padStart(2, "0"),
        sec.toString().padStart(2, "0"),
        mil.toString(),
    ];
};
