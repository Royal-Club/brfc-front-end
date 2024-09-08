import React, { useEffect, useState, useRef, useCallback } from "react";

interface WheelComponentProps {
    segments: string[];
    segColors: string[];
    onFinished: (segment: string) => void;
    primaryColor?: string;
    contrastColor?: string;
    buttonText?: string;
    isOnlyOnce?: boolean;
    size?: number;
    upDuration?: number;
    downDuration?: number;
    fontFamily?: string;
    maxHeight?: number;
    maxWidth?: number;
    centerImageSrc?: string;
}

const PickerWheel: React.FC<WheelComponentProps> = ({
    segments,
    segColors,
    onFinished,
    primaryColor = "black",
    contrastColor = "white",
    buttonText = "Spin",
    isOnlyOnce = false,
    size = 150,
    upDuration = 100,
    downDuration = 600,
    fontFamily = "proxima-nova",
    maxHeight = 400,
    maxWidth = 400,
    centerImageSrc,
}) => {
    const [isFinished, setFinished] = useState(false);
    const [currentSegment, setCurrentSegment] = useState<string>(segments[0]);
    const isStartedRef = useRef<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
    const timerHandleRef = useRef<number | null>(null);

    const angleCurrentRef = useRef<number>(0);
    const angleDeltaRef = useRef<number>(0);
    const spinStartRef = useRef<number>(0);
    const framesRef = useRef<number>(0);

    const centerX = maxWidth / 2;
    const centerY = maxHeight / 2;

    const timerDelay = segments.length;
    const maxSpeed = Math.PI / segments.length;
    const upTime = segments.length * upDuration;
    const downTime = segments.length * downDuration;

    const wheelInit = useCallback(() => {
        if (canvasRef.current) {
            canvasContextRef.current = canvasRef.current.getContext("2d");
            canvasRef.current.width = maxWidth;
            canvasRef.current.height = maxHeight;
        }
        wheelDraw();
    }, [maxWidth, maxHeight]);

    useEffect(() => {
        wheelInit();
        return () => {
            if (timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
            }
        };
    }, [wheelInit]);

    useEffect(() => {
        wheelDraw();
    }, [segments, segColors]);

    const spin = () => {
        if (segments.length < 2) return; // Disable spin if less than 2 segments
        if (!isStartedRef.current && (!isOnlyOnce || !isFinished)) {
            isStartedRef.current = true;
            setFinished(false);
            if (!timerHandleRef.current) {
                spinStartRef.current = new Date().getTime();
                framesRef.current = 0;
                timerHandleRef.current = window.setInterval(
                    onTimerTick,
                    timerDelay
                );
            }
        }
    };

    const onTimerTick = () => {
        framesRef.current++;
        draw();
        const duration = new Date().getTime() - spinStartRef.current;
        let progress = 0;
        let finished = false;

        if (duration < upTime) {
            progress = duration / upTime;
            angleDeltaRef.current =
                maxSpeed * Math.sin((progress * Math.PI) / 2);
        } else {
            progress = duration / downTime;
            angleDeltaRef.current =
                maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
            if (progress >= 1) finished = true;
        }

        angleCurrentRef.current += angleDeltaRef.current;

        const segmentIndex = getSegmentIndex();
        const winningSegment = segments[segmentIndex];
        setCurrentSegment(winningSegment);

        if (finished) {
            setFinished(true);
            onFinished(winningSegment);
            if (timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
                timerHandleRef.current = null;
            }
            angleDeltaRef.current = 0;
            isStartedRef.current = false;
        }
    };

    const getSegmentIndex = () => {
        const change = angleCurrentRef.current + Math.PI / 2;
        const normalizedAngle = change % (Math.PI * 2);
        const segmentAngle = (Math.PI * 2) / segments.length;
        let index = Math.floor(normalizedAngle / segmentAngle);
        index = segments.length - 1 - index;
        if (index < 0) index = segments.length - 1;
        return index;
    };

    const wheelDraw = () => {
        clear();
        drawWheel();
        drawNeedle();
    };

    const draw = () => {
        clear();
        drawWheel();
        drawNeedle();
    };

    const drawSegment = (key: number, lastAngle: number, angle: number) => {
        const ctx = canvasContextRef.current;
        const value = segments[key];
        if (!ctx) return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = segColors[key];
        ctx.fill();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = contrastColor;
        ctx.font = `bold 1.5em ${fontFamily}`;
        ctx.fillText(value.substr(0, 21), size / 2 + 10, 0);
        ctx.restore();
    };

    const drawWheel = () => {
        const ctx = canvasContextRef.current;
        if (!ctx) return;

        const len = segments.length;
        let lastAngle = angleCurrentRef.current;
        const PI2 = Math.PI * 2;
        ctx.lineWidth = 1;
        ctx.strokeStyle = primaryColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = `1em ${fontFamily}`;

        for (let i = 1; i <= len; i++) {
            const angle = PI2 * (i / len) + angleCurrentRef.current;
            drawSegment(i - 1, lastAngle, angle);
            lastAngle = angle;
        }

        // Draw center circle with image or text
        if (centerImageSrc) {
            const img = new Image();
            img.src = centerImageSrc;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 50, 0, PI2, false);
            ctx.closePath();
            ctx.fillStyle = "#fff";
            ctx.lineWidth = 0;
            ctx.strokeStyle = contrastColor;
            ctx.fill();
            ctx.font = `bold 1em ${fontFamily}`;
            ctx.fillStyle = contrastColor;
            ctx.textAlign = "center";
            ctx.drawImage(img, centerX - 40, centerY - 40, 80, 80); // Adjust size and position
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, 0, PI2, false);
            ctx.closePath();
            ctx.fillStyle = primaryColor;
            ctx.lineWidth = 10;
            ctx.strokeStyle = contrastColor;
            ctx.fill();
            ctx.font = `bold 1em ${fontFamily}`;
            ctx.fillStyle = contrastColor;
            ctx.textAlign = "center";
            ctx.fillText(buttonText, centerX, centerY + 3);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = primaryColor;
        ctx.stroke();
    };

    const drawNeedle = () => {
        const ctx = canvasContextRef.current;
        if (!ctx) return;

        ctx.lineWidth = 1;
        ctx.strokeStyle = contrastColor;
        ctx.fillStyle = contrastColor;
        ctx.beginPath();
        ctx.moveTo(centerX + 15, centerY - 48);
        ctx.lineTo(centerX - 15, centerY - 48);
        ctx.lineTo(centerX, centerY - 65);
        ctx.closePath();
        ctx.fill();
    };

    const clear = () => {
        const ctx = canvasContextRef.current;
        if (ctx) {
            ctx.clearRect(0, 0, maxWidth, maxHeight);
        }
    };

    return (
        <div id="wheel">
            <canvas
                ref={canvasRef}
                onClick={spin}
                style={{
                    pointerEvents: isFinished && isOnlyOnce ? "none" : "auto",
                    opacity: isFinished && isOnlyOnce ? 0.5 : 1,
                    cursor: isFinished && isOnlyOnce ? "default" : "pointer",
                }}
            />
        </div>
    );
};

export default PickerWheel;
